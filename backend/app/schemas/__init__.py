from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from enum import Enum

class StatusEnum(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    UNKNOWN = "unknown"

class SQLExecutionRecord(BaseModel):
    """SQL执行记录模型"""
    file_name: str = Field(..., description="SQL脚本文件名")
    file_path: str = Field(..., description="SQL脚本完整路径")
    execution_time: float = Field(..., description="查询执行时间戳")
    status: StatusEnum = Field(..., description="执行状态")
    data: List[Dict[str, Any]] = Field(..., description="执行结果数据列表")
    error: Optional[str] = Field(None, description="错误信息")
    row_count: int = Field(..., description="返回行数")
    execution_time_ms: float = Field(..., description="执行耗时毫秒")
    timestamp: float = Field(..., description="数据保存时间戳")
    save_time: Optional[str] = Field(None, description="友好格式保存时间")
    sql_content: str = Field(..., description="原始SQL语句")

class CollectionList(BaseModel):
    """集合列表响应"""
    collections: List[str]

class PaginatedResponse(BaseModel):
    """分页响应"""
    items: List[SQLExecutionRecord]
    total: int
    page: int
    size: int
    pages: int

class StatisticsSummary(BaseModel):
    """统计摘要"""
    total_plans: int = Field(..., description="总查询计划数")
    success_count: int = Field(..., description="成功数量")
    error_count: int = Field(..., description="失败数量")
    avg_execution_time: float = Field(..., description="平均执行时间")
    max_execution_time: float = Field(..., description="最大执行时间")
    min_execution_time: float = Field(..., description="最小执行时间")
    p95_execution_time: float = Field(..., description="P95执行时间")
    p99_execution_time: float = Field(..., description="P99执行时间")
    total_rows: int = Field(..., description="总返回行数")
    slow_sql_count: int = Field(..., description="慢SQL数量")
    execution_time_distribution: List[Dict[str, Any]] = Field(..., description="执行时间分布")
    # 新增字段：FROM表数量和node节点数量统计
    from_table_distribution: List[Dict[str, Any]] = Field(default_factory=list, description="FROM表数量分布")
    plan_node_distribution: List[Dict[str, Any]] = Field(default_factory=list, description="执行计划节点数量分布")
    avg_from_tables: float = Field(default=0, description="平均FROM表数量")
    avg_plan_nodes: float = Field(default=0, description="平均计划节点数量")
    max_from_tables: int = Field(default=0, description="最大FROM表数量")
    max_plan_nodes: int = Field(default=0, description="最大计划节点数量")

class PlanNode(BaseModel):
    """执行计划节点"""
    node_type: str = Field(..., description="节点类型")
    actual_total_time: Optional[float] = Field(None, description="实际总时间")
    actual_rows: Optional[int] = Field(None, description="实际行数")
    loops: Optional[int] = Field(None, description="循环次数")
    shared_hit_blocks: Optional[int] = Field(None, description="共享缓存命中块")
    shared_read_blocks: Optional[int] = Field(None, description="共享读取块")
    parent: Optional[str] = Field(None, description="父节点")
    children: List[str] = Field(default_factory=list, description="子节点")
    raw_data: Dict[str, Any] = Field(..., description="原始节点数据")

class PlanDetail(BaseModel):
    """执行计划详情"""
    plan_id: str = Field(..., description="计划ID")
    sql_content: str = Field(..., description="SQL内容")
    execution_time_ms: float = Field(..., description="执行时间")
    status: StatusEnum = Field(..., description="状态")
    row_count: int = Field(..., description="返回行数")
    nodes: List[PlanNode] = Field(..., description="节点列表")
    root_node: str = Field(..., description="根节点ID")
    plan_content: str = Field(..., description='查询执行计划的文本')

class ComparisonData(BaseModel):
    """对比数据"""
    plans: List[PlanDetail] = Field(..., description="对比的计划列表")
    comparison_metrics: Dict[str, Any] = Field(..., description="对比指标")

class SearchFilters(BaseModel):
    """搜索筛选"""
    q: Optional[str] = Field(None, description="搜索关键词")
    status: Optional[StatusEnum] = Field(None, description="状态筛选")
    min_execution_time: Optional[float] = Field(None, description="最小执行时间")
    max_execution_time: Optional[float] = Field(None, description="最大执行时间")
    file_name: Optional[str] = Field(None, description="文件名筛选")

class Settings(BaseModel):
    """应用设置"""
    mongodb_url: str = Field(default="mongodb://localhost:27017", description="MongoDB连接地址")
    database_name: str = Field(default="sql_results", description="数据库名")
    slow_sql_threshold: float = Field(default=100.0, description="慢SQL阈值")
    default_collection: Optional[str] = Field(None, description="默认集合")
    page_size: int = Field(default=20, description="默认分页大小")

class ConnectionTest(BaseModel):
    """连接测试结果"""
    success: bool = Field(..., description="连接是否成功")
    message: str = Field(..., description="测试结果消息")