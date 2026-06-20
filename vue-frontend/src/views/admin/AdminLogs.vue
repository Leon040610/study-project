<template>
  <div class="admin-logs">
    <h2 class="page-title">系统日志</h2>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="filters.q" placeholder="搜索管理员/操作/详情" clearable style="width: 240px" @keyup.enter="reload" @clear="reload" />
        <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 180px" @change="reload">
          <el-option label="登录登出" value="auth" />
          <el-option label="资源管理" value="resource" />
          <el-option label="帖子管理" value="post" />
          <el-option label="用户管理" value="user" />
          <el-option label="系统设置" value="setting" />
          <el-option label="备份恢复" value="backup" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange" type="daterange"
          range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
          value-format="YYYY-MM-DD" @change="reload"
        />
        <el-button type="primary" @click="reload">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <span class="filter-spacer" />
        <el-button :icon="Download" @click="exportLogs">导出 CSV</el-button>
      </div>

      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDate(row.timestamp) }}</template>
        </el-table-column>
        <el-table-column label="管理员" width="160" prop="adminName" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="typeColor(row.type)">{{ typeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="动作" width="140" prop="action" />
        <el-table-column label="详情" min-width="260" prop="detail" show-overflow-tooltip />
        <el-table-column label="IP" width="130" prop="ip" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const items = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ q: '', type: '', dateRange: [] as string[], page: 1, pageSize: 20 })

function formatDate(s: string) { return s ? new Date(s).toLocaleString('zh-CN') : '-' }
function typeName(t: string) { return ({ auth: '登录', resource: '资源', post: '帖子', user: '用户', setting: '设置', backup: '备份' } as any)[t] || t || '其他' }
function typeColor(t: string) { return ({ auth: '', resource: 'success', post: 'warning', user: 'danger', setting: 'info', backup: '' } as any)[t] || 'info' }

async function reload() {
  loading.value = true
  try {
    const params: any = { q: filters.q, type: filters.type, page: filters.page, pageSize: filters.pageSize }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    const data: any = await api.get('/admin/logs', { params })
    items.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.q = ''; filters.type = ''; filters.dateRange = []; filters.page = 1
  reload()
}

async function exportLogs() {
  try {
    const params: any = { q: filters.q, type: filters.type, all: 1 }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    const res: any = await api.get('/admin/logs', { params })
    const rows: any[] = res.items || []
    if (rows.length === 0) return ElMessage.warning('无可导出的日志')

    const header = ['时间', '管理员', '类型', '动作', '详情', 'IP']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push([
        formatDate(r.timestamp),
        csvEsc(r.adminName),
        csvEsc(typeName(r.type)),
        csvEsc(r.action),
        csvEsc(r.detail),
        csvEsc(r.ip)
      ].join(','))
    }
    const csv = '\uFEFF' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-logs-${Date.now()}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    ElMessage.success(`已导出 ${rows.length} 条日志`)
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

function csvEsc(v: any) {
  if (v == null) return ''
  const s = String(v)
  if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

onMounted(reload)
</script>

<style scoped>
.admin-logs { padding: 8px 4px; }
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.filter-spacer { flex: 1; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
