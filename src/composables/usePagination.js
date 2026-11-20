import { ref, computed, watch } from 'vue'

/**
 * 客户端分页组合函数：对已加载的列表数据做前端切片分页
 * @param source 列表数据源（ref 或 computed，值为数组）
 * @param options.defaultSize 默认每页条数（10/20/50/100/'all'）
 * @returns { page, size, total, pagedList } page=当前页，size=每页条数，total=总条数，pagedList=当前页数据
 */
export function usePagination(source, { defaultSize = 10 } = {}) {
  const page = ref(1)
  const size = ref(defaultSize)

  // 数据源变化（筛选、刷新）后若当前页越界，回到第一页
  watch(source, () => {
    const maxPage = size.value === 'all' ? 1 : Math.max(1, Math.ceil(source.value.length / size.value))
    if (page.value > maxPage) page.value = 1
  })

  const total = computed(() => source.value.length)
  const pagedList = computed(() => {
    if (size.value === 'all') return source.value
    const start = (page.value - 1) * size.value
    return source.value.slice(start, start + size.value)
  })

  return { page, size, total, pagedList }
}
