import json
import re
from typing import List, Dict, Any, Optional, Tuple
from app.schemas import PlanNode, PlanDetail

class PlanParserService:
    """执行计划解析服务"""
    
    @staticmethod
    def extract_query_plan_json(data_list: List[Dict[str, Any]]) -> Optional[str]:
        """从data列表中提取QUERY PLAN的JSON字符串"""
        for item in data_list:
            if isinstance(item, dict) and "QUERY PLAN" in item:
                return item["QUERY PLAN"][0]
        return None
    
    @staticmethod
    def parse_json_string(json_str: str) -> Optional[Dict[str, Any]]:
        """解析JSON字符串，处理可能的格式问题"""
        try:
            # 尝试直接解析
            return json.loads(json_str)
        except json.JSONDecodeError:
            try:
                # 尝试清理JSON字符串
                cleaned = json_str.strip()
                # 移除可能的尾随逗号
                cleaned = re.sub(r',(\s*})', r'\1', cleaned)
                cleaned = re.sub(r',(\s*])', r'\1', cleaned)
                return json.loads(cleaned)
            except json.JSONDecodeError:
                return None
    
    @staticmethod
    def extract_node_info(node_data: Dict[str, Any], parent_id: Optional[str] = None) -> Tuple[PlanNode, str]:
        """从节点数据中提取信息"""
        node_id = f"node_{id(node_data)}"
        
        # 提取基本信息
        node_type = node_data.get("Node Type", "Unknown")
        actual_total_time = node_data.get("Actual Total Time")
        actual_rows = node_data.get("Actual Rows")
        loops = node_data.get("Loops")
        shared_hit_blocks = node_data.get("Shared Hit Blocks")
        shared_read_blocks = node_data.get("Shared Read Blocks")
        
        # 处理嵌套的Plan
        children_plans = []
        if "Plan" in node_data:
            children_plans.append(node_data["Plan"])
        if "Plans" in node_data:
            children_plans.extend(node_data["Plans"])
        
        plan_node = PlanNode(
            node_type=node_type,
            actual_total_time=actual_total_time,
            actual_rows=actual_rows,
            loops=loops,
            shared_hit_blocks=shared_hit_blocks,
            shared_read_blocks=shared_read_blocks,
            parent=parent_id,
            children=[],  # 将在后面填充
            raw_data=node_data
        )
        
        return plan_node, node_id
    
    @staticmethod
    def parse_execution_plan(json_data: Dict[str, Any]) -> List[PlanNode]:
        """解析执行计划JSON，返回节点列表"""
        nodes = []
        node_map = {}
        
        def parse_node(node_data: Dict[str, Any], parent_id: Optional[str] = None):
            if not isinstance(node_data, dict):
                return None
            
            plan_node, node_id = PlanParserService.extract_node_info(node_data, parent_id)
            node_map[node_id] = plan_node
            nodes.append(plan_node)
            
            # 处理子节点
            children_ids = []
            if "Plan" in node_data:
                child_id = parse_node(node_data["Plan"], node_id)
                if child_id:
                    children_ids.append(child_id)
            
            if "Plans" in node_data and isinstance(node_data["Plans"], list):
                for child_plan in node_data["Plans"]:
                    child_id = parse_node(child_plan, node_id)
                    if child_id:
                        children_ids.append(child_id)
            
            # 更新子节点列表
            plan_node.children = children_ids
            return node_id
        
        # 从根节点开始解析
        if "Plan" in json_data:
            parse_node(json_data["Plan"])
        else:
            # 如果没有Plan键，尝试直接解析
            parse_node(json_data)
        
        return nodes
    
    @staticmethod
    def find_root_node(nodes: List[PlanNode]) -> Optional[str]:
        """找到根节点ID"""
        if not nodes:
            return None
        
        # 找到没有父节点的节点作为根节点
        for node in nodes:
            if node.parent is None:
                return f"node_{id(node.raw_data)}"
        
        # 如果所有节点都有父节点，选择第一个作为根节点
        return f"node_{id(nodes[0].raw_data)}" if nodes else None