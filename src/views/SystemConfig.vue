<template>
  <div>
    <el-tabs v-model="activeTab">
      <!-- 支出项目配置 -->
      <el-tab-pane label="支出项目配置" name="expense">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>支出项目列表</span>
              <div><el-button type="success" @click="expImportVisible = true; expFile = null" v-if="hasPerm('config:expense:import')">导入Excel</el-button>
              <el-button type="primary" @click="handleAddExpense" v-if="hasPerm('config:expense:create')">新增支出项目</el-button></div>
            </div>
          </template>
          <el-table :data="expenseList" v-loading="expLoading" stripe>
            <el-table-column prop="itemCode" label="编码" width="120" />
            <el-table-column prop="itemName" label="项目名称" width="150" />
            <el-table-column prop="category" label="分类" width="120">
              <template #default="{ row }">{{ catLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column prop="costAccount" label="成本科目" min-width="150" />
            <el-table-column prop="taxRate" label="税率%" width="80" align="right" />
            <el-table-column prop="isActive" label="状态" width="80">
              <template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'danger'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="70" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEditExpense(row)" v-if="hasPerm('config:expense:edit')">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDeleteExpense(row)" v-if="hasPerm('config:expense:delete')">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 增值税项目配置 -->
      <el-tab-pane label="增值税项目配置" name="vat">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>增值税项目列表</span>
              <div><el-button type="success" @click="vatImportVisible = true; vatFile = null" v-if="hasPerm('config:vat:import')">导入Excel</el-button>
              <el-button type="primary" @click="handleAddVat" v-if="hasPerm('config:vat:create')">新增增值税项目</el-button></div>
            </div>
          </template>
          <el-table :data="vatList" v-loading="vatLoading" stripe>
            <el-table-column prop="taxRate" label="税率%" width="100" align="right" />
            <el-table-column prop="itemName" label="税目名称" width="150" />
            <el-table-column prop="taxMethod" label="计税方式" width="120">
              <template #default="{ row }">{{ row.taxMethod === 'GENERAL' ? '一般计税' : '简易计税' }}</template>
            </el-table-column>
            <el-table-column prop="isDeductible" label="可抵扣" width="80">
              <template #default="{ row }"><el-tag :type="row.isDeductible ? 'success' : 'danger'" size="small">{{ row.isDeductible ? '是' : '否' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="accountCode" label="会计科目" min-width="180" />
            <el-table-column prop="isActive" label="状态" width="80">
              <template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'danger'" size="small">{{ row.isActive ? '启用' : '禁用' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEditVat(row)" v-if="hasPerm('config:vat:edit')">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDeleteVat(row)" v-if="hasPerm('config:vat:delete')">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 支出项目弹窗 -->
    <el-dialog v-model="expDialogVisible" :title="expIsEdit ? '编辑支出项目' : '新增支出项目'" width="500px">
      <el-form :model="expForm" ref="expFormRef" label-width="100px">
        <el-form-item label="项目编码" prop="itemCode"><el-input v-model="expForm.itemCode" /></el-form-item>
        <el-form-item label="项目名称"><el-input v-model="expForm.itemName" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="expForm.category" style="width:100%">
            <el-option label="材料" value="MATERIAL" /><el-option label="劳务" value="LABOR" /><el-option label="机械" value="MACHINERY" />
            <el-option label="差旅" value="TRAVEL" /><el-option label="分包" value="SUBCONTRACT" /><el-option label="管理" value="MANAGEMENT" /><el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本科目"><el-input v-model="expForm.costAccount" /></el-form-item>
        <el-form-item label="税率%"><el-input :model-value="expForm.taxRate" @input="(v) => expForm.taxRate = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
        <el-form-item label="是否启用"><el-switch v-model="expForm.isActive" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="排序"><el-input :model-value="expForm.sortOrder" @input="(v) => expForm.sortOrder = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="expForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="expDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmitExpense" :loading="expSubmitting">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 增值税项目弹窗 -->
    <el-dialog v-model="vatDialogVisible" :title="vatIsEdit ? '编辑增值税项目' : '新增增值税项目'" width="500px">
      <el-form :model="vatForm" ref="vatFormRef" label-width="100px">
        <el-form-item label="税率%"><el-input :model-value="vatForm.taxRate" @input="(v) => vatForm.taxRate = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
        <el-form-item label="税目名称"><el-input v-model="vatForm.itemName" /></el-form-item>
        <el-form-item label="计税方式">
          <el-select v-model="vatForm.taxMethod" style="width:100%">
            <el-option label="一般计税" value="GENERAL" /><el-option label="简易计税" value="SIMPLE" />
          </el-select>
        </el-form-item>
        <el-form-item label="可抵扣"><el-switch v-model="vatForm.isDeductible" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="会计科目"><el-input v-model="vatForm.accountCode" /></el-form-item>
        <el-form-item label="是否启用"><el-switch v-model="vatForm.isActive" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="排序"><el-input :model-value="vatForm.sortOrder" @input="(v) => vatForm.sortOrder = allowNumber(v)" placeholder="请输入数字" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="vatForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vatDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmitVat" :loading="vatSubmitting">确 定</el-button>
      </template>
    </el-dialog>
    <!-- Excel导入弹窗 -->
    <el-dialog v-model="expImportVisible" title="导入支出项目配置Excel" width="450px">
      <el-upload
        ref="expUploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleExpFileChange"
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
        <el-button @click="expImportVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleExpImport" :loading="expImportLoading">导 入</el-button>
      </template>
    </el-dialog>
    <!-- Excel导入弹窗 -->
    <el-dialog v-model="vatImportVisible" title="导入增值税项目配置Excel" width="450px">
      <el-upload
        ref="vatUploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleVatFileChange"
        :on-exceed="() => ElMessage.warning('只能上传一个文件')"
      >
        <el-icon style="font-size:40px;color:#409eff"><Upload /></el-icon>
        <div>将 Excel 文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 .xlsx / .xls 文件</div>
          <div style="margin-top:8px">
            <el-link type="primary" :underline="false" :href="getTemplateUrl('vat-items')" target="_blank">
              <el-icon style="vertical-align:middle"><Download /></el-icon> 下载导入模板
            </el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="vatImportVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleVatImport" :loading="vatImportLoading">导 入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExpenseItems, addExpenseItem, updateExpenseItem, deleteExpenseItem, getVatItems, addVatItem, updateVatItem, deleteVatItem, importExpenseItems, importVatItems, permissionStore, getTemplateUrl } from '../api'
import { Upload, Download } from '@element-plus/icons-vue'

const hasPerm = (code) => permissionStore.has(code)

const activeTab = ref('expense')
const catLabel = (c) => ({ MATERIAL: '材料', LABOR: '劳务', MACHINERY: '机械', TRAVEL: '差旅', SUBCONTRACT: '分包', MANAGEMENT: '管理', OTHER: '其他' }[c] || c || '-')

const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) {
    s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  }
  return s === '' ? 0 : s
}

// === 支出项目 ===
const expLoading = ref(false); const expSubmitting = ref(false); const expDialogVisible = ref(false); const expIsEdit = ref(false)
const expFormRef = ref(null); const expenseList = ref([])
const expForm = reactive({ id: null, itemCode: '', itemName: '', category: '', costAccount: '', taxRate: 0, isActive: 1, sortOrder: 0, remark: '' })

const loadExpenseItems = async () => { expLoading.value = true; try { const { data } = await getExpenseItems(); expenseList.value = data.data || [] } catch {} finally { expLoading.value = false } }
const resetExpForm = () => { Object.assign(expForm, { id: null, itemCode: '', itemName: '', category: '', costAccount: '', taxRate: 0, isActive: 1, sortOrder: 0, remark: '' }) }
const handleAddExpense = () => { resetExpForm(); expIsEdit.value = false; expDialogVisible.value = true }
const handleEditExpense = (row) => { resetExpForm(); expIsEdit.value = true; Object.keys(expForm).forEach(k => { if (row[k] !== undefined) expForm[k] = row[k] }); expDialogVisible.value = true }
const handleSubmitExpense = async () => { expSubmitting.value = true; try { if (expIsEdit.value) { await updateExpenseItem(expForm); ElMessage.success('更新成功') } else { await addExpenseItem(expForm); ElMessage.success('新增成功') }; expDialogVisible.value = false; loadExpenseItems() } catch { ElMessage.error('操作失败') } finally { expSubmitting.value = false } }
const handleDeleteExpense = (row) => { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { try { await deleteExpenseItem(row.id); ElMessage.success('删除成功'); loadExpenseItems() } catch {} }).catch(() => {}) }

// === 增值税项目 ===
const vatLoading = ref(false); const vatSubmitting = ref(false); const vatDialogVisible = ref(false); const vatIsEdit = ref(false)
const vatFormRef = ref(null); const vatList = ref([])
const vatForm = reactive({ id: null, taxRate: 0, itemName: '', taxMethod: 'GENERAL', isDeductible: 1, accountCode: '', isActive: 1, sortOrder: 0, remark: '' })

const loadVatItems = async () => { vatLoading.value = true; try { const { data } = await getVatItems(); vatList.value = data.data || [] } catch {} finally { vatLoading.value = false } }
const resetVatForm = () => { Object.assign(vatForm, { id: null, taxRate: 0, itemName: '', taxMethod: 'GENERAL', isDeductible: 1, accountCode: '', isActive: 1, sortOrder: 0, remark: '' }) }
const handleAddVat = () => { resetVatForm(); vatIsEdit.value = false; vatDialogVisible.value = true }
const handleEditVat = (row) => { resetVatForm(); vatIsEdit.value = true; Object.keys(vatForm).forEach(k => { if (row[k] !== undefined) vatForm[k] = row[k] }); vatDialogVisible.value = true }
const handleSubmitVat = async () => { vatSubmitting.value = true; try { if (vatIsEdit.value) { await updateVatItem(vatForm); ElMessage.success('更新成功') } else { await addVatItem(vatForm); ElMessage.success('新增成功') }; vatDialogVisible.value = false; loadVatItems() } catch { ElMessage.error('操作失败') } finally { vatSubmitting.value = false } }
const handleDeleteVat = (row) => { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { try { await deleteVatItem(row.id); ElMessage.success('删除成功'); loadVatItems() } catch {} }).catch(() => {}) }


// === 支出项目导入 ===
const expImportVisible = ref(false)
const expImportLoading = ref(false)
const expUploadRef = ref(null)
const expFile = ref(null)
const handleExpFileChange = (file) => { expFile.value = file.raw }
const handleExpImport = async () => {
  if (!expFile.value) { ElMessage.warning('请先选择文件'); return }
  expImportLoading.value = true
  try {
    const { data } = await importExpenseItems(expFile.value)
    if (data.code === 200) { ElMessage.success(data.message + '，共导入 ' + data.data + ' 条'); expImportVisible.value = false; loadExpenseItems() }
    else { ElMessage.error(data.message) }
  } catch (e) { ElMessage.error('导入失败：' + (e.response?.data?.message || e.message)) }
  finally { expImportLoading.value = false; expFile.value = null }
}

// === 增值税项目导入 ===
const vatImportVisible = ref(false)
const vatImportLoading = ref(false)
const vatUploadRef = ref(null)
const vatFile = ref(null)
const handleVatFileChange = (file) => { vatFile.value = file.raw }
const handleVatImport = async () => {
  if (!vatFile.value) { ElMessage.warning('请先选择文件'); return }
  vatImportLoading.value = true
  try {
    const { data } = await importVatItems(vatFile.value)
    if (data.code === 200) { ElMessage.success(data.message + '，共导入 ' + data.data + ' 条'); vatImportVisible.value = false; loadVatItems() }
    else { ElMessage.error(data.message) }
  } catch (e) { ElMessage.error('导入失败：' + (e.response?.data?.message || e.message)) }
  finally { vatImportLoading.value = false; vatFile.value = null }
}

onMounted(() => { loadExpenseItems(); loadVatItems() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
