<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">设置</h2>
      <p class="page-description">配置MongoDB连接和应用参数</p>
    </div>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="16">
        <!-- 数据库配置 -->
        <el-card class="card-container">
          <template #header>
            <el-space>
              <el-icon><Coin /></el-icon>
              数据库配置
            </el-space>
          </template>
          
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            label-position="top"
          >
            <el-form-item
              label="MongoDB连接地址"
              prop="mongodb_url"
            >
              <el-input
                v-model="form.mongodb_url"
                placeholder="mongodb://localhost:27017"
              />
            </el-form-item>

            <el-form-item
              label="数据库名称"
              prop="database_name"
            >
              <el-input
                v-model="form.database_name"
                placeholder="sql_results"
              />
            </el-form-item>

            <el-form-item
              label="默认集合"
              prop="default_collection"
            >
              <el-input
                v-model="form.default_collection"
                placeholder="留空则显示所有集合"
              />
            </el-form-item>

            <el-divider />

            <!-- 应用配置 -->
            <h4 style="margin-bottom: 16px;">
              <el-space>
                <el-icon><Lightning /></el-icon>
                应用配置
              </el-space>
            </h4>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item
                  label="慢SQL阈值 (ms)"
                  prop="slow_sql_threshold"
                >
                  <el-input-number
                    v-model="form.slow_sql_threshold"
                    :min="0"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item
                  label="默认分页大小"
                  prop="page_size"
                >
                  <el-input-number
                    v-model="form.page_size"
                    :min="1"
                    :max="100"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider />

            <el-form-item>
              <el-space>
                <el-button
                  type="primary"
                  @click="handleSaveSettings"
                  :loading="loading"
                >
                  保存设置
                </el-button>
                <el-button @click="handleLoadSettings">
                  加载保存的设置
                </el-button>
                <el-button @click="handleResetSettings">
                  重置设置
                </el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <!-- 连接测试 -->
        <el-card class="card-container">
          <template #header>
            <el-space>
              <el-icon><Setting /></el-icon>
              连接测试
            </el-space>
          </template>
          
          <p style="color: #a1a1aa; margin-bottom: 16px;">
            测试MongoDB连接是否正常
          </p>

          <el-alert
            v-if="connectionResult"
            :title="connectionResult.success ? '连接成功' : '连接失败'"
            :description="connectionResult.message"
            :type="connectionResult.success ? 'success' : 'error'"
            style="margin-bottom: 16px"
          >
            <template #icon>
              <el-icon v-if="connectionResult.success"><SuccessFilled /></el-icon>
              <el-icon v-else><CircleCloseFilled /></el-icon>
            </template>
          </el-alert>

          <el-button
            type="primary"
            style="width: 100%"
            :loading="testingConnection"
            @click="handleTestConnection"
          >
            <el-icon><Coin /></el-icon>
            测试连接
          </el-button>
        </el-card>

        <!-- 使用说明 -->
        <el-card title="使用说明" style="margin-top: 24px">
          <div style="font-size: 14px; line-height: 1.6; color: #a1a1aa;">
            <h4 style="color: #e4e4e7; margin-bottom: 8px;">MongoDB连接格式：</h4>
            <p style="margin-bottom: 12px;">
              • 本地连接：mongodb://localhost:27017<br/>
              • 带认证：mongodb://username:password@localhost:27017<br/>
              • 远程连接：mongodb://server:port
            </p>

            <h4 style="color: #e4e4e7; margin-bottom: 8px;">数据集合：</h4>
            <p style="margin-bottom: 12px;">
              系统会自动列出数据库中的所有集合，您可以选择要分析的数据集合。
            </p>

            <h4 style="color: #e4e4e7; margin-bottom: 8px;">慢SQL阈值：</h4>
            <p>
              用于统计和标识执行时间超过此阈值的SQL查询，单位为毫秒。
            </p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Coin, Lightning, Setting, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { apiService } from '@/services/api'
import type { Settings, ConnectionTest } from '@/types'

const formRef = ref()
const loading = ref(false)
const connectionResult = ref<ConnectionTest | null>(null)
const testingConnection = ref(false)

const form = reactive<Settings>({
  mongodb_url: 'mongodb://localhost:27017',
  database_name: 'sql_results',
  slow_sql_threshold: 100,
  default_collection: '',
  page_size: 20,
})

const rules = {
  mongodb_url: [
    { required: true, message: '请输入MongoDB连接地址' },
    { pattern: /^mongodb:\/\//, message: '请输入有效的MongoDB连接地址' }
  ],
  database_name: [
    { required: true, message: '请输入数据库名称' }
  ],
  slow_sql_threshold: [
    { required: true, message: '请输入慢SQL阈值' },
    { type: 'number', min: 0, message: '阈值必须大于0' }
  ],
  page_size: [
    { required: true, message: '请输入分页大小' },
    { type: 'number', min: 1, max: 100, message: '分页大小必须在1-100之间' }
  ]
}

const handleTestConnection = async () => {
  if (!form.mongodb_url) {
    ElMessage.error('请输入MongoDB连接地址')
    return
  }

  testingConnection.value = true
  try {
    const result = await apiService.testConnection(form)
    connectionResult.value = result
    if (result.success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error(`连接测试失败: ${result.message}`)
    }
  } catch (err: any) {
    const errorResult: ConnectionTest = {
      success: false,
      message: '连接测试异常'
    }
    connectionResult.value = errorResult
    ElMessage.error('连接测试异常')
  } finally {
    testingConnection.value = false
  }
}

const handleSaveSettings = async () => {
  try {
    // 验证表单
    await formRef.value.validate()
    
    // 保存到后端
    await apiService.saveSettings(form)
    ElMessage.success('设置已保存')
    
    // 同时保存到localStorage作为备份
    localStorage.setItem('sql_plan_visualizer_settings', JSON.stringify(form))
    
    // 触发storage变化事件，通知其他页面重新加载
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'sql_plan_visualizer_settings'
    }))
  } catch (err: any) {
    console.error('保存设置失败:', err)
    ElMessage.error('保存设置失败')
  }
}

const handleLoadSettings = async () => {
  try {
    // 先尝试从后端加载设置
    try {
      const settings = await apiService.getSettings()
      Object.assign(form, settings)
      ElMessage.success('已加载服务器设置')
      return
    } catch (serverErr: any) {
      console.log('从服务器加载设置失败，尝试从本地加载:', serverErr)
    }
    
    // 如果服务器加载失败，从localStorage加载
    const saved = localStorage.getItem('sql_plan_visualizer_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      Object.assign(form, settings)
      ElMessage.success('已加载本地保存的设置')
    } else {
      ElMessage.info('没有找到保存的设置')
    }
  } catch (err: any) {
    console.error('加载设置失败:', err)
    ElMessage.error('加载设置失败')
  }
}

const handleResetSettings = () => {
  ElMessageBox.confirm('确定要重置所有设置吗？', '确认重置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    Object.assign(form, {
      mongodb_url: 'mongodb://localhost:27017',
      database_name: 'sql_results',
      slow_sql_threshold: 100,
      default_collection: '',
      page_size: 20,
    })
    connectionResult.value = null
    ElMessage.success('设置已重置')
  }).catch(() => {
    // 用户取消
  })
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
</style>