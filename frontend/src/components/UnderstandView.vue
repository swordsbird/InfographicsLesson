<template>
  <!-- 主内容区 -->
  <v-main class="bg-grey-lighten-4 main-container">
    <div class="content-wrapper">
      <!-- 左侧边栏 - 20% -->
      <div class="left-sidebar">
        <!-- 搜索框固定在顶部 -->
        <div class="search-container">
          <div class="d-flex align-center pa-2 gap-2">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              placeholder="搜索图片"
              hide-details
              density="comfortable"
              bg-color="white"
              color="black"
            ></v-text-field>
            
            <v-btn
              color="gray"
              icon="mdi-upload"
              size="small"
              @click="triggerFileInput"
            ></v-btn>

            <!-- 隐藏的文件输入框 -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileUpload"
            >
          </div>
        </div>
        
        <!-- 可滚动的图片列表 -->
        <div class="scrollable-content">
          <v-container class="px-2 py-2">
            <v-row dense>
              <v-col 
                v-for="image in images" 
                :key="image.id" 
                cols="12"
                class="pa-1"
              >
                <v-card
                  variant="outlined"
                  class="image-card"
                  @click="selectedImage = image.filename"
                >
                  <v-img
                    cover
                    height="150"
                    :src="image.filename"
                  ></v-img>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </div>

      <!-- 中间画布区域 - 60% -->
      <div class="canvas-container" @click="handleCanvasClick">
        <!-- 浮动工具栏 -->

        <!-- 画布 -->
        <div 
          class="canvas-wrapper position-relative" 
          ref="canvasRef" 
          @dblclick="handleCanvasDoubleClick"
        >
          <v-img
            :src="selectedImage"
            cover
            class="canvas-image"
            :draggable="false"
            @load="handleImageLoad"
          ></v-img>
          <!-- 渲染所有可绘制元素 -->
          <template v-for="(element, index) in drawElements" :key="element.id">
            <div 
              class="draw-element"
              :class="{
                'selected': selectedElementIndex === index,
                'bounding-box': element.type === ELEMENT_TYPES.BOUNDING_BOX,
                'text-element': element.type === ELEMENT_TYPES.TEXT,
                'pictogram-element': element.type === ELEMENT_TYPES.PICTOGRAM
              }"
              :data-index="index"
              :style="getElementStyle(element, index)"
            >
              <!-- 标题栏 - 可拖动 -->
              <div 
                class="element-title"
                @mousedown="startTitleDrag($event, index)"
              >
                <span class="element-label">
                  {{ element.type === ELEMENT_TYPES.BOUNDING_BOX ? 'BB' : 
                     element.type === ELEMENT_TYPES.TEXT ? 'TEXT' : 'ICON' }}{{ index + 1 }}
                </span>
                <div class="delete-button" @click.stop="deleteElement(index)">
                  <v-icon size="small" color="white">mdi-close</v-icon>
                </div>
              </div>
              
              <!-- 文本内容 - 仅文本元素显示 -->
              <template v-if="element.type === ELEMENT_TYPES.TEXT">
                <div 
                  v-if="isEditing && editingIndex === index"
                  class="text-content editing-text"
                  contenteditable="true"
                  @blur="saveTextEdit($event, index)"
                  @keydown.enter.prevent="saveTextEdit($event, index)"
                  :style="{
                    color: element.style.color,
                    fontSize: element.style.fontSize,
                    fontWeight: element.style.fontWeight
                  }"
                  v-text="element.content"
                ></div>
                <div 
                  v-else 
                  class="text-content"
                  @dblclick="handleTextDoubleClick($event, index)"
                  :style="{
                    color: element.style.color,
                    fontSize: element.style.fontSize,
                    fontWeight: element.style.fontWeight
                  }"
                >{{ element.content }}</div>
              </template>

              <!-- 图标内容 - 仅图标元素显示 -->
              <template v-if="element.type === ELEMENT_TYPES.PICTOGRAM">
                <div class="pictogram-content" v-html="element.content"></div>
              </template>
              <div class="resize-handle" @mousedown.stop="startResize($event, index)"></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="right-sidebar">
        <!-- 工具栏 -->
        <div class="toolbox">
          <div class="toolbox-content">
            <v-btn-toggle v-model="currentMode">
              <!-- 工具选择 -->
                <v-btn 
                  :value="ELEMENT_TYPES.BOUNDING_BOX" 
                  :class="{ 'active': currentMode === ELEMENT_TYPES.BOUNDING_BOX }"
                >
                  <v-icon>mdi-vector-rectangle</v-icon>
                </v-btn>
                <v-btn 
                  :value="ELEMENT_TYPES.TEXT" 
                  :class="{ 'active': currentMode === ELEMENT_TYPES.TEXT }"
                >
                  <v-icon>mdi-format-text</v-icon>
                </v-btn>
                <v-btn
                  :value="ELEMENT_TYPES.PICTOGRAM"
                  :class="{ 'active': currentMode === ELEMENT_TYPES.PICTOGRAM }"
                >
                  <v-icon>mdi-image</v-icon>
                </v-btn>
                <v-btn
                  :value="ELEMENT_TYPES.OTHER"
                  :class="{ 'active': currentMode === ELEMENT_TYPES.OTHER }"
                >
                  <v-icon>mdi-shape</v-icon>
                </v-btn>
              </v-btn-toggle>
            
            
            <div class="pictogram-picker" v-if="currentMode === ELEMENT_TYPES.PICTOGRAM">
              <div class="pictogram-circles d-flex">
                <div
                  v-for="pictogram in PICTOGRAMS" 
                  :key="pictogram.value"
                  class="pictogram-circle mx-1"
                  :class="{ 'active': currentPictogram === pictogram.value }"
                  :style="{ border: '2px solid #ddd' }"
                  @click="handlePictogramSelect(pictogram.value)"
                >
                  <div class="pictogram-svg" v-html="pictogram.value" style="width: 36px; height: 36px;"></div>
                </div>
              </div>
            </div>
            <!-- 颜色选择器 (当选择文本工具时显示) -->
            <div class="color-picker" v-if="currentMode === ELEMENT_TYPES.TEXT">
              <div class="tool-section">
                <div class="tool-label">颜色</div>
                <div class="color-circles justify-start">
                  <div
                    v-for="color in TEXT_COLORS"
                    :key="color.value"
                    class="color-circle"
                    :class="{ 'active': currentTextStyle.color === color.value }"
                    :style="{ backgroundColor: color.value }"
                    @click="handleStyleSelect('color', color.value)"
                  ></div>
                </div>
              </div>

              <!-- 字体样式按钮组 -->
              <div class="tool-section">
                <div class="tool-label">样式</div>
                <v-btn-toggle
                  v-model="currentTextStyle.fontWeight"
                  density="comfortable"
                  class="font-style-toggle"
                >
                  <v-btn value="normal" 
                    @click="handleStyleSelect('fontWeight', 'normal')"
                  >
                    <v-icon>mdi-format-text</v-icon>
                  </v-btn>
                  <v-btn value="bold"
                    @click="handleStyleSelect('fontWeight', 'bold')"
                  >
                    <v-icon>mdi-format-bold</v-icon>
                  </v-btn>
                </v-btn-toggle>
              </div>

              <!-- 字体大小按钮组 -->
              <div class="tool-section">
                <div class="tool-label">大小</div>
                <v-btn-toggle
                  v-model="currentTextStyle.fontSize"
                  density="comfortable"
                  class="font-size-toggle"
                >
                  <v-btn value="12px"
                    @click="handleStyleSelect('fontSize', '12px')"
                  >
                    <v-icon>mdi-format-size</v-icon>
                    <span class="text-caption">小</span>
                  </v-btn>
                  <v-btn value="16px"
                    @click="handleStyleSelect('fontSize', '16px')"
                  >
                    <v-icon>mdi-format-size</v-icon>
                    <span class="text-subtitle-2">中</span>
                  </v-btn>
                  <v-btn value="20px"
                    @click="handleStyleSelect('fontSize', '20px')"
                  >
                    <v-icon>mdi-format-size</v-icon>
                    <span class="text-h6">大</span>
                  </v-btn>
                </v-btn-toggle>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析部分 -->
        <div class="analyze-section">
          <!-- 添加分析按钮 -->
          <v-btn
            color="dark"
            density="comfortable"
            class="mb-4"
            :loading="analyzing"
            @click="analyzeImage"
          >
            开始分析
          </v-btn>

          <div class="detection-list">
            <!-- 检测结果列表 -->
            <div 
              v-for="(box, index) in drawElements" 
              :key="box.id" 
              class="box-list-item" 
              :class="{ 'selected': selectedElementIndex === index }"
              @click="selectElement(index)"
            >
              <div class="box-color-mark" :style="{ backgroundColor: box.type === ELEMENT_TYPES.BOUNDING_BOX ? '#42A5F5' : '#FF7043' }"></div>
              <span>{{ box.content || `Box ${index + 1}` }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-main>
</template>
<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next'

// 使用 glob 导入所有图片
const imageModules = import.meta.glob('../assets/images/*.png', { eager: true })
const handleImageLoad = (event) => {
  // 获取图片实际尺寸
  const img = event.target;
  const canvas = canvasRef.value;
  
  // 更新画布包装器的高度以匹配图片
  if (canvas && img && img.naturalHeight) {
    // 使用图片的自然高度
    const imgRatio = img.naturalHeight / img.naturalWidth;
    const canvasWidth = canvas.offsetWidth;
    canvas.style.height = `${canvasWidth * imgRatio}px`;
  }
};

const images = ref(
  Object.entries(imageModules).map(([path, module], index) => ({
    id: index + 1,
    filename: module.default
  }))
);

const selectedImage = ref('');

const fileInput = ref(null);

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click();
};

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // 验证文件大小（5MB限制）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB!');
    return;
  }

  // 创建文件的本地预览URL
  const fileUrl = URL.createObjectURL(file);
  
  // 添加到图片列表
  images.value.unshift({
    id: Date.now(),
    filename: fileUrl,
    name: file.name
  });
  
  // 清空文件输入
  event.target.value = '';
};

// 元素类型常量
const ELEMENT_TYPES = {
  BOUNDING_BOX: 'boundingBox',
  TEXT: 'text',
  PICTOGRAM: 'pictogram',
  OTHER: 'other'
};

// 统一管理所有的 ref
const canvasRef = ref(null);
const drawElements = ref([]);
const selectedElementIndex = ref(-1);
const currentMode = ref(ELEMENT_TYPES.BOUNDING_BOX);
const searchQuery = ref(null);
const isDragging = ref(false);
const isResizing = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const analyzing = ref(false);

const toolboxPosition = ref({ x: 20, y: 20 });
const isToolboxDragging = ref(false);
const toolboxDragOffset = ref({ x: 0, y: 0 });

// 工具栏拖动
const startToolboxDrag = (event) => {
  isToolboxDragging.value = true;
  toolboxDragOffset.value = {
    x: event.clientX - toolboxPosition.value.x,
    y: event.clientY - toolboxPosition.value.y
  };
  
  document.addEventListener('mousemove', handleToolboxDrag);
  document.addEventListener('mouseup', stopToolboxDrag);
};

const handleToolboxDrag = (event) => {
  if (!isToolboxDragging.value) return;
  
  toolboxPosition.value = {
    x: event.clientX - toolboxDragOffset.value.x,
    y: event.clientY - toolboxDragOffset.value.y
  };
};

const stopToolboxDrag = () => {
  isToolboxDragging.value = false;
  document.removeEventListener('mousemove', handleToolboxDrag);
  document.removeEventListener('mouseup', stopToolboxDrag);
};

// 颜色选项简化为圆形选择器
const TEXT_COLORS = [
  { value: '#000000' }, // 黑色
  { value: '#FFFFFF' }, // 白色
  { value: '#FF0000' }, // 红色
  { value: '#1976D2' }  // 蓝色
];

const PICTOGRAMS = [
  {
    value: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="white"/></svg>`,
    label: '圆形'
  },
  {
    value: `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="white"/></svg>`, 
    label: '正方形'
  },
  {
    value: `<svg viewBox="0 0 100 100">
      <path d="M50 10 L61 39 L92 39 L67 57 L77 86 L50 69 L23 86 L33 57 L8 39 L39 39 Z" fill="white"/>
    </svg>`,
    label: '星形'
  }
]

// 统一的文本样式状态
const currentTextStyle = ref({
  color: TEXT_COLORS[0].value,
  fontSize: '16px',
  fontWeight: 'normal'
});

// 统一的样式处理函数
const handleStyleSelect = (property, value) => {
  // 更新当前样式状态
  currentTextStyle.value[property] = value;

  // 如果有选中的文本元素，更新其样式
  if (selectedElementIndex.value !== -1) {
    const element = drawElements.value[selectedElementIndex.value];
    if (element.type === ELEMENT_TYPES.TEXT) {
      console.log(element.style);
      element.style[property] = value;
    }
  }
};

// 处理画布双击
const handleCanvasDoubleClick = (event) => {
  // 检查是否点击了文本内容区域
  if (event.target.classList.contains('text-content')) {
    return; // 如果是文本内容区域，不创建新元素
  }

  if (!canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let newElement;
  switch (currentMode.value) {
    case ELEMENT_TYPES.TEXT:
      newElement = createTextElement(x, y);
      break;
    case ELEMENT_TYPES.PICTOGRAM:
      newElement = createPictogramElement(x, y);
      break;
    case ELEMENT_TYPES.OTHER:
      newElement = createOtherElement(x, y);
      break;
    default:
      newElement = createBoundingBox(x, y);
  }
  drawElements.value.push(newElement);
};

// 状态变量
const mouseDownPos = ref({ x: 0, y: 0 });
const dragStartTime = ref(0);
const isEditing = ref(false);
const editingIndex = ref(-1);
const currentPictogram = ref(PICTOGRAMS[0].value);
// 处理拖动
const handleDrag = (event) => {
  if (!isDragging.value) return;

  const index = selectedElementIndex.value;
  if (index === -1) return;
  
  const element = drawElements.value[index];
  const newX = event.clientX - dragOffset.value.x;
  const newY = event.clientY - dragOffset.value.y;
  
  // 获取画布边界
  const canvas = canvasRef.value;
  const canvasRect = canvas.getBoundingClientRect();
  
  // 确保元素不会拖出画布
  const maxX = canvasRect.width - element.width;
  const maxY = canvasRect.height - element.height;
  
  element.x = Math.max(0, Math.min(newX, maxX));
  element.y = Math.max(0, Math.min(newY, maxY));
};

// 停止拖动
const stopDrag = (event) => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  // 如果没有发生拖动，则处理点击选中
  if (!isDragging.value) {
    const element = event.target.closest('.draw-element');
    if (element) {
      const index = parseInt(element.dataset.index);
      handleElementClick(index);
    }
  }
  
  isDragging.value = false;
};

// 处理元素点击选中
const handleElementClick = (index) => {
  if (selectedElementIndex.value === index) {
    selectedElementIndex.value = -1;
  } else {
    selectedElementIndex.value = index;
    // 根据选中元素类型切换工具栏
    const selectedElement = drawElements.value[index];
    currentMode.value = selectedElement.type;
  }
};

// 处理文本双击编辑
const handleTextDoubleClick = (event, index) => {
  if (!event.target.classList.contains('text-content')) return;
  
  event.stopPropagation();
  isEditing.value = true;
  editingIndex.value = index;
  
  nextTick(() => {
    const textInput = document.querySelector('.editing-text');
    if (textInput) {
      textInput.focus();
    }
  });
};

// 保存文本编辑
const saveTextEdit = (event, index) => {
  const element = drawElements.value[index];
  element.content = event.target.innerText;
  isEditing.value = false;
  editingIndex.value = -1;
  saveBoxesToStorage(selectedImage.value); // 保存到存储
};

const handlePictogramSelect = (pictogram) => {
  currentPictogram.value = pictogram;
};

// 定义可能的样式配置
const boxStyles = [
  {
    // 蓝色框 - boundingbox
    border: '2px solid #1E88E5',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    labelColor: '#FFFFFF',
    labelBgColor: '#1E88E5',
  },
  {
    // 橙色框 - textbox
    border: '2px solid #F4511E',
    backgroundColor: 'rgba(244, 81, 30, 0.1)', 
    labelColor: '#FFFFFF',
    labelBgColor: '#F4511E',
  },
  {
    // 绿色框 - pictogrambox
    border: '2px solid #43A047',
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    labelColor: '#FFFFFF', 
    labelBgColor: '#43A047',
  },
  {
    // 黄色框 - other box
    border: '2px solid #FDD835',
    backgroundColor: 'rgba(253, 216, 53, 0.1)',
    labelColor: '#000000',
    labelBgColor: '#FDD835',
  }
];

const getBoxStyle = (type) => {
  if (type === ELEMENT_TYPES.BOUNDING_BOX) {
    return boxStyles[0];
  } else if (type === ELEMENT_TYPES.TEXT) {
    return boxStyles[1];
  } else if (type === ELEMENT_TYPES.PICTOGRAM) {
    return boxStyles[2];
  } else if (type === ELEMENT_TYPES.OTHER) {
    return boxStyles[3];
  }
  return boxStyles[0];
};

const boundingBoxes = ref([]);

const draggingIndex = ref(-1);
const canvasSize = ref({ width: 0, height: 0 });

const resizingIndex = ref(-1);
const resizeStartPos = ref({ x: 0, y: 0 });
const originalSize = ref({ width: 0, height: 0 });
const originalPos = ref({ x: 0, y: 0 });

// 存储所有图片的 bounding boxes
const imageBoxesMap = ref(new Map());

const selectedBoxIndex = ref(-1);

// 处理拖拽结束
const handleDragEnd = () => {
  if (selectedImage.value) {
    imageBoxesMap.value.set(selectedImage.value, [...drawElements.value]);
  }
};
// 修改图片变化处理函数
const handleImageChange = () => {
  // 如果当前有元素，先保存到 localStorage
  if (drawElements.value.length > 0) {
    const storageKey = `boxes_${selectedImage.value}`;
    localStorage.setItem(storageKey, JSON.stringify(drawElements.value));
  }

  // 清空当前元素
  drawElements.value = [];
  
  // 从 localStorage 加载数据
  if (selectedImage.value) {
    const storageKey = `boxes_${selectedImage.value}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      drawElements.value = JSON.parse(savedData);
    }
    
    const newValue = selectedImage.value.split('/').pop();
  }
};

// 监听选中图片的变化
watch(selectedImage, (newImage) => {
  if (newImage) {
    handleImageChange();
  }
});

// 添加新的 box
const addBox = (event) => {
  if (!selectedImage.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  
  const width = 0.2;
  const height = 0.2;
  
  const newX = Math.min(Math.max(0, x - width/2), 1 - width);
  const newY = Math.min(Math.max(0, y - height/2), 1 - height);
  
  const style = boxStyles[boundingBoxes.value.length % boxStyles.length];
  
  boundingBoxes.value.push({
    id: Date.now(),
    x: newX,
    y: newY,
    width,
    height,
    style: {
      border: `2px solid ${style.borderColor}`,
      backgroundColor: style.backgroundColor,
      labelStyle: {
        backgroundColor: style.labelBgColor,
        color: 'white',
        padding: '2px 6px',
        borderRadius: '2px',
        fontSize: '12px',
        fontWeight: '500'
      }
    }
  });
  
  imageBoxesMap.value.set(selectedImage.value, [...boundingBoxes.value]);
};

// 删除 box
const deleteBox = (index) => {
  boundingBoxes.value.splice(index, 1);
  // 保存到 map
  imageBoxesMap.value.set(selectedImage.value, [...boundingBoxes.value]);
};

// 更新画布尺寸
const updateCanvasSize = () => {
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    canvasSize.value = {
      width: rect.width,
      height: rect.height
    };
  }
};

// 开始调整大小
const startResize = (event, index) => {
  event.preventDefault();
  event.stopPropagation();
  
  isResizing.value = true;
  selectedElementIndex.value = index;
  
  const element = drawElements.value[index];
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = element.width;
  const startHeight = element.height;
  
  const handleResize = (e) => {
    if (!isResizing.value) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const newWidth = Math.max(50, startWidth + dx);  // 最小宽度 50px
    const newHeight = Math.max(50, startHeight + dy); // 最小高度 50px
    
    // 获取画布边界
    const canvasRect = canvasRef.value.getBoundingClientRect();
    
    // 确保不超出画布
    const maxWidth = canvasRect.width - element.x;
    const maxHeight = canvasRect.height - element.y;
    
    drawElements.value[index] = {
      ...element,
      width: Math.min(newWidth, maxWidth),
      height: Math.min(newHeight, maxHeight)
    };
  };
  
  const stopResize = () => {
    isResizing.value = false;
    selectedElementIndex.value = -1;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  };
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

// 修改分析函数
const analyzeImage = async () => {
  if (!selectedImage.value) {
    alert('请先选择一张图片');
    return;
  }

  analyzing.value = true;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const boxCount = Math.floor(Math.random() * 4) + 3;
    // 获取画布尺寸
    const canvasRect = canvasRef.value.getBoundingClientRect();
    
    // 生成新的 bounding boxes
    const newBoxes = Array(boxCount).fill(null).map((_, index) => {
      
      // 生成合理的像素尺寸
      const width = Math.random() * 150 + 100; // 100-250px
      const height = Math.random() * 150 + 100; // 100-250px
      
      // 确保位置在画布内
      const x = Math.random() * (canvasRect.width - width);
      const y = Math.random() * (canvasRect.height - height);
      const style = getBoxStyle(ELEMENT_TYPES.BOUNDING_BOX);
      
      return {
        id: Date.now() + index,
        type: ELEMENT_TYPES.BOUNDING_BOX,
        x,
        y,
        width,
        height,
        style
      };
    });
    
    // 更新元素列表
    drawElements.value = newBoxes;
    
  } finally {
    analyzing.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  window.addEventListener('resize', updateCanvasSize);
  updateCanvasSize();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize);
});

// 文本编辑相关状态

// 开始编辑文本
const startEditing = (index) => {
  isEditing.value = true;
  editingIndex.value = index;
  // 下一个 tick 后聚焦并选中文本
  nextTick(() => {
    const textInput = document.querySelector('.editing-text');
    if (textInput) {
      textInput.focus();
      textInput.select();
    }
  });
};

// 处理按键事件
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    event.target.blur();
  }
  if (event.key === 'Escape') {
    isEditing.value = false;
    editingIndex.value = -1;
  }
};

// 处理元素选中
const selectElement = (index) => {
  selectedElementIndex.value = index;
};

// 初始化工具栏位置在画布右上角
const initToolboxPosition = () => {
  const canvas = canvasRef.value;
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    toolboxPosition.value = {
      x: rect.right - 200, // 距离右边 200px
      y: rect.top + 20    // 距离顶部 20px
    };
  }
};

// 监听画布加载完成
onMounted(() => {
  nextTick(() => {
    initToolboxPosition();
  });
});

// 更新当前选中元素的颜色
const updateSelectedElementColor = (color) => {
  if (selectedElementIndex.value !== -1) {
    const element = drawElements.value[selectedElementIndex.value];
    if (element.type === ELEMENT_TYPES.TEXT) {
      element.style.color = color;
    }
  }
};

// 监听颜色变化
watch(currentTextStyle, (newStyle) => {
  updateSelectedElementColor(newStyle.color);
});

// 字体大小选项
const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Middle', value: '16px' },
  { label: 'Large', value: '20px' }
];

// 字体样式选项
const FONT_STYLES = [
  { label: 'Regular', value: 'normal' },
  { label: 'Bold', value: 'bold' },
  { label: 'Italic', value: 'italic' }
];

// 处理画布点击
const handleCanvasClick = (event) => {
  // 只有点击画布空白处才处理
  if (event.target === canvasRef.value) {
    // 检查是否点击了工具栏
    const toolbox = document.querySelector('.toolbox');
    if (toolbox && toolbox.contains(event.target)) {
      return; // 如果点击了工具栏，不做任何处理
    }
  }
};

// 监听选中元素变化，自动切换 tab
watch(selectedElementIndex, (newIndex) => {
  if (newIndex !== -1) {
    const selectedElement = drawElements.value[newIndex];
    currentMode.value = selectedElement.type;
  }
});

// 获取元素样式
const getElementStyle = (element, index) => {
  const isSelected = selectedElementIndex.value === index;
  
  // 基础样式
  const baseStyle = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
  };
  
  // 根据元素类型和选中状态设置特定样式
  if (element.type === ELEMENT_TYPES.BOUNDING_BOX) {
    return {
      ...baseStyle,
      border: isSelected 
        ? `3px solid ${element.style.border.split(' ')[2]}`
        : element.style.border,
      backgroundColor: isSelected
        ? element.style.backgroundColor.replace('0.1', '0.3')
        : element.style.backgroundColor,
    };
  } else {
    // 文本元素
    return {
      ...baseStyle,
      border: isSelected 
        ? `3px solid ${element.style.border.split(' ')[2]}`
        : element.style.border,
      backgroundColor: element.style.backgroundColor,
    };
  }
};

// 从 props 接收当前页面 ID
const props = defineProps({
});

// 存储键的前缀，用于区分不同图片的数据
const STORAGE_KEY_PREFIX = 'image_boxes_';

// 获取当前图片的存储键
const getStorageKey = (imageId) => `${STORAGE_KEY_PREFIX}${imageId}`;

// 添加 getImageId 计算属性
const getImageId = computed(() => {
  if (!selectedImage.value) return null;
  return selectedImage.value.split('/').pop(); // 获取文件名作为ID
});

// 修改 saveBoxesToStorage 函数
const saveBoxesToStorage = (imageId) => {
  if (!imageId) return;
  imageId = imageId.split('?')[0];
  
  const storageKey = getStorageKey(imageId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(drawElements.value));
  } catch (error) {
    console.error('Failed to save boxes:', error);
  }
};

// 从localStorage加载指定图片的boxes
const loadBoxesFromStorage = (imageId) => {
  if (!imageId) return;  // 添加安全检查
  imageId = imageId.split('?')[0];
  
  const storageKey = getStorageKey(imageId);
  try {
    const savedBoxes = localStorage.getItem(storageKey);
    if (savedBoxes) {
      drawElements.value = JSON.parse(savedBoxes);
    } else {
      drawElements.value = [];
    }
  } catch (error) {
    console.error('Failed to load boxes:', error);
    drawElements.value = [];
  }
};

// 监听图片ID变化
watch(() => props.imageId, (newImageId, oldImageId) => {
  if (oldImageId) {
    saveBoxesToStorage(oldImageId);
  }
  if (newImageId) {
    loadBoxesFromStorage(newImageId);
    // 重置状态
    selectedElementIndex.value = -1;
    isEditing.value = false;
    editingIndex.value = -1;
  }
}, { immediate: true });

// 监听元素变化，自动保存
watch(drawElements, () => {
  saveBoxesToStorage(currentImageId.value);
}, { deep: true });

// 创建新元素时添加图片ID
const createTextElement = (x, y) => ({
  id: Date.now(),
  type: ELEMENT_TYPES.TEXT,
  x,
  y,
  width: 200,
  height: 100,
  content: '双击编辑文本',
  style: {
    border: getBoxStyle(ELEMENT_TYPES.TEXT).border,
    backgroundColor: getBoxStyle(ELEMENT_TYPES.TEXT).backgroundColor,
    ...currentTextStyle.value  // 使用当前样式状态
  }
});

const createPictogramElement = (x, y) => ({
  id: Date.now(),
  imageId: currentImageId.value,
  type: ELEMENT_TYPES.PICTOGRAM,
  x,
  y,
  width: 100,
  height: 100,
  content: currentPictogram.value,
  style: {
    border: getBoxStyle(ELEMENT_TYPES.PICTOGRAM).border,
    backgroundColor: getBoxStyle(ELEMENT_TYPES.PICTOGRAM).backgroundColor,
  }
});

const createBoundingBox = (x, y) => ({
  id: Date.now(),
  imageId: currentImageId.value,
  type: ELEMENT_TYPES.BOUNDING_BOX,
  x,
  y,
  width: 150,
  height: 150,
  style: {
    border: getBoxStyle(ELEMENT_TYPES.BOUNDING_BOX).border,
    backgroundColor: getBoxStyle(ELEMENT_TYPES.BOUNDING_BOX).backgroundColor,
  }
});

// 组件卸载时保存数据
onUnmounted(() => {
  saveBoxesToStorage(currentImageId.value);
});

// 处理标题栏拖动
const startTitleDrag = (event, index) => {
  if (event.target.classList.contains('delete-button')) return;
  
  event.stopPropagation();
  
  isDragging.value = true;
  mouseDownPos.value = {
    x: event.clientX,
    y: event.clientY
  };
  
  const element = drawElements.value[index];
  dragOffset.value = {
    x: event.clientX - element.x,
    y: event.clientY - element.y
  };
  
  selectedElementIndex.value = index;
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

// 创建一个响应式变量来存储当前图片ID
const currentImageId = ref(null);

// 监听 selectedImage 变化
watch(() => selectedImage.value, (newImage, oldImage) => {
  if (oldImage) {
    saveBoxesToStorage(oldImage);
  }
  if (newImage) {
    currentImageId.value = newImage.split('/').pop();  // 更新当前图片ID
    loadBoxesFromStorage(currentImageId.value);
    // 重置状态
    selectedElementIndex.value = -1;
    isEditing.value = false;
    editingIndex.value = -1;
  }
});

// 删除元素
const deleteElement = (index) => {
  // 如果正在编辑文本，先取消编辑状态
  if (isEditing.value && editingIndex.value === index) {
    isEditing.value = false;
    editingIndex.value = -1;
  }
  
  // 如果删除的是当前选中的元素，取消选中状态
  if (selectedElementIndex.value === index) {
    selectedElementIndex.value = -1;
  } else if (selectedElementIndex.value > index) {
    // 如果删除的元素在当前选中元素之前，需要更新选中索引
    selectedElementIndex.value--;
  }
  
  // 从数组中删除元素
  drawElements.value.splice(index, 1);
  
  // 保存更改到存储
  saveBoxesToStorage(currentImageId.value);
};

// 当选中元素变化时，更新当前样式状态
watch(selectedElementIndex, (newIndex) => {
  if (newIndex !== -1) {
    const element = drawElements.value[newIndex];
    if (element.type === ELEMENT_TYPES.TEXT) {
      // 更新当前样式状态以匹配选中元素
      currentTextStyle.value = {
        color: element.style.color,
        fontSize: element.style.fontSize,
        fontWeight: element.style.fontWeight
      };
    }
  }
});

</script>

<style scoped src="./understand.css">
</style>
