# SQL Plan Visualizer - Vue版本

基于Vue 3 + TypeScript + Element Plus重构的SQL查询执行计划可视化分析平台。

## 技术栈

- **前端框架**: Vue 3.4+
- **构建工具**: Vite 5.0+
- **UI组件库**: Element Plus 2.4+
- **状态管理**: Pinia 2.1+
- **图表库**: ECharts 5.4+
- **HTTP客户端**: Axios 1.6+
- **树状图**: D3.js 7.8+
- **类型检查**: TypeScript 5.2+

## 功能特性

### 🎯 核心功能
- **仪表板**: SQL执行计划统计概览，包含关键指标和可视化图表
- **执行计划可视化**: 详细的执行计划查看，支持树状图和PEV2可视化
- **数据分析**: 多查询对比分析和节点级深度分析
- **高级搜索**: 全文检索和高级筛选SQL执行计划
- **系统设置**: MongoDB连接配置和应用参数管理

### 🎨 用户界面
- **响应式设计**: 支持桌面和移动设备
- **暗色主题**: 内置明暗主题切换
- **国际化**: 完整的中文界面
- **交互体验**: 流畅的动画和过渡效果

### 📊 数据可视化
- **统计图表**: 执行时间分布、状态分布饼图
- **对比分析**: 多计划执行时间和返回行数对比
- **树状图**: D3.js实现的交互式执行计划树
- **PEV2集成**: 专业的PostgreSQL执行计划可视化工具

## 项目结构

```
frontend-vue/
├── public/                 # 静态资源
│   └── pev2.html       # PEV2可视化工具页面
├── src/                   # 源代码
│   ├── components/          # 公共组件
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.vue      # 仪表板页面
│   │   ├── PlanVisualizer.vue # 执行计划可视化页面
│   │   ├── DataAnalysis.vue   # 数据分析页面
│   │   └── Settings.vue       # 设置页面
│   ├── services/           # API服务
│   │   └── api.ts            # API接口封装
│   ├── types/              # 类型定义
│   │   └── index.ts           # TypeScript类型
│   ├── router/             # 路由配置
│   │   └── index.ts           # Vue Router配置
│   ├── App.vue             # 根组件
│   ├── main.ts             # 应用入口
│   └── style.css            # 全局样式
├── package.json            # 项目依赖
├── vite.config.ts          # Vite配置
├── tsconfig.json          # TypeScript配置
├── Dockerfile             # Docker构建文件
├── nginx.conf             # Nginx配置文件
└── README.md              # 项目说明
```

## 快速开始

### 环境要求
- Node.js 16.0+
- npm 8.0+ 或 yarn 1.22+

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发模式
```bash
npm run dev
# 或
yarn dev
```

应用将在 `http://localhost:13000` 启动

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或
yarn preview
```

## Docker部署

### 构建Docker镜像
```bash
docker build -t sql-plan-visualizer-frontend-vue .
```

### 运行容器
```bash
docker run -p 80:80 sql-plan-visualizer-frontend-vue
```

### 使用Docker Compose
```yaml
version: '3.8'
services:
  frontend-vue:
    build: ./frontend-vue
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
```

## 配置说明

### API代理配置
开发环境下，Vite会自动代理 `/api/*` 请求到后端服务器：
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

### 环境变量
- `NODE_ENV`: 运行环境 (development/production)
- `VITE_API_BASE_URL`: API基础URL (生产环境可配置)

## 浏览器支持

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint + Prettier 保持代码风格

### 组件开发
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 使用 Composition API
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const count = ref(0)

// 计算属性
const doubled = computed(() => count.value * 2)

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
/* 组件样式 */
</style>
```

### API调用示例
```typescript
import { apiService } from '@/services/api'

// 获取数据
const data = await apiService.getCollections()
console.log(data)
```

## 与React版本的对比

### 技术栈对比
| 特性 | React版本 | Vue版本 |
|------|-----------|----------|
| 框架 | React 18.2+ | Vue 3.4+ |
| 状态管理 | 内置State | Pinia |
| UI组件 | Ant Design | Element Plus |
| 构建工具 | Vite | Vite |
| 类型系统 | TypeScript | TypeScript |
| 树状图 | react-d3-tree | D3.js原生 |

### 功能对比
- ✅ 完全保持原有功能
- ✅ 相同的用户界面布局
- ✅ 相同的数据可视化效果
- ✅ 相同的API接口调用
- ✅ 相同的响应式设计

### 性能优化
- 🚀 Vue 3的响应式系统更高效
- 🚀 Composition API提供更好的代码组织
- 🚀 Element Plus按需加载减少包体积
- 🚀 Vite的快速热更新

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您在使用过程中遇到问题，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

---

**注意**: 本项目是从React版本完全重构而来，保持了所有原有功能和用户界面，只是技术栈从React迁移到了Vue 3。