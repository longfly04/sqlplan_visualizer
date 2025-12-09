import motor.motor_asyncio
import os
from typing import Optional

class DatabaseConfig:
    def __init__(self):
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.database_name = os.getenv("DATABASE_NAME", "sql_results")
        
    def get_client(self):
        """获取MongoDB异步客户端"""
        return motor.motor_asyncio.AsyncIOMotorClient(self.mongodb_url)
    
    def get_database(self, client=None):
        """获取数据库实例"""
        if client is None:
            client = self.get_client()
        return client[self.database_name]
    
    async def test_connection(self) -> bool:
        """测试数据库连接"""
        try:
            client = self.get_client()
            await client.admin.command('ping')
            return True
        except Exception:
            return False

# 全局数据库配置实例
db_config = DatabaseConfig()