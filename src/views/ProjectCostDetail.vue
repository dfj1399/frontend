<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目成本详情</span>
          <div>
            <el-select v-model="selectedClientName" placeholder="选择客户" clearable style="width:180px;margin-right:8px" @change="onClientChange">
              <el-option v-for="c in clients" :key="c.clientName" :label="c.clientName" :value="c.clientName" />
            </el-select>
            <el-select v-model="selectedProjectId" placeholder="选择项目" clearable style="width:220px;margin-right:8px" @change="loadData">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-button type="success" @click="importDialogVisible = true; selectedFile = null">导入Excel</el-button>
            <el-button type="info" @click="handleDownloadTemplate">下载模板</el-button>
            <el-button type="warning" @click="handleExport">导出Excel</el-button>
            <el-button type="primary" @click="handleAdd">新增成本</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe show-summary :summary-method="getSummary">
        <el-table-column prop="projectCode" label="项目编号" width="120" />
        <el-table-column prop="projectName" label="项目名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="clientName" label="客户名称" width="110" show-overflow-tooltip />
        <el-table-column prop="contractAmount" label="合同金额" width="120" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
        <el-table-column prop="recordDate" label="记录日期" width="110" />
        <el-table-column prop="revenueWithTax" label="结算收入" width="120" align="right"><template #default="{ row }">{{ fmt(row.revenueWithTax) }}</template></el-table-column>
        <el-table-column prop="revenueWithoutTax" label="结算收入（除税）" width="120" align="right"><template #default="{ row }">{{ fmt(row.revenueWithoutTax) }}</template></el-table-column>
        <el-table-column prop="settlementAmount" label="结算金额" width="120" align="right"><template #default="{ row }">{{ fmt(row.settlementAmount) }}</template></el-table-column>
        <el-table-column prop="directMaterialCost" label="直接材料" width="110" align="right"><template #default="{ row }">{{ fmt(row.directMaterialCost) }}</template></el-table-column>
        <el-table-column prop="directLaborCost" label="直接劳务" width="110" align="right"><template #default="{ row }">{{ fmt(row.directLaborCost) }}</template></el-table-column>
        <el-table-column prop="directMachineryCost" label="直接机械" width="110" align="right"><template #default="{ row }">{{ fmt(row.directMachineryCost) }}</template></el-table-column>
        <el-table-column prop="directExpense" label="直接费用" width="110" align="right"><template #default="{ row }">{{ fmt(row.directExpense) }}</template></el-table-column>
        <el-table-column prop="indirectManagementFee" label="间接管理" width="110" align="right"><template #default="{ row }">{{ fmt(row.indirectManagementFee) }}</template></el-table-column>
        <el-table-column prop="otherCost" label="其他" width="100" align="right"><template #default="{ row }">{{ fmt(row.otherCost) }}</template></el-table-column>
        <el-table-column prop="costSubtotal" label="成本合计" width="110" align="right"><template #default="{ row }">{{ fmt(row.costSubtotal) }}</template></el-table-column>
        <el-table-column prop="operatingProfit" label="营业利润" width="110" align="right"><template #default="{ row }">{{ fmt(row.operatingProfit) }}</template></el-table-column>
        <el-table-column prop="inputTax" label="进项税" width="100" align="right"><template #default="{ row }">{{ fmt(row.inputTax) }}</template></el-table-column>
        <el-table-column prop="periodManagementFee" label="期间管理" width="100" align="right"><template #default="{ row }">{{ fmt(row.periodManagementFee) }}</template></el-table-column>
        <el-table-column prop="periodFinancialFee" label="期间财务" width="100" align="right"><template #default="{ row }">{{ fmt(row.periodFinancialFee) }}</template></el-table-column>
        <el-table-column prop="projectCostAmount" label="项目成本支出(含税)" width="150" align="right"><template #default="{ row }">{{ fmt(row.projectCostAmount) }}</template></el-table-column>
        <el-table-column prop="loanAmount" label="借款费用" width="100" align="right"><template #default="{ row }">{{ fmt(row.loanAmount) }}</template></el-table-column>
        <el-table-column prop="grossMarginRate" label="毛利率(%)" width="100" align="right"><template #default="{ row }">{{ row.grossMarginRate != null ? Number(row.grossMarginRate).toFixed(2) : '-' }}</template></el-table-column>
        <el-table-column prop="fundsOccupation" label="资金占用" width="100" align="right"><template #default="{ row }">{{ fmt(row.fundsOccupation) }}</template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑成本' : '新增成本'" width="900px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属项目" prop="projectId">
              <el-select v-model="form.projectId" style="width:100%" placeholder="选择项目" @change="onProjectChange">
                <el-option v-for="p in projects" :key="p.id" :label="p.projectName" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记录日期" prop="recordDate">
              <el-date-picker v-model="form.recordDate" type="date" value-format="YYYY-MM-DD" style="width:100%" @change="onDateChange" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="年"><el-input :model-value="form.recordYear" @input="(v) => form.recordYear = allowNumber(v)" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="月"><el-input :model-value="form.recordMonth" @input="(v) => form.recordMonth = allowNumber(v)" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="结算收入"><el-input :model-value="fmt(form.revenueWithTax)" disabled style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="结算收入（除税）"><el-input :model-value="fmt(form.revenueWithoutTax)" disabled style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="结算金额"><el-input :model-value="fmt(form.settlementAmount)" disabled style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="直接材料"><el-input :model-value="form.directMaterialCost" @input="(v) => form.directMaterialCost = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="直接劳务"><el-input :model-value="form.directLaborCost" @input="(v) => form.directLaborCost = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="直接机械"><el-input :model-value="form.directMachineryCost" @input="(v) => form.directMachineryCost = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="直接费用"><el-input :model-value="form.directExpense" @input="(v) => form.directExpense = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="间接管理"><el-input :model-value="form.indirectManagementFee" @input="(v) => form.indirectManagementFee = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="其他"><el-input :model-value="form.otherCost" @input="(v) => form.otherCost = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="成本合计"><el-input :model-value="fmt(form.costSubtotal)" disabled style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="营业利润"><el-input :model-value="fmt(form.operatingProfit)" disabled style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="进项税"><el-input :model-value="form.inputTax" @input="(v) => form.inputTax = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="期间管理"><el-input :model-value="form.periodManagementFee" @input="(v) => form.periodManagementFee = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="期间财务"><el-input :model-value="form.periodFinancialFee" @input="(v) => form.periodFinancialFee = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="项目成本支出"><el-input :model-value="form.projectCostAmount" @input="(v) => form.projectCostAmount = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="借款费用"><el-input :model-value="form.loanAmount" @input="(v) => form.loanAmount = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="毛利率(%)"><el-input :model-value="form.grossMarginRate != null ? Number(form.grossMarginRate).toFixed(2) : '-'" disabled style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="资金占用"><el-input :model-value="form.fundsOccupation" @input="(v) => form.fundsOccupation = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
      </template>
    </el-dialog>

    <!-- Excel导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入项目成本详情Excel" width="450px">
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
            <el-link type="primary" :underline="false" :href="getTemplateUrl('expense-items')" target="_blank">
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
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjects, getClients, getProjectCosts, getProjectCostsByProject, addProjectCost, updateProjectCost, deleteProjectCost, importProjectCosts, exportProjectCosts, getTemplateUrl } from '../api'
import { Upload, Download } from '@element-plus/icons-vue'

const loading = ref(false); const submitLoading = ref(false); const dialogVisible = ref(false); const isEdit = ref(false)
const formRef = ref(null); const list = ref([])
const allProjects = ref([])
const clients = ref([])
const selectedProjectId = ref(null)
const selectedClientName = ref(null)

const projects = computed(() => {
  if (!selectedClientName.value) return allProjects.value
  return allProjects.value.filter(p => p.clientName === selectedClientName.value)
})

const onClientChange = () => {
  selectedProjectId.value = null
  loadData()
}

const form = reactive({ id: null, projectId: null, recordDate: '', recordYear: null, recordMonth: null, revenueWithTax: 0, revenueWithoutTax: 0, settlementAmount: 0, directMaterialCost: 0, directLaborCost: 0, directMachineryCost: 0, directExpense: 0, indirectManagementFee: 0, otherCost: 0, costSubtotal: 0, operatingProfit: 0, inputTax: 0, periodManagementFee: 0, periodFinancialFee: 0, projectCostAmount: 0, loanAmount: 0, fundsOccupation: 0, grossMarginRate: 0, remark: '', createdBy: '', updatedBy: '' })
const rules = { projectId: [{ required: true, message: '请选择项目', trigger: 'change' }], recordDate: [{ required: true, message: '请选择日期', trigger: 'change' }] }

const fmt = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'

const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) {
    s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  }
  return s === '' ? 0 : s
}

const onProjectChange = (projectId) => {
  if (!projectId) {
    form.revenueWithTax = 0
    form.revenueWithoutTax = 0
    form.settlementAmount = 0
    return
  }
  const project = allProjects.value.find(p => p.id === projectId)
  if (project) {
    form.revenueWithTax = Number(project.revenueWithTax || 0)
    form.revenueWithoutTax = Number(project.revenueWithoutTax || 0)
    form.settlementAmount = Number(project.settlementAmount || 0)
  } else {
    form.revenueWithTax = 0
    form.revenueWithoutTax = 0
    form.settlementAmount = 0
  }
}

watch(
  () => [form.directMaterialCost, form.directLaborCost, form.directMachineryCost, form.directExpense, form.indirectManagementFee, form.otherCost, form.revenueWithTax, form.revenueWithoutTax, form.periodManagementFee, form.periodFinancialFee],
  () => {
    form.costSubtotal = Number(form.directMaterialCost || 0) + Number(form.directLaborCost || 0) + Number(form.directMachineryCost || 0) + Number(form.directExpense || 0) + Number(form.indirectManagementFee || 0) + Number(form.otherCost || 0)
    form.operatingProfit = Number(form.revenueWithTax || 0) - Number(form.costSubtotal || 0)
    // 毛利率 = (成本合计 + 期间管理 + 期间财务) / 结算收入（除税）
    const revWithoutTax = Number(form.revenueWithoutTax || 0)
    if (revWithoutTax > 0) {
      const numerator = Number(form.costSubtotal || 0) + Number(form.periodManagementFee || 0) + Number(form.periodFinancialFee || 0)
      form.grossMarginRate = (numerator / revWithoutTax * 100).toFixed(2)
    } else {
      form.grossMarginRate = 0
    }
  }
)

const onDateChange = (val) => {
  if (val) {
    const d = new Date(val)
    form.recordYear = d.getFullYear()
    form.recordMonth = d.getMonth() + 1
  }
}

const loadData = async () => {
  loading.value = true
  try {
    if (selectedProjectId.value) {
      const { data } = await getProjectCostsByProject(selectedProjectId.value)
      list.value = data.data || []
    } else {
      const { data } = await getProjectCosts(selectedClientName.value ? { clientName: selectedClientName.value } : undefined)
      list.value = data.data || []
    }
  } catch { ElMessage.error('获取数据失败') }
  finally { loading.value = false }
}

const resetForm = () => { Object.assign(form, { id: null, projectId: null, recordDate: '', recordYear: null, recordMonth: null, revenueWithTax: 0, revenueWithoutTax: 0, settlementAmount: 0, directMaterialCost: 0, directLaborCost: 0, directMachineryCost: 0, directExpense: 0, indirectManagementFee: 0, otherCost: 0, costSubtotal: 0, operatingProfit: 0, inputTax: 0, periodManagementFee: 0, periodFinancialFee: 0, projectCostAmount: 0, loanAmount: 0, fundsOccupation: 0, grossMarginRate: 0, remark: '', createdBy: '', updatedBy: '' }) }

const handleAdd = () => { resetForm(); isEdit.value = false; dialogVisible.value = true }
const handleEdit = (row) => { resetForm(); isEdit.value = true; Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] }); dialogVisible.value = true }

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) { await updateProjectCost(form); ElMessage.success('更新成功') }
    else { await addProjectCost(form); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } catch { ElMessage.error('操作失败') }
  finally { submitLoading.value = false }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此条成本记录？', '提示', { type: 'warning' }).then(async () => {
    try { await deleteProjectCost(row.id); ElMessage.success('删除成功'); loadData() } catch { ElMessage.error('删除失败') }
  }).catch(() => {})
}

const getSummary = ({ columns, data }) => {
  const sums = []; columns.forEach((c, i) => {
    if (i === 0) { sums[i] = '合计'; return }
    if (['contractAmount', 'revenueWithTax', 'revenueWithoutTax', 'settlementAmount', 'directMaterialCost', 'directLaborCost', 'directMachineryCost', 'directExpense', 'indirectManagementFee', 'otherCost', 'costSubtotal', 'operatingProfit', 'inputTax', 'periodManagementFee', 'periodFinancialFee', 'projectCostAmount', 'loanAmount', 'fundsOccupation'].includes(c.property)) {
      const v = data.reduce((a, r) => a + Number(r[c.property] || 0), 0)
      sums[i] = v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    } else sums[i] = ''
  }); return sums
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
    const { data } = await importProjectCosts(selectedFile.value)
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
const handleDownloadTemplate = () => { window.open(getTemplateUrl('expense-items'), '_blank') }
const handleExport = async () => {
  try {
    const res = await exportProjectCosts(selectedProjectId.value)
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '项目成本详情.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) { ElMessage.error('导出失败：' + (e.response?.data?.message || e.message)) }
}
onMounted(async () => {
  try {
    const [projRes, clientRes] = await Promise.all([getProjects(), getClients()])
    allProjects.value = projRes.data?.data || []
    clients.value = clientRes.data?.data || []
  } catch { /* ignore */ }
  loadData()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>