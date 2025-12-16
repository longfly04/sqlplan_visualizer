# SQL Plan Visualizer Docker 部署指南

本文档详细说明如何使用 Docker 容器部署 SQL Plan Visualizer 应用，实现持久化运行。

## 📋 目录结构

```
sqlplan_visualizer/
├── docker-compose.yml          # Docker Compose 配置
├── .env                        # 环境变量配置
├── .dockerignore              # Docker 忽略文件
├── start.sh                   # 启动脚本
├── backend/                   # 后端代码
│   ├── Dockerfile            # 后端 Docker 镜像配置
│   └── ...
├── frontend-vue/             # 前端代码
│   ├── Dockerfile           # 前端 Docker 镜像配置
│   ├── nginx.conf           # Nginx 配置
│   └── ...
├── scripts/                  # 脚本文件
│   └── init-mongo.js        # MongoDB 初始化脚本
└── data/                    # 数据持久化目录
    ├── mongodb/            # MongoDB 数据
    └── redis/              # Redis 数据
```

## 🏗️ 架构概览

### 服务组成
- **前端服务** (Nginx + Vue.js): 端口 3000
- **后端服务** (Python + FastAPI): 端口 8000  
- **MongoDB 数据库**: 端口 27017
- **Redis 缓存**: 端口 6379

### 网络架构
- 所有服务运行在 `sql_plan_network` 网络中
- 服务间通过服务名通信（如 `backend`, `mongodb`, `redis`）
- 前端通过 Nginx 代理访问后端 API

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd sqlplan_visualizer

# 2. 运行启动脚本
./start.sh
```

### 方式二：手动启动

```bash
# 1. 创建必要目录
mkdir -p logs uploads data/mongodb data/redis

# 2. 启动所有服务
docker-compose up --build -d

# 3. 查看服务状态
docker-compose ps
```

## 🔧 配置说明

### 环境变量 (.env)

主要配置项：

```bash
# 数据库配置
MONGODB_URL=mongodb://admin:password123@mongodb:27017/sql_results?authSource=admin
DATABASE_NAME=sql_results

# API 配置
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:80"]

# 前端配置
VITE_API_BASE_URL=http://localhost:8000

# 安全配置
SECRET_KEY=your-super-secret-key-change-this-in-production
```

### MongoDB 配置

- **镜像**: `mongo:6.0`
- **端口**: 27017
- **用户**: admin / password123
- **数据库**: sql_results
- **数据持久化**: `mongodb_data` volume

### Redis 配置

- **镜像**: `redis:7-alpine`
- **端口**: 6379
- **数据持久化**: `redis_data` volume

## 📊 服务访问

### Web 界面
- **前端界面**: http://localhost:3000
- **后端API文档**: http://localhost:8000/docs

### 数据库连接
- **MongoDB**: `mongodb://admin:password123@localhost:27017/sql_results`
- **Redis**: `redis://localhost:6379`

## 🔍 常用操作

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 进入容器
```bash
# 进入后端容器
docker-compose exec backend bash

# 进入 MongoDB 容器
docker-compose exec mongodb mongo -u admin -p password123 --authenticationDatabase admin
```

## 📈 性能优化

### 数据持久化
- MongoDB 数据存储在 `mongodb_data` volume
- Redis 数据存储在 `redis_data` volume
- 日志文件存储在 `logs` 目录

### 资源限制
可以在 docker-compose.yml 中添加资源限制：

```yaml
services:
  backend:
    # ... 其他配置
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### 监控
```bash
# 查看资源使用情况
docker stats

# 查看容器健康状态
docker-compose ps
```

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :8000
   lsof -i :27017
   ```

2. **权限问题**
   ```bash
   # 设置脚本执行权限
   chmod +x start.sh
   
   # 设置目录权限
   chmod 755 logs uploads data
   ```

3. **MongoDB 连接问题**
   ```bash
   # 检查 MongoDB 状态
   docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"
   ```

4. **前端构建失败**
   ```bash
   # 清理并重新构建
   docker-compose down
   docker-compose build --no-cache frontend
   docker-compose up -d frontend
   ```

### 日志分析
```bash
# 查看详细错误信息
docker-compose logs backend | tail -50
docker-compose logs frontend | tail -50
```

## 🔄 更新部署

### 更新代码
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并启动
docker-compose down
docker-compose up --build -d

# 3. 验证服务
docker-compose ps
```

### 备份数据
```bash
# 备份 MongoDB 数据
docker-compose exec mongodb mongodump --out /data/backup/$(date +%Y%m%d_%H%M%S)

# 备份 Redis 数据
docker-compose exec redis redis-cli BGSAVE
```

## 🔒 安全建议

1. **生产环境配置**
   - 修改默认密码
   - 使用 HTTPS
     - 限制 - 配置防火墙
数据库访问

2. **环境变量**
   - 不要在代码中硬编码敏感信息
   - 使用强密码
   - 定期更新密钥

3. **网络安全**
   - 限制服务间通信
   - 使用防火墙规则
   - 定期更新镜像

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [MongoDB Docker 文档](https://hub.docker.com/_/mongo)
- [Redis Docker 文档](https://hub.docker.com/_/redis)

## 🆘 技术支持

如果遇到问题，请：

1. 检查 Docker 和 Docker Compose 版本
2. 查看日志文件
3. 确认端口未被占用
4. 验证环境变量配置
5. 重启相关服务

---

**版本**: v0.1.1  
**更新时间**: 2025-12-16