<template>
  <v-app>
    <!-- 顶部导航栏 -->
    <v-app-bar color="dark" elevation="0" border>
      <v-container class="px-4" fluid>
        <v-row align="center" no-gutters>
          <!-- 左对齐标题 -->
          <v-col cols="3">
            <span class="text-h6 font-weight-medium">信息图表分析小助手</span>
          </v-col>
          
          <v-col>
            <v-tabs v-model="activeTab">
              <v-tab value="understand" class="text-h6">理解</v-tab>
              <v-tab value="design" class="text-h6">设计</v-tab>
            </v-tabs>
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>

    <v-window v-model="activeTab">
      <v-window-item value="understand">
        <UnderstandView />
      </v-window-item>
      <v-window-item value="design">
        <DesignView />
      </v-window-item>
    </v-window>

  </v-app>
</template>

<script>
import UnderstandView from './components/UnderstandView.vue';
import DesignView from './components/DesignView.vue';

export default {
  name: 'App',
  data: () => ({
    activeTab: 'understand',
  }),
}
</script>

<style>/* 隐藏全局滚动条 */
html, body {
  overflow: hidden !important;
  margin: 0;
  padding: 0;
  height: 100%;
}

.v-application {
  overflow: hidden !important;
  height: 100vh !important;
}

.main-container {
  height: calc(100vh) !important;
  overflow: hidden;
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