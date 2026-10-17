<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>负责人管理</span>
          <el-button type="primary" @click="handleAdd" v-if="hasPerm('owner:create')">新增负责人</el-button>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="ownerName" label="负责人姓名" min-width="160" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)" v-if="hasPerm('owner:edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="hasPerm('owner:delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑负责人' : '新增负责人'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="负责人姓名" prop="ownerName">
          <el-input v-model="form.ownerName" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjectOwners, addProjectOwner, updateProjectOwner, deleteProjectOwner, permissionStore } from '../api'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const list = ref([])

const form = reactive({ id: null, ownerName: '', phone: '', remark: '' })

const hasPerm = (code) => permissionStore.has(code)

const rules = {
  ownerName: [{ required: true, message: '请输入负责人姓名', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const { data } = await getProjectOwners()
    list.value = data.data || []
  } catch { ElMessage.error('获取数据失败') }
  finally { loading.value = false }
}

const resetForm = () => {
  Object.assign(form, { id: null, ownerName: '', phone: '', remark: '' })
}

const handleAdd = () => { resetForm(); isEdit.value = false; dialogVisible.value = true }

const handleEdit = (row) => {
  resetForm()
  isEdit.value = true
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateProjectOwner(form)
      ElMessage.success('更新成功')
    } else {
      await addProjectOwner(form)
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
  ElMessageBox.confirm(`确定删除负责人 "${row.ownerName}"？`, '提示', { type: 'warning' }).then(async () => {
    try {
      await deleteProjectOwner(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch { ElMessage.error('删除失败') }
  }).catch(() => {})
}

onMounted(() => { loadData() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
