<template>
  <div class="pev2-page-container">
    <div class="page-header">
      <el-button 
        type="primary" 
        @click="goBack"
        :icon="ArrowLeft"
      >
        返回列表
      </el-button>
      <h2 class="page-title">执行计划详情</h2>
    </div>

    <el-alert
      v-if="error"
      title="错误"
      :description="error"
      type="error"
      style="margin-bottom: 24px"
    />
    
    <!-- 基本信息 -->
    <el-card title="基本信息" style="margin-bottom: 16px" v-if="planDetail">
      <el-descriptions :column="2" size="small">
        <el-descriptions-item label="SQL内容">
          <div class="sql-display">
            {{ planDetail.sql_content }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="执行时间">
          <el-tag type="primary">{{ planDetail.execution_time_ms.toFixed(2) }}ms</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="返回行数">
          <el-tag type="success">{{ planDetail.row_count }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="planDetail.status === 'success' ? 'success' : 'danger'">
            {{ planDetail.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
<div v-else-if="planDetail && !pev2Error" class="content-container">
  <!-- PEV2 可视化 -->
  <el-card title="PEV2 执行计划可视化" class="pev2-card">
    <el-tabs v-model="activeTab" type="card" class="pev2-tabs">
      <el-tab-pane label="Plan" name="plan">
        <div class="plan-container" v-show="activeTab === 'plan'">
          <div class="pev2-wrapper">
            <Plan
              v-if="pev2Plan && pev2Query && activeTab === 'plan'"
              :plan-source="pev2Plan"
              :plan-query="pev2Query"
            />
            <div v-else-if="activeTab === 'plan'" class="empty-container">
              正在加载PEV2可视化组件...
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Grid" name="grid">
        <div class="grid-container" v-show="activeTab === 'grid'">
          <div class="pev2-wrapper">
            <Plan
              v-if="pev2Plan && pev2Query && activeTab === 'grid'"
              :plan-source="pev2Plan"
              :plan-query="pev2Query"
              view="grid"
            />
            <div v-else-if="activeTab === 'grid'" class="empty-container">
              正在加载PEV2网格视图...
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Raw" name="raw">
        <div class="raw-container" v-show="activeTab === 'raw'">
          <pre class="json-display">{{ pev2Plan }}</pre>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Query" name="query">
        <div class="query-container" v-show="activeTab === 'query'">
          <pre class="sql-display">{{ pev2Query }}</pre>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Stats" name="stats">
        <div class="stats-container" v-show="activeTab === 'stats'">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="执行时间">
              <el-tag type="primary">{{ planDetail.execution_time_ms.toFixed(2) }}ms</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="返回行数">
              <el-tag type="success">{{ planDetail.row_count }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="planDetail.status === 'success' ? 'success' : 'danger'">
                {{ planDetail.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="节点数量">
              <el-tag type="info">{{ planDetail.nodes.length }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <h4 style="margin-top: 24px; margin-bottom: 16px;">节点详情</h4>
          <el-table :data="planDetail.nodes" style="width: 100%">
            <el-table-column prop="node_type" label="节点类型" width="200">
              <template #default="{ row }">
                <el-tag type="primary">{{ row.node_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="actual_total_time" label="实际时间" width="120">
              <template #default="{ row }">
                {{ row.actual_total_time ? row.actual_total_time.toFixed(2) + 'ms' : 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column prop="actual_rows" label="实际行数" width="120">
              <template #default="{ row }">
                {{ row.actual_rows || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column prop="loops" label="循环次数" width="100">
              <template #default="{ row }">
                {{ row.loops || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column prop="shared_hit_blocks" label="缓存命中" width="100">
              <template #default="{ row }">
                {{ row.shared_hit_blocks || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column prop="shared_read_blocks" label="缓存读取" width="100">
              <template #default="{ row }">
                {{ row.shared_read_blocks || 'N/A' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</div>
    <!-- PEV2错误显示 -->
    <el-alert
      v-if="pev2Error"
      title="PEV2可视化错误"
      :description="pev2Error"
      type="warning"
      style="margin: 16px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plan } from 'pev2'
import 'pev2/dist/pev2.css'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { apiService } from '@/services/api'
import type { PlanDetail } from '@/types'

const router = useRouter()
const route = useRoute()

const planDetail = ref<PlanDetail | null>(null)
const pev2Plan = ref<string>('')
const pev2Query = ref<string>('')
const loading = ref(false)
const error = ref<string>('')
const pev2Error = ref<string>('')
const activeTab = ref<string>('plan')

const goBack = () => {
  router.push('/visualizer')
}

const loadPlanDetail = async () => {
  const planId = route.params.id as string
  const collection = route.query.collection as string

  if (!planId || !collection) {
    error.value = '缺少必要的参数：计划ID或集合名称'
    return
  }

  loading.value = true
  error.value = ''
  pev2Error.value = ''

  try {
    console.log('正在获取执行计划详情，ID:', planId, '集合:', collection)
    const data = await apiService.getPlanDetail(planId, collection)
    console.log('执行计划详情获取成功:', data)
    
    planDetail.value = data
    
    // 准备PEV2数据 - PEV2需要JSON字符串格式的计划数据
    if (data.plan_content) {
      try {
        // 验证JSON格式
        const parsedPlan = JSON.parse(data.plan_content)
        
        // 确保parsedPlan是对象而不是数组
        if (parsedPlan && typeof parsedPlan === 'object' && !Array.isArray(parsedPlan)) {
          pev2Plan.value = JSON.stringify(parsedPlan, null, 2)
          pev2Query.value = data.sql_content || ''
          console.log('PEV2计划数据准备成功')
        } else {
          console.error('PEV2计划数据格式不正确，期望对象但得到:', typeof parsedPlan)
          pev2Error.value = '执行计划数据格式错误，期望对象格式'
        }
      } catch (parseErr) {
        console.error('PEV2计划数据解析失败:', parseErr)
        pev2Error.value = '执行计划数据格式错误，无法进行可视化'
      }
    } else {
      pev2Error.value = '未找到执行计划数据'
    }
  } catch (err: any) {
    console.error('获取执行计划详情失败:', err)
    error.value = `获取执行计划详情失败: ${err.response?.data?.detail || err.message || '未知错误'}`
    ElMessage.error('加载执行计划详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPlanDetail()
})
</script>

<style>
/* 全局样式，确保PEV2组件正确显示 */
.pev2-page-container {
  padding: 16px;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  color: #18181b;
  font-size: 24px;
  font-weight: 600;
}

.loading-container {
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.sql-display {
  max-height: 100px;
  overflow: auto;
  font-family: monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
}

.pev2-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pev2-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  min-height: 0;
}

.pev2-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: none !important;
  border-radius: 0 !important;
  overflow: hidden;
  background: white;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #a1a1aa;
  font-size: 16px;
}

/* PEV2标签页样式 */
.pev2-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pev2-tabs .el-tabs__content {
  flex: 1;
  min-height: 0;
}

.pev2-tabs .el-tab-pane {
  height: 100%;
}

/* PEV2容器包装器 */
.pev2-wrapper {
  width: 100%;
  height: 100%;
  min-height: 600px;
  position: relative;
  overflow: hidden;
}

/* 确保PEV2组件占满容器 */
.pev2-wrapper > div {
  width: 100% !important;
  height: 100% !important;
  min-height: 600px !important;
}

/* Plan和Grid容器样式 */
.plan-container, .grid-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  padding: 16px;
  box-sizing: border-box;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

/* 确保PEV2组件内部元素正确显示 */
.pev2-wrapper :deep(.splitpanes__pane) {
  min-height: 600px !important;
  height: 600px !important;
}

.pev2-wrapper :deep(.diagram) {
  min-height: 500px !important;
  height: 500px !important;
}

.pev2-wrapper :deep(.d-flex) {
  min-height: 500px !important;
  height: 500px !important;
}

.pev2-wrapper :deep(.flex-column) {
  min-height: 500px !important;
  height: 500px !important;
}

.pev2-wrapper :deep(.flex-grow-1) {
  min-height: 500px !important;
  height: 500px !important;
}

.pev2-wrapper :deep(.overflow-hidden) {
  min-height: 500px !important;
  height: 500px !important;
}

.pev2-wrapper :deep(.plan-diagram) {
  min-height: 500px !important;
  height: 500px !important;
}

/* Raw视图样式 */
.raw-container {
  height: 100%;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
}

.json-display {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 500px;
  overflow: auto;
  margin: 0;
}

/* Query视图样式 */
.query-container {
  height: 100%;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
}

.query-container .sql-display {
  max-height: none;
  height: auto;
  min-height: 200px;
}

/* Stats视图样式 */
.stats-container {
  height: 100%;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
}
</style>