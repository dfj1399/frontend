<template>
  <div class="table-pagination">
    <div class="page-size-wrap">
      <span>每页</span>
      <el-select :model-value="size" style="width: 110px" @change="handleSizeChange">
        <el-option v-for="opt in sizeOptions" :key="opt" :label="opt === 'all' ? '所有' : opt + ' 条'" :value="opt" />
      </el-select>
    </div>
    <el-pagination
      v-if="size !== 'all'"
      background
      layout="prev, pager, next, jumper"
      :total="total"
      :page-size="pageSizeNum"
      :current-page="page"
      hide-on-single-page
      @current-change="handlePageChange"
    />
    <span class="total-text">共 {{ total }} 条</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 }
})
const page = defineModel('page', { type: Number, default: 1 })
const size = defineModel('size', { type: [Number, String], default: 10 })
const emit = defineEmits(['change'])

const sizeOptions = [10, 20, 50, 100, 'all']

const pageSizeNum = computed(() => (size.value === 'all' ? props.total : Number(size.value)))

const handleSizeChange = (val) => {
  const p = 1
  page.value = p
  size.value = val
  emit('change', { page: p, size: val })
}

const handlePageChange = (p) => {
  page.value = p
  emit('change', { page: p, size: size.value })
}
</script>

<style scoped>
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
.page-size-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 13px;
}
.total-text {
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
}
</style>
