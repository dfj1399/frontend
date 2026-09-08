<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>项目结算回款</span>
          <div>
            <el-select v-model="selectedClientName" placeholder="选择客户" clearable style="width:180px;margin-right:8px" @change="onClientChange">
              <el-option v-for="c in clients" :key="c.clientName" :label="c.clientName" :value="c.clientName" />
            </el-select>
            <el-select v-model="selectedProjectId" placeholder="选择项目" clearable style="width:220px;margin-right:8px" @change="loadGroupedData">
              <el-option v-for="p in projects" :key="p.id" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.id" />
            </el-select>
            <el-button type="success" v-if="hasPerm('payment:import')" @click="importDialogVisible = true; selectedFile = null">导入Excel</el-button>
            <el-button type="info" @click="handleDownloadTemplate">下载模板</el-button>
            <el-button type="warning" v-if="hasPerm('payment:export')" @click="handleExport">导出Excel</el-button>
          </div>
        </div>
      </template>

      <el-table :data="groupedList" v-loading="loading" stripe show-summary :summary-method="getSummary">
        <el-table-column prop="projectCode" label="项目编号" width="110" show-overflow-tooltip />
        <el-table-column prop="projectName" label="项目名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link v-if="hasPerm('payment:detail')" type="primary" @click="showHistory(row)">{{ row.projectName }}</el-link>
            <span v-else>{{ row.projectName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="clientName" label="客户名称" width="100" show-overflow-tooltip />
        <el-table-column prop="contractAmount" label="合同金额" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.contractAmount) }}</template>
        </el-table-column>
        <el-table-column prop="totalSettlement" label="累计结算" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.totalSettlement) }}</template>
        </el-table-column>
        <el-table-column prop="totalInvoice" label="累计开票" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.totalInvoice) }}</template>
        </el-table-column>
        <el-table-column prop="totalPayment" label="累计回款" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.totalPayment) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="270" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('payment:receive')" type="success" size="small" @click="openPaymentDialog(row)">回款</el-button>
            <el-button v-if="hasPerm('payment:settle')" type="warning" size="small" @click="openSettlementDialog(row)">结算</el-button>
            <el-button v-if="hasPerm('payment:invoice')" type="primary" size="small" @click="openInvoiceDialog(row)">开票</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ==================== 回款对话框 ==================== -->
    <el-dialog v-model="paymentDialogVisible" title="新增回款" width="550px">
      <el-form :model="paymentForm" :rules="paymentRules" ref="paymentFormRef" label-width="90px">
        <el-form-item label="项目">
          <span>{{ currentProjectName }}</span>
        </el-form-item>
        <el-form-item label="关联结算" prop="refLogId">
          <el-select v-model="paymentForm.refLogId" placeholder="选择结算记录" style="width:100%" @change="onSettlementChange">
            <el-option v-for="s in settlements" :key="s.id" :label="'结算 ' + fmt(s.amount) + ' (' + s.operationDate + ')'" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算详情" v-if="selectedSettlementTaxDetails.length > 0">
          <el-table :data="selectedSettlementTaxDetails" size="small" border>
            <el-table-column prop="itemName" label="税目" width="100" />
            <el-table-column prop="taxRate" label="税率%" width="70" align="right" />
            <el-table-column prop="settlementAmount" label="结算金额" width="100" align="right">
              <template #default="{ row }">{{ fmt(row.settlementAmount) }}</template>
            </el-table-column>
            <el-table-column prop="invoiceAmount" label="发票金额" width="100" align="right">
              <template #default="{ row }">{{ fmt(row.invoiceAmount) }}</template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="回款金额" prop="amount">
          <el-input :model-value="paymentForm.amount" @input="(v) => paymentForm.amount = allowNumber(v)" placeholder="请输入数字" style="width:100%" />
        </el-form-item>
        <el-form-item label="日期" prop="operationDate">
          <el-date-picker v-model="paymentForm.operationDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-alert v-if="paymentValidationWarning" :title="paymentValidationWarning" type="warning" show-icon :closable="false" style="margin-top:8px" />
      </el-form>
      <el-divider content-position="left">回款历史</el-divider>
      <el-table :data="paymentHistory" v-loading="paymentHistoryLoading" size="small" max-height="220" stripe style="margin-top:8px">
        <el-table-column prop="operationDate" label="日期" width="110" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button v-if="hasPerm('payment:receive:delete')" type="danger" size="small" @click="deleteHistoryItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitPayment" :loading="paymentLoading">确 定</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 结算对话框 ==================== -->
    <el-dialog v-model="settlementDialogVisible" title="新增结算" width="800px">
      <el-form :model="settlementForm" ref="settlementFormRef" label-width="80px">
        <el-form-item label="项目">
          <span>{{ currentProjectName }}</span>
        </el-form-item>
        <el-form-item label="日期" prop="operationDate">
          <el-date-picker v-model="settlementForm.operationDate" type="date" value-format="YYYY-MM-DD" style="width:220px" />
        </el-form-item>
        <el-divider content-position="left">结算税率明细（来自项目配置）</el-divider>
        <el-alert v-if="projectRevenueTaxes.length === 0 && !revenueTaxLoading" title="该项目尚未配置税率明细，请先在「项目管理」中为该项目添加税率" type="warning" show-icon :closable="false" style="margin-bottom:8px" />
        <el-table :data="settlementForm.taxDetails" size="small" stripe style="margin-bottom:12px" v-loading="revenueTaxLoading">
          <el-table-column label="税目" width="160">
            <template #default="{ row }">
              <span>{{ row.itemName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="税率%" width="70" align="right">
            <template #default="{ row }">{{ row.taxRate }}</template>
          </el-table-column>
          <el-table-column label="结算金额" width="140">
            <template #default="{ row }">
              <el-input :model-value="row.settlementAmount" @input="(v) => row.settlementAmount = allowNumber(v)" placeholder="请输入数字" size="small" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="发票金额" width="140">
            <template #default="{ row }">
              <el-input :model-value="row.invoiceAmount" @input="(v) => row.invoiceAmount = allowNumber(v)" placeholder="请输入数字" size="small" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="税额" width="100" align="right">
            <template #default="{ row }">{{ calcSettlementTax(row) }}</template>
          </el-table-column>
        </el-table>
        <el-form-item label="结算合计" style="margin-top:12px">
          <span style="font-weight:bold;font-size:16px">{{ fmt(settlementTotalAmount) }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="settlementForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-alert v-if="settlementValidationWarning" :title="settlementValidationWarning" type="warning" show-icon :closable="false" style="margin-top:8px" />
      </el-form>
      <el-divider content-position="left">结算单附件</el-divider>
      <el-upload
        ref="settlementUploadRef"
        multiple
        :auto-upload="false"
        :limit="9"
        accept="image/*,.pdf"
        :on-change="handleSettlementFileChange"
        :on-exceed="() => ElMessage.warning('\u6700\u591a\u4e0a\u4f209\u4e2a\u6587\u4ef6')"
        list-type="picture-card"
        style="margin-bottom:12px"
      >
        <el-icon><Plus /></el-icon>
      </el-upload>
      <el-divider content-position="left">结算历史</el-divider>
      <el-table :data="settlementHistory" v-loading="settlementHistoryLoading" size="small" max-height="220" stripe style="margin-top:8px">
        <el-table-column prop="operationDate" label="日期" width="110" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="结算单" width="160">
          <template #default="{ row }">
            <template v-if="settlementDocsMap[row.id] && settlementDocsMap[row.id].length > 0">
              <el-image
                v-for="doc in settlementDocsMap[row.id]"
                :key="doc.id"
                :src="getDocUrl(doc)"
                :preview-src-list="settlementDocsMap[row.id].map(d => getDocUrl(d))"
                style="width:50px;height:50px;margin-right:4px;cursor:pointer"
                fit="cover"
                preview-teleported
              />
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="税率明细" min-width="200">
          <template #default="{ row }">
            <template v-if="row.taxDetails && row.taxDetails.length > 0">
              <el-popover placement="left" :width="400" trigger="hover">
                <template #reference>
                  <el-tag type="warning" size="small" style="cursor:pointer">{{ row.taxDetails.length }}个税目</el-tag>
                </template>
                <el-table :data="row.taxDetails" size="small" stripe>
                  <el-table-column prop="itemName" label="税目" width="100" />
                  <el-table-column prop="taxRate" label="税率%" width="70" align="right" />
                  <el-table-column prop="settlementAmount" label="结算金额" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.settlementAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="invoiceAmount" label="发票金额" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.invoiceAmount) }}</template>
                  </el-table-column>
                </el-table>
              </el-popover>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button v-if="hasPerm('payment:settle:delete')" type="danger" size="small" @click="deleteHistoryItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="settlementDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitSettlement" :loading="settlementLoading">确 定</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 开票对话框 ==================== -->
    <el-dialog v-model="invoiceDialogVisible" title="开票管理" width="800px">
      <div style="margin-bottom:12px">
        <span style="font-weight:bold">项目：{{ currentProjectName }}</span>
      </div>
      <el-table :data="invoiceableList" v-loading="invoiceableLoading" size="small" stripe>
        <el-table-column prop="itemName" label="税目" width="130" />
        <el-table-column prop="taxRate" label="税率%" width="70" align="right" />
        <el-table-column prop="settlementAmount" label="结算金额" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.settlementAmount) }}</template>
        </el-table-column>
        <el-table-column prop="invoiceAmount" label="发票金额" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.invoiceAmount) }}</template>
        </el-table-column>
        <el-table-column prop="issuedInvoiceAmount" label="已开发票额度" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.issuedInvoiceAmount) }}</template>
        </el-table-column>
        <el-table-column label="可开票余额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: canInvoiceRow(row) ? '#E6A23C' : '' }">
              {{ fmt(Number(row.invoiceAmount || 0) - Number(row.issuedInvoiceAmount || 0)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button v-if="canInvoiceRow(row)" type="warning" size="small" @click="openRowInvoiceInput(row)">开票</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-divider content-position="left">开票历史</el-divider>
      <el-table :data="invoiceHistory" v-loading="invoiceHistoryLoading" size="small" max-height="220" stripe style="margin-top:8px">
        <el-table-column prop="operationDate" label="日期" width="110" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="税率明细" min-width="180">
          <template #default="{ row }">
            <template v-if="row.taxDetails && row.taxDetails.length > 0">
              <el-popover placement="left" :width="400" trigger="hover">
                <template #reference>
                  <el-tag type="primary" size="small" style="cursor:pointer">{{ row.taxDetails[0].itemName }}</el-tag>
                </template>
                <el-table :data="row.taxDetails" size="small" stripe>
                  <el-table-column prop="itemName" label="税目" width="100" />
                  <el-table-column prop="taxRate" label="税率%" width="70" align="right" />
                  <el-table-column prop="settlementAmount" label="结算金额" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.settlementAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="invoiceAmount" label="发票金额" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.invoiceAmount) }}</template>
                  </el-table-column>
                </el-table>
              </el-popover>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button v-if="hasPerm('payment:invoice:delete')" type="danger" size="small" @click="deleteHistoryItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="invoiceDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 单行开票输入弹窗 ==================== -->
    <el-dialog v-model="rowInvoiceDialogVisible" title="开票" width="450px" :close-on-click-modal="false">
      <el-form label-width="120px">
        <el-form-item label="税目">{{ currentInvoiceRow.itemName }} ({{ currentInvoiceRow.taxRate }}%)</el-form-item>
        <el-form-item label="结算金额">{{ fmt(currentInvoiceRow.settlementAmount) }}</el-form-item>
        <el-form-item label="发票金额上限">{{ fmt(currentInvoiceRow.invoiceAmount) }}</el-form-item>
        <el-form-item label="已开发票额度">{{ fmt(currentInvoiceRow.issuedInvoiceAmount) }}</el-form-item>
        <el-form-item label="本次开票金额">
          <el-input :model-value="newInvoiceAmount" @input="(v) => newInvoiceAmount = allowNumber(v)" placeholder="请输入数字" style="width:100%" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="invoiceDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rowInvoiceDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitRowInvoice" :loading="invoiceLoading">确 定</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 操作历史对话框 ==================== -->
    <el-dialog v-model="historyDialogVisible" :title="'操作历史 - ' + historyProjectName" width="950px">
      <el-radio-group v-model="historyTypeFilter" @change="loadHistory" style="margin-bottom:12px">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="PAYMENT">回款</el-radio-button>
        <el-radio-button value="SETTLEMENT">结算</el-radio-button>
        <el-radio-button value="INVOICE">开票</el-radio-button>
      </el-radio-group>
      <el-table :data="historyList" v-loading="historyLoading" stripe max-height="400">
        <el-table-column label="操作类型" width="80">
          <template #default="{ row }">
            <el-tag :type="operationTagType(row.operationType)" size="small">{{ operationTypeLabelMap[row.operationType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="结算单" width="160">
          <template #default="{ row }">
            <template v-if="row.operationType === 'SETTLEMENT' && historyDocsMap[row.id] && historyDocsMap[row.id].length > 0">
              <el-image
                v-for="doc in historyDocsMap[row.id]" :key="doc.id"
                :src="getDocUrl(doc)"
                :preview-src-list="historyDocsMap[row.id].map(d => getDocUrl(d))"
                style="width:50px;height:50px;margin-right:4px;cursor:pointer"
                fit="cover" preview-teleported
              />
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="operationDate" label="日期" width="110" />
        <el-table-column label="税率明细" min-width="280">
          <template #default="{ row }">
            <template v-if="row.operationType === 'SETTLEMENT' && row.taxDetails && row.taxDetails.length > 0">
              <el-popover placement="left" :width="480" trigger="hover">
                <template #reference>
                  <el-tag type="warning" size="small" style="cursor:pointer">{{ row.taxDetails.length }}个税目</el-tag>
                </template>
                <el-table :data="row.taxDetails" size="small" stripe>
                  <el-table-column prop="itemName" label="税目" width="100" />
                  <el-table-column prop="taxRate" label="税率%" width="70" align="right" />
                  <el-table-column prop="settlementAmount" label="结算金额" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.settlementAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="invoiceAmount" label="发票金额" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.invoiceAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="issuedInvoiceAmount" label="已开发票额度" width="100" align="right">
                    <template #default="{ row: d }">{{ fmt(d.issuedInvoiceAmount) }}</template>
                  </el-table-column>
                </el-table>
              </el-popover>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('operation:delete')" type="danger" size="small" @click="deleteOperation(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="historyDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- Excel导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="导入项目结算回款Excel" width="450px">
      <el-upload
        ref="uploadRef" drag :auto-upload="false" :limit="1" accept=".xlsx,.xls"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning('只能上传一个文件')"
      >
        <el-icon style="font-size:40px;color:#409eff"><Upload /></el-icon>
        <div>将 Excel 文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 .xlsx / .xls 文件</div>
          <div style="margin-top:8px">
            <el-link type="primary" :underline="false" :href="getTemplateUrl('project-payment')" target="_blank">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjects, getClients, importProjectPayments, exportProjectPayments, getPaymentGroupedList, getPaymentOperationsByProject, addPaymentOperation, deletePaymentOperation, getPaymentSettlements, getSettlementTaxDetails, getInvoiceableTaxDetails, getProjectRevenueTax, getActiveVatItems, uploadSettlementDocs, getSettlementDocs, deleteSettlementDoc, permissionStore, loadPermissionsFromCache, getTemplateUrl } from '../api'
import { Upload, Download, Plus } from '@element-plus/icons-vue'

loadPermissionsFromCache()
const hasPerm = (code) => permissionStore.has(code)

const loading = ref(false)
const groupedList = ref([])
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
  loadGroupedData()
}

const activeVatItems = ref([])

const fmt = (v) => v != null ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'
const allowNumber = (v) => {
  let s = String(v).replace(/[^\d.]/g, '')
  const dotIdx = s.indexOf('.')
  if (dotIdx !== -1) s = s.substring(0, dotIdx + 1) + s.substring(dotIdx + 1).replace(/\./g, '')
  return s === '' ? 0 : s
}

const operationTypeLabelMap = { PAYMENT: '回款', SETTLEMENT: '结算', INVOICE: '开票' }
const operationTagType = (t) => ({ PAYMENT: 'success', SETTLEMENT: 'warning', INVOICE: 'primary' }[t] || 'info')

// ===================== 加载按项目编组的数据 =====================
const loadGroupedData = async () => {
  loading.value = true
  try {
    const { data } = await getPaymentGroupedList(selectedProjectId.value || undefined, selectedClientName.value || undefined)
    groupedList.value = (data.data || []).map(r => ({
      ...r, contractAmount: Number(r.contractAmount || 0), revenueWithTax: Number(r.revenueWithTax || 0),
      revenueWithoutTax: Number(r.revenueWithoutTax || 0), totalPayment: Number(r.totalPayment || 0),
      totalSettlement: Number(r.totalSettlement || 0), totalInvoice: Number(r.totalInvoice || 0)
    }))
  } catch { ElMessage.error('获取数据失败') }
  finally { loading.value = false }
}

const getSummary = ({ columns, data }) => {
  const sums = []; columns.forEach((c, i) => {
    if (i === 0) { sums[i] = '合计'; return }
    if (['contractAmount', 'totalSettlement', 'totalInvoice', 'totalPayment'].includes(c.property)) {
      sums[i] = data.reduce((a, r) => a + Number(r[c.property] || 0), 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    } else sums[i] = ''
  }); return sums
}

const currentProjectRow = ref(null)
const currentProjectName = computed(() => {
  if (!currentProjectRow.value) return ''
  return currentProjectRow.value.projectName + ' (' + currentProjectRow.value.projectCode + ')'
})

// ==================== 回款对话框 ====================
const paymentDialogVisible = ref(false)
const paymentLoading = ref(false)
const paymentFormRef = ref(null)
const settlements = ref([])
const selectedSettlementTaxDetails = ref([])
const paymentForm = reactive({ projectId: null, refLogId: null, amount: 0, operationDate: '', remark: '' })

// 各弹窗历史记录
const paymentHistory = ref([])
const paymentHistoryLoading = ref(false)
const settlementHistory = ref([])
const settlementHistoryLoading = ref(false)
const settlementFiles = ref([])
const settlementUploadRef = ref(null)
const settlementDocsMap = ref({})
const invoiceHistory = ref([])
const invoiceHistoryLoading = ref(false)

const paymentRules = {
  refLogId: [{ required: true, message: '请选择结算记录', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  operationDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const paymentValidationWarning = computed(() => {
  const row = currentProjectRow.value
  if (!row) return ''
  const amount = Number(paymentForm.amount || 0)
  if (amount <= 0) return ''
  const newTotal = Number(row.totalPayment || 0) + amount
  if (newTotal > Number(row.totalSettlement || 0)) {
    return '注意：累计回款(' + fmt(newTotal) + ')将超过累计结算(' + fmt(row.totalSettlement) + ')'
  }
  return ''
})

const openPaymentDialog = async (row) => {
  currentProjectRow.value = row
  paymentForm.projectId = row.projectId
  paymentForm.refLogId = null
  paymentForm.amount = 0
  paymentForm.operationDate = ''
  paymentForm.remark = ''
  selectedSettlementTaxDetails.value = []
  settlements.value = []
  try {
    const { data } = await getPaymentSettlements(row.projectId)
    settlements.value = data.data || []
  } catch { /* ignore */ }
  loadPaymentHistory(row.projectId)
  paymentDialogVisible.value = true
}

const onSettlementChange = async (settlementId) => {
  if (!settlementId) { selectedSettlementTaxDetails.value = []; return }
  try {
    const { data } = await getSettlementTaxDetails(settlementId)
    selectedSettlementTaxDetails.value = data.data || []
  } catch { selectedSettlementTaxDetails.value = [] }
}

// ==================== 历史记录加载 ====================
const loadPaymentHistory = async (projectId) => {
  paymentHistoryLoading.value = true
  try {
    const { data } = await getPaymentOperationsByProject(projectId, 'PAYMENT')
    paymentHistory.value = data.data || []
  } catch { paymentHistory.value = [] }
  finally { paymentHistoryLoading.value = false }
}

const loadSettlementHistory = async (projectId) => {
  settlementHistoryLoading.value = true
  try {
    const { data } = await getPaymentOperationsByProject(projectId, 'SETTLEMENT')
    settlementHistory.value = data.data || []
    // 加载每条结算记录的附件
    if (settlementHistory.value.length > 0) {
      const docPromises = settlementHistory.value.map(row =>
        getSettlementDocs(row.id).then(res => ({ id: row.id, docs: res.data?.data || [] })).catch(() => ({ id: row.id, docs: [] }))
      )
      const docResults = await Promise.all(docPromises)
      const docsMap = {}
      docResults.forEach(({ id, docs }) => { if (docs.length > 0) docsMap[id] = docs })
      settlementDocsMap.value = docsMap
    }
  } catch { settlementHistory.value = [] }
  finally { settlementHistoryLoading.value = false }
}

const loadInvoiceHistory = async (projectId) => {
  invoiceHistoryLoading.value = true
  try {
    const { data } = await getPaymentOperationsByProject(projectId, 'INVOICE')
    invoiceHistory.value = data.data || []
  } catch { invoiceHistory.value = [] }
  finally { invoiceHistoryLoading.value = false }
}

const deleteHistoryItem = (row) => {
  ElMessageBox.confirm('确定删除此条操作记录？删除结算将同时删除关联的回款和开票记录', '提示', { type: 'warning' }).then(async () => {
    try {
      await deletePaymentOperation(row.id)
      ElMessage.success('删除成功')
      // 刷新当前弹窗历史
      const pid = currentProjectRow.value.projectId
      loadPaymentHistory(pid)
      loadSettlementHistory(pid)
      loadInvoiceHistory(pid)
      loadGroupedData()
    } catch { ElMessage.error('删除失败') }
  }).catch(() => {})
}

const submitPayment = async () => {
  const valid = await paymentFormRef.value.validate().catch(() => false)
  if (!valid) return
  paymentLoading.value = true
  try {
    await addPaymentOperation({
      projectId: paymentForm.projectId, operationType: 'PAYMENT',
      amount: Number(paymentForm.amount), operationDate: paymentForm.operationDate,
      refLogId: paymentForm.refLogId, remark: paymentForm.remark
    })
    ElMessage.success('回款成功')
    paymentDialogVisible.value = false
    loadGroupedData()
    loadPaymentHistory(currentProjectRow.value.projectId)
  } catch (e) { ElMessage.error(e.response?.data?.message || '操作失败') }
  finally { paymentLoading.value = false }
}

// ==================== 结算对话框 ====================
const settlementDialogVisible = ref(false)
const settlementLoading = ref(false)
const settlementFormRef = ref(null)
const settlementForm = reactive({ operationDate: '', remark: '', taxDetails: [] })
const projectRevenueTaxes = ref([])
const revenueTaxLoading = ref(false)

const settlementTotalAmount = computed(() => {
  return settlementForm.taxDetails.reduce((sum, d) => sum + Number(d.settlementAmount || 0), 0)
})

const settlementValidationWarning = computed(() => {
  const row = currentProjectRow.value
  if (!row) return ''
  const total = settlementTotalAmount.value
  if (total <= 0) return ''
  const newTotal = Number(row.totalSettlement || 0) + total
  const contract = Number(row.contractAmount || 0)
  if (contract > 0 && newTotal > contract) {
    return '注意：累计结算(' + fmt(newTotal) + ')将超过合同金额(' + fmt(contract) + ')'
  }
  return ''
})

const calcSettlementTax = (row) => {
  const amt = Number(row.invoiceAmount || 0)
  const rate = Number(row.taxRate || 0)
  // 税额 = 含税金额 / (1+税率) * 税率 = 含税金额 * 税率 / (100+税率)
  return (amt * rate / (100 + rate)).toFixed(2)
}

const getDocUrl = (doc) => {
  const normalizedPath = doc.filePath.replace(/\\/g, '/')
  const storedName = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1)
  const ctxPath = window.location.pathname.startsWith('/project') ? '/project' : ''
  return ctxPath + '/settlement-docs/' + doc.operationLogId + '/' + storedName
}

const handleSettlementFileChange = (uploadFile) => {
  settlementFiles.value.push(uploadFile.raw)
}

const openSettlementDialog = async (row) => {
  currentProjectRow.value = row
  settlementForm.operationDate = ''
  settlementForm.remark = ''
  settlementForm.taxDetails = []
  settlementFiles.value = []
  settlementUploadRef.value?.clearFiles()
  projectRevenueTaxes.value = []
  revenueTaxLoading.value = true
  try {
    const { data } = await getProjectRevenueTax(row.projectId)
    projectRevenueTaxes.value = data.data || []
    // 将项目税率填充为结算税率明细（结算金额/发票金额初始为0）
    settlementForm.taxDetails = projectRevenueTaxes.value.map(pt => ({
      vatConfigId: pt.vatConfigId, itemName: pt.itemName, taxRate: Number(pt.taxRate),
      settlementAmount: 0, invoiceAmount: 0
    }))
  } catch { projectRevenueTaxes.value = [] }
  finally { revenueTaxLoading.value = false }
  loadSettlementHistory(row.projectId)
  settlementDialogVisible.value = true
}

const submitSettlement = async () => {
  // 过滤掉结算金额和发票金额均为0的行
  const nonZeroDetails = settlementForm.taxDetails.filter(d =>
    Number(d.settlementAmount || 0) > 0 || Number(d.invoiceAmount || 0) > 0
  )
  if (nonZeroDetails.length === 0) { ElMessage.warning('请至少填写一条税率明细的结算金额或发票金额'); return }
  if (!settlementForm.operationDate) { ElMessage.warning('请选择日期'); return }
  settlementLoading.value = true
  try {
    const taxDetails = nonZeroDetails.map(d => ({
      vatConfigId: d.vatConfigId, itemName: d.itemName, taxRate: Number(d.taxRate),
      settlementAmount: Number(d.settlementAmount || 0),
      invoiceAmount: Number(d.invoiceAmount || 0),
      issuedInvoiceAmount: 0
    }))
    const { data: addRes } = await addPaymentOperation({
      projectId: currentProjectRow.value.projectId, operationType: 'SETTLEMENT',
      amount: taxDetails.reduce((s, d) => s + d.settlementAmount, 0), operationDate: settlementForm.operationDate,
      remark: settlementForm.remark, taxDetails
    })
    // 上传结算单附件
    const settlementId = addRes?.data?.id
    if (settlementId && settlementFiles.value.length > 0) {
      try {
        await uploadSettlementDocs(settlementId, settlementFiles.value)
      } catch (e) {
        console.error('结算单上传失败', e)
      }
    }
    ElMessage.success('结算成功')
    settlementDialogVisible.value = false
    settlementFiles.value = []
    loadGroupedData()
    loadSettlementHistory(currentProjectRow.value.projectId)
  } catch (e) { ElMessage.error(e.response?.data?.message || '操作失败') }
  finally { settlementLoading.value = false }
}

// ==================== 开票对话框 ====================
const invoiceDialogVisible = ref(false)
const rowInvoiceDialogVisible = ref(false)
const invoiceableLoading = ref(false)
const invoiceLoading = ref(false)
const invoiceableList = ref([])
const currentInvoiceRow = reactive({ id: null, itemName: '', taxRate: 0, settlementAmount: 0, invoiceAmount: 0, issuedInvoiceAmount: 0 })
const newInvoiceAmount = ref(0)
const invoiceDate = ref('')

const canInvoiceRow = (row) => Number(row.invoiceAmount || 0) > Number(row.issuedInvoiceAmount || 0)

const openInvoiceDialog = async (row) => {
  currentProjectRow.value = row
  invoiceableList.value = []
  invoiceHistory.value = []
  invoiceableLoading.value = true
  invoiceHistoryLoading.value = true
  try {
    const [invRes, histRes] = await Promise.all([
      getInvoiceableTaxDetails(row.projectId),
      getPaymentOperationsByProject(row.projectId, 'INVOICE')
    ])
    invoiceableList.value = invRes.data?.data || []
    invoiceHistory.value = histRes.data?.data || []
    if (invoiceableList.value.length === 0) {
      if (invoiceHistory.value.length === 0) {
        ElMessage.warning('暂无结算税率明细，请先点击「结算」录入结算税率明细')
        return
      }
      ElMessage.info('所有发票均已开票完毕，以下为历史开票记录')
    }
  } catch { /* ignore */ }
  finally {
    invoiceableLoading.value = false
    invoiceHistoryLoading.value = false
  }
  invoiceDialogVisible.value = true
}

const openRowInvoiceInput = (row) => {
  Object.assign(currentInvoiceRow, {
    id: row.id, itemName: row.itemName, taxRate: row.taxRate,
    settlementAmount: row.settlementAmount, invoiceAmount: row.invoiceAmount,
    issuedInvoiceAmount: row.issuedInvoiceAmount
  })
  newInvoiceAmount.value = Number(row.invoiceAmount || 0) - Number(row.issuedInvoiceAmount || 0)
  invoiceDate.value = ''
  rowInvoiceDialogVisible.value = true
}

const submitRowInvoice = async () => {
  const amt = Number(newInvoiceAmount.value || 0)
  if (amt <= 0) { ElMessage.warning('请输入开票金额'); return }
  const remain = Number(currentInvoiceRow.invoiceAmount || 0) - Number(currentInvoiceRow.issuedInvoiceAmount || 0)
  if (amt > remain) { ElMessage.warning('开票金额不能超过可开票余额 ' + remain.toFixed(2)); return }
  invoiceLoading.value = true
  try {
    await addPaymentOperation({
      projectId: currentProjectRow.value.projectId, operationType: 'INVOICE',
      amount: amt, operationDate: invoiceDate.value || new Date().toISOString().slice(0, 10),
      refTaxDetailId: currentInvoiceRow.id, remark: '开票: ' + currentInvoiceRow.itemName
    })
    ElMessage.success('开票成功')
    rowInvoiceDialogVisible.value = false
    const { data } = await getInvoiceableTaxDetails(currentProjectRow.value.projectId)
    invoiceableList.value = data.data || []
    loadGroupedData()
    loadInvoiceHistory(currentProjectRow.value.projectId)
  } catch (e) { ElMessage.error(e.response?.data?.message || '操作失败') }
  finally { invoiceLoading.value = false }
}

// ==================== 操作历史对话框 ====================
const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyList = ref([])
const historyProjectId = ref(null)
const historyProjectName = ref('')
const historyTypeFilter = ref('')
const historyDocsMap = ref({})

const showHistory = (row) => {
  historyProjectId.value = row.projectId
  historyProjectName.value = row.projectName
  historyTypeFilter.value = ''
  historyDocsMap.value = {}
  historyDialogVisible.value = true
  loadHistory()
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const type = historyTypeFilter.value || undefined
    const { data } = await getPaymentOperationsByProject(historyProjectId.value, type)
    historyList.value = data.data || []
    // 加载结算记录附件
    const settlementRows = historyList.value.filter(r => r.operationType === 'SETTLEMENT')
    if (settlementRows.length > 0) {
      const docPromises = settlementRows.map(row =>
        getSettlementDocs(row.id).then(res => ({ id: row.id, docs: res.data?.data || [] })).catch(() => ({ id: row.id, docs: [] }))
      )
      const docResults = await Promise.all(docPromises)
      const docsMap = {}
      docResults.forEach(({ id, docs }) => { if (docs.length > 0) docsMap[id] = docs })
      historyDocsMap.value = docsMap
    }
  } catch { ElMessage.error('获取操作历史失败') }
  finally { historyLoading.value = false }
}

const deleteOperation = (row) => {
  ElMessageBox.confirm('确定删除此条操作记录？删除结算将同时删除关联的回款和开票记录', '提示', { type: 'warning' }).then(async () => {
    try {
      await deletePaymentOperation(row.id)
      ElMessage.success('删除成功')
      loadHistory(); loadGroupedData()
    } catch { ElMessage.error('删除失败') }
  }).catch(() => {})
}

// ===================== 导入/导出 =====================
const importDialogVisible = ref(false)
const importLoading = ref(false)
const uploadRef = ref(null)
const selectedFile = ref(null)
const handleFileChange = (file) => { selectedFile.value = file.raw }
const handleImport = async () => {
  if (!selectedFile.value) { ElMessage.warning('请先选择文件'); return }
  importLoading.value = true
  try {
    const { data } = await importProjectPayments(selectedFile.value)
    if (data.code === 200) { ElMessage.success(data.message + '，共导入 ' + data.data + ' 条'); importDialogVisible.value = false; loadGroupedData() }
    else { ElMessage.error(data.message) }
  } catch (e) { ElMessage.error('导入失败：' + (e.response?.data?.message || e.message)) }
  finally { importLoading.value = false; selectedFile.value = null }
}
const handleDownloadTemplate = () => { window.open(getTemplateUrl('project-payment'), '_blank') }
const handleExport = async () => {
  try {
    const params = {}
    if (selectedProjectId.value) params.projectId = selectedProjectId.value
    if (selectedClientName.value) params.clientName = selectedClientName.value
    const res = await exportProjectPayments(params)
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = '项目结算回款.xlsx'; document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url); ElMessage.success('导出成功')
  } catch (e) { ElMessage.error('导出失败：' + (e.response?.data?.message || e.message)) }
}

onMounted(async () => {
  try {
    const [projRes, clientRes] = await Promise.all([getProjects(), getClients()])
    allProjects.value = projRes.data?.data || []
    clients.value = clientRes.data?.data || []
  } catch { /* ignore */ }
  try { const { data } = await getActiveVatItems(); activeVatItems.value = data.data || [] } catch { /* ignore */ }
  loadGroupedData()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
