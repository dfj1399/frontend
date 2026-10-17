<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>增值税发票台账</span>
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
            <el-button type="primary" @click="loadData" :loading="loading">查询</el-button>
            <el-button @click="handleExport" :loading="exporting" v-if="permissionStore.has('report:vat-export')">导出</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe size="small" border>
        <el-table-column prop="projectCode" label="项目编号" width="100" fixed />
        <el-table-column prop="projectName" label="项目名称" width="130" show-overflow-tooltip fixed />
        <el-table-column prop="clientName" label="客户名称" width="100" show-overflow-tooltip fixed />
        <el-table-column prop="contractAmount" label="合同金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>

        <el-table-column label="累计" align="center">
          <el-table-column prop="totalInvoiceAmount" label="发票金额" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalInvoiceAmount) }}</template></el-table-column>
          <el-table-column prop="totalExTaxAmount" label="除税金额" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalExTaxAmount) }}</template></el-table-column>
          <el-table-column prop="totalTaxAmount" label="税额" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalTaxAmount) }}</template></el-table-column>
        </el-table-column>

        <el-table-column label="当年" align="center">
          <el-table-column prop="yearInvoiceAmount" label="发票金额" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearInvoiceAmount) }}</template></el-table-column>
          <el-table-column prop="yearExTaxAmount" label="除税金额" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearExTaxAmount) }}</template></el-table-column>
          <el-table-column prop="yearTaxAmount" label="税额" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearTaxAmount) }}</template></el-table-column>
        </el-table-column>

        <el-table-column v-for="m in 12" :key="'m'+m" :label="m+'月'" align="center">
          <el-table-column :prop="'m'+m+'Invoice'" label="发票金额" width="80" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'Invoice']) }}</template></el-table-column>
          <el-table-column :prop="'m'+m+'ExTax'" label="除税金额" width="80" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'ExTax']) }}</template></el-table-column>
          <el-table-column :prop="'m'+m+'Tax'" label="税额" width="80" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'Tax']) }}</template></el-table-column>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjects, getClients, getProjectOwners, getVatInvoiceLedger, exportVatInvoiceLedger, permissionStore } from '../api'

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
const query = reactive({ year: new Date().getFullYear(), projectId: null, clientName: null, owner: null })
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)
const tableData = ref([])

const fmt = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'

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
  if (query.projectId) params.projectId = query.projectId
  if (query.clientName) params.clientName = query.clientName
  if (query.owner) params.owner = query.owner
  try {
    const { data } = await getVatInvoiceLedger(params)
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
    if (query.projectId) params.projectId = query.projectId
    if (query.clientName) params.clientName = query.clientName
    if (query.owner) params.owner = query.owner
    const { data } = await exportVatInvoiceLedger(params)
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.download = '增值税发票台账.xlsx'
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
