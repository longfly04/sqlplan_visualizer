import json
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from app.core.database import db_config
from app.services.analysis import AnalysisService
from app.schemas import (
    CollectionList, StatisticsSummary,
    SearchFilters, PlanDetail, ComparisonData, Settings, ConnectionTest
)
from app.services.plan_parser import PlanParserService

router = APIRouter()

async def get_database() -> AsyncIOMotorDatabase:
    """获取数据库实例依赖注入"""
    return db_config.get_database()

@router.get("/collections", response_model=CollectionList)
async def get_collections(db: AsyncIOMotorDatabase = Depends(get_database)):
    """获取所有集合列表"""
    try:
        collections = await db.list_collection_names()
        return CollectionList(collections=collections)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取集合列表失败: {str(e)}")

@router.get("/plans")
async def get_plans(
    collection: str,
    page: int = 1,
    size: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """分页获取查询计划列表"""
    try:
        collection_obj = db[collection]
        skip = (page - 1) * size
        
        # 获取总数
        total = await collection_obj.count_documents({})
        
        # 分页查询
        cursor = collection_obj.find({}).sort("timestamp", -1).skip(skip).limit(size)
        plans = await cursor.to_list(length=size)
        
        # 转换_id为字符串并处理复杂度信息
        for plan in plans:
            plan["_id"] = str(plan["_id"])
            # 处理复杂度信息
            plan = AnalysisService.process_record_complexity(plan)
        
        return {
            "items": plans,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取查询计划失败: {str(e)}")

@router.get("/stats/summary", response_model=StatisticsSummary)
async def get_stats_summary(
    collection: str,
    slow_sql_threshold: float = 100.0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """获取聚合统计信息"""
    try:
        return await AnalysisService.get_collection_stats(db, collection, slow_sql_threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

@router.get("/stats/basic", response_model=StatisticsSummary)
async def get_basic_stats(
    collection: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """获取基础统计信息（不依赖阈值）"""
    try:
        return await AnalysisService.get_basic_collection_stats(db, collection)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取基础统计信息失败: {str(e)}")

@router.get("/stats/slow-sql", response_model=StatisticsSummary)
async def get_slow_sql_stats(
    collection: str,
    slow_sql_threshold: float = 100.0,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """获取慢SQL统计信息（依赖阈值）"""
    try:
        return await AnalysisService.get_slow_sql_stats(db, collection, slow_sql_threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取慢SQL统计信息失败: {str(e)}")

@router.get("/stats/slow-sql-list")
async def get_slow_sql_list(
    collection: str,
    slow_sql_threshold: float = 100.0,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """获取慢SQL列表数据（用于趋势图表）"""
    try:
        return await AnalysisService.get_slow_sql_list(db, collection, slow_sql_threshold, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取慢SQL列表失败: {str(e)}")

@router.get("/plans/{plan_id}/detail")
async def get_plan_detail(
    plan_id: str,
    collection: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """获取单个计划的详细信息，包括解析后的节点数据"""
    try:
        # 获取原始记录
        record = await AnalysisService.get_record_detail(db, collection, plan_id)
        if not record:
            raise HTTPException(status_code=404, detail="查询计划不存在")
        
        # 解析执行计划
        parsed_plan = PlanParserService.extract_query_plan_json(record)
        if not parsed_plan:
            raise HTTPException(status_code=400, detail="无法找到执行计划数据")
        
        # 解析JSON
        parsed_plan = PlanParserService.parse_json_string(parsed_plan)
        if not parsed_plan:
            raise HTTPException(status_code=400, detail="执行计划JSON解析失败")
        
        # 提取节点
        nodes = PlanParserService.parse_execution_plan(parsed_plan)
        root_node = PlanParserService.find_root_node(nodes)
        
        # 将计划转换为JSON字符串以便存储到PlanContent
        plan_content = json.dumps(parsed_plan, ensure_ascii=False)
        
        return PlanDetail(
            plan_id=plan_id,
            sql_content=record["sql_content"],
            execution_time_ms=record["execution_time_ms"],
            status=record["status"],
            row_count=record["row_count"],
            nodes=nodes,
            root_node=root_node,
            plan_content=plan_content
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取计划详情失败: {str(e)}")

@router.post("/analysis/compare")
async def compare_plans(
    plan_ids: List[str],
    collection: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """接收多个plan_id，返回对比数据"""
    try:
        plans = []
        for plan_id in plan_ids:
            # 这里复用get_plan_detail的逻辑
            record = await AnalysisService.get_record_detail(db, collection, plan_id)
            if record:
                query_plan_json = PlanParserService.extract_query_plan_json(record)
                if query_plan_json:
                    parsed_plan = PlanParserService.parse_json_string(query_plan_json)
                    
                    if parsed_plan:
                        nodes = PlanParserService.parse_execution_plan(parsed_plan)
                        root_node = PlanParserService.find_root_node(nodes)
                        
                        # 将计划转换为JSON字符串以便存储到PlanContent
                        plan_content = json.dumps(parsed_plan, ensure_ascii=False)
                        
                        plan_detail = PlanDetail(
                            plan_id=plan_id,
                            sql_content=record["sql_content"],
                            execution_time_ms=record["execution_time_ms"],
                            status=record["status"],
                            row_count=record["row_count"],
                            nodes=nodes,
                            root_node=root_node,
                            plan_content=plan_content
                        )
                        plans.append(plan_detail)
        
        # 生成对比指标
        comparison_metrics = {
            'total_plans': len(plans),
            'avg_execution_time': sum(p.execution_time_ms for p in plans) / len(plans) if plans else 0,
            'max_execution_time': max((p.execution_time_ms for p in plans), default=0),
            'min_execution_time': min((p.execution_time_ms for p in plans), default=0)
        }
        
        return ComparisonData(
            plans=plans,
            comparison_metrics=comparison_metrics
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"对比分析失败: {str(e)}")

@router.get("/search")
async def search_plans(
    collection: str,
    q: str = None,
    status: str = None,
    min_execution_time: float = None,
    max_execution_time: float = None,
    file_name: str = None,
    page: int = 1,
    size: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """搜索SQL计划"""
    try:
        filters = SearchFilters(
            q=q,
            status=status,
            min_execution_time=min_execution_time,
            max_execution_time=max_execution_time,
            file_name=file_name
        )
        
        filters_dict = filters.dict(exclude_none=True)
        return await AnalysisService.search_records(db, collection, filters_dict, page, size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")

@router.get("/settings", response_model=Settings)
async def get_settings():
    """获取当前设置"""
    try:
        # TODO: 从数据库或配置文件中读取设置
        # 暂时返回默认设置
        return Settings(
            mongodb_url="mongodb://localhost:27017",
            database_name="sql_results",
            slow_sql_threshold=100.0,
            default_collection=None,
            page_size=20
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取设置失败: {str(e)}")

@router.post("/settings")
async def save_settings(settings: Settings):
    """保存设置"""
    try:
        # TODO: 保存设置到数据库或配置文件
        # 暂时只返回成功响应
        return {"success": True, "message": "设置保存成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存设置失败: {str(e)}")

@router.post("/settings/test-connection", response_model=ConnectionTest)
async def test_connection(
    settings: Settings
):
    """测试MongoDB连接"""
    try:
        success = await db_config.test_connection()
        if success:
            return ConnectionTest(success=True, message="连接成功")
        else:
            return ConnectionTest(success=False, message="连接失败")
    except Exception as e:
        return ConnectionTest(success=False, message=f"连接测试异常: {str(e)}")

@router.get("/stats/script-names")
async def get_script_names_by_range(
    collection: str,
    range_type: str,  # 'execution_time', 'from_table', 'plan_node'
    range_value: str,
    slow_sql_threshold: Optional[float] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """获取指定范围内的SQL脚本名称列表"""
    try:
        return await AnalysisService.get_sql_script_names_by_range(
            db, collection, range_type, range_value, slow_sql_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取脚本名称列表失败: {str(e)}")