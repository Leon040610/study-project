<template>
  <div class="admin-students">
    <h2 class="page-title">用户管理</h2>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="filters.q" placeholder="搜索邮箱/姓名" clearable style="width: 240px" @keyup.enter="reload" @clear="reload" />
        <el-select v-model="filters.role" placeholder="全部角色" clearable style="width: 130px" @change="reload">
          <el-option label="普通用户" value="user" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-select v-model="filters.disabled" placeholder="全部状态" clearable style="width: 130px" @change="reload">
          <el-option label="正常" :value="false" />
          <el-option label="已禁用" :value="true" />
        </el-select>
        <el-button type="primary" @click="reload">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table v-loading="loading" :data="items" border stripe>
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="32" style="vertical-align: middle">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div style="display:inline-block; margin-left:10px; vertical-align: middle">
              <div style="font-weight:500">{{ row.name || row.email }}</div>
              <div style="font-size:12px; color:#9ca3af">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.role === 'admin' ? 'warning' : 'info'">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.disabled ? 'danger' : 'success'">
              {{ row.disabled ? '已禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="changeRole(row)">
              {{ row.role === 'admin' ? '降为用户' : '升为管理员' }}
            </el-button>
            <el-button size="small" link :type="row.disabled ? 'success' : 'danger'" @click="toggleStatus(row)">
              {{ row.disabled ? '启用' : '禁用' }}
            </el-button>
            <el-button size="small" link type="danger" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const items = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ q: '', role: '', disabled: '' as any, page: 1, pageSize: 10 })

function formatDate(s: string) { return s ? new Date(s).toLocaleString('zh-CN') : '-' }

async function reload() {
  loading.value = true
  try {
    const data: any = await api.get('/admin/users', { params: filters })
    items.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.q = ''; filters.role = ''; filters.disabled = ''; filters.page = 1
  reload()
}

async function changeRole(row: any) {
  const newRole = row.role === 'admin' ? 'user' : 'admin'
  try {
    await ElMessageBox.confirm(
      `将 ${row.email} 角色修改为「${newRole === 'admin' ? '管理员' : '用户'}」？`,
      '角色修改', { type: 'warning' }
    )
  } catch { return }
  try {
    await api.put('/admin/users/' + row.id + '/role', { role: newRole })
    ElMessage.success('角色已更新')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '修改失败')
  }
}

async function toggleStatus(row: any) {
  const next = !row.disabled
  try {
    await ElMessageBox.confirm(
      `${next ? '禁用' : '启用'} 用户 ${row.email}?`,
      '状态修改', { type: 'warning' }
    )
  } catch { return }
  try {
    await api.put('/admin/users/' + row.id + '/status', { disabled: next })
    ElMessage.success(next ? '已禁用' : '已启用')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

async function confirmDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${row.email} 吗？其数据将被清理，此操作不可恢复。`,
      '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await api.delete('/admin/users/' + row.id)
    ElMessage.success('已删除')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(reload)
</script>

<style scoped>
.admin-students { padding: 8px 4px; }
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
