// MongoDB 初始化脚本
// 用于创建示例数据和索引

// 切换到sql_results数据库
db = db.getSiblingDB('sql_results');

// 创建示例集合和文档
db.createCollection('sample_execution_plans');

// 插入示例SQL执行记录
db.sample_execution_plans.insertMany([
  {
    file_name: "query_1.sql",
    file_path: "/data/queries/query_1.sql",
    execution_time: 1640995200.0,
    status: "success",
    data: [
      {
        "QUERY PLAN": "{\"Plan\": {\"Node Type\": \"Seq Scan\", \"Relation Name\": \"users\", \"Alias\": \"u\", \"Startup Cost\": 0.00, \"Total Cost\": 23.40, \"Plan Rows\": 1000, \"Plan Width\": 104, \"Actual Startup Time\": 0.123, \"Actual Total Time\": 45.678, \"Actual Rows\": 1000, \"Actual Loops\": 1, \"Shared Hit Blocks\": 100, \"Shared Read Blocks\": 50}}"
      }
    ],
    error: null,
    row_count: 1000,
    execution_time_ms: 45.678,
    timestamp: 1640995200.0,
    save_time: "2022-01-01 08:00:00",
    sql_content: "SELECT * FROM users WHERE age > 25 ORDER BY name;"
  },
  {
    file_name: "query_2.sql",
    file_path: "/data/queries/query_2.sql",
    execution_time: 1640995260.0,
    status: "success",
    data: [
      {
        "QUERY PLAN": "{\"Plan\": {\"Node Type\": \"Hash Join\", \"Join Type\": \"Inner\", \"Startup Cost\": 100.50, \"Total Cost\": 200.75, \"Plan Rows\": 500, \"Plan Width\": 200, \"Actual Startup Time\": 15.432, \"Actual Total Time\": 78.901, \"Actual Rows\": 500, \"Actual Loops\": 1, \"Shared Hit Blocks\": 200, \"Shared Read Blocks\": 100, \"Plans\": [{\"Node Type\": \"Seq Scan\", \"Relation Name\": \"orders\", \"Alias\": \"o\", \"Actual Startup Time\": 5.123, \"Actual Total Time\": 25.456, \"Actual Rows\": 1000, \"Actual Loops\": 1}, {\"Node Type\": \"Index Scan\", \"Relation Name\": \"customers\", \"Alias\": \"c\", \"Index Name\": \"idx_customer_id\", \"Actual Startup Time\": 10.309, \"Actual Total Time\": 53.445, \"Actual Rows\": 500, \"Actual Loops\": 1}]}}"
      }
    ],
    error: null,
    row_count: 500,
    execution_time_ms: 78.901,
    timestamp: 1640995260.0,
    save_time: "2022-01-01 08:01:00",
    sql_content: "SELECT c.name, o.total FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.total > 100;"
  },
  {
    file_name: "query_3.sql",
    file_path: "/data/queries/query_3.sql",
    execution_time: 1640995320.0,
    status: "error",
    data: [
      {
        "QUERY PLAN": "{\"Plan\": {\"Node Type\": \"Nested Loop\", \"Join Type\": \"Left\", \"Startup Cost\": 0.00, \"Total Cost\": 150.25, \"Plan Rows\": 2000, \"Plan Width\": 150, \"Actual Startup Time\": 0.001, \"Actual Total Time\": 123.456, \"Actual Rows\": 0, \"Actual Loops\": 1}}"
      }
    ],
    error: "relation 'nonexistent_table' does not exist",
    row_count: 0,
    execution_time_ms: 123.456,
    timestamp: 1640995320.0,
    save_time: "2022-01-01 08:02:00",
    sql_content: "SELECT * FROM users u LEFT JOIN nonexistent_table nt ON u.id = nt.user_id;"
  }
]);

// 创建索引以提高查询性能
db.sample_execution_plans.createIndex({ "file_name": 1 });
db.sample_execution_plans.createIndex({ "status": 1 });
db.sample_execution_plans.createIndex({ "execution_time_ms": 1 });
db.sample_execution_plans.createIndex({ "timestamp": -1 });
db.sample_execution_plans.createIndex({ "sql_content": "text" });

print("示例数据初始化完成！");
print("集合名称: sample_execution_plans");
print("文档数量: " + db.sample_execution_plans.countDocuments());