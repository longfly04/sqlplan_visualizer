<template>
  <div class="pev2-viewer">
    <!-- 导航栏 -->
    <nav class="navbar pev2-navbar">
      <div class="container-fluid">
        <router-link to="/" class="btn btn-link pev2-brand">
          SQL Plan Visualizer
        </router-link>
        <div class="navbar-text ms-auto">
          查询计划可视化
        </div>
      </div>
    </nav>
    
    <!-- 主内容区域 -->
    <div v-if="loading" class="pev2-loading">
      <el-icon class="is-loading" size="32">
        <Loading />
      </el-icon>
      <div class="mt-2">加载查询计划...</div>
    </div>
    
    <div v-else-if="error" class="pev2-error">
      <el-alert :title="error" type="error" />
    </div>
    
    <div v-else class="pev2-content" :class="{ 'has-data': planData && queryData }">
      <div v-if="planData && queryData" class="pev2-plan-container">
        <Plan
          :plan-source="planData"
          :plan-query="queryData"
        />
      </div>
      <div v-else class="pev2-no-data">
        <el-alert title="没有找到查询计划数据" type="warning" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import apiService from '@/services/api'

// PEV2组件和样式
import { Plan } from 'pev2'
import 'pev2-css'
import 'splitpanes/dist/splitpanes.css'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'
import '../../third_party/node_modules/bootstrap/dist/css/bootstrap.min.css'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const planData = ref('')
const queryData = ref('')

onMounted(async () => {
  try {
    // 从路由参数获取数据
    const recordId = route.query.id as string
    const collection = route.query.collection as string
    
    if (!recordId || !collection) {
      throw new Error('缺少必要参数：id 或 collection')
    }
    
    console.log('=== 开始加载查询计划 ===')
    console.log('recordId:', recordId)
    console.log('collection:', collection)
    
    // 获取计划详情
    const planDetail = await apiService.getPlanDetail(recordId, collection)
    
    if (!planDetail) {
      throw new Error('获取计划详情失败：数据为空')
    }
    
    // 提取plan和query数据
    planData.value = String(planDetail.plan_content || '')
    queryData.value = String(planDetail.sql_content || '')
    
    console.log('=== 数据加载成功 ===')
    console.log('planData长度:', planData.value.length)
    console.log('queryData长度:', queryData.value.length)
    console.log('plan前100字符:', planData.value.substring(0, 100))
    console.log('query前100字符:', queryData.value.substring(0, 100))
    
    loading.value = false
    
  } catch (err: any) {
    console.error('=== 加载查询计划失败 ===')
    console.error('错误类型:', typeof err)
    console.error('错误信息:', err)
    console.error('错误堆栈:', (err as Error).stack)
    
    error.value = '加载查询计划失败: ' + (err as Error).message
    loading.value = false
    ElMessage.error(error.value)
  }
})
</script>

<style scoped>
.pev2-viewer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.pev2-navbar {
  flex-shrink: 0;
  height: 56px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 0 16px;
}

.pev2-brand {
  color: #495057 !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.25rem;
}

.pev2-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pev2-loading,
.pev2-error,
.pev2-no-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.pev2-plan-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* PEV2 组件容器样式穿透 */
:deep(.pev2-container) {
  height: 100% !important;
  display: flex;
  flex-direction: column !important;
}

:deep(.pev2-container .pev2-wrapper) {
  flex: 1 !important;
  height: 100% !important;
  overflow: auto !important;
}

/* 确保 PEV2 的主体内容占满容器 */
:deep(#app) {
  height: 100% !important;
}

:deep(.d-flex.flex-column.vh-100) {
  height: 100% !important;
}
</style>