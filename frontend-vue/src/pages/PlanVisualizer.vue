<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">执行计划</h2>
      <p class="page-description">查看和分析SQL查询执行计划</p>
    </div>

    <!-- 搜索和筛选功能合并到一个框内 -->
    <el-card class="card-container">
      <el-space direction="vertical" style="width: 100%">
        <!-- 第一行：数据集合选择 -->
        <el-space style="width: 100%">
          <span>选择数据集合:</span>
          <el-select
            v-model="selectedCollection"
            @change="handleCollectionChange"
            style="width: 200px"
            :disabled="!collections"
          >
            <el-option
              v-for="collection in collections?.collections"
              :key="collection"
              :label="collection"
              :value="collection"
            />
          </el-select>
        </el-space>
        
        <!-- 第二行：搜索和筛选功能 -->
        <el-space style="width: 100%">
          <span>搜索查询:</span>
          <el-input
            v-model="searchQuery"
            placeholder="输入SQL关键字搜索"
            style="width: 200px"
            clearable
          />
          
          <el-select
            v-model="searchStatus"
            style="width: 150px"
          >
            <el-option label="全部状态" value="all" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="error" />
          </el-select>
          
          <el-button
            type="primary"
            @click="handleSearch"
            :disabled="!selectedCollection"
          >
            搜索
          </el-button>
          
          <el-button
            type="success"
            :disabled="selectedPlans.length < 2"
            @click="handleComparePlans"
          >
            <el-icon><TrendCharts /></el-icon>
            对比分析 ({{ selectedPlans.length }})
          </el-button>
        </el-space>
      </el-space>
    </el-card>

    <el-alert
      v-if="error"
      title="错误"
      :description="error"
      type="error"
      style="margin-bottom: 24px"
    />

    <!-- 计划列表 -->
    <el-card>
      <el-table
        :data="plans"
        row-key="_id"
        v-loading="loading"
        @selection-change="handleSelectPlans"
      >
        <el-table-column type="selection" :selectable="(row: SQLExecutionRecord) => row.status === 'success'" />
        
        <el-table-column
          prop="sql_content"
          label="SQL内容"
          min-width="300px"
        >
          <template #default="{ row }">
            <div class="sql-content">
              {{ row.sql_content }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="execution_time_ms"
          label="执行时间"
          width="120px"
          sortable
        >
          <template #default="{ row }">
            {{ row.execution_time_ms.toFixed(2) }}ms
          </template>
        </el-table-column>
        
        <el-table-column
          prop="row_count"
          label="返回行数"
          width="120px"
          sortable
        />
        
        <el-table-column
          prop="status"
          label="状态"
          width="100px"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'success' ? 'success' : row.status === 'error' ? 'danger' : 'warning'"
            >
              {{ row.status === 'success' ? '成功' : row.status === 'error' ? '失败' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="file_name"
          label="文件名"
          width="150px"
        />
        
        <el-table-column
          label="操作"
          width="100px"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleViewPlan(row)"
            >
              <el-icon><View /></el-icon>
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleShowSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 对比分析模态框 -->
    <el-dialog
      v-model="modalVisible"
      title="执行计划对比分析"
      width="1200px"
    >
      <template #header>
        <el-space>
          <el-icon><TrendCharts /></el-icon>
          执行计划对比分析
        </el-space>
      </template>

      <div v-if="comparisonData">
        <!-- 对比概览 -->
        <el-row :gutter="16" style="margin-bottom: 24px">
          <el-col :span="6">
            <el-card>
              <el-statistic
                title="对比计划数"
                :value="comparisonData.comparison_metrics.total_plans"
              >
                <template #prefix>
                  <el-icon><Compass /></el-icon>
                </template>
              </el-statistic>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic
                title="平均执行时间"
                :value="comparisonData.comparison_metrics.avg_execution_time.toFixed(2)"
                suffix="ms"
              />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic
                title="最大执行时间"
                :value="comparisonData.comparison_metrics.max_execution_time.toFixed(2)"
                suffix="ms"
              />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic
                title="最小执行时间"
                :value="comparisonData.comparison_metrics.min_execution_time.toFixed(2)"
                suffix="ms"
              />
            </el-card>
          </el-col>
        </el-row>

        <!-- PEV2 可视化对比 -->
        <el-card title="PEV2 执行计划对比" style="margin-bottom: 24px">
          <el-tabs v-model="activePlanTab" type="card">
            <el-tab-pane
              v-for="(plan, index) in comparisonData.plans"
              :key="plan.plan_id"
              :label="`计划 ${index + 1}`"
              :name="`plan-${index}`"
            >
              <div class="pev2-comparison-container">
                <div class="plan-info">
                  <el-descriptions :column="3" size="small" style="margin-bottom: 16px">
                    <el-descriptions-item label="执行时间">
                      <el-tag type="primary">{{ plan.execution_time_ms.toFixed(2) }}ms</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="返回行数">
                      <el-tag type="success">{{ plan.row_count }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="状态">
                      <el-tag :type="plan.status === 'success' ? 'success' : 'danger'">
                        {{ plan.status === 'success' ? '成功' : '失败' }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                  <div class="sql-display">
                    <strong>SQL内容:</strong>
                    <pre>{{ plan.sql_content }}</pre>
                  </div>
                </div>
                <div class="pev2-visualization">
                  <Plan
                    v-if="plan.plan_content"
                    :plan-source="plan.plan_content"
                    :plan-query="plan.sql_content"
                  />
                  <div v-else class="empty-container">
                    无法加载执行计划数据
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 对比图表 -->
        <el-card title="执行时间与行数对比" style="margin-bottom: 24px">
          <div ref="comparisonChart" style="height: 400px"></div>
        </el-card>

        <!-- 节点详细对比 -->
        <el-card title="节点级详细对比">
          <el-table
            :data="getAllNodesForTable()"
            style="width: 100%"
          >
            <el-table-column
              prop="plan_id"
              label="计划ID"
              width="150px"
            />
            <el-table-column
              prop="node_type"
              label="节点类型"
              width="180px"
            >
              <template #default="{ row }">
                <el-tag type="primary">{{ row.node_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="actual_total_time"
              label="实际时间"
              width="120px"
              sortable
            >
              <template #default="{ row }">
                {{ row.actual_total_time ? row.actual_total_time.toFixed(2) + 'ms' : 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="actual_rows"
              label="实际行数"
              width="120px"
              sortable
            >
              <template #default="{ row }">
                {{ row.actual_rows || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="loops"
              label="循环次数"
              width="120px"
              sortable
            >
              <template #default="{ row }">
                {{ row.loops || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="shared_hit_blocks"
              label="缓存命中"
              width="100px"
            >
              <template #default="{ row }">
                {{ row.shared_hit_blocks || 'N/A' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="shared_read_blocks"
              label="缓存读取"
              width="100px"
            >
              <template #default="{ row }">
                {{ row.shared_read_blocks || 'N/A' }}
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 节点表格分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="nodeCurrentPage"
              v-model:page-size="nodePageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="nodeTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleNodeSizeChange"
              @current-change="handleNodePageChange"
            />
          </div>
        </el-card>
      </div>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { View, TrendCharts, Compass } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import { useRouter } from 'vue-router'
import { Plan } from 'pev2'
import 'pev2/dist/pev2.css'
import type { CollectionList, SQLExecutionRecord, ComparisonData } from '@/types'

const router = useRouter()
const collections = ref<CollectionList | null>(null)
const selectedCollection = ref<string>('')
const plans = ref<SQLExecutionRecord[]>([])
const selectedPlans = ref<string[]>([])
const comparisonData = ref<ComparisonData | null>(null)
const modalVisible = ref(false)
const loading = ref(false)
const error = ref<string>('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 节点表格分页
const nodeCurrentPage = ref(1)
const nodePageSize = ref(10)
const nodeTotal = ref(0)

// 搜索相关状态
const searchQuery = ref('')
const searchStatus = ref<'all' | 'success' | 'error'>('all')
const comparisonChart = ref<HTMLElement>()
const activePlanTab = ref<string>('plan-0')
let comparisonChartInstance: echarts.ECharts | null = null

// 加载集合列表
onMounted(async () => {
  try {
    const data = await apiService.getCollections()
    collections.value = data
    if (data.collections.length > 0) {
      selectedCollection.value = data.collections[0]
    }
  } catch (err: any) {
    error.value = '加载集合列表失败'
  }
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  
  if (comparisonChartInstance) {
    comparisonChartInstance.dispose()
    comparisonChartInstance = null
  }
})

// 加载计划列表
watch([selectedCollection, currentPage, searchQuery, searchStatus], async () => {
  if (selectedCollection.value) {
    await loadPlans()
  }
})

const loadPlans = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('正在加载计划列表，集合:', selectedCollection.value, '搜索:', searchQuery.value, '状态:', searchStatus.value)
    
    let data
    if (searchQuery.value || searchStatus.value !== 'all') {
      // 使用搜索API
      const filters: any = {}
      if (searchQuery.value) {
        filters.q = searchQuery.value
      }
      if (searchStatus.value !== 'all') {
        filters.status = searchStatus.value
      }
      data = await apiService.searchPlans(selectedCollection.value, filters, currentPage.value, pageSize.value)
    } else {
      // 使用普通获取API
      data = await apiService.getPlans(selectedCollection.value, currentPage.value, pageSize.value)
    }
    
    console.log('计划列表加载成功:', data)
    plans.value = data.items
    total.value = data.total
  } catch (err: any) {
    console.error('加载计划列表失败:', err)
    error.value = `加载计划列表失败: ${err.response?.data?.detail || err.message || '未知错误'}`
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number, size?: number) => {
  currentPage.value = page
  if (size && size !== pageSize.value) {
    pageSize.value = size
  }
}

const handleShowSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCollectionChange = (value: string) => {
  selectedCollection.value = value
  currentPage.value = 1
  selectedPlans.value = []
}

const handleSelectPlans = (selection: SQLExecutionRecord[]) => {
  selectedPlans.value = selection.map(item => item._id)
}

const handleSearch = async () => {
  if (selectedCollection.value) {
    currentPage.value = 1
    await loadPlans()
  }
}

const handleViewPlan = (record: SQLExecutionRecord) => {
  // 跳转到PEV2可视化页面，传递计划ID和集合名称
  router.push({
    name: 'PEV2Visualizer',
    params: { id: record._id },
    query: { collection: selectedCollection.value }
  })
}

const handleComparePlans = async () => {
  if (selectedPlans.value.length < 2) {
    ElMessage.warning('请至少选择2个计划进行对比')
    return
  }

  loading.value = true
  error.value = ''
  try {
    console.log('正在对比计划，IDs:', selectedPlans.value, '集合:', selectedCollection.value)
    console.log('选中的计划详情:', plans.value.filter(p => selectedPlans.value.includes(p._id)))
    
    // 验证选中的计划是否存在且状态正确
    const validPlans = plans.value.filter(p =>
      selectedPlans.value.includes(p._id) && p.status === 'success'
    )
    
    if (validPlans.length < 2) {
      ElMessage.warning('请至少选择2个执行成功的计划进行对比')
      return
    }
    
    console.log('有效计划数量:', validPlans.length)
    console.log('请求参数详情:', {
      plan_ids: selectedPlans.value,
      collection: selectedCollection.value
    })
    
    const data = await apiService.comparePlans(selectedPlans.value, selectedCollection.value)
    console.log('对比分析成功:', data)
    comparisonData.value = data
    modalVisible.value = true
    
    // 等待DOM更新后初始化图表
    await nextTick()
    initComparisonChart()
  } catch (err: any) {
    console.error('对比分析失败:', err)
    error.value = `对比分析失败: ${err.response?.data?.detail || err.message || '未知错误'}`
    ElMessage.error('对比分析失败')
  } finally {
    loading.value = false
  }
}

// 初始化对比图表
const initComparisonChart = () => {
  if (!comparisonChart.value || !comparisonData.value) return

  // 销毁旧实例
  if (comparisonChartInstance) {
    comparisonChartInstance.dispose()
    comparisonChartInstance = null
  }

  comparisonChartInstance = echarts.init(comparisonChart.value)
  
  const plans = comparisonData.value.plans
  const executionTimes = plans.map(p => p.execution_time_ms)
  const rowCounts = plans.map(p => p.row_count)
  const planNames = plans.map((_, index) => `计划${index + 1}`)

  const option = {
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['执行时间(ms)', '返回行数'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: planNames,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '执行时间(ms)',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '返回行数',
        position: 'right',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '执行时间(ms)',
        type: 'bar',
        data: executionTimes,
        itemStyle: {
          color: '#388BFF'
        },
        barWidth: '30%'
      },
      {
        name: '返回行数',
        type: 'bar',
        yAxisIndex: 1,
        data: rowCounts,
        itemStyle: {
          color: '#34D399'
        },
        barWidth: '30%'
      }
    ]
  }
  
  comparisonChartInstance.setOption(option)
}

// 监听窗口大小变化
const handleWindowResize = () => {
  if (comparisonChartInstance) {
    comparisonChartInstance.resize()
  }
}

// 展开所有节点数据用于表格显示
const getAllNodesForTable = () => {
  if (!comparisonData.value) return []
  
  const allNodes: any[] = []
  comparisonData.value.plans.forEach(plan => {
    plan.nodes.forEach((node, nodeIndex) => {
      allNodes.push({
        key: `${plan.plan_id}_${nodeIndex}`,
        plan_id: plan.plan_id,
        node_type: node.node_type,
        actual_total_time: node.actual_total_time,
        actual_rows: node.actual_rows,
        loops: node.loops,
        shared_hit_blocks: node.shared_hit_blocks,
        shared_read_blocks: node.shared_read_blocks,
      })
    })
  })
  
  // 更新节点总数
  nodeTotal.value = allNodes.length
  
  // 分页处理
  const start = (nodeCurrentPage.value - 1) * nodePageSize.value
  const end = start + nodePageSize.value
  return allNodes.slice(start, end)
}

// 节点表格分页处理
const handleNodePageChange = (page: number) => {
  nodeCurrentPage.value = page
}

const handleNodeSizeChange = (size: number) => {
  nodePageSize.value = size
  nodeCurrentPage.value = 1
}
</script>

<style scoped>
.page-container {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  color: #18181b;
}

.page-description {
  color: #a1a1aa;
  margin-top: 8px;
}

.card-container {
  margin-bottom: 24px;
}

.sql-content {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* PEV2对比相关样式 */
.pev2-comparison-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.sql-display {
  margin-top: 12px;
}

.sql-display pre {
  background: #f1f3f4;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  margin: 8px 0 0 0;
}

.pev2-visualization {
  min-height: 500px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.pev2-visualization > div {
  width: 100% !important;
  height: 100% !important;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6c757d;
  font-size: 16px;
}
</style>