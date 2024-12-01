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
                  label="选择图表数据"
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
                  item-title="text"
                  item-value="value"
                >
                  <template v-slot:selection="{ item }">
                    <v-icon :icon="item.raw.icon" size="small" class="mr-2"></v-icon>
                    {{ item.raw.text }}
                  </template>
                  
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon :icon="item.raw.icon" size="small"></v-icon>
                      </template>
                      <!-- <v-list-item-title>{{ item.raw.text }}</v-list-item-title> -->
                    </v-list-item>
                  </template>
                </v-select>
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
          <!-- 添加标题 -->
          <div class="section-title pa-2">
            已保存的图表
          </div>
          
          <div class="scrollable-content">
            <v-container class="px-2 py-2">
              <v-row dense>
                <v-col
                  v-for="(svg, index) in svgFiles"
                  :key="svg.id"
                  cols="12"
                  class="pa-1"
                >
                  <v-card
                    variant="outlined"
                    class="image-card"
                    @click="loadSvg(svg)"
                  >
                    <div class="d-flex align-center pa-2">
                      <div class="flex-grow-1">
                        <v-img
                          cover
                          height="150"
                          :src="svg.url"
                        ></v-img>
                      </div>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        variant="text"
                        class="ml-2"
                        @click.stop="deleteSvg(svg.id)"
                      ></v-btn>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 - 60% -->
      <div class="canvas-container" @contextmenu.prevent>
        <div class="canvas-wrapper">
          <div id="chartCanvas" @contextmenu.prevent></div>
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
          <!-- 添加标题 -->
          <div class="section-title pa-2">
            已有图标
          </div>
          <v-container class="pa-4">
            <v-row dense>
              <v-col v-for="(path, index) in pictogramPaths" :key="index" cols="6" class="mb-2">
                <div class="square-card">
                  <div class="image-container">
                    <v-img
                      :src="path"
                      @click="addImageToChart(path)"
                      class="square-image"
                      contain
                    ></v-img>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- 分割图片部分 -->
        <div class="middle-section">
          <div class="section-title pa-2">
            分割图片 ({{ segmentedImages.length }})
          </div>
          <v-container class="pa-4">
            <v-row dense>
              <v-col v-for="image in segmentedImages" :key="image.id" cols="6" class="mb-2">
                <div class="square-card">
                  <div class="image-container">
                    <v-img
                      :src="image.url"
                      @click="addSegmentToChart(image)"
                      class="segment-image"
                      contain
                    ></v-img>
                    <v-btn
                      icon="mdi-delete"
                      size="x-small"
                      color="error"
                      variant="flat"
                      class="delete-btn"
                      @click.stop="deleteSegmentImage(image.id)"
                    ></v-btn>
                  </div>
                </div>
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
const chartTypes = ref([
  { text: 'Bar', value: 'Bar', icon: 'mdi-chart-bar' },
  { text: 'Pie', value: 'Pie', icon: 'mdi-chart-pie' },
  { text: 'Line', value: 'Line', icon: 'mdi-chart-line' },
  { text: 'Scatter Plot', value: 'Scatter Plot', icon: 'mdi-chart-scatter-plot' }
]); // 图表类型列表
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

// 添加新的响应式变量
const savedDesigns = ref([]);

// 在 onMounted 中加载分割图片数据
onMounted(() => {
  canvasRef.value = document.getElementById('chartCanvas');
  const files = import.meta.glob('/public/json/*.json'); // 匹配 public/json 文件夹中的 JSON 文件
  jsonFiles.value = Object.keys(files).map(filePath => filePath.replace('/public/json/', ''));
  
  // 从 localStorage 加载已保存的 SVG
  try {
    const savedSvgs = localStorage.getItem('savedSvgs');
    if (savedSvgs) {
      svgFiles.value = JSON.parse(savedSvgs);
    }
  } catch (error) {
    console.error('从localStorage加载SVG失败:', error);
  }
  
  const pictogramsGlobal = import.meta.glob('/public/pictogram/*.png');
  pictogramPaths.value = Object.keys(pictogramsGlobal).map(filePath => filePath.replace('/public/', ''));
  console.log("pictogramPaths", pictogramPaths);
  addHoverEffect();
  
  // 从 localStorage 加载分割图片
  try {
    const savedSegments = localStorage.getItem('segmentedImages');
    if (savedSegments) {
      segmentedImages.value = JSON.parse(savedSegments);
      console.log('Loaded segmented images:', segmentedImages.value);
      
      // 检查每个图片的 URL
      segmentedImages.value.forEach((img, index) => {
        console.log(`Image ${index}:`, {
          id: img.id,
          urlLength: img.url.length,
          hasData: img.url.startsWith('data:'),
          dimensions: `${img.originalWidth}x${img.originalHeight}`
        });
      });
    }
  } catch (error) {
    console.error('从localStorage加载分割图片失败:', error);
  }

  // 禁用画布的右键菜单
  const canvas = document.getElementById('chartCanvas');
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

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

  // 确保图表有正确的ID
  const chartElement = d3.select('#chartCanvas svg #chart');
  if (!chartElement.empty()) {
    chartElement
      .attr('id', 'chart')
      .attr('data-element-id', 'chart');
  }
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
                            // key以'Color'结尾
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

  try {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    // 创建新的 SVG 记录
    const newSvg = {
      id: `svg_${Date.now()}`,
      url: `data:image/svg+xml;base64,${btoa(svgString)}`,
      timestamp: Date.now()
    };
    
    // 添加到数组
    svgFiles.value.unshift(newSvg);
    
    // 保存到 localStorage
    localStorage.setItem('savedSvgs', JSON.stringify(svgFiles.value));
    
  } catch (error) {
    console.error('保存SVG失败:', error);
    alert('保存失败，请重试');
  }
};

const loadSvg = async (svg) => {
  try {
    const chartCanvas = document.getElementById('chartCanvas');
    
    // 如果是 base64 格式的 SVG 数据
    if (svg.url.startsWith('data:image/svg+xml;base64,')) {
      const svgString = atob(svg.url.split(',')[1]);
      chartCanvas.innerHTML = svgString;
    } else {
      // 如果是文件路径（兼容旧数据）
      const response = await fetch(svg.url);
      if (!response.ok) throw new Error('Failed to load SVG file');
      const svgText = await response.text();
      chartCanvas.innerHTML = svgText;
    }
    
    // 添加不可选择属性
    const svgElement = d3.select('#chartCanvas svg');
    svgElement.selectAll('text')
      .style('user-select', 'none')
      .style('-webkit-user-select', 'none')
      .style('-moz-user-select', 'none')
      .style('-ms-user-select', 'none');
    
    addHoverEffect();
  } catch (error) {
    console.error('加载SVG失败:', error);
    alert('加载失败，请重试');
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
  clearInteractions(); // 清除所有交互功能
  
  const addBoundingBoxEffect = (elementId, titleId) => {
    const element = d3.select(`#${elementId}`);
    const title = titleId ? d3.select(`#${titleId}`) : null;
    let boundingBoxId = null;
    console.log("element", element);
  
    const onMouseOver = () => {
      if (isResizing.value) return;
      
      // 获取元素的边界框
      let boundingBox;
      const elementBBox = element.node().getBoundingClientRect();
      boundingBox = {
        x: elementBBox.left,
        y: elementBBox.top,
        width: elementBBox.width,
        height: elementBBox.height
      };
      // const canvasElement = document.getElementById('chartCanvas');
      // const canvasBBox = canvasElement.getBoundingClientRect();
      
      // // 调整坐标，使其相对于画布
      // const adjustedX = elementBBox.x - canvasBBox.x;
      // const adjustedY = elementBBox.y - canvasBBox.y;
      
      // if (titleId && title) {
      //   const titleBBox = title.node().getBoundingClientRect();
      //   const adjustedTitleX = titleBBox.x - canvasBBox.x;
      //   const adjustedTitleY = titleBBox.y - canvasBBox.y;
        
      //   const x1 = Math.min(adjustedX, adjustedTitleX);
      //   const y1 = Math.min(adjustedY, adjustedTitleY);
      //   const x2 = Math.max(adjustedX + elementBBox.width, adjustedTitleX + titleBBox.width);
      //   const y2 = Math.max(adjustedY + elementBBox.height, adjustedTitleY + titleBBox.height);
        
      //   boundingBox = {
      //     x: x1,
      //     y: y1,
      //     width: x2 - x1,
      //     height: y2 - y1
      //   };
      // } else {
      //   boundingBox = {
      //     x: adjustedX,
      //     y: adjustedY,
      //     width: elementBBox.width,
      //     height: elementBBox.height
      //   };
      // }

      // 创建边界框元素
      let newElement = createBoundingBox({
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        index: drawElements.value.length,
      });
      
      selectedElementId.value = newElement.id;
      boundingBoxId = newElement.id;
      drawElements.value.push(newElement);
      targetType.value = elementId === 'chart' ? 'chart' : 'element';
    };
  
    const onMouseOut = (event) => {
      if (isResizing.value) return;
      if (boundingBoxId !== null && !fixedElementIdList.value.includes(boundingBoxId)) {
        const boundingBox = drawElements.value.find(el => el.id === boundingBoxId);
        if (boundingBox) {
          const bbox = document.getElementById(boundingBoxId).getBoundingClientRect();
          if (
            event.clientX < bbox.left ||
            event.clientX > bbox.right ||
            event.clientY < bbox.top ||
            event.clientY > bbox.bottom
          ) {
            drawElements.value = drawElements.value.filter(el => el.id !== boundingBoxId);
            boundingBoxId = null;
          }
        }
      }
    };
  
    element.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
    if (title) {
      title.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
    }
  };

  if (isViewMode.value) {
    // 视图模式下添加hover效果
    // addEffect('x-axis', 'titlex-axis', 'red');
    // addEffect('y-axis', 'titley-axis', 'red');
    // addEffect('background', null, 'red');
    // addEffect('marks', null, 'red', false);
  } else {
    // 编辑模式下添加边界框效果
    addBoundingBoxEffect('chart', null);
    // 为图片元素添加边界框效果
    segmentedImages.value.forEach(image => {
      if (document.getElementById(image.id)) {
        addBoundingBoxEffect(image.id, null);
      }
    });
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
  // 处理右键点击
  if (event.button === 2) { // 2 表示右键
    event.preventDefault();
    event.stopPropagation();
    console.log("handleBBoxClick right click", id);
    // 如果是图片的边界框，删除对应的图片
    if (currentImageId.value) {
      deleteImage(currentImageId.value);
    }
    return;
  }

  // 原有的左键点击逻辑
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
  
  isResizing.value = true;
  selectedElementId.value = id;
  
  const element = drawElements.value.find(el => el.id === id);
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = element.width;
  const startHeight = element.height;
  const aspectRatio = startWidth / startHeight;

  // 根据目标类型和ID选择正确的元素
  let targetElement;
  if (targetType === 'image') {
    // 使用当前选中的图片ID
    targetElement = document.getElementById(currentImageId.value);
  } else if (targetType === 'chart') {
    targetElement = document.getElementById('chart');
  } else {
    targetElement = document.querySelector(`[data-element-id="${id}"]`);
  }

  if (!targetElement) {
    console.error('Target element not found:', id, targetType);
    return;
  }

  const targetBBox = targetElement.getBoundingClientRect();
  const canvasElement = document.getElementById('chartCanvas');
  const canvasBBox = canvasElement.getBoundingClientRect();
  targetBBox.x = targetBBox.x - canvasBBox.x;
  targetBBox.y = targetBBox.y - canvasBBox.y;
  
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
    
    let newWidth = Math.max(50, startWidth + dx);
    let newHeight = Math.max(50, startHeight + dy);

    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    canvasRef.value = document.getElementById('chartCanvas');
    const canvasRect = canvasRef.value.getBoundingClientRect();
    const maxWidth = canvasRect.left + canvasRect.width - element.x;
    const maxHeight = canvasRect.top + canvasRect.height - element.y;
    
    element.width = Math.min(newWidth, maxWidth);
    element.height = Math.min(newHeight, maxHeight);

    const scaleX = element.width / targetWidth;
    const scaleY = element.height / targetHeight;
    const newScale = `scale(${scaleX}, ${scaleY})`;
    const scaledX = targetX * scaleX;
    const scaledY = targetY * scaleY;
    const newTranslate = `translate(${targetX - scaledX}, ${targetY - scaledY})`;

    // 只更新当前选中的元素的transform
    if (transform === '') {
      targetElement.setAttribute('transform', `${newTranslate}, ${newScale}`);
    } else {
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

  // 根据目标类型选择正确的元素
  let targetElement;
  if (targetType === 'image') {
    targetElement = document.getElementById(currentImageId.value);
  } else if (targetType === 'chart') {
    targetElement = document.getElementById('chart');
  } else {
    targetElement = document.querySelector(`[data-element-id="${id}"]`);
  }

  if (targetElement) {
    dragInitTransform.value = targetElement.getAttribute('transform');
  }

  const handleDragWithType = (e) => handleDrag(e, targetType);
  document.addEventListener('mousemove', handleDragWithType);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', handleDragWithType);
    stopDrag();
  });
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

  // 修改目标元素的选择逻辑
  let targetElement;
  if (targetType === 'image') {
    targetElement = document.getElementById(currentImageId.value);
  } else if (targetType === 'chart') {
    targetElement = document.getElementById('chart');
  } else {
    targetElement = document.querySelector(`[data-element-id="${id}"]`);
  }

  if (!targetElement) {
    console.error('Target element not found:', id, targetType);
    return;
  }

  const targetBBox = targetElement.getBoundingClientRect();
  
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
  
  // 只更新当前选中的元素的transform
  if (!dragInitTransform.value) {
    targetElement.setAttribute('transform', newTranslate);
  } else {
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
  const imageId = `image-${Date.now()}`;
  const image = svg.append('image')
    .attr('id', imageId)
    .attr('data-element-id', imageId)
    .attr('x', 50)
    .attr('y', 50)
    .attr('width', 100)
    .attr('height', 100)
    .attr('href', path)
    .attr('opacity', 0.1);
    
  image.transition()
    .duration(500)
    .attr('opacity', 1);
  
  // 添加右键点击事件
  image.on('contextmenu', (event) => {
    event.preventDefault();
    event.stopPropagation(); // 阻止事件冒泡
    deleteImage(imageId);
    return false;
  });
  
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
};

// 添加删除图片的函数
const deleteImage = (imageId) => {
  // 删除SVG中的图片元素
  const image = d3.select(`#${imageId}`);
  if (!image.empty()) {
    image.remove();
  }
  
  // 如果当前选中的是这个图片，清除选中状态
  if (currentImageId.value === imageId) {
    currentImageId.value = null;
    selectedElementId.value = null;
  }
  
  // 删除相关的边界框
  drawElements.value = drawElements.value.filter(el => {
    const element = document.getElementById(el.id);
    if (element && element.classList.contains('element-box')) {
      const relatedImage = document.getElementById(imageId);
      if (!relatedImage) {
        element.remove();
        return false;
      }
    }
    return true;
  });
};

// 计算图片样式
const getImageStyle = (image) => {
  if (!image.originalWidth || !image.originalHeight) return {};
  
  const ratio = image.originalWidth / image.originalHeight;
  if (ratio > 1) {
    return {
      width: '100%',
      height: 'auto',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)'
    };
  } else {
    return {
      width: 'auto',
      height: '100%',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)'
    };
  }
};

// 添加分割图片到图表
const addSegmentToChart = (image) => {
  console.log('Adding segment to chart:', image);
  const svg = d3.select('#chartCanvas svg');
  const imageId = `segment-${Date.now()}`;
  
  svg.append('image')
    .attr('id', imageId)
    .attr('x', 50)
    .attr('y', 50)
    .attr('width', image.originalWidth || 100)
    .attr('height', image.originalHeight || 100)
    .attr('href', image.url)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // 为新添加的图片添加hover效果
  addHoverEffect();
};

// 删除分割图片
const deleteSegmentImage = (imageId) => {
  segmentedImages.value = segmentedImages.value.filter(img => img.id !== imageId);
  saveSegmentsToLocalStorage();
};

// 保存到localStorage
const saveSegmentsToLocalStorage = () => {
  try {
    localStorage.setItem('segmentedImages', JSON.stringify(segmentedImages.value));
  } catch (error) {
    console.error('保存到localStorage失败:', error);
    if (error.name === 'QuotaExceededError') {
      segmentedImages.value = segmentedImages.value.slice(-5);
      localStorage.setItem('segmentedImages', JSON.stringify(segmentedImages.value));
    }
  }
};

// 添加监听器以检查数据变化
watch(segmentedImages, (newVal) => {
  console.log('segmentedImages changed:', newVal.length);
}, { deep: true });



// 重新绑定事件监听器
const rebindEventListeners = () => {
  // 为所有图片重新绑定事件
  const images = document.querySelectorAll('#chartCanvas svg image');
  images.forEach(img => {
    const imageId = img.getAttribute('id');
    d3.select(img)
      .on('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteImage(imageId);
      })
      .on('mouseover', () => {
        if (!isDragging.value && !isResizing.value) {
          targetType.value = 'image';
          const imageBBox = img.getBoundingClientRect();
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
  });
};

// 添加删除 SVG 的函数
const deleteSvg = (svgId) => {
  svgFiles.value = svgFiles.value.filter(svg => svg.id !== svgId);
  localStorage.setItem('savedSvgs', JSON.stringify(svgFiles.value));
};

</script>


<style scoped src="./design.css">

</style>

<style scoped>
/* 统一的卡片和图片容器样式 */
.square-card {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 创建正方形容器 */
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  overflow: hidden;
}

.image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 统一的图片样式 */
.square-image,
.segment-image {
  width: 100% !important;
  height: 100% !important;
}

.square-image :deep(.v-img__img),
.segment-image :deep(.v-img__img) {
  object-fit: contain !important;
}

/* 布局样式 */
.right-sidebar {
  width: 20%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #f5f5f5;
  overflow: hidden;
}

.upper-section,
.middle-section {
  flex-shrink: 0;
  height: 40%;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.section-title {
  flex-shrink: 0;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  background-color: #e0e0e0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-container {
  flex: 1;
  overflow-y: auto;
}

/* 滚动条样式 */
.v-container::-webkit-scrollbar {
  width: 6px;
}

.v-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.v-container::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 删除按钮样式 */
.delete-btn {
  position: absolute !important;
  top: 4px;
  right: 4px;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-container:hover .delete-btn {
  opacity: 1;
}
</style>