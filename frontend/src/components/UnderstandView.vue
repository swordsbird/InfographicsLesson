<template>
  <!-- 主内容区 -->
  <v-main class="bg-grey-lighten-4 main-container">
    <div 
      v-if="analyzing || queryImageStatus" 
      class="loading-overlay"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <div class="loading-text mt-4">
        {{ analyzing ? '正在检测视觉元素...' : '正在生成解释...' }}
      </div>
    </div>
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
              placeholder="搜索图表"
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
        <div class="floating-button">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="tonal"
            @click="toggleElementsVisibility"
            :color="elementsVisible ? 'dark' : 'grey'"
            style="position: fixed; top: 80px; right: calc(25% + 30px); z-index: 100;"
          ></v-btn>
        </div>

        <!-- 画布 -->
        <div 
          class="canvas-wrapper position-relative" 
          ref="canvasRef" 
          :style="{
            'padding-top': selectedImage && imageRatio > 0.8 ? '200px' : '100px',
            'padding-bottom': selectedImage && imageRatio > 0.8 ? '200px' : '100px'
          }"
          @dblclick="handleCanvasDoubleClick"
          @click="selectElement($event, null)"
        >
          <!-- 添加占位提示 -->
          <div v-if="!selectedImage" class="canvas-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <v-icon size="64" color="grey">mdi-image-outline</v-icon>
            <div class="placeholder-text" style="text-align: center;">请在左边栏选择一张信息图表</div>
          </div>

          <!-- 原有的画布内容 -->
          <template v-else>
            <v-img
              :src="selectedImage"
              cover
              ref="canvasImage"
              class="canvas-image"
              :draggable="false"
              @load="handleImageLoad"
            ></v-img>
            <!-- 渲染所有可绘制元素 -->
            <template v-for="(element, index) in drawElements" :key="element.id">
              <!-- 元素内容 -->
              <div 
                class="draw-element"
                :class="{
                  'selected': selectedElementId === element.id,
                  'text-element': element.type === ELEMENT_TYPES.TEXT,
                  'pictogram-element': element.type === ELEMENT_TYPES.PICTOGRAM
                }"
                :data-index="element.index"
                :style="getElementStyle(element)"
              >
                <!-- 标题栏 - 可拖动 -->
                <div 
                  class="element-title"
                  v-if="elementsVisible"
                  :style="{ 'background-color': getBoxType(element.type).labelBgColor }"
                  @mousedown="startTitleDrag($event, element.id)"
                >
                  <span class="element-label">
                    {{ element.id }}
                  </span>
                  <div class="delete-button" @click.stop="deleteElement(element)">
                    <v-icon size="small" color="white">mdi-close</v-icon>
                  </div>
                </div>
                
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
                <div v-if="elementsVisible" class="resize-handle" @mousedown.stop="startResize($event, element.id)"></div>
              </div>

              <!-- 独立的边框box element.type === ELEMENT_TYPES.BOUNDING_BOX ||  -->
              <div 
                v-if="elementsVisible"
                class="element-box"
                :class="{
                  'selected': selectedElementId === element.id,
                  'bounding-box': element.type === ELEMENT_TYPES.BOUNDING_BOX
                }"
                :style="getBoxStyle(element)"
              ></div>
            </template>
          </template>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="right-sidebar">
        <!-- 工具栏 -->
        <div class="toolbox">
          <div class="toolbox-content">
            <div class="text-white text-subtitle-1 mb-4">添加/编辑元素</div>
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
                <!--
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
                -->
              </v-btn-toggle>
            
            
            <div class="pictogram-picker" v-if="currentMode === ELEMENT_TYPES.PICTOGRAM">
              <div class="pictogram-circles d-flex my-2">
                <div
                  v-for="pictogram in PICTOGRAMS" 
                  :key="pictogram.label"
                  class="pictogram-circle mx-1"
                  :class="{ 'active': currentPictogram.value.label === pictogram.label }"
                  @click="handlePictogramSelect(pictogram)"
                >
                  <div class="pictogram-svg" v-html="pictogram.value" style=""></div>
                </div>
              </div>
            </div>
            <div class="text-style-picker" v-if="currentMode === ELEMENT_TYPES.TEXT">
              <div class="tool-section">
                <div class="tool-label">Color</div>
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
              
              <div class="tool-section">
                <div class="tool-label">Font Size</div>
                <div class="font-size-toggle">
                  <v-btn
                    v-for="size in FONT_SIZES"
                    :key="size.value"
                    :class="{
                      'v-btn--active': selectedElement?.style?.fontSize === size.value
                    }"
                    @click="updateFontSize(size.value)"
                    density="compact"
                  >
                    <span :style="{ fontSize: size.value }">A</span>
                  </v-btn>
                </div>
              </div>

              <div class="tool-section">
                <div class="tool-label">Font Style</div>
                <div class="font-style-toggle">
                  <v-btn
                    v-for="style in FONT_STYLES"
                    :key="style.value"
                    :class="{
                      'v-btn--active': selectedElement?.style?.fontWeight === style.value
                    }"
                    @click="updateFontStyle(style.value)"
                    variant="text"
                    density="compact"
                  >
                    <v-icon>
                      {{ style.value === 'bold' ? 'mdi-format-bold' : 'mdi-format-text' }}
                    </v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分析部分 -->
        <div class="analyze-section">
          <!-- 添加分析按钮 -->
          <div class="d-flex gap-2 mb-4 mx-2">
            <v-btn
              color="dark"
              density="comfortable"
              :loading="analyzing"
              @click="analyzeImage"
            >
              检测元素
            </v-btn>
            <v-btn
              color="error"
              density="comfortable"
              @click="clearElements"
              :disabled="!drawElements.length"
            >
              清空元素
            </v-btn>
          </div>
          <div class="detection-list" style="max-height: 150px; overflow-y: auto;">
            <!-- 检测结果列表 -->
            <v-chip
              v-for="(box, index) in drawElements"
              :key="box.id"
              size="small"
              :variant="selectedElementId === box.id ? 'flat' : 'tonal'"
              @click="selectElement($event, box)"
              @click:close="deleteElement(box)"
              class="ma-1" label closable draggable
            >
              {{ `${SHORT_ELEMENT_TYPES[box.type]}${box.index}` }}
            </v-chip>
          </div>
          <div class="divider my-2" style="border-top: 1px solid rgba(0, 0, 0, 0.12);"></div>
          <div class="d-flex align-center gap-2 mb-2" style="position: relative;">
            <textarea
              v-model="customOverallPrompt"
              placeholder="请输入提示词，用于指导信息图整体理解"
              rows="6"
              class="prompt-textarea"
            ></textarea>
            <v-btn
              color="dark"
              size="small"
              v-if="customOverallPrompt == ''"
              @click="useDefaultOverallPrompt"
              style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"
            >
              使用样例提示词
            </v-btn>
          </div>

          <div class="d-flex align-center gap-2 mb-2" style="position: relative;">
            <textarea
              v-model="customBoxPrompt"
              placeholder="请输入提示词，用于指导信息图元素理解"
              rows="6"
              class="prompt-textarea"
            ></textarea>
            <v-btn
              color="dark"
              size="small"
              v-if="customBoxPrompt == ''"
              @click="useDefaultBoxPrompt"
              style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"
            >
              使用样例提示词
            </v-btn>
          </div>
          <!-- 添加导出按钮 -->
          <v-btn
            color="dark"
            density="comfortable"
            class="mb-2 mx-2"
            :loading="queryImageStatus"
            :disabled="!drawElements.some(el => el.type === ELEMENT_TYPES.BOUNDING_BOX)"
            @click="queryImage"
          >
            生成解释
          </v-btn>
          <div class="d-flex gap-2">
            <v-btn
              color="dark"
              density="comfortable"
              class="mb-2"
              @click="showHowToInteractDialog = true"
            >
              如何交互？
            </v-btn>
            <v-btn
              color="dark"
              density="comfortable" 
              class="mb-2"
              @click="showHowToModifyDialog = true"
            >
              如何修改代码？
            </v-btn>
          </div>

        </div>
      </div>
    </div>
  </v-main>
<v-dialog v-model="showHowToInteractDialog" max-width="600px">
  <v-card>
    <v-card-title class="text-h5 pa-4">
      如何交互使用？
    </v-card-title>
    <v-card-text class="pa-4">
      <div class="text-body-1">
        <p class="mb-4">本工具提供以下交互功能：</p>
        
        <p class="font-weight-bold mb-2">1. 信息图表管理</p>
        <p class="mb-4">
          • 左侧栏可以浏览和选择已有图表<br>
          • 点击上传按钮可以添加新的图表<br>
          • 搜索框可以快速查找图表
        </p>

        <p class="font-weight-bold mb-2">2. 元素检测</p>
        <p class="mb-4">
          • 点击"检测元素"自动识别图表中的关键区域<br>
          • 使用右上角的眼睛图标可以显示/隐藏标注框<br>
          • 点击"清空元素"可以删除所有标注
        </p>

        <p class="font-weight-bold mb-2">3. 编辑标注框</p>
        <p class="mb-4">
          • 双击画布：创建新的标注框<br>
          • 拖动标题栏：移动标注框位置<br>
          • 拖动右下角：调整标注框大小<br>
          • 点击关闭按钮：删除当前标注框<br>
          这一步主要是为了纠正标注框位置，方便后续生成解释
        </p>

        <p class="font-weight-bold mb-2">4. 生成解释</p>
        <p class="mb-4">
          • 调整好标注框后点击"生成解释"<br>
          • 系统会分析整体内容和每个标注区域<br>
          • 自动生成标题、描述和详细解释
        </p>

        <p class="font-weight-bold mb-2">5. 编辑文本</p>
        <p class="mb-4">
          • 双击文本：进入编辑模式<br>
          • 右侧工具栏：调整字体大小、颜色和粗细<br>
          • 拖动文本框标题栏：调整文本位置<br>
          • Enter键：完成编辑
        </p>
        <p class="text-caption">
          提示：首次使用建议先查看"如何修改"了解详细的编辑功能
        </p>
      </div>
    </v-card-text>
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn
        color="dark"
        variant="text"
        @click="showHowToInteractDialog = false"
      >
        关闭
      </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="showHowToModifyDialog" max-width="600px">
  <v-card>
    <v-card-title class="text-h5 pa-4">
      如何修改代码？
    </v-card-title>
    <v-card-text class="pa-4">
      <div class="text-body-1">
        <p class="mb-4">您可以通过以下方式修改提示词或者代码：</p>
        
        <p class="font-weight-bold mb-2">1. 修改提示词</p>
        <p class="mb-4">
          • 整体提示词：引导AI理解图表的整体主题和重点<br>
          • 元素提示词：引导AI解读每个标注区域的具体内容<br>
          • 点击"使用样例提示词"可以参考预设的提示语
        </p>

        <p class="font-weight-bold mb-2">2. 修改文本框出现位置</p>
        <p class="mb-4">
          在 src/components/UnderstandView.vue 中的 queryImage 函数（约1245-1345行）记录了文本框的位置计算逻辑：<br>
          • 标题文本框：位于图表上方中央<br>
          • 描述文本框：位于标题下方<br>
          • 元素说明文本框：位于对应标注框下方<br><br>
          同学可以通过修改这些计算逻辑来：<br>
          • 调整文本框的初始位置<br>
          • 优化文本布局算法<br>
          • 设计防止文本框重叠的策略<br>
          • 根据图表内容动态调整文本颜色：
            - 分析标注框所在区域的背景颜色
            - 深色背景区域使用白色文字
            - 浅色背景区域使用黑色文字
            - 可以使用 Canvas API 获取图表的像素颜色
        </p>

        <p class="text-caption mt-4">
          注意：修改后需要重新点击"生成解释"来更新AI分析结果。建议先调整好标注框位置再生成解释。
        </p>
      </div>
    </v-card-text>
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn
        color="dark"
        variant="text"
        @click="showHowToModifyDialog = false"
      >
        关闭
      </v-btn>
    </v-card-actions>
  </v-card>
  </v-dialog>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { analyzeWithOpenAI, defaultOverallPrompt, defaultBoxPrompt } from './utils/llm';
import { createTextElement, createPictogramElement, createBoundingBox, ELEMENT_TYPES, SHORT_ELEMENT_TYPES } from './utils/elements';
import { SEGMENT_API, SEGMENT_BOX_API } from './utils/OPENAI_API';
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
const imageRatio = ref(0);
const fileInput = ref(null);
const customOverallPrompt = ref("");
const customBoxPrompt = ref("");
const showHowToInteractDialog = ref(false);
const showHowToModifyDialog = ref(false);

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

// 统一管理所有的 ref
const canvasRef = ref(null);
const canvasImage = ref(null);
const drawElements = ref([]);
const selectedElementId = ref(null);
const selectedElement = computed(() => drawElements.value.find(el => el.id === selectedElementId.value));
const currentMode = ref(ELEMENT_TYPES.BOUNDING_BOX);
const searchQuery = ref(null);
const isDragging = ref(false);
const isResizing = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const analyzing = ref(false);
const queryImageStatus = ref(false);
const elementsVisible = ref(true);
// 颜色选项简化为圆形选择器
const TEXT_COLORS = [
  { value: '#000000' }, // 黑色
  { value: '#FFFFFF' }, // 白色
  { value: '#1f77b4' }, // 蓝色
  { value: '#ff7f0e' }, // 橙色
  { value: '#2ca02c' }, // 绿色
  { value: '#d62728' }, // 红色
  { value: '#9467bd' } // 紫色
];

const PICTOGRAMS = [
  {
    value: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="white"/></svg>`,
    label: 'Circle'
  },
  {
    value: `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="white"/></svg>`, 
    label: 'Square'
  },
  {
    value: `<svg viewBox="0 0 100 100">
      <path d="M50 10 L61 39 L92 39 L67 57 L77 86 L50 69 L23 86 L33 57 L8 39 L39 39 Z" fill="white"/>
    </svg>`,
    label: 'Star'
  }
]

// 字体大小选项
const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Middle', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'Extra Large', value: '24px' }
];

// 字体样式选项
const FONT_STYLES = [
  { label: 'Regular', value: 'normal' },
  { label: 'Bold', value: 'bold' }
];

// 统一的文本样式状态
const currentTextStyle = ref({
  color: TEXT_COLORS[0].value,
  fontSize: FONT_SIZES.find(size => size.label === 'Middle').value,
  fontWeight: 'normal'
});

// 统一的样式处理函数
const handleStyleSelect = (property, value) => {
  // 更新当前样式状态
  currentTextStyle.value[property] = value;

  // 如果有选中的文本元素，更新其样式
  if (selectedElementId.value !== null) {
    const element = drawElements.value.find(el => el.id === selectedElementId.value);
    if (element && element.type === ELEMENT_TYPES.TEXT) {
      element.style[property] = value;
    }
  }
};

const toggleElementsVisibility = () => {
  elementsVisible.value = !elementsVisible.value;
};

// 处理画布双击
const handleCanvasDoubleClick = (event) => {
  if (event.target.classList.contains('text-content')) return;
  if (!canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const elementIndex = drawElements.value.filter(
    el => el.type === currentMode.value
  ).length;

  let newElement;
  switch (currentMode.value) {
    case ELEMENT_TYPES.TEXT:
      newElement = createTextElement({
        x,
        y,
        index: elementIndex,
        content: '双击编辑文本',
        style: { ...currentTextStyle.value }
      });
      break;
    case ELEMENT_TYPES.PICTOGRAM:
      newElement = createPictogramElement({
        x,
        y,
        index: elementIndex,
        content: currentPictogram.value.value
      });
      break;
    default:
      newElement = createBoundingBox({
        x,
        y,
        index: elementIndex
      });
  }
  drawElements.value.push(newElement);
};

// 状态变量
const isEditing = ref(false);
const editingElementId = ref(null);
const currentPictogram = ref(PICTOGRAMS[0]);
// 处理拖动
const handleDrag = (event) => {
  if (!isDragging.value) return;

  const id = selectedElementId.value;
  if (id === null) return;
  
  const element = drawElements.value.find(el => el.id === id);
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
const handleElementClick = (event, elementId) => {
  event.stopPropagation();
  selectedElementId.value = elementId;
};

// 处理文本双击编辑
const handleTextDoubleClick = (event, id) => {
  if (!event.target.classList.contains('text-content')) return;
  
  event.stopPropagation();
  isEditing.value = true;
  editingElementId.value = id;
  
  nextTick(() => {
    const textInput = document.querySelector('.editing-text');
    if (textInput) {
      textInput.focus();
    }
  });
};

// 保存文本编辑
const saveTextEdit = (event, id) => {
  const element = drawElements.value.find(el => el.id === id);
  element.content = event.target.innerText;
  isEditing.value = false;
  editingElementId.value = null;
  saveBoxesToStorage(selectedImage.value); // 保存到存储
};

const handlePictogramSelect = (pictogram) => {
  currentPictogram.value = pictogram;
};
const useDefaultOverallPrompt = () => {
  customOverallPrompt.value = defaultOverallPrompt;
};

const useDefaultBoxPrompt = () => {
  customBoxPrompt.value = defaultBoxPrompt;
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

const getBoxType = (type) => {
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

const canvasSize = ref({ width: 0, height: 0 });

// 更新画布尺寸
const updateCanvasSize = () => {
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const newSize = {
      width: rect.width,
      height: rect.height
    };

    // Only adjust elements if we have previous dimensions to compare against
    if (previousCanvasSize.value.width && previousCanvasSize.value.height) {
      const widthRatio = newSize.width / previousCanvasSize.value.width;
      console.log(widthRatio);
      // Adjust all elements proportionally
      drawElements.value = drawElements.value.map(element => ({
        ...element,
        x: element.x * widthRatio,
        y: element.y * widthRatio,
        width: element.width * widthRatio,
        height: element.height * widthRatio
      }));
    }

    // Update canvas size state
    canvasSize.value = newSize;
    previousCanvasSize.value = newSize;
  }
};

// Add a debounced version of updateCanvasSize to prevent too frequent updates
const debouncedUpdateCanvasSize = () => {
  let timeoutId;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(updateCanvasSize, 100);
  };
};

// 开始调整大小
const startResize = (event, id) => {
  event.preventDefault();
  event.stopPropagation();
  
  isResizing.value = true;
  selectedElementId.value = id;
  
  const element = drawElements.value.find(el => el.id === id);
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
    
    element.width = Math.min(newWidth, maxWidth);
    element.height = Math.min(newHeight, maxHeight);
  };
  
  const stopResize = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  };
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};


const clearElements = () => {
  drawElements.value = [];
  selectedElementId.value = null;
  saveBoxesToStorage(selectedImage.value);
};

const analyzeImage = async () => {
  if (!selectedImage.value) {
    alert('请先选择一张图片');
    return;
  }

  // 获取图片元素
  const imageElement = canvasImage.value?.$el?.querySelector('img');
  if (!imageElement) {
    alert('无法获取图片元素');
    queryImageStatus.value = false;
    return;
  }

  analyzing.value = true;

  // 创建临时canvas
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');

  // 设置临时canvas尺寸为图片实际尺寸
  tempCanvas.width = imageElement.naturalWidth;
  tempCanvas.height = imageElement.naturalHeight;

  // 绘制原始图片
  ctx.drawImage(imageElement, 0, 0);
  // Get image data from canvas
  const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const pixels = imageData.data;

  // Create 3D array [width][height][rgb]
  const imageArray = new Array(tempCanvas.width);
  for (let x = 0; x < tempCanvas.width; x++) {
    imageArray[x] = new Array(tempCanvas.height);
    for (let y = 0; y < tempCanvas.height; y++) {
      // Calculate position in the pixels array (4 values per pixel - r,g,b,a)
      const pos = (y * tempCanvas.width + x) * 4;
      // Store RGB values (skip alpha)
      imageArray[x][y] = [
        pixels[pos],     // R
        pixels[pos + 1], // G 
        pixels[pos + 2]  // B
      ];
    }
  }

  let result;
  // Send POST request to segment API
  try {
    const response = await fetch(SEGMENT_BOX_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageArray
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    result = await response.json();
    console.log('Segmentation result:', result);
  } catch (error) {
    console.error('Error calling segment API:', error);
    analyzing.value = false;
    return;
  }

  try {
    // Process masked images from result
    const rect = canvasImage.value.$el.getBoundingClientRect();
    const canvasRect = canvasRef.value.getBoundingClientRect();
    const offsetX = rect.left - canvasRect.left;
    const offsetY = rect.top - canvasRect.top;
    const ratio = rect.width / tempCanvas.width;
    let boxes = result.cropped_bboxes.map(box => ({
      x: box[1],
      y: box[0],
      width: box[3],
      height: box[2],
    }));
    boxes.forEach(box => {
      box.area = box.width * box.height;
    });
    boxes.sort((a, b) => b.area - a.area);
    const minArea = boxes[10].area * 0.25;
    boxes = boxes.filter(box => box.area >= minArea);

    for (let i = 0; i < boxes.length; i++) {
      const toRemove = [];
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i];
        const box2 = boxes[j];
        
        // Calculate intersection area
        const xOverlap = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x));
        const yOverlap = Math.max(0, Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y));
        const overlapArea = xOverlap * yOverlap;
        
        // Calculate box2's area
        const box2Area = box2.width * box2.height;
        
        // If more than 85% of box2 is covered by box1, remove box2
        if (overlapArea / box2Area > 0.85) {
          toRemove.push(j);
        }
      }
      // If box i overlaps with 3 or more other boxes, mark box i for removal
      if (toRemove.length >= 3) {
        boxes.splice(i, 1);
        --i;
      } else {
        // Remove all marked boxes in reverse order to maintain correct indices
        toRemove.reverse();
        for (const index of toRemove) {
          boxes.splice(index, 1);
        }
      }
    }
    
    for (let {x, y, width, height} of boxes) {
      drawElements.value.push(createBoundingBox({
        x: x * ratio + offsetX,
        y: y * ratio + offsetY,
        width: width * ratio,
        height: height * ratio,
        index: drawElements.value.length
      }));
    }
  } finally {
    analyzing.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  window.addEventListener('resize', debouncedUpdateCanvasSize());
  // Initial canvas size setup
  updateCanvasSize();
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedUpdateCanvasSize);
});

// 处理按键事件
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    event.target.blur();
  }
  if (event.key === 'Escape') {
    isEditing.value = false;
    editingElementId.value = null;
  }
};

// 处理元素选中
const selectElement = (event, element) => {
  if (element) {
    selectedElementId.value = element.id;
  } else {
    if (event && event.target === canvasRef.value) {
      selectedElementId.value = null;
    }
  }
};


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

// 获取元素样式
const getElementStyle = (element) => {
  const elementId = element.id;
  const isSelected = selectedElementId.value === elementId;
  
  // 基础样式，移除边框和背景相关样式
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
  };
};

// 从 props 接收当前页面 ID
const props = defineProps({
});

// 存储键的前缀，用于区分不同图片的数据
const STORAGE_KEY_PREFIX = 'image_boxes_';

// 获取当前图片的存储键
const getStorageKey = (imageId) => `${STORAGE_KEY_PREFIX}${imageId}`;

// 修改 saveBoxesToStorage 函数
const saveBoxesToStorage = (imageId) => {
  if (!imageId) return;
  imageId = imageId.split('?')[0];
  
  const storageKey = getStorageKey(imageId);
  try {
    // 保存元素数据和画布宽度
    const dataToSave = {
      elements: drawElements.value,
      canvasWidth: canvasRef.value?.offsetWidth || 0
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save boxes:', error);
  }
};

// 修改 loadBoxesFromStorage 函数
const loadBoxesFromStorage = (imageId) => {
  if (!imageId) return;
  imageId = imageId.split('?')[0];
  
  const storageKey = getStorageKey(imageId);
  try {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      const { elements, canvasWidth: previousWidth } = JSON.parse(savedData);
      const currentWidth = canvasRef.value?.offsetWidth || 0;
      
      if (previousWidth && currentWidth) {
        // 计算宽度比例
        const widthRatio = currentWidth / previousWidth;
        
        // 调整所有元素的位置和尺寸
        drawElements.value = elements.map(element => ({
          ...element,
          x: element.x * widthRatio,
          y: element.y * widthRatio,
          width: element.width * widthRatio,
          height: element.height * widthRatio
        }));
      } else {
        // 如果没有之前的宽度信息，直接使用保存的元素
        drawElements.value = elements;
      }
    } else {
      drawElements.value = [];
    }
  } catch (error) {
    console.error('Failed to load boxes:', error);
    drawElements.value = [];
  }
  console.log(drawElements.value);
};

// 添加计算文本高度的辅助函数
const calculateTextHeight = (text, width, style) => {
  // 创建临时 div 用于计算
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.width = `${width}px`;
  div.style.padding = '8px'; // 与 text-content 的 padding 保持一致
  
  // 应用文本样式
  div.style.fontSize = style.fontSize || '16px';
  div.style.fontWeight = style.fontWeight || 'normal';
  div.style.lineHeight = '1.5';
  div.style.wordBreak = 'break-word';
  div.style.whiteSpace = 'pre-wrap';
  
  div.textContent = text;
  document.body.appendChild(div);
  
  // 获取实际高度并添加额外的 padding
  const height = div.offsetHeight + 16; // 上下各加 8px padding
  
  // 清理临时元素
  document.body.removeChild(div);
  
  return Math.max(height, 40); // 设置最小高度为 40px
};

// 修改 queryImage 函数
const queryImage = async () => {
  if (!canvasRef.value || !selectedImage.value) {
    alert('请先选择一张图片');
    return;
  }
  queryImageStatus.value = true;

  // 获取图片元素
  const imageElement = canvasImage.value?.$el?.querySelector('img');
  if (!imageElement) {
    queryImageStatus.value = false;
    return;
  }

  const maxWidth = 1200;
  const maxHeight = 1200;
  const ratio = Math.min(maxWidth / imageElement.naturalWidth, maxHeight / imageElement.naturalHeight);

  const boxes = drawElements.value.filter(element => element.type === ELEMENT_TYPES.BOUNDING_BOX);
  const queryPromises = [];
  // 添加整体分析的 Promise
  const overallAnalysis = async () => {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = imageElement.naturalWidth * ratio;
    tempCanvas.height = imageElement.naturalHeight * ratio;

    ctx.drawImage(imageElement, 0, 0, tempCanvas.width, tempCanvas.height);
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    const result = await analyzeWithOpenAI(dataUrl, customOverallPrompt.value);
    const { title, description } = result;
    
    // 添加标题文本框
    // 标题文本框样式设置
    const titleStyle = {
      fontSize: FONT_SIZES.find(size => size.label === 'Extra Large').value,
      fontWeight: 'bold',
      color: currentTextStyle.value.color
    };
    // 标题文本框宽度设置,可根据需要调整
    const titleWidth = 400;

    // 添加标题文本框
    // x: 标题水平位置,默认在图片右侧75%处居中,可修改比例调整位置
    // y: 标题垂直位置,默认距顶部20px,可调整
    // width: 文本框宽度,默认400px
    // height: 根据内容自动计算,可通过修改calculateTextHeight()调整行高等
    drawElements.value.push(createTextElement({
      x: imageElement.naturalWidth * 0.75 - titleWidth / 2,
      y: 20,
      width: titleWidth,
      height: calculateTextHeight(title, titleWidth, titleStyle),
      index: drawElements.value.length,
      content: title,
      style: titleStyle
    }));
    
    // 描述文本框样式设置
    const descStyle = {
      fontSize: FONT_SIZES.find(size => size.label === 'Middle').value,
      color: currentTextStyle.value.color
    };
    // 描述文本框宽度设置,可根据需要调整
    const descWidth = 600;
    const titleHeight = calculateTextHeight(title, titleWidth, titleStyle);

    // 添加描述文本框
    // x: 描述水平位置,默认在图片右侧75%处居中,可修改比例调整位置
    // y: 描述垂直位置,默认在标题下方40px,可调整间距
    // width: 文本框宽度,默认600px
    // height: 根据内容自动计算,可通过修改calculateTextHeight()调整行高等
    drawElements.value.push(createTextElement({
      x: imageElement.naturalWidth * 0.75 - descWidth / 2,
      y: 40 + titleHeight,
      width: descWidth,
      height: calculateTextHeight(description, descWidth, descStyle),
      index: drawElements.value.length,
      content: description,
      style: descStyle
    }));
  };
  queryPromises.push(overallAnalysis());

  // 添加每个标注框的分析 Promise
  // 计算图片缩放比例
  const scaleX = imageElement.naturalWidth / canvasImage.value.$el.offsetWidth * ratio;
  const scaleY = imageElement.naturalHeight / canvasImage.value.$el.offsetHeight * ratio;
  const rect = canvasImage.value.$el.getBoundingClientRect();
  const canvasRect = canvasRef.value.getBoundingClientRect();
  const offsetX = rect.left - canvasRect.left;
  const offsetY = rect.top - canvasRect.top;

  boxes.forEach((box) => {
    const boxAnalysis = async () => {
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      tempCanvas.width = imageElement.naturalWidth * ratio;
      tempCanvas.height = imageElement.naturalHeight * ratio;

      ctx.drawImage(imageElement, 0, 0, tempCanvas.width, tempCanvas.height);
      ctx.lineWidth = 2;

      // 转换标注框坐标和尺寸到实际图片大小
      const scaledX = (box.x - offsetX) * scaleX;
      const scaledY = (box.y - offsetY) * scaleY;
      const scaledWidth = box.width * scaleX;
      const scaledHeight = box.height * scaleY;
      ctx.strokeStyle = 'red';
      ctx.strokeWidth = 4;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      const dataUrl = tempCanvas.toDataURL('image/png');
      const result = await analyzeWithOpenAI(dataUrl, customBoxPrompt.value);
      const { content } = result;

      // 标注框说明文本样式设置
      const elementStyle = {
        fontSize: FONT_SIZES.find(size => size.label === 'Middle').value,
        color: currentTextStyle.value.color
      };

      // 标注框说明文本框设置
      // elementWidth: 文本框宽度,默认200px,可调整
      // x: 文本框水平位置,默认在标注框中心,可修改定位方式
      // y: 文本框垂直位置,默认在标注框下方10px,可调整间距
      // width: 文本框宽度
      // height: 根据内容自动计算,可通过修改calculateTextHeight()调整行高等
      const elementWidth = 200;
      const x = box.x + box.width / 2 - elementWidth / 2;
      const y = box.y + box.height / 2 + 10;
      const width = elementWidth;
      const height = calculateTextHeight(content, width, elementStyle);

      drawElements.value.push(createTextElement({
        x: x,
        y: y,
        width,
        height,
        index: drawElements.value.length,
        content: content,
        style: elementStyle
      }));
    };
    queryPromises.push(boxAnalysis());
  });

  // 等待所有查询完成
  await Promise.all(queryPromises);

  // const link = document.createElement('a');
  // link.download = `annotated_${Date.now()}.png`;
  // link.href = dataUrl;
  // link.click();

  queryImageStatus.value = false;
}


// 监听图片ID变化
watch(() => props.imageId, (newImageId, oldImageId) => {
  if (oldImageId) {
    saveBoxesToStorage(oldImageId);
  }
  if (newImageId) {
    loadBoxesFromStorage(newImageId);
    // 重置状态
    selectedElementId.value = null;
    isEditing.value = false;
    editingElementId.value = null;
  }
}, { immediate: true });

// 监听元素变化，自动保存
watch(drawElements, () => {
  saveBoxesToStorage(currentImageId.value);
}, { deep: true });


// 组件卸载时保存数据
onUnmounted(() => {
  saveBoxesToStorage(currentImageId.value);
});

// 处理标题栏拖动
const startTitleDrag = (event, id) => {
  if (event.target.classList.contains('delete-button')) return;
  
  event.stopPropagation();
  
  isDragging.value = true;
  
  const element = drawElements.value.find(el => el.id === id);
  dragOffset.value = {
    x: event.clientX - element.x,
    y: event.clientY - element.y
  };
  
  selectedElementId.value = id;
  
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
    selectedElementId.value = null;
    isEditing.value = false;
    editingElementId.value = null;
    console.log("selectedImage", selectedImage.value)
  }
});

watch(() => canvasImage.value, () => {
  const img = canvasImage.value.$el.querySelector('img');
  imageRatio.value = img?.naturalWidth / img?.naturalHeight || 0;
  console.log("imageRatio", imageRatio.value);
});

// 删除元素
const deleteElement = (element) => {
  const index = drawElements.value.findIndex(el => el.id === element.id);
  if (index !== -1) {
    drawElements.value.splice(index, 1);
    if (selectedElementId.value === element.id) {
      selectedElementId.value = null;
    }
    saveBoxesToStorage(props.imageId);
  }
};

// 当选中元素变化时，更新当前样式状态
watch(selectedElementId, (newId) => {
  if (newId !== null) {
    const element = drawElements.value.find(el => el.id === newId);
    currentMode.value = element.type;
    if (element && element.type === ELEMENT_TYPES.TEXT) {
      // 更新当前样式状态以匹配选中元素
      currentTextStyle.value = {
        color: element.style.color,
        fontSize: element.style.fontSize,
        fontWeight: element.style.fontWeight
      };
    }
  }
});

// Add these new refs for tracking canvas dimensions
const previousCanvasSize = ref({ width: 0, height: 0 });

// 使用现有的常量数组，只需要添加新的处理函数
const updateFontSize = (size) => {
  if (selectedElementId.value) {
    const element = drawElements.value.find(el => el.id === selectedElementId.value);
    if (element && element.type === ELEMENT_TYPES.TEXT) {
      element.style.fontSize = size;
      saveBoxesToStorage(props.imageId);
    }
  }
};

const updateFontStyle = (style) => {
  if (selectedElementId.value) {
    const element = drawElements.value.find(el => el.id === selectedElementId.value);
    if (element && element.type === ELEMENT_TYPES.TEXT) {
      element.style.fontWeight = style;
      saveBoxesToStorage(props.imageId);
    }
  }
};

// 添加新的 getBoxStyle 函数
const getBoxStyle = (element) => {
  const elementId = element.id;
  const isSelected = selectedElementId.value === elementId;
  const boxStyle = getBoxType(element.type);
  
  return {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    border: isSelected 
      ? `4px solid ${boxStyle.border.split(' ')[2]}`
      : boxStyle.border,
    backgroundColor: isSelected
      ? boxStyle.backgroundColor.replace('0.1', '0.4')
      : boxStyle.backgroundColor,
    pointerEvents: 'none', // 确保box不会干扰元素的交互
    position: 'absolute',
  };
};

</script>

<style scoped src="./understand.css">
</style>
