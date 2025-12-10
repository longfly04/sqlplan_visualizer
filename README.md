# SQL查询执行计划可视化分析平台

一个基于Web的、前后端分离的SQL查询执行计划可视化与数据分析平台。该平台通过从MongoDB数据库中提取存储的SQL执行历史记录及其详细的执行计划，为用户提供直观的可视化展示、深入的节点级性能分析、跨查询的横向对比以及多维度的统计洞察。

## ✨ 特性

- 🎯 **可视化**: 将复杂的JSON格式执行计划转化为直观的图形化展示
- 📊 **对比分析**: 支持多个SQL查询及其执行计划之间的详细性能指标对比
- 🔍 **数据洞察**: 提供聚合统计和细粒度数据分析，快速定位性能瓶颈
- 🔎 **全文搜索**: 支持SQL内容和文件名的全文检索及高级筛选
- ⚙️ **灵活配置**: 支持MongoDB连接配置和应用参数设置

## 🏗️ 技术架构

### 后端 (Backend)
- **框架**: FastAPI (Python)
- **数据库**: MongoDB with Motor (异步驱动)
- **API**: RESTful API with 自动文档生成
- **特点**: 异步处理、高性能、类型安全

### 前端 (Frontend)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design
- **图表库**: ECharts + React D3 Tree
- **路由**: React Router v6
- **状态管理**: React Hooks
- **特点**: 现代化、响应式、组件化

## 📋 功能模块

### 1. 仪表板 (Dashboard)
- 关键统计信息展示（总查询数、平均执行时间、慢SQL数量等）
- 执行时间分布直方图
- 执行状态饼图
- 实时数据刷新

### 2. 执行计划可视化 (Plan Visualizer)
- SQL执行记录列表（支持分页、排序）
- 交互式执行计划树状图
- 节点级详细信息展示
- 执行计划节点颜色编码（根据执行时间）

### 3. 数据分析 (Data Analysis)
- 多查询对比功能
- 执行时间与返回行数对比图表
- 节点级深度分析表格
- 性能指标横向对比

### 4. 搜索 (Search)
- 全文检索SQL内容和文件名
- 高级筛选（状态、执行时间范围、文件名）
- 分页结果展示
- 搜索条件保存

### 5. 设置 (Settings)
- MongoDB连接配置
- 连接测试功能
- 应用参数设置（慢SQL阈值、分页大小等）
- 设置保存与加载

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- MongoDB 3.6+

### 安装与运行

#### 1. 克隆项目
```bash
git clone <repository-url>
cd sql_plan_visualizer
```

#### 2. 后端设置
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python main.py
```
后端服务将在 http://localhost:8000 启动

#### 3. 前端设置
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
前端应用将在 http://localhost:3000 启动

#### 4. MongoDB配置
确保MongoDB服务正在运行，并且数据库结构符合要求：

- **数据库地址**: `mongodb://localhost:27017`
- **数据库名**: `sql_results`
- **数据结构**:
```javascript
{
  "_id": ObjectId,
  "file_name": "string",
  "file_path": "string", 
  "execution_time": "number",
  "status": "success|error|unknown",
  "data": [{"QUERY PLAN": "json_string"}],
  "error": "string|null",
  "row_count": "number",
  "execution_time_ms": "number",
  "timestamp": "number",
  "save_time": "string|null",
  "sql_content": "string"
}
```

## 📁 项目结构

```
sql_plan_visualizer/
├── backend/                 # 后端应用
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── schemas/        # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── main.py         # 应用入口
│   ├── requirements.txt    # Python依赖
│   └── .env               # 环境配置
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   ├── package.json        # Node.js依赖
│   └── vite.config.ts     # Vite配置
├── docs/                  # 文档，开发中
└── README.md             # 项目说明
```

## 🔧 API接口

### 核心API端点

- `GET /api/collections` - 获取所有集合列表
- `GET /api/plans?collection=<name>&page=1&size=20` - 分页获取查询计划列表
- `GET /api/stats/summary?collection=<name>` - 获取聚合统计信息
- `GET /api/plans/<plan_id>/detail` - 获取单个计划的详细信息
- `POST /api/analysis/compare` - 接收多个plan_id，返回对比数据
- `GET /api/search?collection=<name>&q=<keyword>&filters=...` - 搜索SQL计划
- `POST /api/settings/test-connection` - 测试MongoDB连接

### 交互式文档
正在开发中...

## 🎨 设计特色

### 视觉设计
- **深色主题优先**: 为开发者优化的深色界面，减少眼部疲劳
- **高对比度**: 确保数据、图表和交互元素的清晰可读性
- **现代极简**: 简洁的界面设计，专注于数据和功能
- **响应式布局**: 支持桌面、平板和移动设备

### 交互设计
- **直观导航**: 清晰的侧边栏导航和面包屑
- **实时反馈**: 操作响应和加载状态指示
- **键盘快捷键**: 支持常用操作的快捷键
- **拖拽排序**: 支持表格和列表的拖拽排序

## 🔍 数据模型

### SQL执行记录结构
```typescript
interface SQLExecutionRecord {
  _id: string;
  file_name: string;
  file_path: string;
  execution_time: number;
  status: 'success' | 'error' | 'unknown';
  data: Array<{ QUERY PLAN: string }>;
  error?: string;
  row_count: number;
  execution_time_ms: number;
  timestamp: number;
  save_time?: string;
  sql_content: string;
}
```

### 执行计划节点结构
```typescript
interface PlanNode {
  node_type: string;
  actual_total_time?: number;
  actual_rows?: number;
  loops?: number;
  shared_hit_blocks?: number;
  shared_read_blocks?: number;
  parent?: string;
  children: string[];
  raw_data: Record<string, any>;
}
```

## 🛠️ 开发指南

### 后端开发
1. 添加新的API端点到 `app/api/routes.py`
2. 业务逻辑添加到 `app/services/` 目录
3. 数据模型定义在 `app/schemas/` 目录
4. 运行测试: `pytest`

### 前端开发
1. 新页面组件添加到 `src/pages/` 目录
2. 通用组件添加到 `src/components/` 目录
3. API服务配置在 `src/services/api.ts`
4. 类型定义在 `src/types/index.ts`

### 样式指南
- 使用CSS变量进行主题管理
- 遵循Ant Design设计规范
- 保持深色主题优先
- 确保响应式设计兼容性


## 🐛 故障排除

### 常见问题

1. **MongoDB连接失败**
   - 检查MongoDB服务是否运行
   - 验证连接地址和端口
   - 确认数据库权限

2. **前端API调用失败**
   - 检查后端服务是否启动
   - 验证CORS配置
   - 查看浏览器控制台错误

3. **执行计划解析错误**
   - 确认数据格式符合预期
   - 检查JSON字符串格式
   - 查看后端日志详情

### 调试工具
- 后端: 查看控制台日志和API文档
- 前端: 浏览器开发者工具
- 数据库: MongoDB Compass

## 📝 更新日志

### v1.0.0 (2025-12-09)
- 初始版本发布
- 实现核心功能模块
- 集成可视化组件
- 支持全文搜索
- 完整的设置配置

### v1.0.1 (2025-12-10)
- 修复前端页面路由问题
- 修复查询解析逻辑


## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 作者

LongFly Yu

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的Python Web框架
- [React](https://reactjs.org/) - 用户界面库
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [ECharts](https://echarts.apache.org/) - 图表库
- [React D3 Tree](https://github.com/bkrem/react-d3-tree) - 树形图组件

---

**SQL Plan Visualizer** - 让SQL性能分析变得简单直观 🚀