<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>应收债权</span>
          <div>
            <el-select v-model="query.clientName" placeholder="选择客户" clearable style="width:180px;margin-right:8px" @change="onClientChange">
              <el-option v-for="c in clients" :key="c.clientName" :label="c.clientName" :value="c.clientName" />
            </el-select>
            <el-select v-model="query.projectId" placeholder="选择项目" clearable style="width:220px;margin-right:8px">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-select v-model="query.owner" placeholder="选择负责人" clearable style="width:140px;margin-right:8px" @change="onOwnerChange">
              <el-option v-for="o in owners" :key="o.ownerName" :label="o.ownerName" :value="o.ownerName" />
            </el-select>
            <el-select v-model="query.year" placeholder="选择年份" clearable style="width:120px;margin-right:8px">
              <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
            </el-select>
            <el-select v-model="query.month" placeholder="选择月份" clearable style="width:120px;margin-right:8px">
              <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
            </el-select>
            <el-button type="primary" @click="loadData" :loading="loading">查询</el-button>
            <el-button @click="handleExport" :loading="exporting">导出</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe show-summary :summary-method="getSummary" size="small">
        <el-table-column prop="projectCode" label="项目编号" width="110" />
        <el-table-column prop="projectName" label="项目名称" min-width="140" />
        <el-table-column prop="clientName" label="客户名称" width="110" />
        <el-table-column prop="contractAmount" label="合同金额" width="120" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
        <el-table-column prop="settlementAmount" label="结算金额" width="120" align="right"><template #default="{ row }">{{ fmt(row.settlementAmount) }}</template></el-table-column>
        <el-table-column prop="invoicedAmount" label="已开发票" width="120" align="right"><template #default="{ row }">{{ fmt(row.invoicedAmount) }}</template></el-table-column>
        <el-table-column prop="receivedAmount" label="已回款" width="120" align="right"><template #default="{ row }">{{ fmt(row.receivedAmount) }}</template></el-table-column>
        <el-table-column prop="settledNotInvoiced" label="已结算未开" width="120" align="right"><template #default="{ row }">{{ fmt(row.settledNotInvoiced) }}</template></el-table-column>
        <el-table-column prop="invoicedNotReceived" label="已票未收款" width="120" align="right"><template #default="{ row }">{{ fmt(row.invoicedNotReceived) }}</template></el-table-column>
        <el-table-column prop="subtotal" label="小计" width="120" align="right"><template #default="{ row }">{{ fmt(row.subtotal) }}</template></el-table-column>
        <el-table-column prop="deposit" label="质保金" width="110" align="right"><template #default="{ row }">{{ fmt(row.deposit) }}</template></el-table-column>
        <el-table-column prop="depositPeriod" label="期限" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjects, getClients, getProjectOwners, getReceivableReport, exportReceivableReport } from '../api'

const loading = ref(false)
const exporting = ref(false)
const allProjects = ref([])
const clients = ref([])
const owners = ref([])
const projects = computed(() => {
  let list = allProjects.value
  if (query.clientName) list = list.filter(p => p.clientName === query.clientName)
  if (query.owner) list = list.filter(p => p.owner === query.owner)
  return list
})
const query = reactive({ year: new Date().getFullYear(), month: null, projectId: null, clientName: null, owner: null })
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)
const tableData = ref([])

const fmt = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'

const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  return s === '' ? 0 : s
}

const onClientChange = () => {
  query.projectId = null
  loadData()
}

const onOwnerChange = () => {
  query.projectId = null
  loadData()
}

const loadData = async () => {
  loading.value = true
  const params = {}
  if (query.year) params.year = query.year
  if (query.month) params.month = query.month
  if (query.projectId) params.projectId = query.projectId
  if (query.clientName) params.clientName = query.clientName
  if (query.owner) params.owner = query.owner
  try {
    const { data } = await getReceivableReport(params)
    tableData.value = data.data || []
  } catch (e) {
    ElMessage.error('报表加载失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const getSummary = ({ columns, data }) => {
  const sumKeys = ['contractAmount','settlementAmount','invoicedAmount','receivedAmount','settledNotInvoiced','invoicedNotReceived','subtotal','deposit']
  const sums = {}
  sumKeys.forEach(k => { sums[k] = data.reduce((a, r) => a + Number(r[k] || 0), 0) })
  return columns.map((c, i) => {
    if (i === 0) return '合计'
    if (sums[c.property] !== undefined) return sums[c.property].toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    return ''
  })
}

const handleExport = async () => {
  exporting.value = true
  try {
    const params = {}
    if (query.year) params.year = query.year
    if (query.month) params.month = query.month
    if (query.projectId) params.projectId = query.projectId
    if (query.clientName) params.clientName = query.clientName
  if (query.owner) params.owner = query.owner
    const { data } = await exportReceivableReport(params)
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.download = '应收债权报表.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.response?.data?.message || e.message))
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  try {
    const [projRes, clientRes, ownerRes] = await Promise.all([getProjects(), getClients(), getProjectOwners()])
    allProjects.value = projRes.data.data || []
    clients.value = clientRes.data.data || []
    owners.value = ownerRes.data.data || []
  } catch { /* ignore */ }
  loadData()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
