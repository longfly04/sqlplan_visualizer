import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Spin,
  Alert,
  Typography,
  Space,
} from 'antd';
import {
  DatabaseOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TableOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { apiService } from '@/services/api';
import type { CollectionList, StatisticsSummary } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const [collections, setCollections] = useState<CollectionList | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [stats, setStats] = useState<StatisticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  // 加载统计信息
  useEffect(() => {
    if (selectedCollection) {
      const loadStats = async () => {
        setLoading(true);
        setError('');
        try {
          const data = await apiService.getStatsSummary(selectedCollection);
          setStats(data);
        } catch (err) {
          setError('加载统计信息失败');
        } finally {
          setLoading(false);
        }
      };
      loadStats();
    }
  }, [selectedCollection]);

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value);
  };

  // 执行时间分布图表配置
  const getDistributionChartOption = () => {
    if (!stats?.execution_time_distribution) return {};

    const data = stats.execution_time_distribution.map(item => [
      item.start,
      item.count
    ]);

    return {
      title: {
        text: '执行时间分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `时间范围: ${data.name}<br/>数量: ${data.value[1]}`;
        },
      },
      xAxis: {
        type: 'value',
        name: '执行时间 (ms)',
        nameLocation: 'middle',
        nameGap: 30,
      },
      yAxis: {
        type: 'value',
        name: '查询数量',
        nameLocation: 'middle',
        nameGap: 50,
      },
      series: [
        {
          type: 'bar',
          data: data,
          itemStyle: {
            color: '#388BFF',
          },
        },
      ],
    };
  };

  // 执行状态饼图配置
  const getStatusChartOption = () => {
    if (!stats) return {};

    const data = [
      { value: stats.success_count, name: '成功', itemStyle: { color: '#34D399' } },
      { value: stats.error_count, name: '失败', itemStyle: { color: '#F87171' } },
    ];

    return {
      title: {
        text: '执行状态分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      series: [
        {
          name: '执行状态',
          type: 'pie',
          radius: '50%',
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          仪表板
        </Title>
        <p style={{ color: '#A1A1AA', marginTop: '8px' }}>
          SQL查询执行计划统计概览
        </p>
      </div>

      {/* 集合选择器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      ) : stats ? (
        <>
          {/* 关键指标卡片 */}
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总查询计划数"
                  value={stats.total_plans}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#388BFF' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="平均执行时间"
                  value={stats.avg_execution_time.toFixed(2)}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#34D399' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="慢SQL数量"
                  value={stats.slow_sql_count}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#FBBF24' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总返回行数"
                  value={stats.total_rows}
                  prefix={<TableOutlined />}
                  valueStyle={{ color: '#8B5CF6' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 图表区域 */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="执行时间分布">
                <ReactECharts
                  option={getDistributionChartOption()}
                  style={{ height: '300px' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="执行状态分布">
                <ReactECharts
                  option={getStatusChartOption()}
                  style={{ height: '300px' }}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', color: '#A1A1AA' }}>
          请选择一个数据集合来查看统计信息
        </div>
      )}
    </div>
  );
};

export default Dashboard;