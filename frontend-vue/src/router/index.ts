import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: {
      title: '仪表板',
      icon: 'DataBoard'
    }
  },
  {
    path: '/visualizer',
    name: 'PlanVisualizer',
    component: () => import('@/pages/PlanVisualizer.vue'),
    meta: {
      title: '执行计划',
      icon: 'Share'
    }
  },
  {
    path: '/pev2-viewer',
    name: 'PEV2Viewer',
    component: () => import('@/pages/PEV2Viewer.vue'),
    meta: {
      title: '查询计划可视化',
      icon: 'View'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: {
      title: '设置',
      icon: 'Setting'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 添加路由守卫，确保路由切换时正确处理
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router