export interface SQLExecutionRecord {
  _id: string;
  file_name: string;
  file_path: string;
  execution_time: number;
  status: 'success' | 'error' | 'unknown';
  data: any[];
  error?: string;
  row_count: number;
  execution_time_ms: number;
  timestamp: number;
  save_time?: string;
  sql_content: string;
}

export interface CollectionList {
  collections: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StatisticsSummary {
  total_plans: number;
  success_count: number;
  error_count: number;
  avg_execution_time: number;
  max_execution_time: number;
  min_execution_time: number;
  p95_execution_time: number;
  p99_execution_time: number;
  total_rows: number;
  slow_sql_count: number;
  execution_time_distribution: Array<{
    range: string;
    count: number;
    start: number;
    end: number;
  }>;
}

export interface PlanNode {
  node_type: string;
  actual_total_time?: number;
  actual_rows?: number;
  loops?: number;
  shared_hit_blocks?: number;
  shared_read_blocks?: number;
  parent?: string;
  children: string[];
  raw_data: Record<string, any>;
}

export interface PlanDetail {
  plan_id: string;
  sql_content: string;
  execution_time_ms: number;
  status: 'success' | 'error' | 'unknown';
  row_count: number;
  nodes: PlanNode[];
  root_node: string;
  plan_content: string;
}

export interface ComparisonData {
  plans: PlanDetail[];
  comparison_metrics: {
    total_plans: number;
    avg_execution_time: number;
    max_execution_time: number;
    min_execution_time: number;
  };
}

export interface SearchFilters {
  q?: string;
  status?: 'success' | 'error' | 'unknown';
  min_execution_time?: number;
  max_execution_time?: number;
  file_name?: string;
}

export interface Settings {
  mongodb_url: string;
  database_name: string;
  slow_sql_threshold: number;
  default_collection?: string;
  page_size: number;
}

export interface ConnectionTest {
  success: boolean;
  message: string;
}

export interface TreeNode {
  name: string;
  attributes?: Record<string, any>;
  children?: TreeNode[];
}