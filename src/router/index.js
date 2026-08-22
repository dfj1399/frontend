import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: 'projects',
        name: 'ProjectManage',
        component: () => import('../views/ProjectManage.vue')
      },
      {
        path: 'project-costs',
        name: 'ProjectCostDetail',
        component: () => import('../views/ProjectCostDetail.vue')
      },
      {
        path: 'project-budgets',
        name: 'ProjectBudget',
        component: () => import('../views/ProjectBudget.vue')
      },
      {
        path: 'project-payments',
        name: 'ProjectPaymentRecord',
        component: () => import('../views/ProjectPaymentRecord.vue')
      },
      {
        path: 'reports',
        redirect: '/reports/receivable'
      },
      {
        path: 'reports/receivable',
        name: 'ReceivableReport',
        component: () => import('../views/ReceivableReport.vue')
      },
      {
        path: 'reports/payment-month',
        name: 'PaymentMonthReport',
        component: () => import('../views/PaymentMonthReport.vue')
      },
      {
        path: 'reports/input-tax',
        name: 'InputTaxReport',
        component: () => import('../views/InputTaxReport.vue')
      },
      {
        path: 'reports/cash-flow',
        name: 'CashFlowReport',
        component: () => import('../views/CashFlowReport.vue')
      },
      {
        path: 'reports/profit',
        name: 'ProfitReport',
        component: () => import('../views/ProfitReport.vue')
      },
      {
        path: 'reports/project-ledger',
        name: 'ProjectLedger',
        component: () => import('../views/ProjectLedger.vue')
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('../views/SystemConfig.vue')
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('../views/UserManage.vue')
      },
      {
        path: 'clients',
        name: 'ClientManage',
        component: () => import('../views/ClientManage.vue')
      },
      {
        path: 'backups',
        name: 'DataBackup',
        component: () => import('../views/DataBackup.vue')
      },
      {
        path: 'operation-logs',
        name: 'OperationLog',
        component: () => import('../views/OperationLog.vue')
      },
      {
        path: 'permissions',
        name: 'PermissionManage',
        component: () => import('../views/PermissionManage.vue')
      }
    ]
  }
]

// 自动检测部署上下文：根路径 / 或 /project/
const routerBase = window.location.pathname.startsWith('/project') ? '/project/' : '/'

const router = createRouter({
  history: createWebHistory(routerBase),
  routes
})

// 路由守卫：未登录则跳转到登录页
router.beforeEach((to, from, next) => {
  const user = sessionStorage.getItem('user')
  if (to.path !== '/login' && !user) {
    next('/login')
  } else {
    next()
  }
})

export default router
