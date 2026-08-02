<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目报表查询</span>
          <div>
            <el-select v-model="query.projectId" placeholder="选择项目" clearable style="width:220px;margin-right:8px">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-input :model-value="query.year" @input="(v) => query.year = allowNumber(v)" placeholder="年" style="width:110px;margin-right:8px" />
            <el-input :model-value="query.month" @input="(v) => query.month = allowNumber(v)" placeholder="月(可选)" style="width:120px;margin-right:8px" />
            <el-input :model-value="query.feeRate" @input="(v) => query.feeRate = allowNumber(v)" placeholder="手续费%" style="width:120px;margin-right:8px" />
            <el-button type="primary" @click="loadAll" :loading="loading">查询</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="应收债权" name="receivable">
          <el-table :data="receivableData" v-loading="loading" stripe show-summary :summary-method="getReceivableSummary" size="small">
            <el-table-column prop="projectCode" label="项目编号" width="110" />
            <el-table-column prop="projectName" label="项目名称" min-width="140" />
            <el-table-column prop="clientName" label="客户名称" width="110" />
            <el-table-column prop="contractAmount" label="合同金额" width="120" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
            <el-table-column prop="settlementAmount" label="结算金额" width="120" align="right"><template #default="{ row }">{{ fmt(row.settlementAmount) }}</template></el-table-column>
            <el-table-column prop="invoicedAmount" label="已开发票" width="120" align="right"><template #default="{ row }">{{ fmt(row.invoicedAmount) }}</template></el-table-column>
            <el-table-column prop="receivedAmount" label="已回款" width="120" align="right"><template #default="{ row }">{{ fmt(row.receivedAmount) }}</template></el-table-column>
            <el-table-column prop="settledNotInvoiced" label="已结算未开" width="120" align="right"><template #default="{ row }">{{ fmt(row.settledNotInvoiced) }}</template></el-table-column>
            <el-table-column prop="invoicedNotReceived" label="已票未收款" width="120" align="right"><template #default="{ row }">{{ fmt(row.invoicedNotReceived) }}</template></el-table-column>
            <el-table-column prop="subtotal" label="小计" width="120" align="right"><template #default="{ row }">{{ fmt(row.subtotal) }}</template></el-table-column>
            <el-table-column prop="deposit" label="质保金" width="110" align="right"><template #default="{ row }">{{ fmt(row.deposit) }}</template></el-table-column>
            <el-table-column prop="depositPeriod" label="期限" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="增值税发票管理台账" name="paymentMonth">
          <el-table :data="paymentMonthData" v-loading="loading" stripe size="small">
            <el-table-column prop="projectCode" label="项目编号" width="100" />
            <el-table-column prop="projectName" label="项目名称" width="130" />
            <el-table-column prop="clientName" label="客户" width="100" />
            <el-table-column prop="contractAmount" label="合同金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
            <el-table-column label="项目累计" align="center">
              <el-table-column prop="totalSettlementAmount" label="结算" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalSettlementAmount) }}</template></el-table-column>
              <el-table-column prop="totalInvoiceAmount" label="已开发票" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalInvoiceAmount) }}</template></el-table-column>
              <el-table-column prop="totalPaymentAmount" label="回款" width="100" align="right"><template #default="{ row }">{{ fmt(row.totalPaymentAmount) }}</template></el-table-column>
            </el-table-column>
            <el-table-column label="当年合计" align="center">
              <el-table-column prop="yearSettlementAmount" label="结算" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearSettlementAmount) }}</template></el-table-column>
              <el-table-column prop="yearInvoiceAmount" label="已开发票" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearInvoiceAmount) }}</template></el-table-column>
              <el-table-column prop="yearPaymentAmount" label="回款" width="100" align="right"><template #default="{ row }">{{ fmt(row.yearPaymentAmount) }}</template></el-table-column>
            </el-table-column>
            <el-table-column v-for="m in 12" :key="'pm'+m" :label="m+'月'" align="center" width="180">
              <el-table-column :prop="'m'+m+'SettlementAmount'" label="结算" width="60" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'SettlementAmount']) }}</template></el-table-column>
              <el-table-column :prop="'m'+m+'InvoiceAmount'" label="发票" width="60" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'InvoiceAmount']) }}</template></el-table-column>
              <el-table-column :prop="'m'+m+'PaymentAmount'" label="回款" width="60" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'PaymentAmount']) }}</template></el-table-column>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="进项税额统计" name="inputTax">
          <el-table :data="inputTaxData" v-loading="loading" stripe show-summary :summary-method="getInputTaxSummary" size="small">
            <el-table-column prop="projectCode" label="项目编号" width="110" />
            <el-table-column prop="projectName" label="项目名称" min-width="150" />
            <el-table-column prop="lastYearTax" label="上年度" width="110" align="right"><template #default="{ row }">{{ fmt(row.lastYearTax) }}</template></el-table-column>
            <el-table-column v-for="m in 12" :key="'it'+m" :prop="'m'+m+'Tax'" :label="m+'月'" width="100" align="right"><template #default="{ row }">{{ fmt(row['m'+m+'Tax']) }}</template></el-table-column>
            <el-table-column prop="yearTax" label="本年累计" width="120" align="right"><template #default="{ row }">{{ fmt(row.yearTax) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="收付实现制台账" name="cashFlow">
          <el-table :data="cashFlowData" v-loading="loading" stripe show-summary :summary-method="getCashFlowSummary" size="small">
            <el-table-column prop="projectCode" label="项目编号" width="100" />
            <el-table-column prop="projectName" label="项目名称" width="130" />
            <el-table-column prop="contractAmount" label="合同金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
            <el-table-column prop="receivableBalance" label="应收账款余额" width="120" align="right"><template #default="{ row }">{{ fmt(row.receivableBalance) }}</template></el-table-column>
            <el-table-column prop="invoicedAmount" label="已票金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.invoicedAmount) }}</template></el-table-column>
            <el-table-column prop="notInvoicedAmount" label="未票金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.notInvoicedAmount) }}</template></el-table-column>
            <el-table-column prop="receivedAmount" label="收回款项" width="110" align="right"><template #default="{ row }">{{ fmt(row.receivedAmount) }}</template></el-table-column>
            <el-table-column prop="costAmount" label="成本费用" width="110" align="right"><template #default="{ row }">{{ fmt(row.costAmount) }}</template></el-table-column>
            <el-table-column prop="outputTax" label="应交增值税" width="110" align="right"><template #default="{ row }">{{ fmt(row.outputTax) }}</template></el-table-column>
            <el-table-column prop="businessTax" label="营业税及附加" width="120" align="right"><template #default="{ row }">{{ fmt(row.businessTax) }}</template></el-table-column>
            <el-table-column prop="costPayment" label="成本支付" width="110" align="right"><template #default="{ row }">{{ fmt(row.costPayment) }}</template></el-table-column>
            <el-table-column prop="handlingFee" label="手续费" width="100" align="right"><template #default="{ row }">{{ fmt(row.handlingFee) }}</template></el-table-column>
            <el-table-column prop="managementFee" label="管理费用" width="110" align="right"><template #default="{ row }">{{ fmt(row.managementFee) }}</template></el-table-column>
            <el-table-column prop="loanAmount" label="借款金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.loanAmount) }}</template></el-table-column>
            <el-table-column prop="fundsOccupation" label="资金占用" width="110" align="right"><template #default="{ row }">{{ fmt(row.fundsOccupation) }}</template></el-table-column>
            <el-table-column prop="fundBalance" label="资金结余" width="110" align="right"><template #default="{ row }">{{ fmt(row.fundBalance) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="项目损益汇总" name="profit">
          <el-table :data="profitData" v-loading="loading" stripe show-summary :summary-method="getProfitSummary" size="small">
            <el-table-column prop="projectCode" label="项目编号" width="100" />
            <el-table-column prop="projectName" label="项目名称" width="130" />
            <el-table-column prop="contractAmount" label="合同金额" width="110" align="right"><template #default="{ row }">{{ fmt(row.contractAmount) }}</template></el-table-column>
            <el-table-column prop="revenueWithoutTax" label="营业收入(不含税)" width="130" align="right"><template #default="{ row }">{{ fmt(row.revenueWithoutTax) }}</template></el-table-column>
            <el-table-column prop="businessTax" label="营业税及附加" width="120" align="right"><template #default="{ row }">{{ fmt(row.businessTax) }}</template></el-table-column>
            <el-table-column label="营业成本" align="center">
              <el-table-column prop="actualCost" label="实际发生" width="110" align="right"><template #default="{ row }">{{ fmt(row.actualCost) }}</template></el-table-column>
              <el-table-column prop="estimatedCost" label="预计成本" width="110" align="right"><template #default="{ row }">{{ fmt(row.estimatedCost) }}</template></el-table-column>
              <el-table-column prop="totalCost" label="合计" width="110" align="right"><template #default="{ row }">{{ fmt(row.totalCost) }}</template></el-table-column>
            </el-table-column>
            <el-table-column prop="operatingProfit" label="营业利润" width="110" align="right"><template #default="{ row }">{{ fmt(row.operatingProfit) }}</template></el-table-column>
            <el-table-column label="期间费用" align="center">
              <el-table-column prop="periodManagementFee" label="管理费用" width="110" align="right"><template #default="{ row }">{{ fmt(row.periodManagementFee) }}</template></el-table-column>
              <el-table-column prop="periodFinancialFee" label="财务费用" width="110" align="right"><template #default="{ row }">{{ fmt(row.periodFinancialFee) }}</template></el-table-column>
              <el-table-column prop="periodTotalFee" label="合计" width="110" align="right"><template #default="{ row }">{{ fmt(row.periodTotalFee) }}</template></el-table-column>
            </el-table-column>
            <el-table-column prop="profitBeforeTax" label="税前利润" width="110" align="right"><template #default="{ row }">{{ fmt(row.profitBeforeTax) }}</template></el-table-column>
            <el-table-column prop="profitRate" label="利润率%" width="100" align="right"><template #default="{ row }">{{ row.profitRate }}%</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjects, getReceivableReport, getPaymentMonthReport, getInputTaxReport, getCashFlowReport, getProfitReport } from '../api'

const activeTab = ref('receivable')
const loading = ref(false)
const projects = ref([])
const query = reactive({ year: new Date().getFullYear(), month: null, projectId: null, feeRate: 10 })

const receivableData = ref([])
const paymentMonthData = ref([])
const inputTaxData = ref([])
const cashFlowData = ref([])
const profitData = ref([])

const fmt = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'

const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) {
    s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  }
  return s === '' ? 0 : s
}

const loadAll = async () => {
  loading.value = true
  const params = {}
  if (query.year) params.year = query.year
  if (query.month) params.month = query.month
  if (query.projectId) params.projectId = query.projectId
  if (query.feeRate != null) params.feeRate = query.feeRate
  try {
    const [r1, r2, r3, r4, r5] = await Promise.all([
      getReceivableReport(params),
      getPaymentMonthReport(params),
      getInputTaxReport(params),
      getCashFlowReport(params),
      getProfitReport(params)
    ])
    receivableData.value = r1.data.data || []
    paymentMonthData.value = r2.data.data || []
    inputTaxData.value = r3.data.data || []
    cashFlowData.value = r4.data.data || []
    profitData.value = r5.data.data || []
  } catch (e) {
    ElMessage.error('报表加载失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const sumProps = (data, props) => {
  const sums = {}; props.forEach(p => {
    sums[p] = data.reduce((a, r) => a + Number(r[p] || 0), 0)
  })
  return sums
}

const getReceivableSummary = ({ columns, data }) => {
  const sums = sumProps(data, ['contractAmount','settlementAmount','invoicedAmount','receivedAmount','settledNotInvoiced','invoicedNotReceived','subtotal','deposit'])
  return columns.map((c, i) => {
    if (i === 0) return '合计'
    if (sums[c.property] !== undefined) return sums[c.property].toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    return ''
  })
}

const getInputTaxSummary = ({ columns, data }) => {
  const props = ['lastYearTax','yearTax']
  for (let m = 1; m <= 12; m++) props.push('m' + m + 'Tax')
  const sums = sumProps(data, props)
  return columns.map((c, i) => {
    if (i === 0) return '合计'
    if (sums[c.property] !== undefined) return sums[c.property].toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    return ''
  })
}

const getCashFlowSummary = ({ columns, data }) => {
  const sums = sumProps(data, ['contractAmount','receivableBalance','invoicedAmount','notInvoicedAmount','receivedAmount','costAmount','outputTax','businessTax','costPayment','handlingFee','managementFee','loanAmount','fundsOccupation','fundBalance'])
  return columns.map((c, i) => {
    if (i === 0) return '合计'
    if (sums[c.property] !== undefined) return sums[c.property].toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    return ''
  })
}

const getProfitSummary = ({ columns, data }) => {
  const sums = sumProps(data, ['contractAmount','revenueWithoutTax','businessTax','actualCost','estimatedCost','totalCost','operatingProfit','periodManagementFee','periodFinancialFee','periodTotalFee','profitBeforeTax'])
  return columns.map((c, i) => {
    if (i === 0) return '合计'
    if (c.property === 'profitRate') {
      const revenue = sums['revenueWithoutTax'] || 0
      const profit = sums['profitBeforeTax'] || 0
      return revenue ? (profit * 100 / revenue).toFixed(2) + '%' : '-'
    }
    if (sums[c.property] !== undefined) return sums[c.property].toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    return ''
  })
}

onMounted(async () => {
  try {
    const { data } = await getProjects()
    projects.value = data.data || []
  } catch { /* ignore */ }
  loadAll()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
