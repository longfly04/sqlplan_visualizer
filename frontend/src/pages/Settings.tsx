import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  InputNumber,
  Select,
  Alert,
  Divider,
  message,
  Row,
  Col,
} from 'antd';
import { SettingOutlined, DatabaseOutlined, ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { apiService } from '@/services/api';
import type { Settings, ConnectionTest } from '@/types';

const { Title } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionTest | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    const formValues = form.getFieldsValue();
    
    if (!formValues.mongodb_url) {
      message.error('请输入MongoDB连接地址');
      return;
    }

    const settings: Settings = {
      mongodb_url: formValues.mongodb_url,
      database_name: formValues.database_name || 'sql_results',
      slow_sql_threshold: formValues.slow_sql_threshold || 100,
      default_collection: formValues.default_collection,
      page_size: formValues.page_size || 20,
    };

    setTestingConnection(true);
    try {
      const result = await apiService.testConnection(settings);
      setConnectionResult(result);
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error(`连接测试失败: ${result.message}`);
      }
    } catch (err) {
      const errorResult: ConnectionTest = {
        success: false,
        message: '连接测试异常'
      };
      setConnectionResult(errorResult);
      message.error('连接测试异常');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = () => {
    const formValues = form.getFieldsValue();
    
    // 这里应该保存到本地存储或发送到后端
    message.success('设置已保存');
    
    // 示例：保存到localStorage
    localStorage.setItem('sql_plan_visualizer_settings', JSON.stringify(formValues));
  };

  const handleLoadSettings = () => {
    try {
      const saved = localStorage.getItem('sql_plan_visualizer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        form.setFieldsValue(settings);
        message.success('已加载保存的设置');
      } else {
        message.info('没有找到保存的设置');
      }
    } catch (err) {
      message.error('加载设置失败');
    }
  };

  const handleResetSettings = () => {
    form.resetFields();
    setConnectionResult(null);
    message.success('设置已重置');
  };

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          设置
        </Title>
        <p style={{ color: '#A1A1AA', marginTop: '8px' }}>
          配置MongoDB连接和应用参数
        </p>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* 数据库配置 */}
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                数据库配置
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                mongodb_url: 'mongodb://localhost:27017',
                database_name: 'sql_results',
                slow_sql_threshold: 100,
                page_size: 20,
              }}
            >
              <Form.Item
                label="MongoDB连接地址"
                name="mongodb_url"
                rules={[
                  { required: true, message: '请输入MongoDB连接地址' },
                  { pattern: /^mongodb:\/\//, message: '请输入有效的MongoDB连接地址' }
                ]}
              >
                <Input placeholder="mongodb://localhost:27017" />
              </Form.Item>

              <Form.Item
                label="数据库名称"
                name="database_name"
                rules={[
                  { required: true, message: '请输入数据库名称' }
                ]}
              >
                <Input placeholder="sql_results" />
              </Form.Item>

              <Form.Item
                label="默认集合"
                name="default_collection"
              >
                <Input placeholder="留空则显示所有集合" />
              </Form.Item>

              <Divider />

              {/* 应用配置 */}
              <Title level={4}>
                <Space>
                  <ThunderboltOutlined />
                  应用配置
                </Space>
              </Title>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="慢SQL阈值 (ms)"
                    name="slow_sql_threshold"
                    rules={[
                      { required: true, message: '请输入慢SQL阈值' },
                      { type: 'number', min: 0, message: '阈值必须大于0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="100"
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="默认分页大小"
                    name="page_size"
                    rules={[
                      { required: true, message: '请输入分页大小' },
                      { type: 'number', min: 1, max: 100, message: '分页大小必须在1-100之间' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="20"
                      min={1}
                      max={100}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleSaveSettings}
                  >
                    保存设置
                  </Button>
                  <Button onClick={handleLoadSettings}>
                    加载保存的设置
                  </Button>
                  <Button onClick={handleResetSettings}>
                    重置设置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 连接测试 */}
          <Card 
            title={
              <Space>
                <SettingOutlined />
                连接测试
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <p style={{ color: '#A1A1AA', marginBottom: '16px' }}>
              测试MongoDB连接是否正常
            </p>

            {connectionResult && (
              <Alert
                message={connectionResult.success ? '连接成功' : '连接失败'}
                description={connectionResult.message}
                type={connectionResult.success ? 'success' : 'error'}
                icon={connectionResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                style={{ marginBottom: '16px' }}
              />
            )}

            <Button
              type="primary"
              block
              loading={testingConnection}
              onClick={handleTestConnection}
              icon={<DatabaseOutlined />}
            >
              测试连接
            </Button>
          </Card>

          {/* 使用说明 */}
          <Card title="使用说明">
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#A1A1AA' }}>
              <h4 style={{ color: '#E4E4E7', marginBottom: '8px' }}>MongoDB连接格式：</h4>
              <p style={{ marginBottom: '12px' }}>
                • 本地连接：mongodb://localhost:27017<br/>
                • 带认证：mongodb://username:password@localhost:27017<br/>
                • 远程连接：mongodb://server:port
              </p>

              <h4 style={{ color: '#E4E4E7', marginBottom: '8px' }}>数据集合：</h4>
              <p style={{ marginBottom: '12px' }}>
                系统会自动列出数据库中的所有集合，您可以选择要分析的数据集合。
              </p>

              <h4 style={{ color: '#E4E4E7', marginBottom: '8px' }}>慢SQL阈值：</h4>
              <p>
                用于统计和标识执行时间超过此阈值的SQL查询，单位为毫秒。
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;