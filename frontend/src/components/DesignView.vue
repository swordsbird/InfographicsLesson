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
        </div>
      </div>

      <!-- 右侧栏 - 20% -->
      <div class="right-sidebar">
        <div class="scrollable-content">
          <v-container class="pa-4">
            <v-row dense>
              <v-col cols="12" class="mb-2">
                <v-btn
                  block
                  color="primary"
                  variant="outlined"
                >
                  操作按钮 1
                </v-btn>
              </v-col>
              <v-col cols="12" class="mb-2">
                <v-btn
                  block
                  color="primary"
                  variant="outlined"
                >
                  操作按钮 2
                </v-btn>
              </v-col>
              <v-col v-for="n in 30" :key="n" cols="12" class="mb-2">
                <v-card variant="outlined" class="pa-4">
                  占位内容 {{ n }}
                </v-card>
              </v-col>
            </v-row>
          </v-container>
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

// 选择器相关数据
const jsonFiles = ref([]); // JSON 文件列表
const selectedJsonFile = ref(''); // 用户选中的 JSON 文件
const chartTypes = ref(['Bar', 'Pie', 'Line', 'Scatter Plot']); // 图表类型列表
const selectedChartType = ref(''); // 用户选中的图���类型
const chartData = ref(null); // 用于存储加载的 JSON 数据
const svgFiles = ref([]); // SVG 文件列表
const isViewMode = ref(true); // 交互模式切换

// 生成按钮是否可用
const canGenerateChart = computed(() => selectedJsonFile.value && selectedChartType.value);

// 动态加载 public/json 文件夹下的所有 JSON 文件
onMounted(() => {
  const files = import.meta.glob('/public/json/*.json'); // 匹配 public/json 文件夹中的 JSON 文件
  jsonFiles.value = Object.keys(files).map(filePath => filePath.replace('/public/json/', ''));
  const svgFilesGlob = import.meta.glob('/public/svg/*.svg'); // 匹配 public/svg 文件夹中的 SVG 文件
  svgFiles.value = Object.keys(svgFilesGlob).map(filePath => filePath.replace('/public/svg/', ''));
  addHoverEffect();
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
const setDefaultStyles = (meta_data, data, input_styles) => {
  if (input_styles === undefined) {
    input_styles = {};
  }
  if (meta_data.x_type === 'categorical' && data[0].x_data_icon === undefined) {return;}
  let styles = {};
  let defaultTextStyles = {
      textColor: 'black',
      textSize: "12px",
      textAlign: 'start',
      textFont: 'Arial',
  };
  let defaultStrokeStyles = {
      strokeColor: 'black',
      strokeWidth: 1,
  };
  let defaultFillStyles = {
      fillColor: 'steelblue',
  };

  let defaultAttachStyles = {
      attachMethod : 'unit', // attach, unit, multiple, or none
      attachSide : 'outer', // outer, inner
      attachRelativePos : 'end', // start, middle, end
      attachSizeRatio : 0.8,
  };
  let defaultAnnotateStyles = {
      attachMethod : "attach", // attach, unit, multiple, or none
      attachSide : 'inner', // outer, inner
      attachRelativePos : 'middle', // start, middle, end
      attachSizeRatio : 0.75,
      stackAttach: 'max',
  };

  let defaultTitleTextStyles = {
      textColor: 'darkblue',
      textSize: "20px",
      textAlign: 'start',
      textFont: 'Trebuchet MS',
  };
  let defaultCaptionTextStyles = {
      textColor: 'darkslategray',
      textSize: "12px",
      textAlign: 'start',
      textFont: 'Verdana',
  };

  let defaultIconStyles = {
      layout: "top", // top, bottom, left, right
      align: "left", // top, bottom, middle, left, right
      sizeRatio: 0.75,
  };

  let axisTextStyles = defaultTextStyles;
  let axisStrokeStyles = defaultStrokeStyles;
  let axisFillStyles = defaultFillStyles;
  let axisAttachStyles = defaultAttachStyles;

  let titleTextStyles = defaultTitleTextStyles;
  let titleStrokeStyles = defaultStrokeStyles;
  let titleFillStyles = defaultFillStyles;
  let titleIconStyles = {...defaultIconStyles};

  let captionTextStyles = defaultCaptionTextStyles;
  let captionStrokeStyles = defaultStrokeStyles;
  let captionFillStyles = defaultFillStyles;

  let topicIconTextStyles = defaultTextStyles;
  let topicIconStrokeStyles = defaultStrokeStyles;
  let topicIconFillStyles = defaultFillStyles;
  let topicIconIconStyles = {...defaultIconStyles};

  let markStrokeStyles = defaultStrokeStyles;
  let markFillStyles = defaultFillStyles;
  let markTextStyles = defaultTextStyles;
  let markAttachStyles = defaultAttachStyles;
  let markAnnotateStyles = defaultAnnotateStyles;


  let attachStyles = defaultAttachStyles;
  if (input_styles.attachStyles !== undefined) {
      for (const key in input_styles.attachStyles) {
          attachStyles[key] = input_styles.attachStyles[key];
      }
  }
  const inputAxisStyles = input_styles.axisStyles;
  if (inputAxisStyles !== undefined) {
      if (inputAxisStyles.textStyles !== undefined) {
          for (const key in inputAxisStyles.textStyles) {
              axisTextStyles[key] = inputAxisStyles.textStyles[key];
          }
      }
      if (inputAxisStyles.strokeStyles !== undefined) {
          for (const key in inputAxisStyles.strokeStyles) {
              axisStrokeStyles[key] = inputAxisStyles.strokeStyles[key];
          }
      }
      if (inputAxisStyles.fillStyles !== undefined) {
          for (const key in inputAxisStyles.fillStyles) {
              axisFillStyles[key] = inputAxisStyles.fillStyles[key];
          }
      }
  }

  const inputTitleStyles = input_styles.titleStyles;
  if (inputTitleStyles !== undefined) {
      if (inputTitleStyles.textStyles !== undefined) {
          for (const key in inputTitleStyles.textStyles) {
              titleTextStyles[key] = inputTitleStyles.textStyles[key];
          }
      }
      if (inputTitleStyles.strokeStyles !== undefined) {
          for (const key in inputTitleStyles.strokeStyles) {
              titleStrokeStyles[key] = inputTitleStyles.strokeStyles[key];
          }
      }
      if (inputTitleStyles.fillStyles !== undefined) {
          for (const key in inputTitleStyles.fillStyles) {
              titleFillStyles[key] = inputTitleStyles.fillStyles[key];
          }
      }
      if (inputTitleStyles.iconStyles !== undefined) {
          for (const key in inputTitleStyles.iconStyles) {
              titleIconStyles[key] = inputTitleStyles.iconStyles[key];
          }
      }
  }
  const inputCaptionStyles = input_styles.captionStyles;
  if (inputCaptionStyles !== undefined) {
      if (inputCaptionStyles.textStyles !== undefined) {
          for (const key in inputCaptionStyles.textStyles) {
              captionTextStyles[key] = inputCaptionStyles.textStyles[key];
          }
      }
      if (inputCaptionStyles.strokeStyles !== undefined) {
          for (const key in inputCaptionStyles.strokeStyles) {
              captionStrokeStyles[key] = inputCaptionStyles.strokeStyles[key];
          }
      }
      if (inputCaptionStyles.fillStyles !== undefined) {
          for (const key in inputCaptionStyles.fillStyles) {
              captionFillStyles[key] = inputCaptionStyles.fillStyles[key];
          }
      }
  }

  const inputTopicIconStyles = input_styles.topicIconStyles;
  if (inputTopicIconStyles !== undefined) {
      if (inputTopicIconStyles.textStyles !== undefined) {
          for (const key in inputTopicIconStyles.textStyles) {
              topicIconTextStyles[key] = inputTopicIconStyles.textStyles[key];
          }
      }
      if (inputTopicIconStyles.strokeStyles !== undefined) {
          for (const key in inputTopicIconStyles.strokeStyles) {
              topicIconStrokeStyles[key] = inputTopicIconStyles.strokeStyles[key];
          }
      }
      if (inputTopicIconStyles.fillStyles !== undefined) {
          for (const key in inputTopicIconStyles.fillStyles) {
              topicIconFillStyles[key] = inputTopicIconStyles.fillStyles[key];
          }
      }
      if (inputTopicIconStyles.iconStyles !== undefined) {
          for (const key in inputTopicIconStyles.iconStyles) {
              topicIconIconStyles[key] = inputTopicIconStyles.iconStyles[key];
          }
      }
  }

  const inputMarkStyles = input_styles.markStyles;
  if (inputMarkStyles !== undefined) {
      if (inputMarkStyles.textStyles !== undefined) {
          for (const key in inputMarkStyles.textStyles) {
              markTextStyles[key] = inputMarkStyles.textStyles[key];
          }
      }
      if (inputMarkStyles.strokeStyles !== undefined) {
          for (const key in inputMarkStyles.strokeStyles) {
              markStrokeStyles[key] = inputMarkStyles.strokeStyles[key];
          }
      }
      if (inputMarkStyles.fillStyles !== undefined) {
          for (const key in inputMarkStyles.fillStyles) {
              markFillStyles[key] = inputMarkStyles.fillStyles[key];
          }
      }
  }


  // axis styles
  let x_axis_styles = {
      // generic styles
      textStyles: axisTextStyles,
      strokeStyles: axisStrokeStyles,
      fillStyles: axisFillStyles,
      attachStyles: axisAttachStyles,
      
      // specific styles
      angle: 0,
      tickFace : 'clw',
      textFace : 'clw',
      tickInnerLength : 5,
      tickOuterLength : 0,
      tickNumber : 3,

      titleFace : 'clw',
      titleTextOrient : 'horizontal',
      titleAlign : 'middle',
      titleRelativePos : 'middle',
  };

  let y_axis_styles = {
      // generic styles
      textStyles: axisTextStyles,
      strokeStyles: axisStrokeStyles,
      fillStyles: axisFillStyles,
      
      // specific styles
      angle: 90,
      tickFace : 'cclw',
      textFace : 'cclw',
      tickInnerLength : 5,
      tickOuterLength : 0,
      tickNumber : 3,

      titleFace : 'cclw',
      titleTextOrient : 'horizontal',
      titleAlign : 'middle',
      titleRelativePos : 'middle',
  };
  if (input_styles.x_axis_styles !== undefined) {
      if (input_styles.x_axis_styles.angle !== undefined) {
          x_axis_styles.angle = input_styles.x_axis_styles.angle;
      }
  }
  if (input_styles.y_axis_styles !== undefined) {
      if (input_styles.y_axis_styles.angle !== undefined) {
          y_axis_styles.angle = input_styles.y_axis_styles.angle;
      }
  }

  
  const faceConfig = {
      '0,90': { x: 'clw', y: 'cclw' },
      '0,-90': { x: 'cclw', y: 'clw' },
      '90,0': { x: 'cclw', y: 'clw' },
      '90,180': { x: 'clw', y: 'cclw' },
      '-90,0': { x: 'clw', y: 'cclw' },
      '-90,180': { x: 'cclw', y: 'clw' },
      '180,90': { x: 'cclw', y: 'clw' },
      '180,-90': { x: 'clw', y: 'cclw' }
  };
  const config = faceConfig[`${x_axis_styles.angle},${y_axis_styles.angle}`];
  
  let mark_styles = {
      textStyles: markTextStyles,
      strokeStyles: markStrokeStyles,
      fillStyles: markFillStyles,
      attachStyles: markAttachStyles,
      annotateStyles: markAnnotateStyles,
  };

  let title_styles = {
      textStyles: titleTextStyles,
      strokeStyles: titleStrokeStyles,
      fillStyles: titleFillStyles,
      iconStyles: titleIconStyles
  };
  let caption_styles = {
      textStyles: captionTextStyles,
      strokeStyles: captionStrokeStyles,
      fillStyles: captionFillStyles
  };

  let topic_icon_styles = {
      textStyles: topicIconTextStyles,
      strokeStyles: topicIconStrokeStyles,
      fillStyles: topicIconFillStyles,
      iconStyles: topicIconIconStyles
  };

  
  if (config) {
      x_axis_styles.tickFace = config.x;
      x_axis_styles.textFace = config.x;
      x_axis_styles.titleFace = config.x;
  
      y_axis_styles.tickFace = config.y;
      y_axis_styles.textFace = config.y;
      y_axis_styles.titleFace = config.y;
  }
  if (input_styles.x_axis_styles !== undefined) {
      for (const key in input_styles.x_axis_styles) {
          x_axis_styles[key] = input_styles.x_axis_styles[key];
      }
  }
  if (input_styles.y_axis_styles !== undefined) {
      for (const key in input_styles.y_axis_styles) {
          y_axis_styles[key] = input_styles.y_axis_styles[key];
      }
  }

  var piechart_styles ={
      totalAngle: Math.PI*2,
      startAngle: 0,
      innerRadius: 50,
      outerRadius: 200,
      marginAngle: Math.PI*2/72
  }

  styles = {
      x_axis_styles: x_axis_styles,
      y_axis_styles: y_axis_styles,
      mark_styles: mark_styles,
      attachStyles: attachStyles,

      titleStyles: title_styles,
      captionStyles: caption_styles,
      topicIconStyles: topic_icon_styles,
      annotation_styles: [],

      annotate_data: false,

      piechart_styles: piechart_styles
  };

  // console.log("input_styles", input_styles);
  if (input_styles.show_legend !== undefined) {
    styles.show_legend = input_styles.show_legend;
  }
  if (input_styles.annotate_data !== undefined) {
    styles.annotate_data = input_styles.annotate_data;
  }

  var scale_factor = 1;
  var numberData = data.length;
  console.log('data',data);
  console.log(numberData);
  // numberData (3,10) ~ scale_factor (1, 2) with 0.1 random noise

  scale_factor = (numberData-3)/7 + 1 + (Math.random()*0.1-0.05);
  var height = 600;
  var width = 600;
  console.log(scale_factor)
  if (styles.y_axis_styles.angle===0 || styles.y_axis_styles.angle===180){
    height = 600*scale_factor;
  }
  else {
    width = 600*scale_factor;
  }
  console.log(height, width);
  return [meta_data, data, styles, width, height];
}

const loadSvg = async (svgFile) => {
  try {
    const response = await fetch(`/svg/${svgFile}`);
    if (!response.ok) throw new Error('Failed to load SVG file');

    const svgText = await response.text();
    const chartCanvas = document.getElementById('chartCanvas');
    chartCanvas.innerHTML = svgText;
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
  clearInteractions(); // 清除所有交互功��
  if (!isViewMode.value) return; // 如果不是查看模式，直接返回
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
      element.selectAll('*').attr('stroke', hoverColor);
      if (modifyFill) {
        element.selectAll('*').attr('fill', hoverColor);
      }
      if (titleId) {
        title.attr('stroke', hoverColor).attr('fill', hoverColor);
      }
    };

    const onMouseOut = () => {
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

  addEffect('x-axis', 'titlex-axis', 'red');
  addEffect('y-axis', 'titley-axis', 'red');
  addEffect('background', null, 'red');
  addEffect('marks', null, 'red', false); // 为 marks 添加 hover 效果，只修改 stroke
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
</script>


<style scoped>

.content-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
}

.left-sidebar {
  width: 20%;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

.control-panel {
  flex-shrink: 0; /* 固定高度 */
  padding: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #f9f9f9;
}

.search-and-images {
  flex-grow: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
}

.search-container {
  flex-shrink: 0; /* 固定高度 */
}

.scrollable-content {
  flex-grow: 1; /* 滚动区域占据剩余空间 */
  overflow-y: auto;
  overflow-x: hidden;
}

.right-sidebar {
  width: 20%;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
}

.search-container {
  flex-shrink: 0;
}

.scrollable-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.canvas-container {
  width: 60%;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  flex-direction: column;
  align-items: center;
}

#chartCanvas {
  width: 100%;
  height: 100%;
}

.canvas-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #ffffff;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

</style>