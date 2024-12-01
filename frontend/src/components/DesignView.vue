<template>
  <!-- 主内容区 -->
  <v-main class="bg-white main-container">
    <div class="content-wrapper">
      <!-- 左侧边栏 -->
      <div class="left-sidebar">
        <!-- 控制面板固定在顶部 -->
        <div class="control-panel">
          <v-container class="pa-2">
            <v-row dense>
              <!-- JSON 文件选择器 -->
              <v-col cols="12" class="mb-2">
                <v-select
                  v-model="selectedJsonFile"
                  :items="jsonFiles"
                  label="选择 JSON 文件"
                  variant="outlined"
                  dense
                ></v-select>
              </v-col>
        
              <!-- 图表类型选择器 -->
              <v-col cols="12" class="mb-2">
                <v-select
                  v-model="selectedChartType"
                  :items="chartTypes"
                  label="选择图表类型"
                  variant="outlined" 
                  dense
                ></v-select>
              </v-col>

              <!-- 交互模式切换 -->
              <v-col cols="12" class="mb-2">
                <v-switch
                  v-model="isViewMode"
                  label="查看模式"
                  variant="outlined"
                  dense
                  color="primary"
                  :class="{'switch-on': isViewMode, 'switch-off': !isViewMode}"
                ></v-switch>
              </v-col>
        
              <!-- 生成按钮 -->
              <v-col cols="12">
                <v-btn
                  block
                  color="primary"
                  variant="contained"
                  :disabled="!canGenerateChart"
                  @click="generateChart"
                >
                  生成图表
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- 搜索框和图片列表 -->
        <div class="search-and-images">
          <div class="search-container">
            <v-text-field
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              placeholder="搜索图片"
              hide-details
              class="pa-2"
              density="comfortable"
              bg-color="white"
              color="black"
            ></v-text-field>
          </div>
          <div class="scrollable-content">
            <v-container class="px-2 py-2">
              <v-row dense>
                <v-col
                  v-for="(svgFile, index) in svgFiles"
                  :key="index"
                  cols="12"
                  class="pa-1"
                >
                  <v-card
                    variant="outlined"
                    class="image-card"
                    @click="loadSvg(svgFile)"
                  >
                    <v-img
                      cover
                      height="150"
                      :src="`/svg/${svgFile}`"
                    ></v-img>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 - 60% -->
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <div id="chartCanvas"></div>
          <!-- <canvas id="chartCanvas"></canvas> -->
          <v-btn @click="saveSvg" color="primary">保存SVG</v-btn>
          <template v-for="(element, index) in drawElements" :key="element.id">
            <!-- 元素内容 -->
            <div 
              class="draw-element"
              :class="{
                'selected': selectedElementId.value === element.id,
                'text-element': element.type === ELEMENT_TYPES.TEXT,
                'pictogram-element': element.type === ELEMENT_TYPES.PICTOGRAM
              }"
              :data-index="element.index"
              :style="getElementStyle(element, selectedElementId.value)"
            >
              <!-- 标题栏 - 可拖动 -->
              <!-- <div 
                class="element-title"
                v-if="elementsVisible"
                :style="{ 'background-color': getBoxType(element.type, selectedElementId.value).labelBgColor }"
                @mousedown="startTitleDrag($event, element.id)"
              >
                <span class="element-label">
                  {{ element.id }}
                </span>
                <div class="delete-button" @click.stop="deleteElement(element)">
                  <v-icon size="small" color="white">mdi-close</v-icon>
                </div>
              </div> -->
              
              <!-- 内容区域 -->
              <div v-if="element.type === ELEMENT_TYPES.TEXT && isEditing && editingElementId === element.id"
                class="text-content editing-text"
                contenteditable="true"
                @blur="saveTextEdit($event, element.id)"
                @keydown.enter.prevent="saveTextEdit($event, element.id)"
                :style="{
                  color: element.style.color,
                  fontSize: element.style.fontSize,
                  fontWeight: element.style.fontWeight
                }"
                v-text="element.content"
              ></div>
              <div v-else-if="element.type === ELEMENT_TYPES.TEXT"
                class="text-content"
                @dblclick="handleTextDoubleClick($event, element.id)"
                :style="{
                  color: element.style.color,
                  fontSize: element.style.fontSize,
                  fontWeight: element.style.fontWeight
                }"
              >{{ element.content }}</div>
              <div v-else-if="element.type === ELEMENT_TYPES.PICTOGRAM" 
                class="pictogram-content" 
                v-html="element.content">
              </div>
              
            </div>

            <!-- 独立的边框box -->
            <div 
              v-if="element.type === ELEMENT_TYPES.BOUNDING_BOX || elementsVisible"
              class="element-box"
              @dblclick="handleBBoxClick($event, element.id)"
              @mouseout="handleBBoxMouseOut($event, element.id)"
              @mousedown="startDrag($event, element.id, targetType)"
              :id="element.id"
              :class="{
                'selected': selectedElementId === element.id,
                'bounding-box': element.type === ELEMENT_TYPES.BOUNDING_BOX
              }"
              :style="getBoxStyle(element, selectedElementId)"
            >
            <div class="resize-handle" @mousedown.stop="startResize($event, element.id, targetType)"></div>
          </div>
            
          </template>
        </div>
      </div>

      <!-- 右侧栏 -->
      <div class="right-sidebar">
        <div class="upper-section">
          <!-- Pictogram 部分 -->
          <v-container class="pa-4">
            <v-row dense>
              <v-col v-for="(path, index) in pictogramPaths" :key="index" cols="3" class="mb-2">
                <v-img
                  cover
                  height="100"
                  :src="path"
                  @click="addImageToChart(path)"
                ></v-img>
                <div class="text-center">{{ processPath(path) }}</div>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- 添加分割图片部分 -->
        <div class="middle-section">
          <div class="section-title pa-2">分割图片</div>
          <v-container class="pa-4">
            <v-row dense>
              <v-col v-for="image in segmentedImages" :key="image.id" cols="6" class="mb-2">
                <v-card variant="outlined" class="segment-image-card">
                  <div class="image-container">
                    <v-img
                      cover
                      height="100"
                      :src="image.url"
                      @click="addSegmentToChart(image)"
                    ></v-img>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <div class="lower-section">
        </div>
      </div>
    </div>
  </v-main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// 导入 d3.js 库
// 使用CDN引入d3.js库
import * as d3 from 'd3'; // 导入 D3.js 的所有模块
import BarChart from '../plugins/Barchart.js'; // 导入 BarChart 类
import { watch } from 'vue';
import { setDefaultStyles } from './utils/chartStyles';
import { createBaseElement, createTextElement, createPictogramElement, 
  createBoundingBox, ELEMENT_TYPES, SHORT_ELEMENT_TYPES, getElementStyle,
  getBoxStyle, getBoxType} from './utils/elements';

// 选择器相关数据
const jsonFiles = ref([]); // JSON 文件列表
const selectedJsonFile = ref(''); // 用户选中的 JSON 文件
const chartTypes = ref(['Bar', 'Pie', 'Line', 'Scatter Plot']); // 图表类型列表
const selectedChartType = ref(''); // 用户选中的图类型
const chartData = ref(null); // 用于存储加载的 JSON 数据
const svgFiles = ref([]); // SVG 文件列表
const isResizing = ref(false);
const isDragging = ref(false);
const canvasRef = ref(null);
const isViewMode = ref(true); // 交互模式切换
const drawElements = ref([]);
const selectedElementId = ref(null);
const selectedElement = computed(() => drawElements.value.find(el => el.id === selectedElementId.value));
const fixedElementIdList = ref([]);
const elementsVisible = ref(true);
const dragOffset = ref({ x: 0, y: 0 });
const dragInit = ref({ x: 0, y: 0 });
const dragInitTransform = ref(null);
// 生成按钮是否可用
const canGenerateChart = computed(() => selectedJsonFile.value && selectedChartType.value);
const pictogramPaths = ref([]);
const currentImageId = ref(null);
const ImageIdList = ref([]);
const targetType = ref('element');

// 添加分割图片相关的状态
const segmentedImages = ref([]);

// 在 onMounted 中加载分割图片数据
onMounted(() => {
  canvasRef.value = document.getElementById('chartCanvas');
  const files = import.meta.glob('/public/json/*.json'); // 匹配 public/json 文件夹中的 JSON 文件
  jsonFiles.value = Object.keys(files).map(filePath => filePath.replace('/public/json/', ''));
  const svgFilesGlob = import.meta.glob('/public/svg/*.svg'); // 匹配 public/svg 文件夹中的 SVG 文件
  svgFiles.value = Object.keys(svgFilesGlob).map(filePath => filePath.replace('/public/svg/', ''));
  
  const pictogramsGlobal = import.meta.glob('/public/pictogram/*.png');
  pictogramPaths.value = Object.keys(pictogramsGlobal).map(filePath => filePath.replace('/public/', ''));
  console.log("pictogramPaths", pictogramPaths);
  addHoverEffect();
  
  // 从 localStorage 加载分割图片
  try {
    const savedSegments = localStorage.getItem('segmentedImages');
    if (savedSegments) {
      segmentedImages.value = JSON.parse(savedSegments);
    }
  } catch (error) {
    console.error('从localStorage加载分割图片失败:', error);
  }
});

// 生成图表函数
const generateChart = async () => {
  try {
    const response = await fetch(`/json/${selectedJsonFile.value}`);
    if (!response.ok) throw new Error('Failed to load JSON file');

    let specification = await response.json(); // 加载 JSON 数据
    let data, meta_data, styles, width, height, input_styles;
    [meta_data, data, input_styles] = parseSpecification(specification); // 解析 JSON 数据
    [meta_data, data, styles, width, height] = setDefaultStyles(meta_data, data, input_styles); // 设置默认样式
    let type = selectedChartType.value.toLowerCase(); // 图表类型

    console.log("data", data);
    console.log("meta_data", meta_data);
    console.log("styles", styles);
    console.log("width", width);
    console.log("height", height);
    console.log("type", type);
    // 调用生成图表逻辑
    renderChart(meta_data, data, styles, width, height, type);
  } catch (error) {
    console.error('Error generating chart:', error);
  }
};

// 渲染图表函数
const renderChart = async (meta_data, data, styles, width, height, type) => {
  let canvas = d3.select('#chartCanvas'); // 选择画布
  console.log("canvas", canvas);
  // 使用 Chart 类生成图表
  // const BarChart = require('/plugins/Barchart.js'); // 请根据实际路径修改
  const chart = new BarChart(data, meta_data, styles, width, height);
  await chart.preprocess();
  await chart.render(canvas);

  // // 使用 plugins/chart.js 的 createChart 函数渲染图表
  // createChart('chartCanvas', type, chartData, chartOptions);
};

const parseSpecification = (spec) => {
    const {meta_data, data, input_styles} = spec;
    // 如果input_styles不为空
    if (input_styles !== undefined){
        // 遍历input_styles的字段
        for (let key in input_styles){
            let styles = input_styles[key];
            // 如果styles不为空
            if (styles !== undefined){
                // 遍历styles的字段
                for (let key in styles){
                    let sub_styles = styles[key];
                    // 如果sub_styles不为空
                    if (sub_styles !== undefined){
                        // 遍历sub_styles的字段
                        for (let key in sub_styles){
                            // 如果key以'Color'结尾
                            if (key.endsWith('Color')){
                                // 如果sub_styles[key]是数组
                                if (sub_styles[key] instanceof Array){
                                    // 将sub_styles[key]转换为hex color
                                    sub_styles[key] = '#'+sub_styles[key].map(c => c.toString(16).padStart(2, '0')).join('');
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let transformedData = data.map(d => ({
        x: d['x_data'],
        y: d['y_data'],
        // x_data_icon: d['x_data_icon']
        x_data_icon: typeof d['x_data_icon'] === 'string' ? d['x_data_icon'] : d['x_data_icon'][0],
        // convery [r, g, b] to hex color, 0->'00'
        color: d['color']?'#'+d['color'].map(c => c.toString(16).padStart(2, '0')).join(''):undefined,
        group: d['group']
    }));

    // List of available color scales in d3
    const colorSchemes = [
        d3.schemeObservable10,
        d3.schemeCategory10,
        d3.schemeAccent,
        d3.schemeDark2,
        d3.schemePaired,
        d3.schemePastel1,
        d3.schemePastel2,
        d3.schemeSet1,
        d3.schemeSet2,
        d3.schemeSet3,
        d3.schemeTableau10
    ];

    // Randomly select a color scale
    const randomColorScale = d3.scaleOrdinal(colorSchemes[Math.floor(Math.random() * colorSchemes.length)]);


    if (meta_data['y_color']!==undefined && meta_data['y_color'].length>1 && meta_data['y_color'][0] instanceof Array){
        for (let i = 0; i < meta_data['y_color'].length; i++){
            meta_data['y_color'][i] = '#'+meta_data['y_color'][i].map(c => c.toString(16).padStart(2, '0')).join('');
        }
        for (let i = 0; i < transformedData.length; i++){
            transformedData[i].color = meta_data['y_color'];
        }
    }
    else if (meta_data['y_color']===undefined && meta_data['y_label'].length>1){
        // meta_data['y_color'] = randomColorScale.domain(meta_data['y_label']);
        meta_data['y_color'] = [];
        for (let i = 0; i < meta_data['y_label'].length; i++){
            meta_data['y_color'].push(randomColorScale(meta_data['y_label'][i]));
        }

        // for (let i = 0; i < meta_data['y_color'].length; i++){
        //     meta_data['y_color'][i] = '#'+meta_data['y_color'][i].map(c => c.toString(16).padStart(2, '0')).join('');
        // }
        for (let i = 0; i < transformedData.length; i++){
            transformedData[i].color = meta_data['y_color'];
        }
    }

    let group_indicator = meta_data.group_indicator;
    // console.log("group_indicator", group_indicator);
    if (group_indicator !== undefined){
        for (let i = 0; i < transformedData.length; i++){
            transformedData[i].color = randomColorScale(transformedData[i].group);
            // console.log("transformedData[i].color", transformedData[i].color);
        }
        meta_data['group_color'] = {};
        for (let i = 0; i < group_indicator.length; i++){
            meta_data['group_color'][group_indicator[i]] = randomColorScale(group_indicator[i]);
        }
    }
    // // leave only 2 data
    // transformedData = transformedData.slice(0, 2);

    return [meta_data, transformedData, input_styles];
}
const saveSvg = async () => {
  const svgElement = document.querySelector('#chartCanvas svg');
      if (!svgElement) {
        console.error('SVG element not found');
        return;
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
}

const loadSvg = async (svgFile) => {
  try {
    const response = await fetch(`/svg/${svgFile}`);
    if (!response.ok) throw new Error('Failed to load SVG file');

    const svgText = await response.text();
    const chartCanvas = document.getElementById('chartCanvas');
    chartCanvas.innerHTML = svgText;
    // Add non-selectable attribute to SVG
    const svg = d3.select('#chartCanvas svg');
    svg.selectAll('text')
       .style('user-select', 'none')
       .style('-webkit-user-select', 'none')
       .style('-moz-user-select', 'none')
       .style('-ms-user-select', 'none');
    addHoverEffect();
  } catch (error) {
    console.error('Error loading SVG:', error);
  }
};

const clearInteractions = () => {
  const elements = ['#x-axis', '#titlex-axis', '#y-axis', '#titley-axis', '#background', '#marks'];
  elements.forEach(selector => {
    const element = d3.select(selector);
    element.on('mouseover', null).on('mouseout', null);
  });
};

const addHoverEffect = () => {
  clearInteractions(); // 清除所有交互功
  const addEffect = (elementId, titleId, hoverColor, modifyFill = true) => {
    const element = d3.select(`#${elementId}`);
    const title = d3.select(`#${titleId}`);
    
    const setOriginalAttributes = (el) => {
      el.selectAll('*').each(function() {
        const item = d3.select(this);
        item.attr('original-stroke', item.attr('stroke') || 'none');
        if (modifyFill) {
          item.attr('original-fill', item.attr('fill') || 'none');
        }
      });
    };

    setOriginalAttributes(element);
    if (titleId) setOriginalAttributes(title);

    const onMouseOver = () => {
      if (isResizing.value) return;
      element.selectAll('*').attr('stroke', hoverColor);
      if (modifyFill) {
        element.selectAll('*').attr('fill', hoverColor);
      }
      if (titleId) {
        title.attr('stroke', hoverColor).attr('fill', hoverColor);
      }
    };

    const onMouseOut = () => {
      if (isResizing.value) return;
      element.selectAll('*').attr('stroke', function() { return d3.select(this).attr('original-stroke'); });
      if (modifyFill) {
        element.selectAll('*').attr('fill', function() { return d3.select(this).attr('original-fill'); });
      }
      if (titleId) {
        title.attr('stroke', function() { return d3.select(this).attr('original-stroke'); }).attr('fill', function() { return d3.select(this).attr('original-fill'); });
      }
    };

    element.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
    if (titleId) title.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
  };

  const addBoundingBoxEffect = (elementId, titleId) => {
    const element = d3.select(`#${elementId}`);
    const title = d3.select(`#${titleId}`);
    let boundingBoxId = null;
  
    const onMouseOver = () => {
      if (isResizing.value) return;
      const elementIndex = drawElements.value.length;
      let boundingBox;
      if (titleId) {
        const bbox = element.node().getBoundingClientRect();
        const titleBbox = title.node().getBoundingClientRect();
        const x1 = Math.min(bbox.x, titleBbox.x);
        const y1 = Math.min(bbox.y, titleBbox.y);
        const x2 = Math.max(bbox.x + bbox.width, titleBbox.x + titleBbox.width);
        const y2 = Math.max(bbox.y + bbox.height, titleBbox.y + titleBbox.height);
        const width = x2 - x1;
        const height = y2 - y1;
        boundingBox = [x1, y1, width, height];
      } else {
        const bbox = element.node().getBoundingClientRect();
        boundingBox = [bbox.x, bbox.y, bbox.width, bbox.height];
      }
      let newElement = createBoundingBox({
        x: boundingBox[0],
        y: boundingBox[1],
        width: boundingBox[2],
        height: boundingBox[3],
        index: elementIndex,
      });
      selectedElementId.value = newElement.id;
      boundingBoxId = newElement.id;
      drawElements.value.push(newElement);
      targetType.value = 'element';
    };
  
    const onMouseOut = (event) => {
      // if (isResizing.value) return;
      // if (boundingBoxId !== null) {
      //   const boundingBox = drawElements.value.find(el => el.id === boundingBoxId);
      //   if (boundingBox) {
      //     const bbox = boundingBox.$el.getBoundingClientRect();
      //     if (
      //       event.clientX < bbox.left ||
      //       event.clientX > bbox.right ||
      //       event.clientY < bbox.top ||
      //       event.clientY > bbox.bottom
      //     ) {
      //       drawElements.value = drawElements.value.filter(el => el.id !== boundingBoxId);
      //       boundingBoxId = null;
      //     }
      //   }
      // }
    };
  
    element.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
    if (titleId) title.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
  };

  if (isViewMode.value){
    addEffect('x-axis', 'titlex-axis', 'red');
    addEffect('y-axis', 'titley-axis', 'red');
    addEffect('background', null, 'red');
    addEffect('marks', null, 'red', false); // 为 marks 添加 hover 效果，只修改 stroke
  }
  else {
    // addBoundingBoxEffect('x-axis', 'titlex-axis');
    // addBoundingBoxEffect('y-axis', 'titley-axis');
    // addBoundingBoxEffect('background', null);
    // addBoundingBoxEffect('marks', null);
    addBoundingBoxEffect('chart', null);
  }
};

onMounted(() => {
  const files = import.meta.glob('/public/json/*.json'); // 匹配 public/json 文件夹中的 JSON 文件
  jsonFiles.value = Object.keys(files).map(filePath => filePath.replace('/public/json/', ''));
  const svgFilesGlob = import.meta.glob('/public/svg/*.svg'); // 匹配 public/svg 文件夹中的 SVG 文件
  svgFiles.value = Object.keys(svgFilesGlob).map(filePath => filePath.replace('/public/svg/', ''));
  addHoverEffect();
});

watch(isViewMode, () => {
  addHoverEffect();
});

const handleBBoxMouseOut = (event, id) => {
  console.log("mouse out");
  if (!fixedElementIdList.value.includes(id)) {
    drawElements.value = drawElements.value.filter(el => el.id !== id);
  }
};
const handleBBoxClick = (event, id) => {
  console.log("handleBBoxClick", id);
  if (fixedElementIdList.value.includes(id)) {
    fixedElementIdList.value = fixedElementIdList.value.filter(el => el !== id);
  } else {
    fixedElementIdList.value.push(id);
  }
};

// 开始调整大小
const startResize = (event, id, targetType = 'element') => {
  event.preventDefault();
  event.stopPropagation();
  console.log("startResize targetType", targetType);
  
  isResizing.value = true;
  selectedElementId.value = id;
  
  const element = drawElements.value.find(el => el.id === id);
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = element.width;
  const startHeight = element.height;
  const aspectRatio = startWidth / startHeight;
  const targetElement = targetType === 'image' ? document.getElementById(currentImageId.value) : document.getElementById('chart');
  console.log("targetElement", targetElement);
  let targetBBox;
  targetBBox = targetElement.getBoundingClientRect();
  const canvasElement = document.getElementById('chartCanvas');
  const canvasBBox = canvasElement.getBoundingClientRect();
  targetBBox.x = targetBBox.x - canvasBBox.x;
  targetBBox.y = targetBBox.y - canvasBBox.y;
  
  // if (targetType === 'image') {
  //   // targetBBox = {x:element.x, y:element.y, width:element.width, height:element.height};
  //   targetBBox = targetElement.getBoundingClientRect();
  // } else {
  //   const targetParentElement = targetElement.parentElement;
  //   targetBBox = targetParentElement.
  // }
  // const targetParentElement = targetElement.parentElement;
  //  = targetParentElement.getBBox();
  console.log("targetBBox", targetBBox);
  const targetX = targetBBox.x;
  const targetY = targetBBox.y;
  const targetWidth = targetBBox.width;
  const targetHeight = targetBBox.height;
  let transform = targetElement.getAttribute('transform');
  if (!transform) {
    transform = '';
  }

  const handleResize = (e) => {
    if (!isResizing.value) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newWidth = Math.max(50, startWidth + dx);  // 最小宽度 50px
    let newHeight = Math.max(50, startHeight + dy); // 最小高度 50px

    // 保持长宽比
    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }
    console.log("newWidth, newHeight", newWidth, newHeight);

    canvasRef.value = document.getElementById('chartCanvas');
    // 获取画布边界
    const canvasRect = canvasRef.value.getBoundingClientRect();
    
    // 确保不超出画布
    const maxWidth = canvasRect.left + canvasRect.width - element.x;
    const maxHeight = canvasRect.top + canvasRect.height - element.y;
    
    element.width = Math.min(newWidth, maxWidth);
    element.height = Math.min(newHeight, maxHeight);

    const scaleX = element.width / targetWidth;
    const scaleY = element.height / targetHeight;
    const newScale = `scale(${scaleX}, ${scaleY})`;
    const scaledX = targetX * scaleX;
    const scaledY = targetY * scaleY;
    // console.log('targetX, targetY, scaledX, scaledY', targetX, targetY, scaledX, scaledY);
    const newTranslate = `translate(${targetX - scaledX}, ${targetY - scaledY})`;
    console.log("newTranslate", newTranslate);
    if (transform === '') {
      targetElement.setAttribute('transform', `${newTranslate}, ${newScale}`);
      // targetElement.setAttribute('transform', `${newScale}`);
    }
    else {
      targetElement.setAttribute('transform', `${newTranslate}, ${newScale}, ${transform}`);
    }
  };
  
  const stopResize = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  };
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

const startDrag = (event, id, targetType = 'element') => {
  event.preventDefault();
  event.stopPropagation();
  
  isDragging.value = true;
  selectedElementId.value = id;
  
  const element = drawElements.value.find(el => el.id === id);
  dragOffset.value = {
    x: event.clientX - element.x,
    y: event.clientY - element.y
  };
  dragInit.value = {
    x: event.clientX,
    y: event.clientY
  };

  const targetElement = targetType === 'image' ? document.getElementById(currentImageId.value) : document.getElementById('chart');
  dragInitTransform.value = targetElement.getAttribute('transform');
  document.addEventListener('mousemove', (e) => handleDrag(e, targetType));
  document.addEventListener('mouseup', stopDrag);
};

const processPath = (path) => {
  return path.replace('pictogram/', '');
};

const handleDrag = (event, targetType) => {
  if (!isDragging.value) return;

  const id = selectedElementId.value;
  if (id === null) return;
  
  const element = drawElements.value.find(el => el.id === id);
  const newX = event.clientX - dragOffset.value.x;
  const newY = event.clientY - dragOffset.value.y;
  
  // 获取画布边界
  const canvas = canvasRef.value;
  const canvasRect = canvas.getBoundingClientRect();

  // 获取目标元素大小
  console.log("targetType", targetType);
  const targetElement = targetType === 'image' ? document.getElementById(currentImageId.value) : document.getElementById('chart');
  const targetBBox = targetElement.getBoundingClientRect();
  const targetWidth = targetBBox.width;
  const targetHeight = targetBBox.height;
  
  // 确保元素不会拖出画布
  const maxX = canvasRect.left + canvasRect.width - element.width;
  const maxY = canvasRect.top + canvasRect.height - element.height;
  const minX = canvasRect.left;
  const minY = canvasRect.top;
  element.x = Math.max(minX, Math.min(newX, maxX));
  element.y = Math.max(minY, Math.min(newY, maxY));

  const elementInitX = dragInit.value.x - dragOffset.value.x;
  const elementInitY = dragInit.value.y - dragOffset.value.y;

  const translateX = element.x - elementInitX;
  const translateY = element.y - elementInitY;
  const newTranslate = `translate(${translateX}, ${translateY})`;
  if (!dragInitTransform.value){
    targetElement.setAttribute('transform', newTranslate);
  }
  else {
    targetElement.setAttribute('transform', `${newTranslate}, ${dragInitTransform.value}`);
  }
};

const stopDrag = (event) => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  isDragging.value = false;
};

const addImageToChart = (path) => {
  const svg = d3.select('#chartCanvas svg');
  const imageId = `image-${drawElements.value.length}`;
  const image = svg.append('image')
    .attr('id', imageId)
    .attr('x', 50) // 初始位置，可根据需要调整
    .attr('y', 50) // 初始位置，可根据需要调整
    .attr('width', 100) // 初始宽度，可根据需要调整
    .attr('height', 100) // 初始高度，可根据需要调整
    .attr('href', path)
    .attr('opacity', 0.1);
  
    
  image.transition()
    .duration(500)
    .attr('opacity', 1);
  
  image.on('mouseover', () => {
    targetType.value = 'image';
    const imageBBox = image.node().getBoundingClientRect();
    if (!isDragging.value && !isResizing.value) {
      const boundingBox = createBoundingBox({
        x: imageBBox.x,
        y: imageBBox.y,
        width: imageBBox.width,
        height: imageBBox.height,
        index: drawElements.value.length,
      });
      drawElements.value.push(boundingBox);
      selectedElementId.value = boundingBox.id;
      currentImageId.value = imageId;
    }
  });

  // image.on('mousedown', (event) => startDrag(event, boundingBox.id, 'image'));
};

// 添加分割图片到画布的方法
const addSegmentToChart = (image) => {
  const svg = d3.select('#chartCanvas svg');
  const imageId = `segment-${Date.now()}`;
  
  const imageElement = svg.append('image')
    .attr('id', imageId)
    .attr('x', 50)
    .attr('y', 50)
    .attr('width', image.originalWidth || 100)
    .attr('height', image.originalHeight || 100)
    .attr('href', image.url)
    .attr('opacity', 0.1);
    
  imageElement.transition()
    .duration(500)
    .attr('opacity', 1);
  
  imageElement.on('mouseover', () => {
    targetType.value = 'image';
    const imageBBox = imageElement.node().getBoundingClientRect();
    if (!isDragging.value && !isResizing.value) {
      const boundingBox = createBoundingBox({
        x: imageBBox.x,
        y: imageBBox.y,
        width: imageBBox.width,
        height: imageBBox.height,
        index: drawElements.value.length,
      });
      drawElements.value.push(boundingBox);
      selectedElementId.value = boundingBox.id;
      currentImageId.value = imageId;
    }
  });
};

</script>


<style scoped src="./design.css">

</style>

<style scoped>
.right-sidebar {
  width: 20%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
}

.upper-section,
.middle-section {
  flex-shrink: 0;
  height: 40%;
  overflow-y: auto;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.lower-section {
  flex-grow: 1;
  overflow-y: auto;
}

.section-title {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  background-color: #f5f5f5;
}

.segment-image-card {
  position: relative;
  overflow: hidden;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>