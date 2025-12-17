import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import './style.css'
import './assets/tooltip-custom.css'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 简化tooltip样式 - 只限制宽度，不限制高度
function setupSimpleTooltip() {
  const style = document.createElement('style')
  style.id = 'simple-tooltip-styles'
  style.textContent = `
    /* 简单的tooltip宽度限制 */
    .el-tooltip__popper,
    .el-tooltip__popper.is-dark,
    .el-tooltip__popper.is-light,
    .el-popper,
    .el-tooltip {
      max-width: 600px !important;
      z-index: 999999 !important;
    }
    
    .el-tooltip__popper .el-tooltip__content,
    .el-tooltip__popper .el-tooltip__inner,
    .el-popper .el-tooltip__content,
    .el-popper .el-tooltip__inner,
    .el-tooltip .el-tooltip__content {
      max-width: 600px !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      padding: 8px 12px !important;
      background: #fff !important;
      color: #333 !important;
      border: 1px solid #ddd !important;
      border-radius: 4px !important;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
    }
  `
  
  const existingStyle = document.getElementById('simple-tooltip-styles')
  if (existingStyle) {
    existingStyle.remove()
  }
  
  document.head.appendChild(style)
  console.log('简单tooltip样式已设置')
}

// 设置简单tooltip样式
setupSimpleTooltip()

app.mount('#app')