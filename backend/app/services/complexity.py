"""复杂度计算服务"""
from typing import Optional, Dict, Any
from enum import Enum
from app.schemas import ComplexityLevel

class ComplexityService:
    """复杂度计算和转换服务"""
    
    @staticmethod
    def get_complexity_from_database(record: Dict[str, Any]) -> Optional[float]:
        """从数据库记录中获取复杂度数值"""
        print(f"[DEBUG] 正在检查记录字段，key数量: {len(record.keys())}")
        
        # 优先从 enhanced_complexity_analysis 中获取真实的total_complexity
        enhanced_analysis = record.get('enhanced_complexity_analysis')
        print(f"[DEBUG] enhanced_complexity_analysis字段: {enhanced_analysis}")
        if enhanced_analysis and isinstance(enhanced_analysis, dict):
            print(f"[DEBUG] enhanced_analysis字段: {list(enhanced_analysis.keys())}")
            
            # 优先获取total_complexity_score（真实的复杂度数值）
            total_complexity = enhanced_analysis.get('total_complexity_score')
            print(f"[DEBUG] total_complexity_score: {total_complexity}")
            if total_complexity is not None:
                try:
                    result = float(total_complexity)
                    print(f"[DEBUG] 从total_complexity_score获取到真实复杂度: {result}")
                    return result
                except (ValueError, TypeError) as e:
                    print(f"[DEBUG] 无法转换total_complexity_score为数值: {e}")
            
            # 备选：尝试complexity_score
            complexity_score = enhanced_analysis.get('complexity_score')
            print(f"[DEBUG] complexity_score: {complexity_score}")
            if complexity_score is not None:
                try:
                    result = float(complexity_score)
                    print(f"[DEBUG] 从complexity_score获取到复杂度: {result}")
                    return result
                except (ValueError, TypeError) as e:
                    print(f"[DEBUG] 无法转换complexity_score为数值: {e}")
        
        # 备选：使用actual_processing_complexity字段
        complexity = record.get('actual_processing_complexity')
        print(f"[DEBUG] actual_processing_complexity字段: {complexity} (类型: {type(complexity)})")
        
        if complexity is not None:
            # 如果是字符串，可能是复杂度等级，需要转换为数值
            if isinstance(complexity, str):
                print(f"[DEBUG] actual_processing_complexity是字符串，尝试解析为复杂度等级")
                level_mapping = {
                    'LOW': 15,        # 低复杂度等级对应15
                    'MEDIUM': 50,     # 中等复杂度等级对应50
                    'HIGH': 95,       # 高复杂度等级对应95
                    'VERY_HIGH': 160, # 非常高复杂度等级对应160
                    'EXTREME': 250    # 极高复杂度等级对应250
                }
                if complexity in level_mapping:
                    result = level_mapping[complexity]
                    print(f"[DEBUG] 从复杂度等级 '{complexity}' 转换为数值: {result}")
                    return result
                else:
                    print(f"[DEBUG] 未知的复杂度等级: {complexity}")
                    return None
            else:
                # 如果是数值，直接转换
                try:
                    result = float(complexity)
                    print(f"[DEBUG] 从actual_processing_complexity获取到数值复杂度: {result}")
                    return result
                except (ValueError, TypeError) as e:
                    print(f"[DEBUG] 无法转换actual_processing_complexity为数值: {e}")
                    return None
        
        print(f"[DEBUG] 数据库中未找到可用的复杂度数值，返回None")
        return None
    
    @staticmethod
    def calculate_complexity_from_record(record: Dict[str, Any]) -> float:
        """基于记录数据计算复杂度数值（备用方案）"""
        try:
            # 首先尝试从数据库获取
            db_complexity = ComplexityService.get_complexity_from_database(record)
            if db_complexity is not None:
                return db_complexity
            
            # 如果数据库中没有，则基于现有指标计算
            execution_time = record.get('execution_time_ms', 0)
            table_count = record.get('table_count', 0)
            row_count = record.get('row_count', 0)
            
            # 复杂度计算公式（可以调整权重）
            complexity = (
                execution_time * 0.1 +  # 执行时间权重
                table_count * 10 +      # 表数量权重
                (row_count / 1000) * 0.5  # 行数量权重
            )
            
            return max(complexity, 1.0)  # 最小复杂度为1
        except Exception as e:
            print(f"计算复杂度失败: {e}")
            return 1.0
    
    @staticmethod
    def calculate_complexity_level(total_complexity: Optional[float]) -> Optional[ComplexityLevel]:
        """根据复杂度数值计算复杂度等级"""
        if total_complexity is None:
            return None
            
        if total_complexity <= 50:
            return ComplexityLevel.LOW
        elif total_complexity <= 100:
            return ComplexityLevel.MEDIUM
        elif total_complexity <= 200:
            return ComplexityLevel.HIGH
        elif total_complexity <= 400:
            return ComplexityLevel.VERY_HIGH
        else:
            return ComplexityLevel.EXTREME
    
    @staticmethod
    def calculate_complexity_from_record_level(record: Dict[str, Any]) -> Optional[ComplexityLevel]:
        """直接根据记录数据计算复杂度等级"""
        complexity_value = ComplexityService.calculate_complexity_from_record(record)
        return ComplexityService.calculate_complexity_level(complexity_value)
    
    @staticmethod
    def get_complexity_color(complexity_level: Optional[ComplexityLevel]) -> str:
        """根据复杂度等级获取对应的颜色"""
        if complexity_level is None:
            return '#909399'  # 默认灰色
            
        color_map = {
            ComplexityLevel.LOW: '#67C23A',      # 绿色
            ComplexityLevel.MEDIUM: '#E6A23C',   # 橙色
            ComplexityLevel.HIGH: '#F56C6C',     # 红色
            ComplexityLevel.VERY_HIGH: '#9C27B0', # 紫色
            ComplexityLevel.EXTREME: '#000000'   # 黑色
        }
        
        return color_map.get(complexity_level, '#909399')
    
    @staticmethod
    def get_complexity_display_text(complexity_level: Optional[ComplexityLevel]) -> str:
        """获取复杂度等级的中文显示文本"""
        if complexity_level is None:
            return '未知'
            
        text_map = {
            ComplexityLevel.LOW: '低',
            ComplexityLevel.MEDIUM: '中',
            ComplexityLevel.HIGH: '高',
            ComplexityLevel.VERY_HIGH: '非常高',
            ComplexityLevel.EXTREME: '极高'
        }
        
        return text_map.get(complexity_level, '未知')