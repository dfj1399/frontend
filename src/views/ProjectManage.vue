<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目管理</span>
          <div>
            <el-select v-model="selectedClientName" placeholder="选择客户" clearable style="width:180px;margin-right:8px" @change="onClientChange">
              <el-option v-for="c in clients" :key="c.clientName" :label="c.clientName" :value="c.clientName" />
            </el-select>
            <el-select v-model="selectedProjectId" placeholder="选择项目" clearable style="width:220px;margin-right:8px" @change="loadData">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-button type="success" @click="importDialogVisible = true; selectedFile = null" v-if="hasPerm('project:import')">导入Excel</el-button>
          <el-button type="primary" @click="handleAdd" v-if="hasPerm('project:create')">新增项目</el-button></div>
        </div>
      </template>
      <el-table :data="filteredList" v-loading="loading" stripe>
        <el-table-column prop="projectCode" label="项目编号" width="120" />
        <el-table-column prop="projectName" label="项目名称" min-width="150" />
        <el-table-column prop="clientName" label="客户名称" width="120" />
        <el-table-column prop="contractNo" label="合同编号" width="120" />
        <el-table-column prop="contractAmount" label="合同金额" width="120" align="right">
          <template #default="{ row }">{{ formatMoney(row.contractAmount) }}</template>
        </el-table-column>
        <el-table-column prop="revenueWithTax" label="营业收入(含税)" width="130" align="right">
          <template #default="{ row }">{{ formatMoney(row.revenueWithTax) }}</template>
        </el-table-column>
        <el-table-column prop="revenueWithoutTax" label="营业收入(除税)" width="130" align="right">
          <template #default="{ row }">{{ formatMoney(row.revenueWithoutTax) }}</template>
        </el-table-column>
        <el-table-column prop="estimatedCost" label="预计成本" width="120" align="right">
          <template #default="{ row }">{{ formatMoney(row.estimatedCost) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="负责人" width="90" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)" v-if="hasPerm('project:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="hasPerm('project:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新增项目'" width="850px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目编号" prop="projectCode"><el-input v-model="form.projectCode" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="projectName"><el-input v-model="form.projectName" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户名称">
              <el-select v-model="form.clientName" filterable remote reserve-keyword placeholder="输入关键词搜索客户" :remote-method="searchClients" :loading="clientSearchLoading" style="width:100%" clearable allow-create>
                <el-option v-for="c in clientOptions" :key="c.clientName" :label="c.clientName" :value="c.clientName" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同编号"><el-input v-model="form.contractNo" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="合同金额"><el-input :model-value="form.contractAmount" @input="(v) => form.contractAmount = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总预算"><el-input :model-value="formatMoney(form.totalBudget)" disabled style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="预计成本"><el-input :model-value="form.estimatedCost" @input="(v) => form.estimatedCost = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="结算金额"><el-input :model-value="formatMoney(form.settlementAmount)" disabled style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质保金"><el-input :model-value="form.deposit" @input="(v) => form.deposit = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="营业收入(含税)"><el-input :model-value="formatMoney(form.revenueWithTax)" disabled style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业收入(除税)"><el-input :model-value="formatMoney(form.revenueWithoutTax)" disabled style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人"><el-input v-model="form.owner" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width:100%">
                <el-option label="进行中" value="IN_PROGRESS" />
                <el-option label="已完成" value="COMPLETED" />
                <el-option label="暂停" value="SUSPENDED" />
                <el-option label="取消" value="CANCELLED" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计结束"><el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>

      <!-- 项目税率明细 -->
      <el-divider content-position="left">项目税率明细</el-divider>
      <div style="margin-bottom:12px">
        <el-button size="small" type="primary" @click="addTaxRow">添加税目</el-button>
        <el-button v-if="isEdit" size="small" @click="saveTaxDetails" :loading="taxSaving">保存税率明细</el-button>
      </div>
      <el-table :data="taxDetails" size="small" stripe border style="margin-bottom:16px">
        <el-table-column label="税目名称" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.vatConfigId" placeholder="选择税目" size="small" style="width:100%" @change="(v) => onVatItemChange(row, v)">
              <el-option v-for="v in activeVatItems" :key="v.id" :label="v.itemName + ' (' + v.taxRate + '%)'" :value="v.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="税率(%)" width="120">
          <template #default="{ row }"><el-input :model-value="row.taxRate" @input="(v) => row.taxRate = allowNumber(v)" placeholder="请输入数字" size="small" style="width:100%" /></template>
        </el-table-column>
        <el-table-column label="发票金额(含税)" width="150">
          <template #default="{ row }"><el-input :model-value="row.invoiceAmount" @input="(v) => row.invoiceAmount = allowNumber(v)" placeholder="请输入数字" size="small" style="width:100%" /></template>
        </el-table-column>
        <el-table-column label="税额" width="120">
          <template #default="{ row }">{{ calcTax(row) }}</template>
        </el-table-column>
        <el-table-column label="备注" width="120">
          <template #default="{ row }"><el-input v-model="row.remark" size="small" /></template>
        </el-table-column>
        <el-table-column label="" width="60">
          <template #default="{ $index }"><el-button type="danger" size="small" link @click="taxDetails.splice($index, 1)">删除</el-button></template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
      </template>
    </el-dialog>
    <!-- Excel导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入项目Excel" width="450px">
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning('只能上传一个文件')"
      >
        <el-icon style="font-size:40px;color:#409eff"><Upload /></el-icon>
        <div>将 Excel 文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 .xlsx / .xls 文件</div>
          <div style="margin-top:8px">
            <el-link type="primary" :underline="false" href="/api/templates/project" target="_blank">
              <el-icon style="vertical-align:middle"><Download /></el-icon> 下载导入模板
            </el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importLoading">导 入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjects, addProject, updateProject, deleteProject, importProjects, getProjectRevenueTax, saveProjectRevenueTax, getActiveVatItems, getBudgetSumCostSubtotal, getClients, permissionStore } from '../api'
import { Upload, Download } from '@element-plus/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const list = ref([])

const allProjects = ref([])
const clients = ref([])
const selectedClientName = ref(null)
const selectedProjectId = ref(null)

const projects = computed(() => {
  if (!selectedClientName.value) return allProjects.value
  return allProjects.value.filter(p => p.clientName === selectedClientName.value)
})

const filteredList = computed(() => {
  if (!selectedProjectId.value) return list.value
  return list.value.filter(p => p.id === selectedProjectId.value)
})

const onClientChange = () => {
  selectedProjectId.value = null
  loadData()
}

const form = reactive({
  id: null, projectCode: '', projectName: '', clientName: '', contractNo: '',
  contractAmount: 0, settlementAmount: 0, deposit: 0, depositPeriod: '',
  totalBudget: 0, estimatedCost: 0, revenueWithTax: 0, revenueWithoutTax: 0,
  status: 'IN_PROGRESS', owner: '', startDate: '', endDate: '',
  actualEndDate: '', remark: ''
})

const rules = {
  projectCode: [{ required: true, message: '请输入项目编号', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

// 税率明细
const taxDetails = ref([])
const taxSaving = ref(false)
const activeVatItems = ref([])
const clientOptions = ref([])
const clientSearchLoading = ref(false)

const hasPerm = (code) => permissionStore.has(code)

const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) {
    s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  }
  return s === '' ? 0 : s
}

const onVatItemChange = (row, vatConfigId) => {
  const item = activeVatItems.value.find(v => v.id === vatConfigId)
  if (item) {
    row.itemName = item.itemName
    row.taxRate = Number(item.taxRate)
  }
}

const loadVatItems = async () => {
  try {
    const { data } = await getActiveVatItems()
    activeVatItems.value = data.data || []
  } catch { /* ignore */ }
}

const searchClients = async (keyword) => {
  clientSearchLoading.value = true
  try {
    const { data } = await getClients(keyword || '')
    clientOptions.value = data.data || []
  } catch { clientOptions.value = [] }
  finally { clientSearchLoading.value = false }
}

const calcTax = (row) => {
  const amt = Number(row.invoiceAmount || 0)
  const rate = Number(row.taxRate || 0)
  // 税额 = 含税金额 / (1+税率) * 税率 = 含税金额 * 税率 / (100+税率)
  return (amt * rate / (100 + rate)).toFixed(2)
}

const totalTax = computed(() => taxDetails.value.reduce((sum, r) => sum + Number(calcTax(r)), 0))

const recalcRevenue = () => {
  form.revenueWithTax = Number(form.contractAmount || 0)
  form.revenueWithoutTax = Number(form.contractAmount || 0) - totalTax.value
}

// 税目变化时联动更新营业收入(含税/除税)
watch(taxDetails, recalcRevenue, { deep: true })

const addTaxRow = () => {
  taxDetails.value.push({ vatConfigId: null, itemName: '', taxRate: 0, invoiceAmount: 0, taxAmount: 0, remark: '' })
}

const loadTaxDetails = async (projectId) => {
  try {
    const { data } = await getProjectRevenueTax(projectId)
    taxDetails.value = data.data || []
  } catch { taxDetails.value = [] }
}

const saveTaxDetails = async () => {
  if (!form.id) { ElMessage.warning('请先保存项目'); return }
  taxSaving.value = true
  try {
    const items = taxDetails.value.map(r => ({
      itemName: r.itemName, taxRate: r.taxRate, invoiceAmount: r.invoiceAmount, taxAmount: Number(calcTax(r)), remark: r.remark
    }))
    await saveProjectRevenueTax(form.id, items)
    ElMessage.success('税率明细保存成功')
    const { data } = await getProjectRevenueTax(form.id)
    taxDetails.value = data.data || []
    recalcRevenue()
    loadData()
  } catch { ElMessage.error('保存税率明细失败') }
  finally { taxSaving.value = false }
}

const formatMoney = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'
const statusLabel = (s) => ({ IN_PROGRESS: '进行中', COMPLETED: '已完成', SUSPENDED: '暂停', CANCELLED: '取消' }[s] || s)
const statusTag = (s) => ({ IN_PROGRESS: '', COMPLETED: 'success', SUSPENDED: 'warning', CANCELLED: 'danger' }[s] || '')

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getProjects({
      clientName: selectedClientName.value || undefined,
      projectId: selectedProjectId.value || undefined
    })
    allProjects.value = data.data || []
    list.value = data.data || []
  } catch { ElMessage.error('获取数据失败') }
  finally { loading.value = false }
}

const resetForm = () => {
  Object.assign(form, { id: null, projectCode: '', projectName: '', clientName: '', contractNo: '', contractAmount: 0, settlementAmount: 0, deposit: 0, depositPeriod: '', totalBudget: 0, estimatedCost: 0, revenueWithTax: 0, revenueWithoutTax: 0, status: 'IN_PROGRESS', owner: '', startDate: '', endDate: '', actualEndDate: '', remark: '' })
  taxDetails.value = []
}

const handleAdd = () => { resetForm(); isEdit.value = false; dialogVisible.value = true; formRef.value?.clearValidate(); searchClients('') }

const handleEdit = async (row) => {
  resetForm()
  isEdit.value = true
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  dialogVisible.value = true
  formRef.value?.clearValidate()
  searchClients('')
  await loadTaxDetails(row.id)
  matchVatConfigIds()
  recalcRevenue()
  try {
    const { data } = await getBudgetSumCostSubtotal(row.id)
    if (data.code === 200) form.totalBudget = Number(data.data || 0)
  } catch { /* ignore */ }
}

const matchVatConfigIds = () => {
  taxDetails.value.forEach(row => {
    if (!row.vatConfigId) {
      if (row.itemName) {
        const item = activeVatItems.value.find(v => v.itemName === row.itemName)
        if (item) { row.vatConfigId = item.id; return }
      }
      if (row.taxRate != null) {
        const item = activeVatItems.value.find(v => Number(v.taxRate) === Number(row.taxRate))
        if (item) { row.vatConfigId = item.id; row.itemName = item.itemName }
      }
    }
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) { await updateProject(form); ElMessage.success('更新成功') }
    else {
      recalcRevenue()
      const { data } = await addProject(form)
      if (data.code !== 200) { ElMessage.error(data.message || '新增失败'); return }
      ElMessage.success('新增成功')
      form.id = data.data.id
      // 新增时一并保存税目明细
      const items = taxDetails.value
        .filter(r => r.itemName || r.vatConfigId || Number(r.invoiceAmount) > 0 || Number(r.taxRate) > 0)
        .map(r => ({ itemName: r.itemName, taxRate: r.taxRate, invoiceAmount: r.invoiceAmount, taxAmount: Number(calcTax(r)), remark: r.remark }))
      try {
        if (items.length) await saveProjectRevenueTax(form.id, items)
      } catch { ElMessage.warning('项目已创建，但税率明细保存失败，可编辑项目后重试') }
    }
    dialogVisible.value = false; loadData()
  } catch { ElMessage.error('操作失败') }
  finally { submitLoading.value = false }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除项目 "${row.projectName}"？`, '提示', { type: 'warning' }).then(async () => {
    try { await deleteProject(row.id); ElMessage.success('删除成功'); loadData() } catch { ElMessage.error('删除失败') }
  }).catch(() => {})
}

const importDialogVisible = ref(false)
const importLoading = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)
const handleFileChange = (file) => { selectedFile.value = file.raw }
const handleImport = async () => {
  if (!selectedFile.value) { ElMessage.warning('请先选择文件'); return }
  importLoading.value = true
  try {
    const { data } = await importProjects(selectedFile.value)
    if (data.code === 200) {
      ElMessage.success(data.message + '，共导入 ' + data.data + ' 条')
      importDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(data.message)
    }
  } catch (e) { ElMessage.error('导入失败：' + (e.response?.data?.message || e.message)) }
  finally { importLoading.value = false; selectedFile.value = null }
}
onMounted(async () => {
  try {
    const [projRes, clientRes] = await Promise.all([getProjects(), getClients()])
    allProjects.value = projRes.data.data || []
    list.value = projRes.data.data || []
    clients.value = clientRes.data.data || []
  } catch { /* ignore */ }
  loadVatItems()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
