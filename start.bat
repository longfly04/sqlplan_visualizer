@echo off
chcp 65001 > nul
cls

echo 🚀 SQL查询执行计划可视化分析平台 - 快速启动
echo ===============================================
echo.

REM 检查Docker和Docker Compose是否安装
docker --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装，请先安装 Docker
    pause
    exit /b 1
)

docker-compose --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

echo 🔍 检查MongoDB服务...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ 检测到本地MongoDB服务
    set MONGO_RUNNING=true
) else (
    echo ⚠️  未检测到本地MongoDB服务，将使用Docker启动
    set MONGO_RUNNING=false
)

echo.
echo 🏗️ 启动服务...
echo 后端服务: http://localhost:8000
echo 前端应用: http://localhost:3000
echo API文档: http://localhost:8000/docs
echo MongoDB: localhost:27017
echo.

if "%MONGO_RUNNING%"=="false" (
    echo 🐳 使用Docker Compose启动完整环境...
    docker-compose up -d
    
    echo ⏳ 等待服务启动...
    timeout /t 10 /nobreak > nul
    
    REM 检查服务状态
    echo 🔍 检查服务状态...
    curl -s http://localhost:8000/health > nul
    if errorlevel 1 (
        echo ❌ 后端服务启动失败，请检查日志
        docker-compose logs backend
        pause
        exit /b 1
    ) else (
        echo ✅ 后端服务启动成功
    )
    
    curl -s http://localhost:3000 > nul
    if errorlevel 1 (
        echo ❌ 前端服务启动失败，请检查日志
        docker-compose logs frontend
        pause
        exit /b 1
    ) else (
        echo ✅ 前端服务启动成功
    )
) else (
    echo 🔧 使用本地MongoDB，启动前后端服务...
    
    REM 启动后端
    echo 🚀 启动后端服务...
    cd backend
    if not exist "venv" (
        echo 📦 创建Python虚拟环境...
        python -m venv venv
    )
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    start /B python main.py
    cd ..
    
    REM 启动前端
    echo 🎨 启动前端服务...
    cd frontend
    npm install
    start /B npm run dev
    cd ..
    
    echo ⏳ 等待服务启动...
    timeout /t 15 /nobreak > nul
)

echo.
echo 🎉 服务启动完成！
echo ===============================================
echo 🌐 前端应用: http://localhost:3000
echo 🔧 后端API: http://localhost:8000
echo 📖 API文档: http://localhost:8000/docs
echo 🗄️  MongoDB: localhost:27017
echo.
echo 💡 使用说明:
echo 1. 访问 http://localhost:3000 打开前端应用
echo 2. 在设置页面配置MongoDB连接（如需要）
echo 3. 选择数据集合开始分析SQL执行计划
echo.
echo ⏹️  停止服务:
if "%MONGO_RUNNING%"=="false" (
    echo    docker-compose down
) else (
    echo    关闭此窗口或按 Ctrl+C 停止服务
)
echo.

if "%MONGO_RUNNING%"=="false" (
    echo 🔄 按任意键停止所有服务，或保持窗口打开查看日志
    echo.
    docker-compose logs -f
) else (
    echo 🔄 保持此窗口打开，按任意键停止服务
    pause > nul
    taskkill /F /IM python.exe > nul 2>&1
    taskkill /F /IM node.exe > nul 2>&1
)

echo.
echo 服务已停止