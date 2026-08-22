<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>备份文件列表（每日 19:00 自动备份）</span>
          <el-button type="primary" @click="handleBackupNow" :loading="backingUp" v-if="hasPerm('backup:view')">
            <el-icon style="margin-right:4px"><FolderAdd /></el-icon>立即备份
          </el-button>
        </div>
      </template>

      <el-table :data="backupList" v-loading="loading" stripe>
        <el-table-column prop="fileName" label="文件名" min-width="220" />
        <el-table-column label="文件大小" width="120" align="right">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="备份时间" width="180">
          <template #default="{ row }">{{ formatTime(row.lastModified) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDownload(row)" v-if="hasPerm('backup:download')">
              <el-icon style="margin-right:2px"><Download /></el-icon>下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBackups, backupNow, downloadBackup, permissionStore } from '../api'
import { Download, FolderAdd } from '@element-plus/icons-vue'

const hasPerm = (code) => permissionStore.has(code)

const loading = ref(false)
const backingUp = ref(false)
const backupList = ref([])

const formatSize = (bytes) => {
  if (bytes == null) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const loadBackups = async () => {
  loading.value = true
  try {
    const { data } = await getBackups()
    if (data.code === 200) {
      backupList.value = data.data || []
    } else {
      ElMessage.error(data.message || '获取备份列表失败')
    }
  } catch {
    ElMessage.error('获取备份列表失败')
  } finally {
    loading.value = false
  }
}

const handleBackupNow = async () => {
  backingUp.value = true
  try {
    const { data } = await backupNow()
    if (data.code === 200) {
      ElMessage.success('备份成功：' + data.data)
      loadBackups()
    } else {
      ElMessage.error(data.message || '备份失败')
    }
  } catch (e) {
    ElMessage.error('备份失败：' + (e.response?.data?.message || e.message))
  } finally {
    backingUp.value = false
  }
}

const handleDownload = async (row) => {
  try {
    const res = await downloadBackup(row.fileName)
    const blob = new Blob([res.data], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
  loadBackups()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
