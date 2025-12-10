import statistics
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas import SQLExecutionRecord, StatisticsSummary

class AnalysisService:
    """数据分析服务"""
    
    @staticmethod
    async def get_collection_stats(db: AsyncIOMotorDatabase, collection_name: str, slow_sql_threshold: float = 100.0) -> StatisticsSummary:
        """获取集合统计信息"""
        collection = db[collection_name]
        
        # 获取总记录数
        total_count = await collection.count_documents({})
        
        # 获取状态统计
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_results = await collection.aggregate(status_pipeline).to_list(None)
        
        success_count = 0
        error_count = 0
        for result in status_results:
            if result["_id"] == "success":
                success_count = result["count"]
            elif result["_id"] == "error":
                error_count = result["count"]
        
        # 获取执行时间统计
        time_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_time": {"$avg": "$execution_time_ms"},
                    "max_time": {"$max": "$execution_time_ms"},
                    "min_time": {"$min": "$execution_time_ms"},
                    "all_times": {"$push": "$execution_time_ms"}
                }
            }
        ]
        time_results = await collection.aggregate(time_pipeline).to_list(None)
        
        if time_results:
            time_data = time_results[0]
            avg_time = time_data["avg_time"]
            max_time = time_data["max_time"]
            min_time = time_data["min_time"]
            all_times = time_data["all_times"]
            
            # 计算百分位数
            sorted_times = sorted(all_times)
            total_times = len(sorted_times)
            
            p95_index = int(total_times * 0.95) - 1
            p99_index = int(total_times * 0.99) - 1
            
            p95_time = sorted_times[p95_index] if p95_index < total_times else max_time
            p99_time = sorted_times[p99_index] if p99_index < total_times else max_time
        else:
            avg_time = max_time = min_time = p95_time = p99_time = 0
        
        # 获取总行数
        row_pipeline = [
            {"$group": {"_id": None, "total_rows": {"$sum": "$row_count"}}}
        ]
        row_results = await collection.aggregate(row_pipeline).to_list(None)
        total_rows = row_results[0]["total_rows"] if row_results else 0
        
        # 计算慢SQL数量
        slow_sql_count = await collection.count_documents({
            "execution_time_ms": {"$gt": slow_sql_threshold}
        })
        
        # 获取执行时间分布
        execution_time_distribution = AnalysisService._get_time_distribution(all_times if time_results else [])
        
        return StatisticsSummary(
            total_plans=total_count,
            success_count=success_count,
            error_count=error_count,
            avg_execution_time=avg_time,
            max_execution_time=max_time,
            min_execution_time=min_time,
            p95_execution_time=p95_time,
            p99_execution_time=p99_time,
            total_rows=total_rows,
            slow_sql_count=slow_sql_count,
            execution_time_distribution=execution_time_distribution
        )
    
    @staticmethod
    def _get_time_distribution(execution_times: List[float], bins: int = 20) -> List[Dict[str, Any]]:
        """生成执行时间分布直方图数据"""
        if not execution_times:
            return []
        
        min_time = min(execution_times)
        max_time = max(execution_times)
        
        if min_time == max_time:
            return [{"range": f"{min_time:.1f}", "count": len(execution_times)}]
        
        bin_width = (max_time - min_time) / bins
        distribution = []
        
        for i in range(bins):
            bin_start = min_time + i * bin_width
            bin_end = min_time + (i + 1) * bin_width
            
            count = sum(1 for t in execution_times if bin_start <= t < bin_end)
            if i == bins - 1:  # 最后一个bin包含最大值
                count = sum(1 for t in execution_times if bin_start <= t <= bin_end)
            
            distribution.append({
                "range": f"{bin_start:.1f}-{bin_end:.1f}",
                "count": count,
                "start": bin_start,
                "end": bin_end
            })
        
        return distribution
    
    @staticmethod
    async def search_records(
        db: AsyncIOMotorDatabase, 
        collection_name: str, 
        filters: Dict[str, Any],
        page: int = 1,
        size: int = 20
    ) -> Dict[str, Any]:
        """搜索记录"""
        collection = db[collection_name]
        
        # 构建查询条件
        query = {}
        
        if filters.get("q"):
            query["$or"] = [
                {"sql_content": {"$regex": filters["q"], "$options": "i"}},
                {"file_name": {"$regex": filters["q"], "$options": "i"}}
            ]
        
        if filters.get("status"):
            query["status"] = filters["status"]
        
        if filters.get("min_execution_time"):
            query.setdefault("execution_time_ms", {})["$gte"] = filters["min_execution_time"]
        
        if filters.get("max_execution_time"):
            query.setdefault("execution_time_ms", {})["$lte"] = filters["max_execution_time"]
        
        if filters.get("file_name"):
            query["file_name"] = {"$regex": filters["file_name"], "$options": "i"}
        
        # 获取总数
        total = await collection.count_documents(query)
        
        # 分页查询
        skip = (page - 1) * size
        cursor = collection.find(query).sort("timestamp", -1).skip(skip).limit(size)
        records = await cursor.to_list(length=size)
        
        # 转换_id为字符串
        for record in records:
            record["_id"] = str(record["_id"])
        
        return {
            "items": records,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    
    @staticmethod
    async def get_record_detail(db: AsyncIOMotorDatabase, collection_name: str, record_id: str) -> Optional[Dict[str, Any]]:
        """获取记录详情"""
        from bson.objectid import ObjectId
        
        try:
            record = await db[collection_name].find_one({"_id": ObjectId(record_id)})
            if record:
                record["_id"] = str(record["_id"])
            return record
        except Exception:
            return None