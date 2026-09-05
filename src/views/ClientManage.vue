<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <div>
            <el-button type="success" @click="importDialogVisible = true" v-if="hasPerm('client:create')">导入</el-button>
            <el-button type="primary" @click="handleAdd" v-if="hasPerm('client:create')">新增客户</el-button>
          </div>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="clientName" label="客户名称" min-width="160" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="contactEmail" label="联系邮箱" width="160" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="taxNo" label="税号" width="130" />
        <el-table-column prop="bankName" label="开户行" width="130" />
        <el-table-column prop="bankAccount" label="银行卡账号" width="150" />
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)" v-if="hasPerm('client:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="hasPerm('client:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑客户' : '新增客户'" width="550px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="客户名称" prop="clientName">
          <el-input v-model="form.clientName" @blur="checkDuplicateName" />
          <div v-if="duplicateNameMsg" class="duplicate-warn">{{ duplicateNameMsg }}</div>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="form.contactEmail" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="税号">
          <el-input v-model="form.taxNo" @blur="checkDuplicateTaxNo" />
          <div v-if="duplicateTaxMsg" class="duplicate-warn">{{ duplicateTaxMsg }}</div>
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="form.bankName" />
        </el-form-item>
        <el-form-item label="银行卡号">
          <el-input v-model="form.bankAccount" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入客户" width="480px">
      <div style="margin-bottom: 12px">
        <el-link type="primary" :href="templateUrl" :underline="false" target="_blank">下载导入模板</el-link>
      </div>
      <el-upload
        ref="uploadRef"
        drag
        action=""
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning('只能上传一个文件')"
      >
        <div style="padding: 20px 0">
          <div style="font-size: 40px; color: #909399">&#xe634;</div>
          <div>将 Excel 文件拖到此处，或 <em>点击上传</em></div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importLoading">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getClients, addClient, updateClient, deleteClient, importClients, checkClientDuplicate, permissionStore, getTemplateUrl } from '../api'

const loading = ref(false)
const submitLoading = ref(false)
const importLoading = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)
const list = ref([])
const importFile = ref(null)
const duplicateNameMsg = ref('')
const duplicateTaxMsg = ref('')

const templateUrl = computed(() => getTemplateUrl('client'))

const form = reactive({
  id: null, clientName: '', contactPerson: '', contactPhone: '', contactEmail: '', address: '', taxNo: '', bankName: '', bankAccount: '', remark: ''
})

const hasPerm = (code) => permissionStore.has(code)

const rules = {
  clientName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getClients()
    list.value = data.data || []
  } catch { ElMessage.error('获取数据失败') }
  finally { loading.value = false }
}

const resetForm = () => {
  Object.assign(form, { id: null, clientName: '', contactPerson: '', contactPhone: '', contactEmail: '', address: '', taxNo: '', bankName: '', bankAccount: '', remark: '' })
  duplicateNameMsg.value = ''
  duplicateTaxMsg.value = ''
}

const handleAdd = () => { resetForm(); isEdit.value = false; dialogVisible.value = true }

const handleEdit = (row) => {
  isEdit.value = true
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  duplicateNameMsg.value = ''
  duplicateTaxMsg.value = ''
  dialogVisible.value = true
}

// 检查客户名称重复
const checkDuplicateName = async () => {
  if (!form.clientName || !form.clientName.trim()) {
    duplicateNameMsg.value = ''
    return
  }
  try {
    const { data } = await checkClientDuplicate({ clientName: form.clientName.trim(), excludeId: form.id || undefined })
    if (data.code === 400) {
      duplicateNameMsg.value = data.message
      ElMessageBox.confirm(data.message + '，是否继续保存？', '重复提醒', {
        confirmButtonText: '继续',
        cancelButtonText: '修改',
        type: 'warning'
      }).catch(() => {
        formRef.value?.scrollToField('clientName')
      })
    } else {
      duplicateNameMsg.value = ''
    }
  } catch { /* ignore */ }
}

// 检查税号重复
const checkDuplicateTaxNo = async () => {
  if (!form.taxNo || !form.taxNo.trim()) {
    duplicateTaxMsg.value = ''
    return
  }
  try {
    const { data } = await checkClientDuplicate({ taxNo: form.taxNo.trim(), excludeId: form.id || undefined })
    if (data.code === 400) {
      duplicateTaxMsg.value = data.message
      ElMessageBox.confirm(data.message + '，是否继续保存？', '重复提醒', {
        confirmButtonText: '继续',
        cancelButtonText: '修改',
        type: 'warning'
      }).catch(() => {
        formRef.value?.scrollToField('taxNo')
      })
    } else {
      duplicateTaxMsg.value = ''
    }
  } catch { /* ignore */ }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      const { data: upRes } = await updateClient(form)
      if (upRes.code !== 200) { ElMessage.error(upRes.message || '更新失败'); return }
      ElMessage.success('更新成功')
    } else {
      const { data: addRes } = await addClient(form)
      if (addRes.code !== 200) { ElMessage.error(addRes.message || '新增失败'); return }
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
  finally { submitLoading.value = false }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除客户 "' + row.clientName + '"？', '提示', { type: 'warning' }).then(async () => {
    try {
      await deleteClient(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch { ElMessage.error('删除失败') }
  }).catch(() => {})
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  importLoading.value = true
  try {
    const { data } = await importClients(importFile.value)
    ElMessage.success(data.message || '导入成功')
    importDialogVisible.value = false
    importFile.value = null
    uploadRef.value?.clearFiles()
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.duplicate-warn { color: #e6a23c; font-size: 12px; line-height: 1.4; margin-top: 2px; }
</style>
