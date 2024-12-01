<template>
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
      <div 
        class="canvas-container" 
        style="overflow: auto;"
        :data-mode="interactionMode"
      >
        <!-- 添加画布工具栏 -->
        <div class="canvas-toolbar pa-2 d-flex align-center">
          <v-btn-toggle v-model="interactionMode" mandatory density="comfortable">
            <v-btn value="click" :class="{ 'active': interactionMode === 'click' }" size="default" style="width: 120px; height: 40px">
              <v-icon>mdi-cursor-default-click</v-icon>
              <span class="ml-1">点选</span>
            </v-btn>
            <!-- <v-btn value="box" :class="{ 'active': interactionMode === 'box' }">
              <v-icon>mdi-vector-rectangle</v-icon>
              <span class="ml-1">框选</span>
            </v-btn> -->
            <!-- <v-btn value="all" :class="{ 'active': interactionMode === 'all' }">
              <v-icon>mdi-select-all</v-icon>
              <span class="ml-1">全部</span>
            </v-btn> -->
          </v-btn-toggle>

          <v-btn
            class="ml-4"
            color="primary"
            :disabled="!maskImage"
            @click="confirmSegment"
            :loading="isConfirming"
            size="default"
            density="comfortable"
            style="width: 120px; height: 40px"
          >
            确认分割
          </v-btn>
        </div>

        <!-- 画布 -->
        <div 
          class="canvas-wrapper position-relative" 
          ref="canvasRef" 
          style="margin-top: 0;"
          @click="handleCanvasClick"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
        >
          <v-img
            :src="selectedImage"
            cover
            ref="canvasImage"
            class="canvas-image"
            :draggable="false"
            @load="handleImageLoad"
          ></v-img>
          
          <!-- 添加遮罩层 -->
          <v-img
            v-if="maskImage" 
            :src="maskImage"
            class="mask-overlay"
            cover
            :draggable="false"
          ></v-img>
          
          <!-- 点击标记 -->
          <template v-for="element in drawElements" :key="element.id">
            <div 
              class="draw-element"
              :class="{'circle': element.type === ELEMENT_TYPES.CIRCLE}"
              :style="getElementStyle(element)"
            ></div>
          </template>
          
          <!-- 加载指示器 -->
          <div v-if="isLoading" class="loading-overlay">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="right-sidebar">
        <div class="upper-section">
          <v-container class="pa-4">
            <v-row dense>
              <v-col v-for="(image, index) in segmentedImages" :key="index" cols="6" class="mb-2">
                <v-card variant="outlined" class="segment-image-card">
                  <v-img
                    cover
                    height="100"
                    :src="image.url"
                    @click="handleSegmentImageClick(image)"
                  ></v-img>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </div>
    </div>

    <!-- 添加loading遮罩 -->
    <v-overlay
      :model-value="isEmbeddingLoading"
      class="align-center justify-center"
    >
      <div class="d-flex flex-column align-center">
        <v-progress-circular
          color="primary"
          indeterminate
          size="64"
        ></v-progress-circular>
        <div class="mt-2" style="color: black">图像embedding计算中...</div>
      </div>
    </v-overlay>
  </v-main>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { createBoundingBox, createCircle, ELEMENT_TYPES } from './utils/elements';
import { SEGMENT_API } from './utils/OPENAI_API';
import { SamAPI } from './utils/samAPI';  // 需要创建这个工具类

const imageModules = import.meta.glob('../assets/images/*.png', { eager: true });

const images = ref(
  Object.entries(imageModules).map(([path, module], index) => ({
    id: index + 1,
    filename: module.default
  }))
);

const selectedImage = ref('');
const fileInput = ref(null);
const searchQuery = ref(null);
const analyzing = ref(false);
const drawElements = ref([]);
const selectedElementId = ref(null);
const currentMode = ref(ELEMENT_TYPES.BOUNDING_BOX);
const canvasRef = ref(null);
const canvasImage = ref(null);
const interactionMode = ref('click'); // 默认为点选模式

// 添加绘制状态变量
const isDrawing = ref(false);
const startPoint = ref({ x: 0, y: 0 });
const endPoint = ref({ x: 0, y: 0 });

// SAM相关状态
const samAPI = ref(null);
const maskImage = ref(null);
const isLoading = ref(false);
const isEmbeddingLoading = ref(false);

// 添加分割图片数组
const segmentedImages = ref([]);

const isConfirming = ref(false);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB!');
    return;
  }

  const fileUrl = URL.createObjectURL(file);
  
  images.value.unshift({
    id: Date.now(),
    filename: fileUrl,
    name: file.name
  });
  
  event.target.value = '';
};

const handleImageLoad = async (event) => {
  const img = event.target;
  const canvas = canvasRef.value;
  
  if (canvas && img && img.naturalHeight) {
    const imgRatio = img.naturalHeight / img.naturalWidth;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvasWidth * imgRatio;
    canvas.style.height = `${canvasHeight}px`;
    
    // 更新 canvasSize
    canvasSize.value = {
      width: canvasWidth,
      height: canvasHeight
    };
    console.log("canvasSize", canvasSize.value);
  }
};

const getElementStyle = (element) => {
  const baseStyle = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    position: 'absolute',
  };

  if (element.type === ELEMENT_TYPES.CIRCLE) {
    return {
      ...baseStyle,
      backgroundColor: 'rgb(64, 224, 208)',
      borderRadius: '50%',
    };
  }

  return {
    ...baseStyle,
    border: '2px solid red',
  };
};

onMounted(async () => {
  window.addEventListener('resize', updateCanvasSize);
  updateCanvasSize();
  samAPI.value = new SamAPI();
  await samAPI.value.initialize();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize);
});

const updateCanvasSize = () => {
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    canvasSize.value = {
      width: rect.width,
      height: rect.height
    };
  }
};

const canvasSize = ref({ width: 0, height: 0 });

const handleCanvasClick = async (event) => {
  if (interactionMode.value !== 'click' || !selectedImage.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 清除之前的点击标记，只保留最新的点
  drawElements.value = drawElements.value.filter(
    element => element.type !== ELEMENT_TYPES.CIRCLE
  );
  
  // 添加新的点击标记
  drawElements.value.push(createCircle({
    x,
    y,
    radius: 5,
    index: drawElements.value.length
  }));

  // 调用SAM进行分割
  try {
    isLoading.value = true;
    
    // 获取图片尺寸
    const imageElement = canvasImage.value.$el.querySelector('img');
    const imageHeight = imageElement.naturalHeight;
    const imageWidth = imageElement.naturalWidth;

    // 准备点击提示
    const clickPrompts = [{
      x: x * (imageWidth / rect.width),  // 转换为原始图片坐标
      y: y * (imageHeight / rect.height)
    }];

    // 调用SAM生成遮罩
    const result = await samAPI.value.generateMask({
      imageHeight,
      imageWidth,
      clickPrompts,
      boxPrompts: []  // 点击模式下不需要框选
    });
    console.log("result", result);
    // 显示分割结果
    if (result) {
      maskImage.value = result;
    }
  } catch (error) {
    console.error('分割失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 鼠标按下时开始绘制
const handleMouseDown = (event) => {
  if (interactionMode.value !== 'box' || !selectedImage.value) return;
  
  isDrawing.value = true;
  const rect = canvasRef.value.getBoundingClientRect();
  startPoint.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  endPoint.value = { ...startPoint.value };
};

// 鼠标移动时更新矩形
const handleMouseMove = (event) => {
  if (!isDrawing.value || interactionMode.value !== 'box') return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  endPoint.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

// 鼠标松开时完成制
const handleMouseUp = () => {
  if (!isDrawing.value || interactionMode.value !== 'box') return;
  
  // 创建最终的矩形
  const x = Math.min(startPoint.value.x, endPoint.value.x);
  const y = Math.min(startPoint.value.y, endPoint.value.y);
  const width = Math.abs(endPoint.value.x - startPoint.value.x);
  const height = Math.abs(endPoint.value.y - startPoint.value.y);
  
  // 只有当矩形面积大于0时才添加
  if (width > 0 && height > 0) {
    // 清除所有已有的矩形
    drawElements.value = drawElements.value.filter(
      element => element.type !== ELEMENT_TYPES.BOUNDING_BOX
    );
    
    // 添加新的矩形
    drawElements.value.push(createBoundingBox({
      x,
      y,
      width,
      height,
      index: drawElements.value.length
    }));
  }
  
  // 重置绘制状态
  isDrawing.value = false;
};

// 计算时矩形的样式
const getTempBoxStyle = computed(() => {
  const x = Math.min(startPoint.value.x, endPoint.value.x);
  const y = Math.min(startPoint.value.y, endPoint.value.y);
  const width = Math.abs(endPoint.value.x - startPoint.value.x);
  const height = Math.abs(endPoint.value.y - startPoint.value.y);
  
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '2px dashed rgb(64, 224, 208)',
    backgroundColor: 'rgba(64, 224, 208, 0.1)',
    pointerEvents: 'none'
  };
});

// 在切换模式时也清除矩形
watch(interactionMode, (newMode) => {
  if (newMode !== 'box') {
    // 切换出框选模式时清除矩形
    drawElements.value = drawElements.value.filter(
      element => element.type !== ELEMENT_TYPES.BOUNDING_BOX
    );
  }
});

// 监听选中图片的变化
watch(selectedImage, async (newImage) => {
  console.log('newImage', newImage);
  if (!newImage) return;
  // 先等待0.5s，确保图片加载完成
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    isEmbeddingLoading.value = true;
    const imageElement = canvasImage.value?.$el?.querySelector('img');
    console.log('canvasImage', canvasImage.value);
    console.log('imageElement', imageElement);
    if (!imageElement) {
    alert('无法获取图片元素');
      analyzing.value = false;
      return;
    } 
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    tempCanvas.width = imageElement.naturalWidth;
    tempCanvas.height = imageElement.naturalHeight;

    ctx.drawImage(imageElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;

    const imageArray = new Array(tempCanvas.width);
    for (let x = 0; x < tempCanvas.width; x++) {
      imageArray[x] = new Array(tempCanvas.height);
      for (let y = 0; y < tempCanvas.height; y++) {
        const pos = (y * tempCanvas.width + x) * 4;
        imageArray[x][y] = [
          pixels[pos],
          pixels[pos + 1],
          pixels[pos + 2]
        ];
      }
    } 
    // 获取embedding
    const embedding = await samAPI.value.getImageEmbedding(imageArray);

    // 初始化SAM并设置embedding
    if (!samAPI.value) {
      samAPI.value = new SamAPI();
      await samAPI.value.initialize();
    }
  } catch (error) {
    console.error('处理图片失败:', error);
    // 显示错误提示
    // ...
  } finally {
    isEmbeddingLoading.value = false;
  }
});

// 添加保存分割结果的函数
const saveMask = async () => {
  if (!maskImage.value || !selectedImage.value) return;
  
  try {
    // 创建一个临时canvas来合成图像
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 加载原始图片
    const originalImg = await loadImage(selectedImage.value);
    const maskImg = await loadImage(maskImage.value);
    
    // 设置canvas尺寸为原始图片大小
    canvas.width = originalImg.width;
    canvas.height = originalImg.height;
    
    // 绘制原始图片
    ctx.drawImage(originalImg, 0, 0);
    
    // 设置混合模式
    ctx.globalCompositeOperation = 'destination-in';
    
    // 绘制遮罩
    ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
    
    // 将canvas转换为blob
    canvas.toBlob((blob) => {
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `segmented_${Date.now()}.png`; // 生成文件名
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
    
  } catch (error) {
    console.error('保存分割结果失败:', error);
    alert('保存失败，请重试');
  }
};

// 辅助函数：加载图片
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';  // 处理跨域问题
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// 修改分析函数
const analyzeImage = async () => {
  if (!selectedImage.value || interactionMode.value !== 'all') return;
  
  try {
    analyzing.value = true;
    
    // 获取图片元素
    const imageElement = canvasImage.value.$el.querySelector('img');
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // 设置canvas尺寸为原图尺寸
    tempCanvas.width = imageElement.naturalWidth;
    tempCanvas.height = imageElement.naturalHeight;
    
    // 将图片绘制到canvas
    ctx.drawImage(imageElement, 0, 0);
    
    // 获取图片数据
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    
    // 转换为后端需要的格式
    const imageArray = new Array(tempCanvas.width);
    for (let x = 0; x < tempCanvas.width; x++) {
      imageArray[x] = new Array(tempCanvas.height);
      for (let y = 0; y < tempCanvas.height; y++) {
        const pos = (y * tempCanvas.width + x) * 4;
        imageArray[x][y] = [
          pixels[pos],
          pixels[pos + 1],
          pixels[pos + 2]
        ];
      }
    }
    
    // 调用后端接口获取所有分割结果
    const response = await fetch('http://166.111.81.54:12145/segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageArray
      })
    });
    
    // 添加响应状态检查
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('response', response);
    // 先获取原始响应文本用于调试
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // 尝试解析JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON解析失败:', e);
      console.log('收到的响应内容:', responseText);
      throw new Error('服务器返回的数据格式不正确');
    }
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (!result.masked_images || !Array.isArray(result.masked_images)) {
      throw new Error('服务器返回的数据格式不符合预期');
    }
    
    // 直接保存每个分割结果
    result.masked_images.forEach((maskedImage, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = tempCanvas.width;
      canvas.height = tempCanvas.height;
      const ctx = canvas.getContext('2d');
      
      const imageData = new ImageData(
        new Uint8ClampedArray(maskedImage),
        canvas.width,
        canvas.height
      );
      ctx.putImageData(imageData, 0, 0);
      
      // 转换为URL并保存到分图片数组
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        segmentedImages.value.push({
          id: `segment_${index + 1}_${Date.now()}`,
          url: url,
          blob: blob
        });
      }, 'image/png');
    });
    
  } catch (error) {
    console.error('分析失败:', error);
    alert(`分析失败: ${error.message}`);
  } finally {
    analyzing.value = false;
  }
};

// 处理分割图片点击
const handleSegmentImageClick = (image) => {
  // 可以添加点击处理逻辑，比如下载或预览
  const a = document.createElement('a');
  a.href = image.url;
  a.download = `${image.id}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 组件卸载时清理URL
onUnmounted(() => {
  segmentedImages.value.forEach(image => {
    URL.revokeObjectURL(image.url);
  });
});

// 添加确认分割函数
const confirmSegment = async () => {
  if (!maskImage.value || !selectedImage.value) return;
  
  try {
    isConfirming.value = true;
    
    // 创建临时canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 加载原始图片和遮罩
    const [originalImg, maskImg] = await Promise.all([
      loadImage(selectedImage.value),
      loadImage(maskImage.value)
    ]);
    
    // 设置canvas尺寸
    canvas.width = originalImg.width;
    canvas.height = originalImg.height;
    
    // 绘制原始图片
    ctx.drawImage(originalImg, 0, 0);
    
    // 设置混合模式
    ctx.globalCompositeOperation = 'destination-in';
    
    // 绘制遮罩
    ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
    
    // 转换为blob并添加到分割结果中
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      segmentedImages.value.push({
        id: `segment_click_${Date.now()}`,
        url: url,
        blob: blob
      });
      
      // 清除当前的遮罩和点击标记
      maskImage.value = null;
      drawElements.value = [];
      
    }, 'image/png');
    
  } catch (error) {
    console.error('确认分割失败:', error);
    alert('确认分割失败，请重试');
  } finally {
    isConfirming.value = false;
  }
};
</script>

<style scoped src="./segment.css">
</style>
