import axios from 'axios'

// 自动检测部署上下文：根路径 / 或 /project/
// 必须用绝对路径，否则在二级路由页面(如 /reports/receivable)下相对路径会被解析到 /reports/api/...
const apiBase = window.location.pathname.startsWith('/project') ? '/project/api' : '/api'

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : apiBase,
  timeout: 10000
})

// 模板下载 URL（自动适配部署上下文：根路径 / 或 /project/）
export const getTemplateUrl = (type) => {
  const base = import.meta.env.DEV ? '/api' : apiBase
  return base + '/templates/' + type
}

// 请求拦截器：自动注入操作人 + 读取权限
api.interceptors.request.use(config => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')
  if (user.username) {
    config.headers['X-Operator'] = user.username
  }
  return config
})

// 全局权限存储
export const permissionStore = {
  permissions: [],
  set(p) { this.permissions = p },
  has(code) { return this.permissions.includes(code) }
}

// 登录后保存权限
export const setUserPermissions = (perms) => {
  permissionStore.set(perms)
  sessionStorage.setItem('permissions', JSON.stringify(perms))
}

// 从缓存恢复权限
export const loadPermissionsFromCache = () => {
  const cached = sessionStorage.getItem('permissions')
  if (cached) {
    try { permissionStore.set(JSON.parse(cached)) } catch {}
  }
}

// ==================== 用户 ====================
export const login = (username, password) => api.post('/users/login', { username, password })
export const getUsers = () => api.get('/users')
export const getUserById = (id) => api.get(`/users/${id}`)
export const addUser = (user) => api.post('/users', user)
export const updateUser = (user) => api.put('/users', user)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// ==================== 项目管理 ====================
export const getProjects = (params) => api.get('/projects', { params })
export const getProjectById = (id) => api.get(`/projects/${id}`)
export const getProjectByCode = (code) => api.get(`/projects/code/${code}`)
export const getProjectsByStatus = (status) => api.get(`/projects/status/${status}`)
export const addProject = (data) => api.post('/projects', data)
export const updateProject = (data) => api.put('/projects', data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)
export const importProjects = (file, operator = 'admin') => {
  const fd = new FormData(); fd.append('file', file); fd.append('operator', operator)
  return api.post('/projects/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}

// ==================== 客户管理 ====================
export const getClients = (keyword) => api.get('/clients', { params: keyword ? { keyword } : {} })
export const getClientById = (id) => api.get(`/clients/${id}`)
export const addClient = (data) => api.post('/clients', data)
export const updateClient = (data) => api.put('/clients', data)
export const deleteClient = (id) => api.delete(`/clients/${id}`)

export const importClients = (file) => {
  const fd = new FormData(); fd.append('file', file)
  return api.post('/clients/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}
export const exportClients = () => api.get('/clients/export', { responseType: 'blob', timeout: 60000 })
export const checkClientDuplicate = (params) => api.get('/clients/check-duplicate', { params })

// ==================== 负责人管理 ====================
export const getProjectOwners = () => api.get('/project-owners')
export const addProjectOwner = (data) => api.post('/project-owners', data)
export const updateProjectOwner = (data) => api.put('/project-owners', data)
export const deleteProjectOwner = (id) => api.delete(`/project-owners/${id}`)

// ==================== 项目成本详情 ====================
export const getProjectCosts = (params) => api.get('/project-costs', { params })
export const getProjectCostById = (id) => api.get(`/project-costs/${id}`)
export const getProjectCostsByProject = (projectId) => api.get(`/project-costs/project/${projectId}`)
export const addProjectCost = (data) => api.post('/project-costs', data)
export const updateProjectCost = (data) => api.put('/project-costs', data)
export const deleteProjectCost = (id) => api.delete(`/project-costs/${id}`)
export const importProjectCosts = (file, operator = 'admin') => {
  const fd = new FormData(); fd.append('file', file); fd.append('operator', operator)
  return api.post('/project-costs/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}
export const exportProjectCosts = (projectId) => {
  return api.get('/project-costs/export', { params: projectId ? { projectId } : {}, responseType: 'blob', timeout: 60000 })
}
export const getProjectRevenueSummary = (projectId) => api.get(`/project-costs/revenue-summary/${projectId}`)

// ==================== 项目预算 ====================
export const getProjectBudgets = (params) => api.get('/project-budgets', { params })
export const getProjectBudgetById = (id) => api.get(`/project-budgets/${id}`)
export const getProjectBudgetsByProject = (projectId) => api.get(`/project-budgets/project/${projectId}`)
export const addProjectBudget = (data) => api.post('/project-budgets', data)
export const updateProjectBudget = (data) => api.put('/project-budgets', data)
export const deleteProjectBudget = (id) => api.delete(`/project-budgets/${id}`)
export const importProjectBudgets = (file, operator = 'admin') => {
  const fd = new FormData(); fd.append('file', file); fd.append('operator', operator)
  return api.post('/project-budgets/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}
export const exportProjectBudgets = (projectId) => {
  return api.get('/project-budgets/export', { params: projectId ? { projectId } : {}, responseType: 'blob', timeout: 60000 })
}
export const getBudgetSumCostSubtotal = (projectId) => api.get(`/project-budgets/sum-cost-subtotal/${projectId}`)

// ==================== 项目结算回款 ====================
export const getProjectPayments = () => api.get('/project-payments')
export const getProjectPaymentById = (id) => api.get(`/project-payments/${id}`)
export const getProjectPaymentsByProject = (projectId) => api.get(`/project-payments/project/${projectId}`)
export const addProjectPayment = (data) => api.post('/project-payments', data)
export const updateProjectPayment = (data) => api.put('/project-payments', data)
export const deleteProjectPayment = (id) => api.delete(`/project-payments/${id}`)
export const importProjectPayments = (file, operator = 'admin') => {
  const fd = new FormData(); fd.append('file', file); fd.append('operator', operator)
  return api.post('/project-payments/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}
export const exportProjectPayments = (params) => {
  return api.get('/project-payments/export', { params, responseType: 'blob', timeout: 60000 })
}
export const getPaymentTaxDetails = (id) => api.get(`/project-payments/${id}/tax-details`)
export const updateSettlementTaxInvoiceAmount = (settlementTaxId, issuedInvoiceAmount) =>
  api.put(`/project-payments/settlement-tax/${settlementTaxId}/invoice`, { issuedInvoiceAmount })

// ==================== 回款/结算/开票操作历史 ====================
export const getPaymentGroupedList = (projectId, clientName) => api.get('/payment-operations/grouped', { params: { projectId: projectId || undefined, clientName: clientName || undefined } })
export const getPaymentOperationsByProject = (projectId, operationType) =>
  api.get('/payment-operations/history', { params: { projectId, operationType } })
export const getPaymentOperationStats = (projectId) => api.get(`/payment-operations/stats/${projectId}`)
export const addPaymentOperation = (data) => api.post('/payment-operations', data)
export const deletePaymentOperation = (id) => api.delete(`/payment-operations/${id}`)
export const getPaymentSettlements = (projectId) => api.get(`/payment-operations/settlements/${projectId}`)
export const getSettlementTaxDetails = (operationLogId) => api.get(`/payment-operations/settlement-tax-details/${operationLogId}`)
export const getInvoiceableTaxDetails = (projectId) => api.get(`/payment-operations/invoiceable-tax-details/${projectId}`)

// ==================== 项目税率明细 ====================
export const getProjectRevenueTax = (projectId) => api.get(`/project-revenue-tax/project/${projectId}`)
export const saveProjectRevenueTax = (projectId, taxDetails) => api.post(`/project-revenue-tax/project/${projectId}`, taxDetails)

// ==================== 系统配置 - 支出项目 ====================
export const getExpenseItems = () => api.get('/config/expense-items')
export const getActiveExpenseItems = () => api.get('/config/expense-items/active')
export const getExpenseItemsByCategory = (cat) => api.get(`/config/expense-items/category/${cat}`)
export const addExpenseItem = (data) => api.post('/config/expense-items', data)
export const updateExpenseItem = (data) => api.put('/config/expense-items', data)
export const deleteExpenseItem = (id) => api.delete(`/config/expense-items/${id}`)
export const importExpenseItems = (file, operator = 'admin') => {
  const fd = new FormData(); fd.append('file', file); fd.append('operator', operator)
  return api.post('/config/expense-items/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}

// ==================== 系统配置 - 增值税项目 ====================
export const getVatItems = () => api.get('/config/vat-items')
export const getActiveVatItems = () => api.get('/config/vat-items/active')
export const addVatItem = (data) => api.post('/config/vat-items', data)
export const updateVatItem = (data) => api.put('/config/vat-items', data)
export const deleteVatItem = (id) => api.delete(`/config/vat-items/${id}`)
export const importVatItems = (file, operator = 'admin') => {
  const fd = new FormData(); fd.append('file', file); fd.append('operator', operator)
  return api.post('/config/vat-items/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}

// ==================== 报表 ====================
export const getReceivableReport = (params) => api.get('/reports/receivable', { params })
export const getPaymentMonthReport = (params) => api.get('/reports/payment-month', { params })
export const getInputTaxReport = (params) => api.get('/reports/input-tax', { params })
export const getCashFlowReport = (params) => api.get('/reports/cash-flow', { params })
export const getProfitReport = (params) => api.get('/reports/profit', { params })
export const getProjectLedgerReport = (params) => api.get('/reports/project-ledger', { params })

// 报表导出（返回 blob）
export const exportReceivableReport = (params) => api.get('/reports/receivable/export', { params, responseType: 'blob', timeout: 60000 })
export const exportPaymentMonthReport = (params) => api.get('/reports/payment-month/export', { params, responseType: 'blob', timeout: 60000 })
export const exportInputTaxReport = (params) => api.get('/reports/input-tax/export', { params, responseType: 'blob', timeout: 60000 })
export const exportCashFlowReport = (params) => api.get('/reports/cash-flow/export', { params, responseType: 'blob', timeout: 60000 })
export const exportProfitReport = (params) => api.get('/reports/profit/export', { params, responseType: 'blob', timeout: 60000 })

// ==================== 数据备份 ====================
export const getBackups = () => api.get('/backups')
export const backupNow = () => api.post('/backups')
export const downloadBackup = (fileName) => api.get(`/backups/download/${encodeURIComponent(fileName)}`, { responseType: 'blob', timeout: 120000 })

// ==================== 操作日志 ====================
export const getOperationLogs = (params) => api.get('/operation-logs', { params })
export const getLogModules = () => api.get('/operation-logs/modules')
export const getLogTypes = (module) => api.get('/operation-logs/types', { params: { module } })

// ==================== 权限管理 ====================
export const getRoles = () => api.get('/permissions/roles')
export const addRole = (data) => api.post('/permissions/roles', data)
export const updateRole = (data) => api.put('/permissions/roles', data)
export const deleteRole = (id) => api.delete(`/permissions/roles/${id}`)
export const getAllPermissions = () => api.get('/permissions')
export const getRolePermissions = (roleId) => api.get(`/permissions/roles/${roleId}/permissions`)
export const assignRolePermissions = (roleId, permissionIds) => api.put(`/permissions/roles/${roleId}/permissions`, { permissionIds })
export const getMyPermissions = () => api.get('/permissions/my')

// ==================== 结算单附件 ====================
export const uploadSettlementDocs = (id, files) => {
  const fd = new FormData()
  files.forEach(f => fd.append('files', f))
  return api.post(`/payment-operations/${id}/settlement-docs`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
}
export const getSettlementDocs = (id) => api.get(`/payment-operations/${id}/settlement-docs`)
export const deleteSettlementDoc = (docId) => api.delete(`/payment-operations/settlement-docs/${docId}`)
