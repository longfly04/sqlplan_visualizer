import axios from 'axios';
import type {
  CollectionList,
  SQLExecutionRecord,
  PaginatedResponse,
  StatisticsSummary,
  PlanDetail,
  ComparisonData,
  SearchFilters,
  Settings,
  ConnectionTest
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.params || config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data);
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Request Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
);

export const apiService = {
  // 获取集合列表
  getCollections(): Promise<CollectionList> {
    return api.get('/collections');
  },

  // 获取计划列表
  getPlans(
    collection: string,
    page = 1,
    size = 20
  ): Promise<PaginatedResponse<SQLExecutionRecord>> {
    return api.get('/plans', {
      params: { collection, page, size }
    });
  },

  // 获取统计摘要
  getStatsSummary(collection: string): Promise<StatisticsSummary> {
    return api.get('/stats/summary', {
      params: { collection }
    });
  },

  // 获取计划详情
  getPlanDetail(planId: string, collection: string): Promise<PlanDetail> {
    return api.get(`/plans/${planId}/detail`, {
      params: { collection }
    });
  },

  // 对比计划
  comparePlans(planIds: string[], collection: string): Promise<ComparisonData> {
    return api.post('/analysis/compare', {
      plan_ids: planIds,
      collection
    });
  },

  // 搜索计划
  searchPlans(
    collection: string,
    filters: SearchFilters,
    page = 1,
    size = 20
  ): Promise<PaginatedResponse<SQLExecutionRecord>> {
    return api.get('/search', {
      params: {
        collection,
        ...filters,
        page,
        size
      }
    });
  },

  // 测试连接
  testConnection(settings: Settings): Promise<ConnectionTest> {
    return api.post('/settings/test-connection', settings);
  }
};

export default apiService;