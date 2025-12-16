<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">仪表板</h2>
      <p class="page-description">SQL查询执行计划统计概览</p>
    </div>

    <!-- 集合选择器和设置 -->
    <el-card class="card-container">
      <el-space>
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
        
        <el-divider direction="vertical" />
        
        <span>慢SQL阈值:</span>
        <el-input-number
          v-model="slowSqlThreshold"
          :min="1"
          :max="10000"
          :step="100"
          @change="handleThresholdChange"
          style="width: 120px"
        />
        <span style="color: #909399; font-size: 12px;">ms</span>
        
        <el-button
          type="primary"
          size="small"
          @click="refreshStats"
          :loading="loading"
        >
          <el-icon><Refresh /></el-icon>
          刷新统计
        </el-button>
      </el-space>
    </el-card>

    <el-alert
      v-if="error"
      title="错误"
      :description="error"
      type="error"
      style="margin-bottom: 24px"
    />

    <div v-if="loading" class="loading-container">
      <el-loading :loading="true" />
    </div>

    <div v-else-if="basicStats" ref="statsContainer">
      <!-- 基础统计指标（不随阈值变化） -->
      <el-row :gutter="24" style="margin-bottom: 24px">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="总查询计划数"
              :value="basicStats.total_plans"
            >
              <template #prefix>
                <el-icon><Coin /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="总返回行数"
              :value="basicStats.total_rows"
            >
              <template #prefix>
                <el-icon><Grid /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="平均执行时间"
              :value="parseFloat(basicStats.avg_execution_time.toFixed(2))"
              suffix="ms"
            >
              <template #prefix>
                <el-icon><Timer /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="平均返回行数"
              :value="Math.round(basicStats.total_rows / basicStats.total_plans)"
            >
              <template #prefix>
                <el-icon><DataLine /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 慢SQL统计指标（随阈值变化） -->
      <el-row :gutter="24" style="margin-bottom: 24px">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="慢SQL数量"
              :value="slowSqlStats?.slow_sql_count || 0"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Warning /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="平均执行时间"
              :value="slowSqlStats ? parseFloat(slowSqlStats.avg_execution_time.toFixed(2)) : 0"
              suffix="ms"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Timer /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="最大执行时间"
              :value="slowSqlStats ? parseFloat(slowSqlStats.max_execution_time.toFixed(2)) : 0"
              suffix="ms"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Clock /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="P95执行时间"
              :value="slowSqlStats ? parseFloat(slowSqlStats.p95_execution_time.toFixed(2)) : 0"
              suffix="ms"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Histogram /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- P95/P99统计信息（替换性能指标对比图表） -->
      <el-row :gutter="24" style="margin-bottom: 24px">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="P95执行时间"
              :value="slowSqlStats ? parseFloat(slowSqlStats.p95_execution_time.toFixed(2)) : 0"
              suffix="ms"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Histogram /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="P99执行时间"
              :value="slowSqlStats ? parseFloat(slowSqlStats.p99_execution_time.toFixed(2)) : 0"
              suffix="ms"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Histogram /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="平均FROM表数量"
              :value="slowSqlStats ? parseFloat(slowSqlStats.avg_from_tables.toFixed(2)) : 0"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><Grid /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="平均计划节点数"
              :value="slowSqlStats ? parseFloat(slowSqlStats.avg_plan_nodes.toFixed(2)) : 0"
              :loading="loadingSlowSql"
            >
              <template #prefix>
                <el-icon><DataLine /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="24">
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <div style="display: flex; align-items: center;">
                <el-icon><TrendCharts /></el-icon>
                <span style="margin-left: 8px;">执行时间分布</span>
              </div>
            </template>
            <div ref="distributionChart" style="height: 400px; width: 100%;"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <div style="display: flex; align-items: center;">
                <el-icon><DataAnalysis /></el-icon>
                <span style="margin-left: 8px;">慢SQL查询基本信息</span>
              </div>
            </template>
            <div ref="queryInfoChart" style="height: 400px; width: 100%;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div v-else class="empty-container">
      请选择一个数据集合来查看统计信息
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Coin, Timer, Warning, Grid, TrendCharts, PieChart, CircleCheck, Clock, Histogram, DataLine, DataAnalysis, Refresh } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import type { CollectionList, StatisticsSummary } from '@/types'

const collections = ref<CollectionList | null>(null)
const selectedCollection = ref<string>('')
const basicStats = ref<StatisticsSummary | null>(null)  // 基础统计（不随阈值变化）
const slowSqlStats = ref<StatisticsSummary | null>(null)  // 慢SQL统计（随阈值变化）
const loading = ref(false)
const loadingSlowSql = ref(false)  // 慢SQL统计加载状态
const error = ref<string>('')
const refreshKey = ref(0)
const slowSqlThreshold = ref<number>(1000)
const distributionChart = ref<HTMLElement>()
const queryInfoChart = ref<HTMLElement>()
let distributionChartInstance: echarts.ECharts | null = null
let queryInfoChartInstance: echarts.ECharts | null = null
let thresholdDebounceTimer: any = null

// 加载集合列表和设置
onMounted(async () => {
  try {
    console.log('正在加载集合列表...')
    const data = await apiService.getCollections()
    console.log('集合列表加载成功:', data)
    
    collections.value = data
    if (data && data.collections && data.collections.length > 0) {
      selectedCollection.value = data.collections[0]
    }
    
    // 加载设置获取慢SQL阈值
    const settings = await apiService.getSettings()
    slowSqlThreshold.value = settings.slow_sql_threshold || 1000
    console.log('慢SQL阈值设置:', slowSqlThreshold.value)
    
    // 监听窗口大小变化，重新渲染图表
    window.addEventListener('resize', handleWindowResize)
  } catch (err: any) {
    console.error('加载集合列表失败:', err)
    error.value = `加载集合列表失败: ${err.response?.data?.detail || err.message || '未知错误'}`
  }
})

// 加载基础统计信息（不随阈值变化）
const loadBasicStats = async () => {
  if (!selectedCollection.value) return
  
  try {
    console.log('正在加载基础统计信息，集合:', selectedCollection.value)
    const data = await apiService.getBasicStats(selectedCollection.value)
    console.log('基础统计信息加载成功:', data)
    basicStats.value = data
  } catch (err: any) {
    console.error('加载基础统计信息失败:', err)
    error.value = `加载基础统计信息失败: ${err.response?.data?.detail || err.message || '未知错误'}`
  }
}

// 加载慢SQL统计信息（随阈值变化）
const loadSlowSqlStats = async () => {
  if (!selectedCollection.value) return
  
  loadingSlowSql.value = true
  try {
    console.log('正在加载慢SQL统计信息，集合:', selectedCollection.value, '阈值:', slowSqlThreshold.value)
    const data = await apiService.getSlowSqlStats(selectedCollection.value, slowSqlThreshold.value)
    console.log('慢SQL统计信息加载成功:', data)
    slowSqlStats.value = data
    
    // 等待DOM更新后更新图表
    await nextTick()
    updateCharts()
  } catch (err: any) {
    console.error('加载慢SQL统计信息失败:', err)
    error.value = `加载慢SQL统计信息失败: ${err.response?.data?.detail || err.message || '未知错误'}`
  } finally {
    loadingSlowSql.value = false
  }
}

// 加载统计信息
watch([selectedCollection, refreshKey], async () => {
  if (selectedCollection.value) {
    loading.value = true
    error.value = ''
    try {
      // 加载基础统计和慢SQL统计
      await Promise.all([loadBasicStats(), loadSlowSqlStats()])
      
      // 等待DOM更新后初始化图表
      await nextTick()
      initCharts()
    } catch (err: any) {
      console.error('加载统计信息失败:', err)
      error.value = `加载统计信息失败: ${err.response?.data?.detail || err.message || '未知错误'}`
    } finally {
      loading.value = false
    }
  }
})

// 监听设置变化
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'sql_plan_visualizer_settings') {
    console.log('检测到设置变化，重新加载统计')
    refreshKey.value++
  }
}

// 监听设置变化和窗口大小变化
onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  // 清理事件监听器和图表实例
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('resize', handleWindowResize)
  
  if (distributionChartInstance) {
    distributionChartInstance.dispose()
    distributionChartInstance = null
  }
  
  if (queryInfoChartInstance) {
    queryInfoChartInstance.dispose()
    queryInfoChartInstance = null
  }
})

// 处理窗口大小变化
const handleWindowResize = () => {
  if (distributionChartInstance) {
    distributionChartInstance.resize()
  }
  
  if (queryInfoChartInstance) {
    queryInfoChartInstance.resize()
  }
}

const handleCollectionChange = (value: string) => {
  selectedCollection.value = value
}

const handleThresholdChange = (value: number) => {
  console.log('慢SQL阈值变更:', value)
  slowSqlThreshold.value = value
  
  // 添加防抖机制，避免频繁调用API
  if (thresholdDebounceTimer) {
    clearTimeout(thresholdDebounceTimer)
  }
  
  thresholdDebounceTimer = setTimeout(() => {
    // 只重新加载慢SQL统计，不刷新基础统计
    loadSlowSqlStats()
  }, 500) // 500ms防抖
}

const refreshStats = () => {
  console.log('手动刷新统计信息')
  // 重新加载所有统计
  loadBasicStats()
  loadSlowSqlStats()
}

const initCharts = async () => {
  try {
    if (!slowSqlStats.value) {
      console.log('慢SQL统计数据为空，跳过图表初始化')
      return
    }

    console.log('开始初始化图表，慢SQL统计数据:', slowSqlStats.value)

    // 销毁旧实例
    destroyAllCharts()
    
    // 等待DOM更新完成，确保容器元素可用
    await nextTick()
    
    // 延迟一点确保DOM完全渲染
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // 重新初始化所有图表
    initDistributionChart()
    initQueryInfoChart()
    
    console.log('所有图表初始化完成')
  } catch (error) {
    console.error('初始化图表时发生错误:', error)
  }
}

// 更新图表数据（用于局部刷新）
const updateCharts = () => {
  try {
    if (!slowSqlStats.value) {
      console.log('慢SQL统计数据为空，跳过图表更新')
      return
    }

    console.log('更新图表数据:', slowSqlStats.value)
    
    // 更新所有图表
    updateDistributionChart()
    updateQueryInfoChart()
    
    console.log('所有图表更新完成')
  } catch (error) {
    console.error('更新图表时发生错误:', error)
  }
}

// 统一的图表销毁函数
const destroyAllCharts = () => {
  try {
    if (distributionChartInstance) {
      distributionChartInstance.dispose()
      distributionChartInstance = null
    }
  } catch (error) {
    console.warn('销毁distributionChart时出错:', error)
  }
  
  try {
    if (queryInfoChartInstance) {
      queryInfoChartInstance.dispose()
      queryInfoChartInstance = null
    }
  } catch (error) {
    console.warn('销毁queryInfoChart时出错:', error)
  }
}

// 初始化执行时间分布图表（拉长布局）
const initDistributionChart = () => {
  if (!distributionChart.value || !slowSqlStats.value?.execution_time_distribution || slowSqlStats.value.execution_time_distribution.length === 0) {
    console.log('执行时间分布图表容器或数据不完整，跳过初始化')
    return
  }

  try {
    distributionChartInstance = echarts.init(distributionChart.value)
    
    const distributionOption = {
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
        },
        formatter: (params: any) => {
          const data = params[0]
          if (slowSqlStats.value && slowSqlStats.value.execution_time_distribution && slowSqlStats.value.execution_time_distribution[data.dataIndex]) {
            const rangeData = slowSqlStats.value.execution_time_distribution[data.dataIndex]
            return `执行时间范围: ${rangeData.range}<br/>数量: ${data.value}`
          }
          return `数量: ${data.value}`
        },
      },
      xAxis: {
        type: 'category',
        name: '执行时间 (ms)',
        nameLocation: 'middle',
        nameGap: 30,
        data: slowSqlStats.value.execution_time_distribution.map(item => item.range),
        axisLabel: {
          formatter: '{value}',
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: 'SQL数量',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          type: 'bar',
          data: slowSqlStats.value.execution_time_distribution.map(item => item.count),
          itemStyle: {
            color: '#388BFF',
          },
          barWidth: '60%'
        },
      ],
    }
    
    distributionChartInstance.setOption(distributionOption)
    console.log('执行时间分布图表初始化成功')
  } catch (error) {
    console.error('执行时间分布图表初始化失败:', error)
  }
}

// 初始化慢SQL查询基本信息图表
const initQueryInfoChart = () => {
  if (!queryInfoChart.value || !slowSqlStats.value) {
    console.log('慢SQL查询基本信息图表容器或数据不存在，跳过初始化')
    return
  }

  try {
    queryInfoChartInstance = echarts.init(queryInfoChart.value)
    
    // 准备数据：FROM表数量分布和计划节点数量分布
    const fromTableData = slowSqlStats.value.from_table_distribution || []
    const planNodeData = slowSqlStats.value.plan_node_distribution || []
    
    const queryInfoOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['FROM表数量', '计划节点数量']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Array.from(new Set([
          ...fromTableData.map(item => item.range),
          ...planNodeData.map(item => item.range)
        ])).sort((a, b) => parseInt(a) - parseInt(b)),
        axisLabel: {
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'SQL数量'
      },
      series: [
        {
          name: 'FROM表数量',
          type: 'bar',
          data: fromTableData.map(item => item.count),
          itemStyle: {
            color: '#5470c6'
          }
        },
        {
          name: '计划节点数量',
          type: 'bar',
          data: planNodeData.map(item => item.count),
          itemStyle: {
            color: '#91cc75'
          }
        }
      ]
    }
    
    queryInfoChartInstance.setOption(queryInfoOption)
    console.log('慢SQL查询基本信息图表初始化成功')
  } catch (error) {
    console.error('慢SQL查询基本信息图表初始化失败:', error)
  }
}

// 更新图表数据的具体实现函数
const updateDistributionChart = () => {
  if (distributionChartInstance && slowSqlStats.value?.execution_time_distribution) {
    distributionChartInstance.setOption({
      series: [{
        data: slowSqlStats.value.execution_time_distribution.map(item => item.count)
      }]
    })
  }
}

const updateQueryInfoChart = () => {
  if (queryInfoChartInstance && slowSqlStats.value) {
    const fromTableData = slowSqlStats.value.from_table_distribution || []
    const planNodeData = slowSqlStats.value.plan_node_distribution || []
    
    queryInfoChartInstance.setOption({
      series: [
        {
          data: fromTableData.map(item => item.count)
        },
        {
          data: planNodeData.map(item => item.count)
        }
      ]
    })
  }
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

.loading-container {
  text-align: center;
  padding: 100px 0;
}

.empty-container {
  text-align: center;
  padding: 100px 0;
  color: #a1a1aa;
}

.el-statistic {
  text-align: center;
}

.el-statistic .el-statistic__content {
  color: #388bff;
}
</style>