<template>
  <div class="admin-backup">
    <div class="page-header">
      <h2 class="page-title">备份与恢复</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Folder" :loading="creating" @click="createBackup">创建备份</el-button>
      </div>
    </div>

    <el-alert
      type="warning" :closable="false" show-icon
      title="提示：恢复操作将覆盖现有数据，请谨慎操作，建议恢复前先创建一份新备份。"
      style="margin-bottom: 12px"
    />

    <el-card>
      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column label="备份名称" min-width="240" prop="name" show-overflow-tooltip />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="用户/帖子/资源" width="180">
          <template #default="{ row }">
            <span v-if="row.snapshot">
              U {{ row.snapshot.userCount || 0 }}
              · P {{ row.snapshot.postCount || 0 }}
              · R {{ row.snapshot.resourceCount || 0 }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="创建者" width="140" prop="createdBy" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="downloadBackup(row)">下载</el-button>
            <el-button size="small" link type="warning" @click="confirmRestore(row)">恢复</el-button>
            <el-button size="small" link type="danger" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const items = ref<any[]>([])
const loading = ref(false)
const creating = ref(false)

function formatDate(s: string) { return s ? new Date(s).toLocaleString('zh-CN') : '-' }
function formatSize(b?: number) {
  if (!b) return '-'
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

async function reload() {
  loading.value = true
  try {
    const data: any = await api.get('/admin/backup')
    items.value = data.items || []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function createBackup() {
  creating.value = true
  try {
    const res: any = await api.post('/admin/backup', {})
    ElMessage.success(`备份创建成功：${res.backup?.name || ''}`)
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

async function confirmRestore(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份「${row.name}」吗？当前数据将被覆盖，此操作不可撤销。`,
      '恢复确认', { type: 'warning', confirmButtonText: '确认恢复', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await ElMessageBox.confirm(
      '再次确认：恢复操作将立即覆盖现有用户、帖子、资源等数据。是否继续？',
      '二次确认', { type: 'warning', confirmButtonText: '我已了解，继续恢复', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await api.post('/admin/backup/restore', { id: row.id })
    ElMessage.success('恢复成功')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '恢复失败')
  }
}

async function confirmDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份「${row.name}」吗？此操作不可恢复。`,
      '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await api.delete('/admin/backup/' + row.id)
    ElMessage.success('已删除')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

function downloadBackup(row: any) {
  const token = localStorage.getItem('token') || ''
  fetch(`/api/admin/backup/${row.id}/download`, { headers: { Authorization: 'Bearer ' + token } })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = row.name + '.json'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    })
    .catch(() => ElMessage.error('下载失败'))
}

onMounted(reload)
</script>

<style scoped>
.admin-backup { padding: 8px 4px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 700; }
</style>
