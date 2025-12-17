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
        border
        resizable
        :default-sort="{ prop: 'execution_time_ms', order: 'descending' }"
      >
        <el-table-column
          prop="sql_content"
          label="SQL内容"
          min-width="200"
          show-overflow-tooltip
          resizable
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
          width="120"
          sortable
          resizable
        >
          <template #default="{ row }">
            {{ row.execution_time_ms.toFixed(2) }}ms
          </template>
        </el-table-column>
        
        <el-table-column
          prop="sql_plan"
          label="SQL执行计划"
          min-width="200"
          show-overflow-tooltip
          resizable
        >
          <template #default="{ row }">
            <div class="sql-plan-content" :data-plan="row.sql_plan">
              {{ row.sql_plan || '无执行计划' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="table_count"
          label="表数量"
          width="100"
          sortable
          resizable
        >
          <template #default="{ row }">
            {{ row.table_count || 0 }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="status"
          label="状态"
          width="100"
          resizable
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
          width="150"
          show-overflow-tooltip
          resizable
        />
        
        <el-table-column
          label="操作"
          width="100"
          fixed="right"
          resizable
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import { useRouter } from 'vue-router'
import type { CollectionList, SQLExecutionRecord } from '@/types'

const router = useRouter()
const collections = ref<CollectionList | null>(null)
const selectedCollection = ref<string>('')
const plans = ref<SQLExecutionRecord[]>([])
const loading = ref(false)
const error = ref<string>('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索相关状态
const searchQuery = ref('')
const searchStatus = ref<'all' | 'success' | 'error'>('all')

// 动态调整tooltip样式
const adjustTooltipStyles = () => {
  setTimeout(() => {
    const tooltips = document.querySelectorAll('.el-tooltip__popper')
    tooltips.forEach(tooltip => {
      const content = tooltip.querySelector('.el-tooltip__content')
      if (content) {
        // 强制设置样式
        ;(content as HTMLElement).style.maxHeight = '120px'
        ;(content as HTMLElement).style.overflowY = 'auto'
        ;(content as HTMLElement).style.overflowX = 'hidden'
        ;(content as HTMLElement).style.wordBreak = 'break-word'
        ;(content as HTMLElement).style.whiteSpace = 'pre-wrap'
        ;(content as HTMLElement).style.padding = '8px 12px'
        ;(content as HTMLElement).style.lineHeight = '1.4'
        ;(content as HTMLElement).style.fontSize = '12px'
        ;(content as HTMLElement).style.backgroundColor = '#fff'
        ;(content as HTMLElement).style.color = '#333'
        ;(content as HTMLElement).style.border = '1px solid #ddd'
        ;(content as HTMLElement).style.borderRadius = '4px'
        ;(content as HTMLElement).style.boxShadow = '0 2px 12px 0 rgba(0, 0, 0, 0.1)'
        ;(content as HTMLElement).style.maxWidth = '600px'
      }
      
      // 设置容器样式
      ;(tooltip as HTMLElement).style.maxWidth = '600px'
      ;(tooltip as HTMLElement).style.zIndex = '999999'
    })
  }, 100)
}

// 加载集合列表
onMounted(async () => {
  try {
    const data = await apiService.getCollections()
    collections.value = data
    if (data.collections.length > 0) {
      selectedCollection.value = data.collections[0]
    }
    
    // 延迟执行tooltip样式调整，确保DOM完全加载
    setTimeout(() => {
      adjustTooltipStyles()
    }, 500)
    
  } catch (err: any) {
    error.value = '加载集合列表失败'
  }
})

// 监听页面变化，重新调整tooltip样式
watch([selectedCollection, currentPage], async () => {
  if (selectedCollection.value) {
    // 数据加载完成后调整tooltip样式
    setTimeout(() => {
      adjustTooltipStyles()
    }, 300)
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
}

const handleSearch = async () => {
  if (selectedCollection.value) {
    currentPage.value = 1
    await loadPlans()
  }
}

const handleViewPlan = (record: SQLExecutionRecord) => {
  try {
    console.log('=== 开始查看执行计划 ===')
    console.log('record数据:', record)
    console.log('record._id:', record._id)
    console.log('selectedCollection.value:', selectedCollection.value)
    
    // 验证必要的数据字段
    if (!record._id || record._id.trim() === '') {
      ElMessage.error('该数据条目缺少有效的ID，无法查看执行计划')
      return
    }
    
    if (!selectedCollection.value) {
      ElMessage.error('缺少集合信息，无法查看执行计划')
      return
    }
    
    if (record.status === 'error') {
      ElMessage.warning('该查询执行失败，无法查看执行计划')
      return
    }
    
    // 跳转到PEV2Viewer页面，传递必要的参数
    router.push({
      name: 'PEV2Viewer',
      query: {
        id: record._id.trim(),
        collection: selectedCollection.value
      }
    })
    
    console.log('=== 跳转到PEV2Viewer页面 ===')
    
  } catch (err: any) {
    console.error('=== 查看计划失败 ===')
    console.error('错误类型:', typeof err)
    console.error('错误信息:', err)
    console.error('错误堆栈:', (err as Error).stack)
    ElMessage.error('跳转到查询计划可视化页面失败: ' + (err as Error).message)
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

.sql-content {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

.sql-plan-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
}

/* 表格样式优化 */
.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

.el-table th {
  background-color: var(--el-table-header-bg-color);
  font-weight: 600;
}

.el-table td {
  padding: 8px 0;
}

/* 表格列宽调整样式 */
.el-table .cell {
  word-break: break-word;
  white-space: pre-wrap;
}

.el-table .el-table__header-wrapper th {
  position: relative;
}

.el-table .el-table__header-wrapper th .cell {
  padding-right: 20px;
}

/* 拖拽调整列宽时的样式 */
.el-table--border .el-table__cell {
  border-right: 1px solid var(--el-table-border-color);
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: var(--el-table-row-hover-bg-color);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

</style>