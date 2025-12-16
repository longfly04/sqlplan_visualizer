#!/bin/bash

# SQL Plan Visualizer Docker 启动脚本

set -e

echo "🚀 启动 SQL Plan Visualizer Docker 容器..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads

# 设置权限
chmod 755 logs uploads

# 停止并删除现有容器（如果存在）
echo "🛑 停止现有容器..."
docker compose down --remove-orphans

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker compose ps

# 显示访问信息
echo ""
echo "✅ SQL Plan Visualizer 已成功启动！"
echo ""
echo "🌐 访问地址："
echo "   前端界面: http://localhost:13000"
echo "   后端API:  http://localhost:8000"
echo "   API文档:  http://localhost:8000/docs"
echo ""
echo "🗄️  数据库信息："
echo "   MongoDB:   mongodb://localhost:27017/sql_results (本地数据库)"
echo ""
echo "📋 常用命令："
echo "   查看日志:     docker compose logs -f"
echo "   停止服务:     docker compose down"
echo "   重启服务:     docker compose restart"
echo "   查看状态:     docker compose ps"
echo ""
echo "🔧 如需修改配置，请编辑 .env 文件"
echo ""
echo "⚠️  注意："
echo "   - 本项目连接到本地 MongoDB 数据库"
echo "   - 请确保本地 MongoDB 服务正在运行"
echo "   - 如在 Linux 上遇到连接问题，请检查 .env 文件中的 MONGODB_URL 配置"