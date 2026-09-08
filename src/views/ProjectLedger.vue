<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目台账</span>
          <div>
            <el-select v-model="query.projectId" placeholder="选择项目" clearable style="width:240px;margin-right:8px">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-date-picker v-model="query.year" type="year" format="YYYY" value-format="YYYY" placeholder="选择年份" clearable style="width:130px;margin-right:8px" />
            <el-button type="primary" @click="loadData" :loading="loading">查询</el-button>
          </div>
        </div>
      </template>

      <div v-if="report.projectCode" class="project-info">
        <span>工程编号：{{ report.projectCode }}</span>
        <span>工程名称：{{ report.projectName }}</span>
        <span v-if="report.owner">负责人：{{ report.owner }}</span>
        <span>查询年度：{{ report.year }}年</span>
      </div>

      <el-table
        :data="report.rows"
        v-loading="loading"
        stripe
        border
        size="small"
        :max-height="560"
        style="width:100%;margin-top:12px"
        :header-cell-style="{background:'#f5f7fa'}"
      >
        <el-table-column prop="rowNo" label="行号" width="50" align="center" fixed />
        <el-table-column prop="itemName" label="项目内容" width="130" fixed>
          <template #default="{ row }">
            <span :class="getItemClass(row.rowNo)">{{ row.itemName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="budgetAmount" label="合同预算" width="110" align="right" fixed>
          <template #default="{ row }">{{ fmtCell(row, row.budgetAmount) }}</template>
        </el-table-column>

        <el-table-column label="以前年度情况" align="center">
          <el-table-column prop="priorTotal" label="以前年度" width="100" align="right">
            <template #default="{ row }">{{ fmtCell(row, row.priorTotal) }}</template>
          </el-table-column>
          <el-table-column prop="priorPriorYear" label="上上年" width="100" align="right">
            <template #default="{ row }">{{ fmtCell(row, row.priorPriorYear) }}</template>
          </el-table-column>
          <el-table-column prop="priorYear" label="上年" width="100" align="right">
            <template #default="{ row }">{{ fmtCell(row, row.priorYear) }}</template>
          </el-table-column>
          <el-table-column prop="priorSum" label="以前年度情况合计" width="130" align="right">
            <template #default="{ row }">{{ fmtCell(row, row.priorSum) }}</template>
          </el-table-column>
        </el-table-column>

        <el-table-column :label="query.year + '年'" align="center">
          <el-table-column v-for="m in 12" :key="'m'+m" :prop="'m'+m" :label="m+'月'" width="90" align="right">
            <template #default="{ row }">{{ fmtCell(row, row['m'+m]) }}</template>
          </el-table-column>
        </el-table-column>

        <el-table-column prop="yearTotal" label="本年累计" width="110" align="right">
          <template #default="{ row }">{{ fmtCell(row, row.yearTotal) }}</template>
        </el-table-column>
        <el-table-column prop="cumulativeTotal" label="累计完成" width="110" align="right">
          <template #default="{ row }">{{ fmtCell(row, row.cumulativeTotal) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
      </el-table>

      <el-empty v-if="!loading && !report.rows.length" description="暂无数据，请选择项目后查询" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjects, getProjectLedgerReport } from '../api'

const loading = ref(false)
const projects = ref([])
const query = reactive({ year: new Date().getFullYear(), projectId: null })
const report = reactive({ projectId: null, projectCode: '', projectName: '', owner: '', year: null, rows: [] })

const fmt = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'

// 指标情况、结算情况为纯标题行，不显示任何金额数据
const blankRows = ['指标情况', '结算情况']
const fmtCell = (row, v) => blankRows.includes(row.itemName) ? '' : fmt(v)

const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) {
    s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  }
  return s === '' ? 0 : s
}

// 分类标题行（加粗显示）：项目支出、指标情况、结算情况
const categoryHeaders = [1, 12, 15]

// 分类下的明细行（左侧缩进）
// 项目支出 2-8，合同总额 10-11，指标情况 13-14，应交增值税 20-23
const detailRows = [2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 20, 21, 22, 23]

const getItemClass = (rowNo) => {
  if (categoryHeaders.includes(rowNo)) return 'category-header'
  if (detailRows.includes(rowNo)) return 'detail-item'
  return ''
}

const loadData = async () => {
  if (!query.projectId) {
    ElMessage.warning('请选择项目')
    return
  }
  loading.value = true
  const params = { projectId: query.projectId }
  if (query.year) params.year = query.year
  try {
    const { data } = await getProjectLedgerReport(params)
    const r = data.data || {}
    report.projectId = r.projectId
    report.projectCode = r.projectCode
    report.projectName = r.projectName
    report.owner = r.owner || ''
    report.year = r.year
    report.rows = r.rows || []
  } catch (e) {
    ElMessage.error('项目台账加载失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await getProjects()
    projects.value = data.data || []
  } catch { /* ignore */ }
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.project-info { font-size: 14px; color: #606266; }
.project-info span { margin-right: 24px; }
.category-header { font-weight: bold; }
.detail-item { padding-left: 20px; }
</style>
