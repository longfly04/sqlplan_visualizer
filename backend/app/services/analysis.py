import statistics
import time
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas import SQLExecutionRecord, StatisticsSummary
from app.services.complexity import ComplexityService

class AnalysisService:
    """数据分析服务"""
    
    # 缓存统计结果，避免重复计算
    _stats_cache = {}
    _cache_ttl = 300  # 缓存5分钟
    
    @staticmethod
    def _get_cache_key(collection_name: str, threshold: Optional[float] = None, is_basic: bool = False) -> str:
        """生成缓存键"""
        if is_basic:
            return f"{collection_name}_basic"
        else:
            return f"{collection_name}_{threshold}"
    
    @staticmethod
    def _is_cache_valid(timestamp: float) -> bool:
        """检查缓存是否有效"""
        return (time.time() - timestamp) < AnalysisService._cache_ttl
    
    @staticmethod
    def clear_cache():
        """清理所有缓存"""
        AnalysisService._stats_cache.clear()
        print("统计缓存已清理")
    
    @staticmethod
    def get_cache_info() -> dict:
        """获取缓存信息"""
        return {
            'cache_size': len(AnalysisService._stats_cache),
            'cache_ttl': AnalysisService._cache_ttl,
            'cached_keys': list(AnalysisService._stats_cache.keys())
        }
    
    @staticmethod
    def process_record_complexity(record: Dict[str, Any]) -> Dict[str, Any]:
        """处理记录中的复杂度信息 - 如果没有enhanced_complexity_analysis字段则保持不变"""
        try:
            # 检查是否有enhanced_complexity_analysis字段
            if 'enhanced_complexity_analysis' in record:
                print(f"[ANALYSIS] 记录包含enhanced_complexity_analysis字段，记录ID: {record.get('_id', 'Unknown')}")
                # 如果有该字段，可以进行一些基本验证，但不进行复杂计算
                enhanced = record['enhanced_complexity_analysis']
                if enhanced and isinstance(enhanced, dict):
                    # 验证是否有必需的字段
                    if 'total_complexity_score' in enhanced:
                        print(f"[ANALYSIS] 记录包含total_complexity_score: {enhanced['total_complexity_score']}")
                    else:
                        print(f"[ANALYSIS] enhanced_complexity_analysis缺少total_complexity_score字段")
            else:
                print(f"[ANALYSIS] 记录不包含enhanced_complexity_analysis字段，记录ID: {record.get('_id', 'Unknown')}")
            
            # 不再进行复杂度计算，让前端直接显示"未知"
            return record
        except Exception as e:
            print(f"[ANALYSIS] 处理复杂度信息失败: {e}")
            return record
    
    @staticmethod
    async def get_collection_stats(db: AsyncIOMotorDatabase, collection_name: str, slow_sql_threshold: float = 100.0) -> 'StatisticsSummary':
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
        
        all_times = []
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
        execution_time_distribution = AnalysisService._get_time_distribution(all_times)
        
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
    async def get_basic_collection_stats(db: AsyncIOMotorDatabase, collection_name: str) -> 'StatisticsSummary':
        """获取基础统计信息（不依赖阈值）"""
        
        # 检查缓存
        cache_key = AnalysisService._get_cache_key(collection_name, is_basic=True)
        if cache_key in AnalysisService._stats_cache:
            cached_data = AnalysisService._stats_cache[cache_key]
            if AnalysisService._is_cache_valid(cached_data['timestamp']):
                print(f"使用缓存的基础统计数据: {cache_key}")
                return cached_data['data']
        
        print(f"计算基础统计数据: {collection_name}")
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
                }
            }
        ]
        time_results = await collection.aggregate(time_pipeline).to_list(None)
        avg_time = time_results[0]["avg_time"] if time_results else 0
        
        # 获取总行数
        row_pipeline = [
            {"$group": {"_id": None, "total_rows": {"$sum": "$row_count"}}}
        ]
        row_results = await collection.aggregate(row_pipeline).to_list(None)
        total_rows = row_results[0]["total_rows"] if row_results else 0
        
        # 计算平均返回行数
        avg_rows_per_plan = total_rows / total_count if total_count > 0 else 0
        
        # 基础统计不需要慢SQL数量和执行时间分布，使用默认值
        result = StatisticsSummary(
            total_plans=total_count,
            success_count=success_count,
            error_count=error_count,
            avg_execution_time=avg_time,
            max_execution_time=0.0,  # 基础统计不需要最大执行时间
            min_execution_time=0.0,
            p95_execution_time=0.0,
            p99_execution_time=0.0,
            total_rows=total_rows,
            slow_sql_count=0,  # 基础统计不包含慢SQL数量
            execution_time_distribution=[],  # 基础统计不包含执行时间分布
            from_table_distribution=[],  # 基础统计不包含FROM表分布
            plan_node_distribution=[],  # 基础统计不包含节点分布
            avg_from_tables=0.0,  # 基础统计平均FROM表数量
            avg_plan_nodes=0.0,  # 基础统计平均节点数量
            max_from_tables=0,  # 基础统计最大FROM表数量
            max_plan_nodes=0  # 基础统计最大节点数量
        )
        
        # 缓存结果
        AnalysisService._stats_cache[cache_key] = {
            'data': result,
            'timestamp': time.time()
        }
        
        return result

    @staticmethod
    async def get_slow_sql_stats(db: AsyncIOMotorDatabase, collection_name: str, slow_sql_threshold: float) -> 'StatisticsSummary':
        """获取慢SQL统计信息（依赖阈值）"""
        
        # 检查缓存
        cache_key = AnalysisService._get_cache_key(collection_name, slow_sql_threshold)
        if cache_key in AnalysisService._stats_cache:
            cached_data = AnalysisService._stats_cache[cache_key]
            if AnalysisService._is_cache_valid(cached_data['timestamp']):
                print(f"使用缓存的慢SQL统计数据: {cache_key}")
                return cached_data['data']
        
        print(f"计算慢SQL统计数据: {collection_name}, 阈值: {slow_sql_threshold}")
        collection = db[collection_name]
        
        # 只获取慢SQL记录
        slow_sql_query = {"execution_time_ms": {"$gt": slow_sql_threshold}}
        slow_sql_count = await collection.count_documents(slow_sql_query)
        
        if slow_sql_count == 0:
            # 如果没有慢SQL，返回空统计
            result = StatisticsSummary(
                total_plans=0,
                success_count=0,
                error_count=0,
                avg_execution_time=0.0,
                max_execution_time=0.0,
                min_execution_time=0.0,
                p95_execution_time=0.0,
                p99_execution_time=0.0,
                total_rows=0,
                slow_sql_count=0,
                execution_time_distribution=[],
                from_table_distribution=[],
                plan_node_distribution=[],
                avg_from_tables=0.0,
                avg_plan_nodes=0.0,
                max_from_tables=0,
                max_plan_nodes=0
            )
            
            # 缓存空结果
            AnalysisService._stats_cache[cache_key] = {
                'data': result,
                'timestamp': time.time()
            }
            
            return result
        
        # 获取慢SQL的执行时间统计
        time_pipeline = [
            {"$match": {"execution_time_ms": {"$gt": slow_sql_threshold}}},
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
            all_times = []
        
        # 获取慢SQL的总行数
        row_pipeline = [
            {"$match": {"execution_time_ms": {"$gt": slow_sql_threshold}}},
            {"$group": {"_id": None, "total_rows": {"$sum": "$row_count"}}}
        ]
        row_results = await collection.aggregate(row_pipeline).to_list(None)
        total_rows = row_results[0]["total_rows"] if row_results else 0
        
        # 获取慢SQL的状态统计
        status_pipeline = [
            {"$match": {"execution_time_ms": {"$gt": slow_sql_threshold}}},
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
        
        # 获取执行时间分布（只针对慢SQL）
        execution_time_distribution = AnalysisService._get_time_distribution(all_times)
        
        # 获取FROM表数量和node节点数量的统计
        from_table_stats = await AnalysisService._get_from_table_stats(collection, slow_sql_query)
        plan_node_stats = await AnalysisService._get_plan_node_stats(collection, slow_sql_query)
        
        result = StatisticsSummary(
            total_plans=slow_sql_count,  # 使用慢SQL数量作为总计划数
            success_count=success_count,
            error_count=error_count,
            avg_execution_time=avg_time,
            max_execution_time=max_time,
            min_execution_time=min_time,
            p95_execution_time=p95_time,
            p99_execution_time=p99_time,
            total_rows=total_rows,
            slow_sql_count=slow_sql_count,
            execution_time_distribution=execution_time_distribution,
            from_table_distribution=from_table_stats["distribution"],
            plan_node_distribution=plan_node_stats["distribution"],
            avg_from_tables=from_table_stats["avg"],
            avg_plan_nodes=plan_node_stats["avg"],
            max_from_tables=from_table_stats["max"],
            max_plan_nodes=from_table_stats["max"]
        )
        
        # 缓存结果
        AnalysisService._stats_cache[cache_key] = {
            'data': result,
            'timestamp': time.time()
        }
        
        return result
    
    @staticmethod
    async def _get_from_table_stats(collection, query: dict) -> Dict[str, Any]:
        """获取FROM表数量统计 - 直接读取数据库中的table_count字段"""
        try:
            # 直接从数据库读取table_count字段，不进行复杂的SQL解析
            cursor = collection.find(query, {"table_count": 1})
            docs = await cursor.to_list(None)
            
            if not docs:
                return {
                    "distribution": [],
                    "avg": 0,
                    "max": 0
                }
            
            from_table_counts = []
            
            # 直接读取table_count字段
            for doc in docs:
                table_count = doc.get("table_count", 0)
                from_table_counts.append(table_count)
            
            if not from_table_counts:
                return {
                    "distribution": [],
                    "avg": 0,
                    "max": 0
                }
            
            # 计算统计信息
            avg_from_tables = sum(from_table_counts) / len(from_table_counts)
            max_from_tables = max(from_table_counts)
            
            # 生成分布数据
            distribution = []
            for i in range(1, min(max_from_tables + 1, 21)):  # 最多显示20个区间
                count = from_table_counts.count(i)
                distribution.append({
                    "range": str(i),
                    "count": count
                })
            
            return {
                "distribution": distribution,
                "avg": avg_from_tables,
                "max": max_from_tables
            }
        except Exception as e:
            # 如果字段不存在或其他错误，返回默认统计
            print(f"获取FROM表数量统计失败: {e}")
            return {
                "distribution": [],
                "avg": 0,
                "max": 0
            }
    
    @staticmethod
    async def _get_plan_node_stats(collection, query: dict) -> Dict[str, Any]:
        """获取计划节点数量统计 - 直接读取数据库中的sql_plan_metrics.nodes字段"""
        try:
            # 直接从数据库读取sql_plan_metrics字段
            cursor = collection.find(query, {"sql_plan_metrics": 1})
            docs = await cursor.to_list(None)
            
            if not docs:
                return {
                    "distribution": [],
                    "avg": 0,
                    "max": 0
                }
            
            plan_node_counts = []
            
            # 直接读取sql_plan_metrics.nodes字段
            for doc in docs:
                sql_plan_metrics = doc.get("sql_plan_metrics", {})
                if isinstance(sql_plan_metrics, dict) and "nodes" in sql_plan_metrics:
                    nodes = sql_plan_metrics["nodes"]
                    if isinstance(nodes, list):
                        node_count = len(nodes)
                    else:
                        node_count = 0
                else:
                    node_count = 0
                plan_node_counts.append(node_count)
            
            if not plan_node_counts:
                return {
                    "distribution": [],
                    "avg": 0,
                    "max": 0
                }
            
            # 计算统计信息
            avg_plan_nodes = sum(plan_node_counts) / len(plan_node_counts)
            max_plan_nodes = max(plan_node_counts)
            
            # 生成分布数据
            distribution = []
            for i in range(1, min(max_plan_nodes + 1, 21)):  # 最多显示20个区间
                count = plan_node_counts.count(i)
                distribution.append({
                    "range": str(i),
                    "count": count
                })
            
            return {
                "distribution": distribution,
                "avg": avg_plan_nodes,
                "max": max_plan_nodes
            }
        except Exception as e:
            # 如果字段不存在或其他错误，返回默认统计
            print(f"获取计划节点数量统计失败: {e}")
            return {
                "distribution": [],
                "avg": 0,
                "max": 0
            }

    @staticmethod
    def _count_from_tables(sql_content: str) -> int:
        """从SQL语句中计算FROM表的数量"""
        if not sql_content:
            return 0
        
        try:
            import re
            # 去除注释
            sql_clean = re.sub(r'--.*', '', sql_content, flags=re.MULTILINE)
            sql_clean = re.sub(r'/\*.*?\*/', '', sql_clean, flags=re.DOTALL)
            
            # 查找FROM子句
            from_matches = list(re.finditer(r'\bFROM\b', sql_clean, re.IGNORECASE))
            
            table_count = 0
            for match in from_matches:
                # 获取FROM之后的内容，直到WHERE、GROUP BY、ORDER BY、LIMIT、UNION等
                from_pos = match.end()
                remaining_sql = sql_clean[from_pos:].strip()
                
                # 找到下一个关键词的位置
                next_keywords = ['WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'UNION', 'HAVING', 'WITH', 'JOIN']
                end_pos = len(remaining_sql)
                
                for keyword in next_keywords:
                    keyword_match = re.search(r'\b' + keyword + r'\b', remaining_sql, re.IGNORECASE)
                    if keyword_match:
                        end_pos = min(end_pos, keyword_match.start())
                
                # 提取FROM之后的内容
                from_clause = remaining_sql[:end_pos].strip()
                
                # 简单的表名计数（这只是一个近似算法）
                # 将逗号分隔的表名和JOIN后的表名都计算在内
                tables = re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\s*(?:as\s+)?[A-Za-z_][A-Za-z0-9_]*\s*(?:,|\b(?:LEFT|RIGHT|INNER|OUTER)?\s*JOIN\b|\b(?:WHERE|GROUP|ORDER|LIMIT|UNION|HAVING|WITH)\b)', from_clause, re.IGNORECASE)
                table_count += len(tables)
            
            return max(table_count, 0)
        except Exception as e:
            print(f"计算FROM表数量失败: {e}")
            return 0
    
    @staticmethod
    def _count_plan_nodes(data: List[Dict[str, Any]]) -> int:
        """从执行计划数据中统计节点数量"""
        if not data:
            return 0
        
        try:
            # 递归计算所有节点
            def count_nodes_recursive(node):
                if isinstance(node, dict):
                    count = 1  # 当前节点
                    for value in node.values():
                        if isinstance(value, (dict, list)):
                            count += count_nodes_recursive(value)
                    return count
                elif isinstance(node, list):
                    total = 0
                    for item in node:
                        total += count_nodes_recursive(item)
                    return total
                else:
                    return 0
            
            total_nodes = 0
            for item in data:
                total_nodes += count_nodes_recursive(item)
            
            return total_nodes
        except Exception as e:
            print(f"计算计划节点数量失败: {e}")
            return 0

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
        db: 'AsyncIOMotorDatabase',
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
        
        # 转换_id为字符串并处理复杂度信息
        for record in records:
            record["_id"] = str(record["_id"])
            # 处理复杂度信息
            record = AnalysisService.process_record_complexity(record)
        
        return {
            "items": records,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    
    @staticmethod
    async def get_record_detail(db: AsyncIOMotorDatabase, collection_name: str, record_id: str) -> 'Optional[Dict[str, Any]]':
        """获取记录详情"""
        from bson.objectid import ObjectId
        
        try:
            record = await db[collection_name].find_one({"_id": ObjectId(record_id)})
            if record:
                record["_id"] = str(record["_id"])
            return record
        except Exception:
            return None

    @staticmethod
    async def get_slow_sql_list(db: AsyncIOMotorDatabase, collection_name: str, slow_sql_threshold: float, limit: int = 50) -> 'Dict[str, Any]':
        """获取慢SQL列表数据（用于趋势图表）"""
        collection = db[collection_name]
        
        # 获取慢SQL记录，按执行时间降序排列
        slow_sql_query = {"execution_time_ms": {"$gt": slow_sql_threshold}}
        cursor = collection.find(slow_sql_query).sort("execution_time_ms", -1).limit(limit)
        slow_sql_records = await cursor.to_list(length=limit)
        
        # 转换_id为字符串
        for record in slow_sql_records:
            record["_id"] = str(record["_id"])
        
        # 提取图表需要的数据
        chart_data = []
        for record in slow_sql_records:
            # 简化文件名显示，只显示最后一部分
            file_name = record.get("file_name", "Unknown")
            if len(file_name) > 20:
                display_name = "..." + file_name[-17:]
            else:
                display_name = file_name
                
            chart_data.append({
                "file_name": display_name,
                "execution_time": record.get("execution_time_ms", 0),
                "timestamp": record.get("timestamp", 0),
                "original_name": file_name  # 保存原始文件名
            })
        
        return {
            "data": chart_data,
            "total": len(chart_data),
            "threshold": slow_sql_threshold
        }
    
    @staticmethod
    async def get_sql_script_names_by_range(
        db: 'AsyncIOMotorDatabase',
        collection_name: str,
        range_type: str,  # 'execution_time', 'from_table', 'plan_node'
        range_value: str,
        slow_sql_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """获取指定范围内的SQL脚本名称列表"""
        collection = db[collection_name]
        
        # 构建查询条件
        query = {}
        if slow_sql_threshold:
            query["execution_time_ms"] = {"$gt": slow_sql_threshold}
        
        # 根据range_type添加不同的筛选条件
        if range_type == "execution_time":
            # 解析执行时间范围
            if "-" in range_value:
                start, end = range_value.split("-")
                start_time = float(start)
                end_time = float(end)
                query["execution_time_ms"] = {
                    "$gte": start_time,
                    "$lte": end_time
                }
        elif range_type == "from_table":
            # 筛选FROM表数量
            table_count = int(range_value)
            query["table_count"] = table_count
        elif range_type == "plan_node":
            # 筛选计划节点数量
            node_count = int(range_value)
            query["sql_plan_metrics.nodes"] = {"$exists": True}
            # 这里需要额外处理，因为MongoDB不能直接查询数组长度
        
        # 获取匹配的文档
        cursor = collection.find(query, {"file_name": 1, "sql_content": 1}).limit(10)
        docs = await cursor.to_list(None)
        
        script_names = []
        for doc in docs:
            file_name = doc.get("file_name", "Unknown")
            sql_content = doc.get("sql_content", "")
            # 简化SQL内容显示，取前50个字符
            sql_preview = sql_content[:50] + "..." if len(sql_content) > 50 else sql_content
            script_names.append({
                "file_name": file_name,
                "sql_preview": sql_preview
            })
        
        return {
            "scripts": script_names,
            "total": len(script_names)
        }