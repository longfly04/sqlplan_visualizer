# SQL查询执行计划可视化分析平台

一个基于Web的、前后端分离的SQL查询执行计划可视化与数据分析平台。该平台通过从MongoDB数据库中提取存储的SQL执行历史记录及其详细的执行计划，为用户提供直观的可视化展示、深入的节点级性能分析、跨查询的横向对比以及多维度的统计洞察。

## ✨ 特性

- 🎯 **可视化**: 将复杂的JSON格式执行计划转化为直观的图形化展示（集成PEV2组件）
- 📊 **对比分析**: 支持多个SQL查询及其执行计划之间的详细性能指标对比
- 🔍 **数据洞察**: 提供聚合统计和细粒度数据分析，快速定位性能瓶颈
- ⚙️ **灵活配置**: 支持MongoDB连接配置和应用参数设置
- 🐳 **Docker部署**: 支持一键Docker Compose部署

## 🚀 快速开始 (Docker 部署)

### 使用 Docker Compose 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/longfly04/sqlplan_visualizer.git
cd sqlplan_visualizer

# 2. 一键启动所有服务
./start.sh

# 或者手动启动
docker-compose up --build -d
```

### 访问地址
- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

### 停止服务
```bash
./stop.sh
# 或者
docker-compose down
```

📖 详细的部署指南请参考 [Docker-Deployment.md](Docker-Deployment.md)

## 🏗️ 技术架构

### 后端 (Backend)
- **框架**: FastAPI (Python)
- **数据库**: MongoDB with Motor (异步驱动)
- **API**: RESTful API with 自动文档生成
- **特点**: 异步处理、高性能、类型安全

### 前端 (Frontend)
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **可视化组件**: PEV2 (PostgreSQL Explain Visualizer 2)
- **路由**: Vue Router
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

### 3. PEV2 可视化查看器
- 集成PEV2组件进行专业的执行计划可视化
- 支持全屏显示
- 详细的节点性能分析

### 4. 设置 (Settings)
- MongoDB连接配置
- 连接测试功能
- 应用参数设置（慢SQL阈值、分页大小等）
- 设置保存与加载

## 🚀 本地开发

### 环境要求
- Python 3.8+
- Node.js 16+
- MongoDB 3.6+

### 安装与运行

#### 1. 克隆项目
```bash
git clone https://github.com/longfly04/sqlplan_visualizer.git
cd sqlplan_visualizer
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
cd frontend-vue

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
sqlplan_visualizer/
├── backend/                    # 后端应用
│   ├── app/
│   │   ├── api/               # API路由
│   │   │   └── routes.py      # 路由定义
│   │   ├── core/              # 核心配置
│   │   │   └── database.py    # 数据库连接
│   │   ├── schemas/           # 数据模型
│   │   │   └── __init__.py
│   │   ├── services/          # 业务逻辑
│   │   │   ├── analysis.py    # 分析服务
│   │   │   └── plan_parser.py # 计划解析器
│   │   └── main.py            # 应用入口
│   ├── Dockerfile             # 后端Docker配置
│   └── requirements.txt       # Python依赖
├── frontend-vue/              # 前端应用 (Vue 3)
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard.vue  # 仪表板
│   │   │   ├── PlanVisualizer.vue # 计划可视化
│   │   │   ├── PEV2Viewer.vue # PEV2查看器
│   │   │   └── Settings.vue   # 设置页面
│   │   ├── router/            # 路由配置
│   │   │   └── index.ts
│   │   ├── services/          # API服务
│   │   │   └── api.ts
│   │   ├── types/             # TypeScript类型
│   │   │   └── index.ts
│   │   ├── App.vue            # 根组件
│   │   ├── main.ts            # 入口文件
│   │   └── style.css          # 全局样式
│   ├── third_party/           # 第三方组件 (PEV2)
│   │   └── ...                # PEV2可视化组件
│   ├── Dockerfile             # 前端Docker配置
│   ├── nginx.conf             # Nginx配置
│   ├── package.json           # Node.js依赖
│   └── vite.config.ts         # Vite配置
├── scripts/                   # 脚本目录
│   └── init-mongo.js          # MongoDB初始化脚本
├── logs/                      # 日志目录
├── uploads/                   # 上传目录
├── docker-compose.yml         # Docker Compose配置
├── docker-compose.linux.yml   # Linux专用配置
├── start.sh                   # 启动脚本
├── stop.sh                    # 停止脚本
├── Docker-Deployment.md       # Docker部署文档
└── README.md                  # 项目说明
```

## 🔧 API接口

### 核心API端点

- `GET /api/collections` - 获取所有集合列表
- `GET /api/plans?collection=<name>&page=1&size=20` - 分页获取查询计划列表
- `GET /api/stats/summary?collection=<name>` - 获取聚合统计信息
- `GET /api/plans/<plan_id>/detail` - 获取单个计划的详细信息
- `POST /api/analysis/compare` - 接收多个plan_id，返回对比数据
- `POST /api/settings/test-connection` - 测试MongoDB连接

### 交互式文档
启动后端服务后访问: http://localhost:8000/docs

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

4. **Docker部署问题**
   - 检查Docker和Docker Compose版本
   - 确认端口未被占用
   - 查看容器日志: `docker-compose logs`

### 调试工具
- 后端: 查看控制台日志和API文档
- 前端: 浏览器开发者工具
- 数据库: MongoDB Compass
- Docker: `docker-compose logs -f`

## 📝 更新日志

### v0.1.2 (2025-12-16)
- Docker部署改进和文档更新
- 添加Docker-Deployment.md部署指南
- 添加init-mongo.js初始化脚本
- 添加start.sh和stop.sh脚本
- 修复docker-compose配置问题

### v0.1.1 (2025-12-16)
- 完善了PEV2组件的嵌入问题，目前可以正常跳转并全屏显示可视化界面
- 去除了冗余功能以及不完善的功能
- 优化的代码目录结构

### v0.1.0 (2025-12-15)
- 前端框架从React迁移到Vue 3
- 集成PEV2可视化组件
- 优化项目结构

### v0.0.2 (2025-12-10)
- 修复前端页面路由问题
- 修复查询解析逻辑

### v0.0.1 (2025-12-09)
- 初始版本发布
- 实现核心功能模块
- 集成可视化组件
- 支持全文搜索
- 完整的设置配置

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
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - Vue 3 UI组件库
- [PEV2](https://github.com/dalibo/pev2) - PostgreSQL Explain Visualizer 2
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

**SQL Plan Visualizer** - 让SQL性能分析变得简单直观 🚀