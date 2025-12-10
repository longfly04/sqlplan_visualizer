import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Typography,
  Drawer,
  Descriptions,
  Tag,
  Alert,
} from 'antd';
import { EyeOutlined, BranchesOutlined } from '@ant-design/icons';
import Tree from 'react-d3-tree';
import { apiService } from '@/services/api';
import type { CollectionList, SQLExecutionRecord, PlanDetail, TreeNode } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const PlanVisualizer: React.FC = () => {
  const [collections, setCollections] = useState<CollectionList | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [plans, setPlans] = useState<SQLExecutionRecord[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

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
  }, [selectedCollection, currentPage]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getPlans(selectedCollection, currentPage, pageSize);
      setPlans(data.items);
      setTotal(data.total);
    } catch (err) {
      setError('加载计划列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value);
    setCurrentPage(1);
  };

  const handleViewPlan = async (record: SQLExecutionRecord) => {
    try {
      console.log('正在获取执行计划详情，ID:', record._id, '集合:', selectedCollection);
      const planDetail = await apiService.getPlanDetail(record._id, selectedCollection);
      console.log('执行计划详情获取成功:', planDetail);
      setSelectedPlan(planDetail);
      
      // 转换执行计划为树状图数据
      const treeNodes = convertPlanToTree(planDetail);
      setTreeData(treeNodes);
      
      setDrawerVisible(true);
    } catch (err) {
      console.error('获取执行计划详情失败:', err);
      setError(`获取执行计划详情失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  // 转换执行计划为树状图数据
  const convertPlanToTree = (plan: PlanDetail): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    
    // 创建所有节点
    plan.nodes.forEach(node => {
      const nodeId = `node_${node.raw_data._id || Math.random().toString(36).substr(2, 9)}`;
      const treeNode: TreeNode = {
        name: `${node.node_type}`,
        attributes: {
          '实际时间': node.actual_total_time?.toFixed(2) + 'ms' || 'N/A',
          '实际行数': node.actual_rows?.toString() || 'N/A',
          '循环次数': node.loops?.toString() || 'N/A',
          '缓存命中': node.shared_hit_blocks?.toString() || 'N/A',
          '缓存读取': node.shared_read_blocks?.toString() || 'N/A',
        },
      };
      nodeMap.set(nodeId, treeNode);
    });

    // 建立父子关系
    const treeRoots: TreeNode[] = [];
    plan.nodes.forEach((node, index) => {
      const nodeId = `node_${index}`;
      const treeNode = nodeMap.get(nodeId)!;
      
      if (node.parent) {
        const parentNode = nodeMap.get(node.parent);
        if (parentNode) {
          if (!parentNode.children) parentNode.children = [];
          parentNode.children.push(treeNode);
        }
      } else {
        treeRoots.push(treeNode);
      }
    });

    return treeRoots;
  };

  // 为节点计算颜色
  const getNodeColor = (node: any) => {
    const time = node.attributes?.['实际时间'];
    if (time && time !== 'N/A') {
      const timeMs = parseFloat(time);
      if (timeMs > 100) return '#F87171'; // 红色 - 高耗时
      if (timeMs > 50) return '#FBBF24'; // 黄色 - 中等耗时
      return '#34D399'; // 绿色 - 低耗时
    }
    return '#388BFF'; // 默认蓝色
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
    {
      title: '操作',
      key: 'action',
      width: '5%',
      render: (_: any, record: SQLExecutionRecord) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewPlan(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          执行计划可视化
        </Title>
        <p style={{ color: '#A1A1AA', marginTop: '8px' }}>
          查看和分析SQL查询执行计划
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

      {/* 计划列表 */}
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

      {/* 执行计划详情抽屉 */}
      <Drawer
        title={
          <Space>
            <BranchesOutlined />
            执行计划详情
          </Space>
        }
        placement="right"
        size="large"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedPlan && (
          <>
            {/* 基本信息 */}
            <Card title="基本信息" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="SQL内容">
                  <div style={{ 
                    maxHeight: '100px', 
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    {selectedPlan.sql_content}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="执行时间">
                  <Tag color="blue">{selectedPlan.execution_time_ms.toFixed(2)}ms</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="返回行数">
                  <Tag color="green">{selectedPlan.row_count}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={selectedPlan.status === 'success' ? 'green' : 'red'}>
                    {selectedPlan.status === 'success' ? '成功' : '失败'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 执行计划树状图 */}
            <Card title="执行计划树状图">
              {treeData.length > 0 ? (
                <div style={{ width: '100%', height: '500px', border: '1px solid #E5E7EB' }}>
                  <Tree
                    data={treeData}
                    orientation="vertical"
                    translate={{ x: 400, y: 50 }}
                    separation={{ siblings: 1, nonSiblings: 1.5 }}
                    nodeSize={{ x: 200, y: 100 }}
                    zoom={0.8}
                    enableLegacyTransitions
                    renderCustomNodeElement={(rd3tProps) => {
                      const { nodeDatum, toggleNode } = rd3tProps;
                      const fillColor = getNodeColor(nodeDatum);
                      
                      return (
                        <g>
                          <circle
                            r={12}
                            fill={fillColor}
                            stroke="#fff"
                            strokeWidth={2}
                            onClick={() => toggleNode()}
                            style={{ cursor: 'pointer' }}
                          />
                          <text
                            fill="#18181B"
                            strokeWidth="0"
                            x={0}
                            y={30}
                            textAnchor="middle"
                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                          >
                            {nodeDatum.name}
                          </text>
                          {nodeDatum.attributes && (
                            <text
                              fill="#52525B"
                              strokeWidth="0"
                              x={0}
                              y={45}
                              textAnchor="middle"
                              style={{ fontSize: '10px' }}
                            >
                              {Object.entries(nodeDatum.attributes).map(([key, value]) =>
                                `${key}: ${value}`
                              ).join(' | ')}
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#A1A1AA' }}>
                  暂无执行计划数据
                </div>
              )}
            </Card>

            {/* PEV2 可视化 */}
            {selectedPlan && (
              <Card title="PEV2 可视化" style={{ marginTop: '16px' }}>
                <div style={{ width: '100%', height: '400px', border: '1px solid #E5E7EB' }}>
                  <iframe
                    src="https://github.com/dalibo/pev2"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title="PEV2 可视化工具"
                  />
                </div>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default PlanVisualizer;