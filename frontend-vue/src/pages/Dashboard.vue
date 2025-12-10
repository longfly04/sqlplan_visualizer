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

    <div v-else-if="stats" ref="statsContainer">
      <!-- 关键指标卡片 -->
      <el-row :gutter="24" style="margin-bottom: 24px">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="总查询计划数"
              :value="stats.total_plans"
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
              title="平均执行时间"
              :value="parseFloat(stats.avg_execution_time.toFixed(2))"
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
              title="慢SQL数量"
              :value="stats.slow_sql_count"
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
              title="总返回行数"
              :value="stats.total_rows"
            >
              <template #prefix>
                <el-icon><Grid /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 扩展统计指标 -->
      <el-row :gutter="24" style="margin-bottom: 24px">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="成功率"
              :value="parseFloat((stats.success_count / stats.total_plans * 100).toFixed(2))"
              suffix="%"
            >
              <template #prefix>
                <el-icon><CircleCheck /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <el-card>
            <el-statistic
              title="最大执行时间"
              :value="parseFloat(stats.max_execution_time.toFixed(2))"
              suffix="ms"
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
              :value="parseFloat(stats.p95_execution_time.toFixed(2))"
              suffix="ms"
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
              title="平均返回行数"
              :value="Math.round(stats.total_rows / stats.total_plans)"
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
            <div ref="distributionChart" style="height: 300px; width: 100%;"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <div style="display: flex; align-items: center;">
                <el-icon><PieChart /></el-icon>
                <span style="margin-left: 8px;">执行状态分布</span>
              </div>
            </template>
            <div ref="statusChart" style="height: 300px; width: 100%;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 性能指标图表 -->
      <el-row :gutter="24" style="margin-top: 24px">
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <div style="display: flex; align-items: center;">
                <el-icon><DataAnalysis /></el-icon>
                <span style="margin-left: 8px;">性能指标对比</span>
              </div>
            </template>
            <div ref="performanceChart" style="height: 300px; width: 100%;"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <div style="display: flex; align-items: center;">
                <el-icon><TrendCharts /></el-icon>
                <span style="margin-left: 8px;">执行时间趋势</span>
              </div>
            </template>
            <div ref="trendChart" style="height: 300px; width: 100%;"></div>
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
const stats = ref<StatisticsSummary | null>(null)
const loading = ref(false)
const error = ref<string>('')
const refreshKey = ref(0)
const slowSqlThreshold = ref<number>(1000)
const distributionChart = ref<HTMLElement>()
const statusChart = ref<HTMLElement>()
const performanceChart = ref<HTMLElement>()
const trendChart = ref<HTMLElement>()
let distributionChartInstance: echarts.ECharts | null = null
let statusChartInstance: echarts.ECharts | null = null
let performanceChartInstance: echarts.ECharts | null = null
let trendChartInstance: echarts.ECharts | null = null

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

// 加载统计信息
watch([selectedCollection, refreshKey], async () => {
  if (selectedCollection.value) {
    loading.value = true
    error.value = ''
    try {
      console.log('正在加载统计信息，集合:', selectedCollection.value, '阈值:', slowSqlThreshold.value)
      
      const data = await apiService.getStatsSummary(selectedCollection.value, slowSqlThreshold.value)
      console.log('统计信息加载成功:', data)
      stats.value = data
      
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
  
  if (statusChartInstance) {
    statusChartInstance.dispose()
    statusChartInstance = null
  }
  
  if (performanceChartInstance) {
    performanceChartInstance.dispose()
    performanceChartInstance = null
  }
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})

// 处理窗口大小变化
const handleWindowResize = () => {
  if (distributionChartInstance) {
    distributionChartInstance.resize()
  }
  
  if (statusChartInstance) {
    statusChartInstance.resize()
  }
  
  if (performanceChartInstance) {
    performanceChartInstance.resize()
  }
  
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

const handleCollectionChange = (value: string) => {
  selectedCollection.value = value
}

const handleThresholdChange = (value: number) => {
  console.log('慢SQL阈值变更:', value)
  slowSqlThreshold.value = value
  // 重新加载统计信息
  refreshKey.value++
}

const refreshStats = () => {
  console.log('手动刷新统计信息')
  refreshKey.value++
}

// 初始化图表
const initCharts = () => {
  if (!stats.value) return

  console.log('初始化图表，统计数据:', stats.value)

  // 销毁旧实例
  if (distributionChartInstance) {
    distributionChartInstance.dispose()
    distributionChartInstance = null
  }
  
  if (statusChartInstance) {
    statusChartInstance.dispose()
    statusChartInstance = null
  }
  
  if (performanceChartInstance) {
    performanceChartInstance.dispose()
    performanceChartInstance = null
  }
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }

  // 执行时间分布图表
  if (distributionChart.value && stats.value.execution_time_distribution && stats.value.execution_time_distribution.length > 0) {
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
            if (stats.value && stats.value.execution_time_distribution && stats.value.execution_time_distribution[data.dataIndex]) {
              const rangeData = stats.value.execution_time_distribution[data.dataIndex]
              return `执行时间范围: ${rangeData.range}<br/>数量: ${data.value}`
            }
            return `数量: ${data.value}`
          },
        },
        xAxis: {
          type: 'category',
          name: '执行时间范围',
          nameLocation: 'middle',
          nameGap: 30,
          data: stats.value.execution_time_distribution.map(item => item.range),
          axisLabel: {
            formatter: '{value}',
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '查询数量',
          nameLocation: 'middle',
          nameGap: 50,
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            type: 'bar',
            data: stats.value.execution_time_distribution.map(item => item.count),
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

  // 执行状态饼图
  if (statusChart.value && (stats.value.success_count > 0 || stats.value.error_count > 0)) {
    try {
      statusChartInstance = echarts.init(statusChart.value)
      
      const data = [
        { value: stats.value.success_count, name: '成功', itemStyle: { color: '#34D399' } },
        { value: stats.value.error_count, name: '失败', itemStyle: { color: '#F87171' } },
      ]

      const statusOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '执行状态',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)'
            }
          },
        ],
      }
      
      statusChartInstance.setOption(statusOption)
      console.log('执行状态饼图初始化成功')
    } catch (error) {
      console.error('执行状态饼图初始化失败:', error)
    }
  }

  // 性能指标对比图表
  if (performanceChart.value) {
    try {
      performanceChartInstance = echarts.init(performanceChart.value)
      
      const performanceOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['执行时间']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['平均', '最大', '最小', 'P95', 'P99'],
          axisLabel: {
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '执行时间 (ms)'
        },
        series: [
          {
            name: '执行时间',
            type: 'bar',
            data: [
              stats.value.avg_execution_time,
              stats.value.max_execution_time,
              stats.value.min_execution_time,
              stats.value.p95_execution_time,
              stats.value.p99_execution_time
            ],
            itemStyle: {
              color: function(params: any) {
                const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
                return colors[params.dataIndex]
              }
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c} ms'
            }
          }
        ]
      }
      
      performanceChartInstance.setOption(performanceOption)
      console.log('性能指标对比图表初始化成功')
    } catch (error) {
      console.error('性能指标对比图表初始化失败:', error)
    }
  }

  // 执行时间趋势图表（模拟数据，实际应该从后端获取时间序列数据）
  if (trendChart.value) {
    try {
      trendChartInstance = echarts.init(trendChart.value)
      
      // 生成模拟的时序数据
      const timeData = []
      const avgTimeData = []
      const maxTimeData = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        timeData.push(date.toLocaleDateString())
        
        // 模拟数据，实际应该从后端获取
        avgTimeData.push(stats.value.avg_execution_time + Math.random() * 100 - 50)
        maxTimeData.push(stats.value.max_execution_time + Math.random() * 200 - 100)
      }
      
      const trendOption = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['平均执行时间', '最大执行时间']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeData
        },
        yAxis: {
          type: 'value',
          name: '执行时间 (ms)'
        },
        series: [
          {
            name: '平均执行时间',
            type: 'line',
            smooth: true,
            data: avgTimeData,
            lineStyle: {
              color: '#5470c6'
            },
            itemStyle: {
              color: '#5470c6'
            }
          },
          {
            name: '最大执行时间',
            type: 'line',
            smooth: true,
            data: maxTimeData,
            lineStyle: {
              color: '#ee6666'
            },
            itemStyle: {
              color: '#ee6666'
            }
          }
        ]
      }
      
      trendChartInstance.setOption(trendOption)
      console.log('执行时间趋势图表初始化成功')
    } catch (error) {
      console.error('执行时间趋势图表初始化失败:', error)
    }
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