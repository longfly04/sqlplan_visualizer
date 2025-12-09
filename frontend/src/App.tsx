import React, { useState } from 'react';
import { Layout, Menu, theme, Typography, Space, Button } from 'antd';
import {
  DashboardOutlined,
  BranchesOutlined,
  BarChartOutlined,
  SearchOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import PlanVisualizer from '@/pages/PlanVisualizer';
import DataAnalysis from '@/pages/DataAnalysis';
import Search from '@/pages/Search';
import Settings from '@/pages/Settings';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/visualizer',
      icon: <BranchesOutlined />,
      label: '执行计划可视化',
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '搜索',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: isDark ? '#141414' : '#fff',
          borderRight: `1px solid ${isDark ? '#2D2D2D' : '#E5E7EB'}`,
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: `1px solid ${isDark ? '#2D2D2D' : '#E5E7EB'}`
        }}>
          {!collapsed && (
            <Title level={4} style={{ 
              margin: 0, 
              color: isDark ? '#E4E4E7' : '#18181B' 
            }}>
              SQL Plan Visualizer
            </Title>
          )}
        </div>
        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            background: 'transparent',
          }}
        />
      </Sider>
      <Layout>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: isDark ? '#141414' : '#fff',
            borderBottom: `1px solid ${isDark ? '#2D2D2D' : '#E5E7EB'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              color: isDark ? '#E4E4E7' : '#18181B'
            }}
          />
          <Space>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{
                color: isDark ? '#E4E4E7' : '#18181B'
              }}
            />
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: isDark ? '#0A0A0A' : '#F8F9FA',
            borderRadius: '12px',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/visualizer" element={<PlanVisualizer />} />
            <Route path="/analysis" element={<DataAnalysis />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;