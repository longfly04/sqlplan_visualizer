// MongoDB 初始化脚本
db = db.getSiblingDB('sql_results');

// 创建用户
db.createUser({
  user: 'sqluser',
  pwd: 'sqlpassword123',
  roles: [
    {
      role: 'readWrite',
      db: 'sql_results'
    }
  ]
});

// 创建集合索引
db.createCollection('sql_executions');
db.sql_executions.createIndex({ "timestamp": -1 });
db.sql_executions.createIndex({ "execution_time_ms": 1 });
db.sql_executions.createIndex({ "status": 1 });
db.sql_executions.createIndex({ "file_name": "text" });

// 插入示例数据（可选）
db.sql_executions.insertOne({
  _id: ObjectId(),
  file_name: "sample_query.sql",
  file_path: "/sample/queries/",
  execution_time: 0.123,
  execution_time_ms: 123,
  status: "success",
  row_count: 100,
  timestamp: new Date(),
  sql_content: "SELECT * FROM sample_table WHERE id > 100",
  data: []
});

print('MongoDB 初始化完成');