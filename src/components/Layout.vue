<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h3>财务管理系统</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        :default-openeds="openedMenus"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/projects">
          <el-icon><House /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/project-costs">
          <el-icon><Money /></el-icon>
          <span>项目成本详情</span>
        </el-menu-item>
        <el-menu-item index="/project-budgets">
          <el-icon><TrendCharts /></el-icon>
          <span>项目预算</span>
        </el-menu-item>
        <el-menu-item index="/project-payments">
          <el-icon><DataAnalysis /></el-icon>
          <span>项目回款记录</span>
        </el-menu-item>
        <el-sub-menu index="/reports">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>项目报表</span>
          </template>
          <el-menu-item index="/reports/receivable">
            <el-icon><CreditCard /></el-icon>
            <span>应收债权</span>
          </el-menu-item>
          <el-menu-item index="/reports/payment-month">
            <el-icon><Tickets /></el-icon>
            <span>增值税发票管理台账</span>
          </el-menu-item>
          <el-menu-item index="/reports/input-tax">
            <el-icon><Coin /></el-icon>
            <span>进项税额统计</span>
          </el-menu-item>
          <el-menu-item index="/reports/cash-flow">
            <el-icon><Notebook /></el-icon>
            <span>收付实现制台账</span>
          </el-menu-item>
          <el-menu-item index="/reports/profit">
            <el-icon><PieChart /></el-icon>
            <span>项目损益汇总</span>
          </el-menu-item>
          <el-menu-item index="/reports/project-ledger">
            <el-icon><DocumentCopy /></el-icon>
            <span>项目台账</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/config">
          <el-icon><Setting /></el-icon>
          <span>系统配置</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/clients">
          <el-icon><OfficeBuilding /></el-icon>
          <span>客户管理</span>
        </el-menu-item>
        <el-menu-item index="/backups" v-if="hasPerm('backup:view')">
          <el-icon><FolderOpened /></el-icon>
          <span>数据备份</span>
        </el-menu-item>
        <el-menu-item index="/operation-logs" v-if="hasPerm('log:view')">
          <el-icon><Clock /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
        <el-menu-item index="/permissions" v-if="hasPerm('role:view')">
          <el-icon><Lock /></el-icon>
          <span>权限管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-right">
          <span style="margin-right: 16px;">欢迎，{{ currentUser.username }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Money, TrendCharts, DataAnalysis, Setting, User, Document, DocumentCopy, OfficeBuilding, Clock, Lock, CreditCard, Tickets, Coin, Notebook, PieChart, FolderOpened } from '@element-plus/icons-vue'
import { permissionStore, loadPermissionsFromCache } from '../api'

loadPermissionsFromCache()

const route = useRoute()
const router = useRouter()
const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}')

const hasPerm = (code) => permissionStore.has(code)

const activeMenu = computed(() => {
  return '/' + route.path.split('/')[1]
})

const openedMenus = computed(() => {
  if (route.path.startsWith('/reports')) return ['/reports']
  return []
})

const handleLogout = () => {
  sessionStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside {
  background: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #3a4a5b;
}
.logo h3 { margin: 0; font-size: 16px; }
.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
}
.header-right {
  display: flex;
  align-items: center;
}
.main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
