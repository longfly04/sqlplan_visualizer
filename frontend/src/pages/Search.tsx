import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Form,
  Row,
  Col,
  Tag,
  DatePicker,
  Alert,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiService } from '@/services/api';
import type { CollectionList, SQLExecutionRecord, SearchFilters } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const Search: React.FC = () => {
  const [collections, setCollections] = useState<CollectionList | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [plans, setPlans] = useState<SQLExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();

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

  // 加载搜索结果
  useEffect(() => {
    if (selectedCollection) {
      handleSearch();
    }
  }, [selectedCollection, currentPage]);

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value);
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    if (!selectedCollection) return;

    setLoading(true);
    setError('');

    try {
      const formValues = form.getFieldsValue();
      const filters: SearchFilters = {};

      if (formValues.q) filters.q = formValues.q;
      if (formValues.status) filters.status = formValues.status;
      if (formValues.minExecutionTime) filters.min_execution_time = formValues.minExecutionTime;
      if (formValues.maxExecutionTime) filters.max_execution_time = formValues.maxExecutionTime;
      if (formValues.fileName) filters.file_name = formValues.fileName;

      const data = await apiService.searchPlans(
        selectedCollection,
        filters,
        currentPage,
        pageSize
      );
      
      setPlans(data.items);
      setTotal(data.total);
    } catch (err) {
      setError('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    setTimeout(() => handleSearch(), 0);
  };

  const columns = [
    {
      title: 'SQL内容',
      dataIndex: 'sql_content',
      key: 'sql_content',
      width: '35%',
      render: (text: string) => (
        <div style={{ 
          maxWidth: '350px', 
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
      width: '12%',
      render: (time: number) => `${time.toFixed(2)}ms`,
      sorter: (a: SQLExecutionRecord, b: SQLExecutionRecord) => 
        a.execution_time_ms - b.execution_time_ms,
    },
    {
      title: '返回行数',
      dataIndex: 'row_count',
      key: 'row_count',
      width: '12%',
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
    {
      title: '执行时间',
      dataIndex: 'save_time',
      key: 'save_time',
      width: '15%',
      render: (time: string) => time || 'N/A',
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          搜索
        </Title>
        <p style={{ color: '#A1A1AA', marginTop: '8px' }}>
          全文检索和高级筛选SQL执行计划
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

      {/* 搜索表单 */}
      <Card title="搜索条件" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ width: '100%' }}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="q" style={{ width: '100%' }}>
                <Input
                  placeholder="搜索SQL内容或文件名"
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" style={{ width: '100%' }}>
                <Select placeholder="执行状态" allowClear>
                  <Option value="success">成功</Option>
                  <Option value="error">失败</Option>
                  <Option value="unknown">未知</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="fileName" style={{ width: '100%' }}>
                <Input placeholder="文件名筛选" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="minExecutionTime" style={{ width: '100%' }}>
                <Input placeholder="最小执行时间(ms)" type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="maxExecutionTime" style={{ width: '100%' }}>
                <Input placeholder="最大执行时间(ms)" type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={18}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    搜索
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 搜索结果 */}
      <Card>
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </Card>
    </div>
  );
};

export default Search;