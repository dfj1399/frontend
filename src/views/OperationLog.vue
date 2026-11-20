<template>
  <div>
    <el-card>
      <template #header><span>操作日志</span></template>
      <!-- 筛选条件 -->
      <el-form :inline="true" :model="filters">
        <el-form-item label="时间段">
          <el-date-picker v-model="filters.dateRange" type="datetimerange" range-separator="至"
            start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="filters.module" placeholder="全部" clearable style="width:140px" @change="onModuleChange">
            <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.operationType" placeholder="全部" clearable style="width:140px">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查 询</el-button>
          <el-button @click="reset">重 置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe class="list-table" max-height="calc(100vh - 320px)">
        <el-table-column prop="username" label="操作人" width="100" />
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="operationType" label="操作类型" width="100" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="targetName" label="目标" width="150" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP" width="130" />
        <el-table-column label="操作时间" width="170">
          <template #default="{ row }">{{ row.createdAt ? row.createdAt.replace('T', ' ') : '' }}</template>
        </el-table-column>
      </el-table>

      <TablePagination :total="total" v-model:page="page" v-model:size="pageSize" @change="onPaginationChange" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import TablePagination from '../components/TablePagination.vue'
import { getOperationLogs, getLogModules, getLogTypes } from '../api'

const loading = ref(false)
const list = ref([])
const modules = ref([])
const types = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filters = reactive({ dateRange: null, module: '', operationType: '' })

const loadModules = async () => {
  try { const { data } = await getLogModules(); modules.value = data.data || [] } catch {}
}
const onModuleChange = async (m) => {
  filters.operationType = ''
  try { const { data } = await getLogTypes(m || ''); types.value = data.data || [] } catch {}
}
const search = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value === 'all' ? 100000 : pageSize.value }
    if (filters.module) params.module = filters.module
    if (filters.operationType) params.operationType = filters.operationType
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    const { data } = await getOperationLogs(params)
    list.value = data.list || []
    total.value = data.total || 0
  } catch {}
  finally { loading.value = false }
}
const onPaginationChange = ({ page: p, size: s }) => {
  page.value = p
  pageSize.value = s
  search()
}
const reset = () => { filters.dateRange = null; filters.module = ''; filters.operationType = ''; types.value = []; search() }

onMounted(() => { loadModules(); search() })
</script>
