#!/bin/bash

# SQL Plan Visualizer 快速启动脚本

set -e

echo "🚀 SQL查询执行计划可视化分析平台 - 快速启动"
echo "==============================================="

# 检查Docker和Docker Compose是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查MongoDB服务（如果本地运行）
echo "🔍 检查MongoDB服务..."
if pgrep -x "mongod" > /dev/null; then
    echo "✅ 检测到本地MongoDB服务"
    MONGO_RUNNING=true
else
    echo "⚠️  未检测到本地MongoDB服务，将使用Docker启动"
    MONGO_RUNNING=false
fi

# 启动服务
echo ""
echo "🏗️  启动服务..."
echo "后端服务: http://localhost:8000"
echo "前端应用: http://localhost:3000"
echo "API文档: http://localhost:8000/docs"
echo "MongoDB: localhost:27017"
echo ""

# 如果没有运行MongoDB，则启动完整的docker-compose
if [ "$MONGO_RUNNING" = false ]; then
    echo "🐳 使用Docker Compose启动完整环境..."
    docker-compose up -d
    
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 检查服务状态
    echo "🔍 检查服务状态..."
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ 后端服务启动成功"
    else
        echo "❌ 后端服务启动失败，请检查日志"
        docker-compose logs backend
        exit 1
    fi
    
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ 前端服务启动成功"
    else
        echo "❌ 前端服务启动失败，请检查日志"
        docker-compose logs frontend
        exit 1
    fi
else
    echo "🔧 使用本地MongoDB，启动前后端服务..."
    
    # 启动后端
    echo "🚀 启动后端服务..."
    cd backend
    if [ ! -d "venv" ]; then
        echo "📦 创建Python虚拟环境..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # 启动前端
    echo "🎨 启动前端服务..."
    cd frontend
    npm install
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo "⏳ 等待服务启动..."
    sleep 15
fi

echo ""
echo "🎉 服务启动完成！"
echo "==============================================="
echo "🌐 前端应用: http://localhost:3000"
echo "🔧 后端API: http://localhost:8000"
echo "📖 API文档: http://localhost:8000/docs"
echo "🗄️  MongoDB: localhost:27017"
echo ""
echo "💡 使用说明:"
echo "1. 访问 http://localhost:3000 打开前端应用"
echo "2. 在设置页面配置MongoDB连接（如需要）"
echo "3. 选择数据集合开始分析SQL执行计划"
echo ""
echo "⏹️  停止服务:"
if [ "$MONGO_RUNNING" = false ]; then
    echo "   docker-compose down"
else
    echo "   按 Ctrl+C 停止服务"
fi
echo ""

# 保持脚本运行
if [ "$MONGO_RUNNING" = false ]; then
    echo "🔄 按 Ctrl+C 停止所有服务"
    trap "docker-compose down" INT
    docker-compose logs -f
else
    echo "🔄 按 Ctrl+C 停止服务"
    trap "kill $BACKEND_PID $FRONTEND_PID" INT
    wait
fi