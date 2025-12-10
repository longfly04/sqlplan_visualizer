import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Typography,
  Modal,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  message,
} from 'antd';
import { BarChartOutlined, CompassOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { apiService } from '@/services/api';
import type { CollectionList, SQLExecutionRecord, ComparisonData } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const DataAnalysis: React.FC = () => {
  const [collections, setCollections] = useState<CollectionList | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [plans, setPlans] = useState<SQLExecutionRecord[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState<'all' | 'success' | 'error'>('all');

  // 加载集合列表
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await apiService.getCollections();
        setCollections(data);
        if (data.collections.length > 0) {
          setSelectedCollection(data.collections[0]);
        }
      } catch (err) {
        setError('加载集合列表失败');
      }
    };
    loadCollections();
  }, []);

  // 加载计划列表
  useEffect(() => {
    if (selectedCollection) {
      loadPlans();
    }
  }, [selectedCollection, currentPage, searchQuery, searchStatus]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('正在加载计划列表，集合:', selectedCollection, '搜索:', searchQuery, '状态:', searchStatus);
      
      let data;
      if (searchQuery || searchStatus !== 'all') {
        // 使用搜索API
        const filters: any = {};
        if (searchQuery) {
          filters.q = searchQuery;
        }
        if (searchStatus !== 'all') {
          filters.status = searchStatus;
        }
        data = await apiService.searchPlans(selectedCollection, filters, currentPage, pageSize);
      } else {
        // 使用普通获取API
        data = await apiService.getPlans(selectedCollection, currentPage, pageSize);
      }
      
      console.log('计划列表加载成功:', data);
      setPlans(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('加载计划列表失败:', err);
      setError(`加载计划列表失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  const handleShowSizeChange = (current: number, size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value);
    setCurrentPage(1);
    setSelectedPlans([]);
  };

  const handleSelectPlans = (selectedRowKeys: React.Key[]) => {
    setSelectedPlans(selectedRowKeys as string[]);
  };

  const handleComparePlans = async () => {
    if (selectedPlans.length < 2) {
      message.warning('请至少选择2个计划进行对比');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('正在对比计划，IDs:', selectedPlans, '集合:', selectedCollection);
      console.log('选中的计划详情:', plans.filter(p => selectedPlans.includes(p._id)));
      
      // 验证选中的计划是否存在且状态正确
      const validPlans = plans.filter(p =>
        selectedPlans.includes(p._id) && p.status === 'success'
      );
      
      if (validPlans.length < 2) {
        message.warning('请至少选择2个执行成功的计划进行对比');
        return;
      }
      
      console.log('有效计划数量:', validPlans.length);
      console.log('请求参数详情:', {
        plan_ids: selectedPlans,
        collection: selectedCollection
      });
      
      const data = await apiService.comparePlans(selectedPlans, selectedCollection);
      console.log('对比分析成功:', data);
      setComparisonData(data);
      setModalVisible(true);
    } catch (err: any) {
      console.error('对比分析失败:', err);
      if (err.response) {
        console.error('错误响应状态:', err.response.status);
        console.error('错误响应数据:', err.response.data);
      }
      setError(`对比分析失败: ${err instanceof Error ? err.message : '未知错误'}`);
      message.error('对比分析失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成对比图表配置
  const getComparisonChartOption = () => {
    if (!comparisonData) return {};

    const plans = comparisonData.plans;
    const executionTimes = plans.map(p => p.execution_time_ms);
    const rowCounts = plans.map(p => p.row_count);
    const planNames = plans.map((_, index) => `计划${index + 1}`);

    return {
      title: {
        text: '执行计划对比分析',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['执行时间(ms)', '返回行数'],
        top: 30
      },
      xAxis: {
        type: 'category',
        data: planNames
      },
      yAxis: [
        {
          type: 'value',
          name: '执行时间(ms)',
          position: 'left'
        },
        {
          type: 'value',
          name: '返回行数',
          position: 'right'
        }
      ],
      series: [
        {
          name: '执行时间(ms)',
          type: 'bar',
          data: executionTimes,
          itemStyle: {
            color: '#388BFF'
          }
        },
        {
          name: '返回行数',
          type: 'bar',
          yAxisIndex: 1,
          data: rowCounts,
          itemStyle: {
            color: '#34D399'
          }
        }
      ]
    };
  };

  // 节点分析表格配置
  const getNodeAnalysisColumns = () => {
    return [
      {
        title: '计划ID',
        dataIndex: 'plan_id',
        key: 'plan_id',
        width: '15%',
      },
      {
        title: '节点类型',
        dataIndex: 'node_type',
        key: 'node_type',
        width: '20%',
        render: (nodeType: string) => (
          <Tag color="blue">{nodeType}</Tag>
        ),
      },
      {
        title: '实际时间',
        dataIndex: 'actual_total_time',
        key: 'actual_total_time',
        width: '15%',
        render: (time: number) => time ? `${time.toFixed(2)}ms` : 'N/A',
        sorter: (a: any, b: any) => (a.actual_total_time || 0) - (b.actual_total_time || 0),
      },
      {
        title: '实际行数',
        dataIndex: 'actual_rows',
        key: 'actual_rows',
        width: '15%',
        render: (rows: number) => rows || 'N/A',
        sorter: (a: any, b: any) => (a.actual_rows || 0) - (b.actual_rows || 0),
      },
      {
        title: '循环次数',
        dataIndex: 'loops',
        key: 'loops',
        width: '15%',
        render: (loops: number) => loops || 'N/A',
        sorter: (a: any, b: any) => (a.loops || 0) - (b.loops || 0),
      },
      {
        title: '缓存命中',
        dataIndex: 'shared_hit_blocks',
        key: 'shared_hit_blocks',
        width: '10%',
        render: (blocks: number) => blocks || 'N/A',
      },
      {
        title: '缓存读取',
        dataIndex: 'shared_read_blocks',
        key: 'shared_read_blocks',
        width: '10%',
        render: (blocks: number) => blocks || 'N/A',
      },
    ];
  };

  // 展开所有节点数据用于表格显示
  const getAllNodesForTable = () => {
    if (!comparisonData) return [];
    
    const allNodes: any[] = [];
    comparisonData.plans.forEach(plan => {
      plan.nodes.forEach((node, nodeIndex) => {
        allNodes.push({
          key: `${plan.plan_id}_${nodeIndex}`,
          plan_id: plan.plan_id,
          node_type: node.node_type,
          actual_total_time: node.actual_total_time,
          actual_rows: node.actual_rows,
          loops: node.loops,
          shared_hit_blocks: node.shared_hit_blocks,
          shared_read_blocks: node.shared_read_blocks,
        });
      });
    });
    
    return allNodes;
  };

  const columns = [
    {
      title: 'SQL内容',
      dataIndex: 'sql_content',
      key: 'sql_content',
      width: '40%',
      render: (text: string) => (
        <div style={{ 
          maxWidth: '400px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' 
        }}>
          {text}
        </div>
      ),
    },
    {
      title: '执行时间',
      dataIndex: 'execution_time_ms',
      key: 'execution_time_ms',
      width: '15%',
      render: (time: number) => `${time.toFixed(2)}ms`,
      sorter: (a: SQLExecutionRecord, b: SQLExecutionRecord) => 
        a.execution_time_ms - b.execution_time_ms,
    },
    {
      title: '返回行数',
      dataIndex: 'row_count',
      key: 'row_count',
      width: '15%',
      sorter: (a: SQLExecutionRecord, b: SQLExecutionRecord) => 
        a.row_count - b.row_count,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange'}>
          {status === 'success' ? '成功' : status === 'error' ? '失败' : '未知'}
        </Tag>
      ),
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      width: '15%',
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedPlans,
    onChange: handleSelectPlans,
    getCheckboxProps: (record: SQLExecutionRecord) => ({
      disabled: record.status !== 'success',
    }),
  };

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          数据分析
        </Title>
        <p style={{ color: '#A1A1AA', marginTop: '8px' }}>
          多查询对比分析和节点级深度分析
        </p>
      </div>

      {/* 搜索和集合选择器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ width: '100%', marginBottom: '16px' }}>
            <span>搜索查询:</span>
            <Select
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="输入SQL关键字搜索"
              style={{ width: 200 }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                option?.toLowerCase().includes(input?.toLowerCase())
              }
            >
              <Option value="">全部</Option>
              <Option value="SELECT">SELECT查询</Option>
              <Option value="INSERT">INSERT查询</Option>
              <Option value="UPDATE">UPDATE查询</Option>
              <Option value="DELETE">DELETE查询</Option>
              <Option value="CREATE">CREATE查询</Option>
            </Select>
            
            <Select
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 150, marginLeft: '8px' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="success">成功</Option>
              <Option value="error">失败</Option>
            </Select>
            
            <Button
              type="primary"
              onClick={() => {
                if (selectedCollection) {
                  loadPlans();
                }
              }}
              disabled={!selectedCollection}
            >
              搜索
            </Button>
          </Space>
          
          <Space style={{ width: '100%' }}>
            <span>选择数据集合:</span>
            <Select
              value={selectedCollection}
              onChange={handleCollectionChange}
              style={{ width: 200 }}
              disabled={!collections}
            >
              {collections?.collections.map(collection => (
                <Option key={collection} value={collection}>
                  {collection}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<CompassOutlined />}
              onClick={handleComparePlans}
              disabled={selectedPlans.length < 2}
            >
              对比分析 ({selectedPlans.length})
            </Button>
          </Space>
        </Space>
      </Card>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 计划列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="_id"
          rowSelection={rowSelection}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handlePageChange,
            onShowSizeChange: handleShowSizeChange,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      </Card>

      {/* 对比分析模态框 */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            执行计划对比分析
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1200}
      >
        {comparisonData && (
          <>
            {/* 对比概览 */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="对比计划数"
                    value={comparisonData.comparison_metrics.total_plans}
                    prefix={<CompassOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均执行时间"
                    value={comparisonData.comparison_metrics.avg_execution_time.toFixed(2)}
                    suffix="ms"
                    valueStyle={{ color: '#388BFF' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最大执行时间"
                    value={comparisonData.comparison_metrics.max_execution_time.toFixed(2)}
                    suffix="ms"
                    valueStyle={{ color: '#F87171' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最小执行时间"
                    value={comparisonData.comparison_metrics.min_execution_time.toFixed(2)}
                    suffix="ms"
                    valueStyle={{ color: '#34D399' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 对比图表 */}
            <Card title="执行时间与行数对比" style={{ marginBottom: '24px' }}>
              <ReactECharts
                option={getComparisonChartOption()}
                style={{ height: '400px' }}
              />
            </Card>

            {/* 节点详细对比 */}
            <Card title="节点级详细对比">
              <Table
                columns={getNodeAnalysisColumns()}
                dataSource={getAllNodesForTable()}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 个节点`,
                }}
                scroll={{ x: 1000 }}
              />
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};

export default DataAnalysis;