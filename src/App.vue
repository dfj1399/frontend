<template>
  <router-view />
</template>

<script setup>
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.el-table th.el-table__cell .cell {
  text-align: center;
}

/* 项目编号列不换行显示 */
.el-table .cell-nowrap .cell {
  white-space: nowrap;
}
</style>
