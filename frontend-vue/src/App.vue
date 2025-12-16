<template>
  <el-container class="layout-container" :class="{ 'dark-theme': isDark }">
    <!-- 侧边栏 -->
    <el-aside
      class="sidebar"
      :width="collapsed ? '64px' : '256px'"
    >
      <div class="logo-container">
        <div v-if="!collapsed" class="logo">
          <h4>SQL Plan Visualizer</h4>
        </div>
      </div>
      
      <el-menu
        :default-active="$route.path"
        :collapse="collapsed"
        :background-color="isDark ? '#141414' : '#fff'"
        :text-color="isDark ? '#E4E4E7' : '#18181B'"
        :active-text-color="isDark ? '#E4E4E7' : '#18181B'"
        router
        :unique-opened="true"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <template #title>仪表板</template>
        </el-menu-item>
        
        <el-menu-item index="/visualizer">
          <el-icon><Share /></el-icon>
          <template #title>执行计划</template>
        </el-menu-item>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <el-button
          type="text"
          @click="toggleCollapse"
          class="header-button"
        >
          <el-icon>
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
        </el-button>
        
        <el-button
          type="text"
          @click="toggleTheme"
          class="header-button"
        >
          <el-icon>
            <Sunny v-if="isDark" />
            <Moon v-else />
          </el-icon>
        </el-button>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  DataBoard,
  Share,
  TrendCharts,
  Setting,
  Fold,
  Expand,
  Sunny,
  Moon
} from '@element-plus/icons-vue'

const collapsed = ref(false)
const isDark = ref(false)

// 从localStorage恢复主题设置
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  }
})

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  // 保存主题设置到localStorage
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  transition: width 0.3s;
}

.logo-container {
  padding: 16px;
  text-align: center;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color);
}

.logo h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color);
  margin: 0;
}

.main-content {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 112px);
}

.header {
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.header-button {
  font-size: 16px;
  width: 64px;
  height: 64px;
  color: var(--el-text-color);
}

.header-button:hover {
  background-color: var(--el-bg-color-hover);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  color: var(--el-text-color);
}

:deep(.el-menu-item:hover) {
  background-color: var(--el-bg-color-hover);
}

:deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary);
  color: #fff;
}

/* 深色主题变量 */
:root.dark-theme {
  --el-bg-color: #141414;
  --el-bg-color-page: #0A0A0A;
  --el-bg-color-hover: #2D2D2D;
  --el-text-color: #E4E4E7;
  --el-border-color: #2D2D2D;
  --el-color-primary: #409EFF;
}

/* 浅色主题变量 */
:root:not(.dark-theme) {
  --el-bg-color: #fff;
  --el-bg-color-page: #F8F9FA;
  --el-bg-color-hover: #F5F7FA;
  --el-text-color: #18181B;
  --el-border-color: #E5E7EB;
  --el-color-primary: #409EFF;
}
</style>