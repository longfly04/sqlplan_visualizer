from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

# 创建FastAPI应用实例
app = FastAPI(
    title="SQL查询执行计划可视化分析平台",
    description="基于Web的SQL查询执行计划可视化与数据分析平台",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api", tags=["SQL执行计划"])

@app.get("/")
async def root():
    """根路径，返回API信息"""
    return {
        "message": "SQL查询执行计划可视化分析平台 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "SQL Plan Visualizer API"}