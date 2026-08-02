<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <el-button type="primary" @click="handleAddRole">新增角色</el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <!-- 左侧角色列表 -->
        <el-col :span="6">
          <el-card shadow="never">
            <template #header><span>角色列表</span></template>
            <div v-for="r in roles" :key="r.id" class="role-item"
              :class="{ active: selectedRole?.id === r.id }" @click="selectRole(r)">
              <div>
                <span>{{ r.roleName }}</span>
                <span style="font-size:12px;color:#999;margin-left:6px">{{ r.roleCode }}</span>
              </div>
              <div v-if="r.id !== 1">
                <el-button size="small" type="primary" link @click.stop="handleEditRole(r)">编辑</el-button>
                <el-popconfirm title="确定删除该角色？" @confirm="handleDeleteRole(r.id)">
                  <template #reference>
                    <el-button size="small" type="danger" link @click.stop>删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
              <span v-else style="font-size:12px;color:#999">系统保留</span>
            </div>
          </el-card>
        </el-col>
        <!-- 右侧权限分配 -->
        <el-col :span="18">
          <el-card shadow="never" v-if="selectedRole">
            <template #header>
              <div class="card-header">
                <span>为 "{{ selectedRole.roleName }}" 分配权限</span>
                <el-button type="primary" size="small" @click="savePermissions" :loading="permSaving">保存权限</el-button>
              </div>
            </template>
            <div v-for="(perms, module) in permissionGroups" :key="module" style="margin-bottom:16px">
              <div style="font-weight:bold;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #eee">{{ module }}</div>
              <el-checkbox-group v-model="checkedPermIds">
                <el-checkbox v-for="p in perms" :key="p.id" :label="p.id" style="margin-right:16px;margin-bottom:4px">
                  {{ p.permissionName }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <el-empty v-if="!Object.keys(permissionGroups).length" description="暂无权限数据" />
          </el-card>
          <el-empty v-if="!selectedRole" description="请先选择一个角色" />
        </el-col>
      </el-row>
    </el-card>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="450px">
      <el-form :model="roleForm" ref="roleFormRef" :rules="roleRules" label-width="80px">
        <el-form-item label="角色名称" prop="roleName"><el-input v-model="roleForm.roleName" /></el-form-item>
        <el-form-item label="角色编码" prop="roleCode"><el-input v-model="roleForm.roleCode" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="roleForm.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitRole" :loading="roleSubmitting">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoles, addRole, updateRole, deleteRole, getAllPermissions, getRolePermissions, assignRolePermissions } from '../api'

const roles = ref([])
const selectedRole = ref(null)
const permissionGroups = ref({})
const checkedPermIds = ref([])
const permSaving = ref(false)

const roleDialogVisible = ref(false)
const roleDialogTitle = ref('新增角色')
const roleSubmitting = ref(false)
const roleFormRef = ref(null)
const roleForm = reactive({ id: null, roleName: '', roleCode: '', description: '' })
const roleRules = {
  roleName: [{ required: true, message: '请输入角色名称' }],
  roleCode: [{ required: true, message: '请输入角色编码' }]
}

const loadRoles = async () => {
  try { const { data } = await getRoles(); roles.value = data.data || [] } catch {}
}
const loadPermissions = async () => {
  try { const { data } = await getAllPermissions(); permissionGroups.value = data.data || {} } catch {}
}
const selectRole = async (role) => {
  selectedRole.value = role
  try { const { data } = await getRolePermissions(role.id); checkedPermIds.value = data.data || [] } catch { checkedPermIds.value = [] }
}
const savePermissions = async () => {
  permSaving.value = true
  try {
    await assignRolePermissions(selectedRole.value.id, checkedPermIds.value)
    ElMessage.success('权限保存成功')
  } catch { ElMessage.error('保存失败') }
  finally { permSaving.value = false }
}

const handleAddRole = () => {
  roleDialogTitle.value = '新增角色'
  roleForm.id = null; roleForm.roleName = ''; roleForm.roleCode = ''; roleForm.description = ''
  roleDialogVisible.value = true
}
const handleEditRole = (role) => {
  roleDialogTitle.value = '编辑角色'
  roleForm.id = role.id; roleForm.roleName = role.roleName; roleForm.roleCode = role.roleCode; roleForm.description = role.description
  roleDialogVisible.value = true
}
const submitRole = async () => {
  const valid = await roleFormRef.value.validate().catch(() => false)
  if (!valid) return
  roleSubmitting.value = true
  try {
    if (roleForm.id) { await updateRole(roleForm); ElMessage.success('更新成功') }
    else { await addRole(roleForm); ElMessage.success('新增成功') }
    roleDialogVisible.value = false
    loadRoles()
  } catch { ElMessage.error('操作失败') }
  finally { roleSubmitting.value = false }
}
const handleDeleteRole = async (id) => {
  try { await deleteRole(id); ElMessage.success('删除成功'); loadRoles(); selectedRole.value = null } catch { ElMessage.error('删除失败') }
}

onMounted(() => { loadRoles(); loadPermissions() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.role-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; }
.role-item:hover { background: #f0f2f5; }
.role-item.active { background: #e6f7ff; border-left: 3px solid #409eff; }
</style>
