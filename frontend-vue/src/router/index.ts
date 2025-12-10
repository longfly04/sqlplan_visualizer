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
    path: '/pev2/:id',
    name: 'PEV2Visualizer',
    component: () => import('@/pages/PEV2Visualizer.vue'),
    meta: {
      title: 'PEV2执行计划可视化',
      icon: 'Share'
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
  routes
})

export default router