import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#388BFF',
            borderRadius: 8,
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          algorithm: undefined, // 使用默认主题
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)