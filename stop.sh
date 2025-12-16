#!/bin/bash

# SQL Plan Visualizer Docker 停止脚本

set -e

echo "🛑 停止 SQL Plan Visualizer Docker 容器..."

# 检查 Docker Compose 是否可用
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 显示当前运行的服务
echo "📊 当前运行的服务："
docker compose ps

# 停止服务
echo "🛑 停止服务..."
docker compose down

echo ""
echo "✅ 服务已停止，数据已保留（连接本地MongoDB）"
echo ""
echo "💡 提示："
echo "   重新启动: ./start.sh"
echo "   查看日志: docker-compose logs -f"
echo "   重启服务: docker-compose restart"
echo ""
echo "🔧 注意："
echo "   - 本项目连接到本地 MongoDB 数据库"
echo "   - 本地数据库中的数据不受影响"
echo "   - 如需完全清理，请手动停止本地 MongoDB 服务"