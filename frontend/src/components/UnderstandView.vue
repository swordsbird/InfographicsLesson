<template>
  <!-- 主内容区 -->
  <v-main class="bg-white main-container">
    <div class="content-wrapper">
      <!-- 左侧边栏 - 20% -->
      <div class="left-sidebar">
        <!-- 搜索框固定在顶部 -->
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
        
        <!-- 可滚动的图片列表 -->
        <div class="scrollable-content">
          <v-container class="px-2 py-2">
            <v-row dense>
              <v-col 
                v-for="n in 20" 
                :key="n" 
                cols="12"
                class="pa-1"
              >
                <v-card
                  variant="outlined"
                  class="image-card"
                >
                  <v-img
                    cover
                    height="150"
                    src="https://via.placeholder.com/300x200"
                  ></v-img>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </div>

      <!-- 中间画布区域 - 60% -->
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <v-img
            src="https://via.placeholder.com/1200x800"
            cover
            class="canvas-image"
          ></v-img>
        </div>
      </div>

      <!-- 右侧边栏 - 20% -->
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
  //
</script>

<style>
/* 隐藏全局滚动条 */
html, body {
  overflow: hidden !important;
}

.v-application {
  overflow: hidden !important;
}
</style>

<style scoped>
.main-container {
  height: calc(100vh - 64px);
  overflow: hidden;
}

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