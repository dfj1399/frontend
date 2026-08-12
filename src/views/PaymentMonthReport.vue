<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>增值税发票管理台账</span>
          <div>
            <el-select v-model="query.clientName" placeholder="选择客户" clearable style="width:180px;margin-right:8px" @change="onClientChange">
              <el-option v-for="c in clients" :key="c.clientName" :label="c.clientName" :value="c.clientName" />
            </el-select>
            <el-select v-model="query.projectId" placeholder="选择项目" clearable style="width:220px;margin-right:8px">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-input :model-value="query.year" @input="(v) => query.year = allowNumber(v)" placeholder="年" style="width:110px;margin-right:8px" />
            <el-input :model-value="query.month" @input="(v) => query.month = allowNumber(v)" placeholder="月(可选)" style="width:120px;margin-right:8px" />
            <el-button type="primary" @click="loadData" :loading="loading">查询</el-button>
            <el-button @click="handleExport" :loading="exporting">导出</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe size="small">
        <el-table-column prop="projectCode" label="项目编号" width="100" />
        <el-table-column prop="projectName" label="项目名称" width="130" />
        <el-table-column prop="clientName" label="客户" width="100" />
        <el-table-column prop="contractAmount" label="合同金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
        <el-table-column label="项目累计" align="center">
          <el-table-column prop="totalSettlementAmount" label="结算" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalSettlementAmount) }}</template></el-table-column>
          <el-table-column prop="totalInvoiceAmount" label="已开发票" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalInvoiceAmount) }}</template></el-table-column>
          <el-table-column prop="totalPaymentAmount" label="回款" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalPaymentAmount) }}</template></el-table-column>
        </el-table-column>
        <el-table-column label="当年合计" align="center">
          <el-table-column prop="yearSettlementAmount" label="结算" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearSettlementAmount) }}</template></el-table-column>
          <el-table-column prop="yearInvoiceAmount" label="已开发票" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearInvoiceAmount) }}</template></el-table-column>
          <el-table-column prop="yearPaymentAmount" label="回款" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearPaymentAmount) }}</template></el-table-column>
        </el-table-column>
        <el-table-column v-for="m in 12" :key="'pm'+m" :label="m+'月'" align="center" width="180">
          <el-table-column :prop="'m'+m+'SettlementAmount'" label="结算" width="60" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'SettlementAmount']) }}</template></el-table-column>
          <el-table-column :prop="'m'+m+'InvoiceAmount'" label="发票" width="60" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'InvoiceAmount']) }}</template></el-table-column>
          <el-table-column :prop="'m'+m+'PaymentAmount'" label="回款" width="60" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'PaymentAmount']) }}</template></el-table-column>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjects, getClients, getPaymentMonthReport, exportPaymentMonthReport } from '../api'

const loading = ref(false)
const exporting = ref(false)
const allProjects = ref([])
const clients = ref([])
const projects = computed(() => {
  if (!query.clientName) return allProjects.value
  return allProjects.value.filter(p => p.clientName === query.clientName)
})
const query = reactive({ year: new Date().getFullYear(), month: null, projectId: null, clientName: null })
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

const loadData = async () => {
  loading.value = true
  const params = {}
  if (query.year) params.year = query.year
  if (query.month) params.month = query.month
  if (query.projectId) params.projectId = query.projectId
  if (query.clientName) params.clientName = query.clientName
  try {
    const { data } = await getPaymentMonthReport(params)
    tableData.value = data.data || []
  } catch (e) {
    ElMessage.error('报表加载失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  exporting.value = true
  try {
    const params = {}
    if (query.year) params.year = query.year
    if (query.month) params.month = query.month
    if (query.projectId) params.projectId = query.projectId
    if (query.clientName) params.clientName = query.clientName
    const { data } = await exportPaymentMonthReport(params)
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.download = '增值税发票管理台账.xlsx'
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
    const [projRes, clientRes] = await Promise.all([getProjects(), getClients()])
    allProjects.value = projRes.data.data || []
    clients.value = clientRes.data.data || []
  } catch { /* ignore */ }
  loadData()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
