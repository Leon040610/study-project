<template>
  <div class="admin-posts">
    <div class="page-header">
      <h2 class="page-title">帖子管理</h2>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-input v-model="filters.q" placeholder="搜索标题/内容/作者" clearable style="width: 240px" @keyup.enter="reload" @clear="reload" />
        <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 130px" @change="reload">
          <el-option label="已发布" value="published" />
          <el-option label="待审核" value="pending" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select v-model="filters.sort" style="width: 130px" @change="reload">
          <el-option label="最新发布" value="newest" />
          <el-option label="最早发布" value="oldest" />
          <el-option label="最多点赞" value="likes" />
        </el-select>
        <el-button type="primary" @click="reload">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <span class="filter-spacer" />
        <el-button v-if="selected.length" type="danger" :icon="Delete" @click="confirmBatchDelete">
          批量删除 ({{ selected.length }})
        </el-button>
      </div>

      <el-table v-loading="loading" :data="items" border stripe @selection-change="selected = $event">
        <el-table-column type="selection" width="44" />
        <el-table-column label="帖子" min-width="240">
          <template #default="{ row }">
            <div class="post-title">{{ row.title || '(无标题)' }}</div>
            <div class="post-content">{{ row.content || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="作者" width="140">
          <template #default="{ row }">
            <el-icon><User /></el-icon>
            <span style="margin-left: 4px">{{ row.author || row.userEmail || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120" prop="category" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="互动" width="160">
          <template #default="{ row }">
            <span><el-icon><Star /></el-icon> {{ row.likes || 0 }}</span>
            <span style="margin-left: 12px"><el-icon><ChatLineRound /></el-icon> {{ row.comments ? row.comments.length : 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" link type="success" @click="review(row, true)">通过</el-button>
            <el-button v-if="row.status === 'pending'" size="small" link type="warning" @click="review(row, false)">拒绝</el-button>
            <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="editVisible" title="编辑帖子" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="已发布" value="published" />
            <el-option label="待审核" value="pending" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, User, Star, ChatLineRound } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const items = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const selected = ref<any[]>([])
const filters = reactive({ q: '', status: '', sort: 'newest', page: 1, pageSize: 10 })

const editVisible = ref(false)
const form = reactive({ id: '', title: '', content: '', status: 'published', category: '' })

function statusName(s: string) { return ({ published: '已发布', pending: '待审核', rejected: '已拒绝' } as any)[s] || s || '已发布' }
function statusType(s: string) { return ({ published: 'success', pending: 'warning', rejected: 'danger' } as any)[s] || 'info' }
function formatDate(s: string) { return s ? new Date(s).toLocaleString('zh-CN') : '-' }

async function reload() {
  loading.value = true
  try {
    const data: any = await api.get('/admin/posts', { params: filters })
    items.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.q = ''; filters.status = ''; filters.sort = 'newest'; filters.page = 1
  reload()
}

function openEdit(row: any) {
  Object.assign(form, { id: row.id, title: row.title || '', content: row.content || '', status: row.status || 'published', category: row.category || '' })
  editVisible.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await api.put('/admin/posts/' + form.id, {
      title: form.title, content: form.content, status: form.status, category: form.category
    })
    ElMessage.success('已保存')
    editVisible.value = false
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function review(row: any, approved: boolean) {
  try {
    await api.put(`/admin/posts/${row.id}/review`, { approved })
    ElMessage.success(approved ? '已批准' : '已拒绝')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

async function confirmDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除帖子 "${row.title || '(无标题)'}" 吗？`,
      '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await api.delete('/posts/' + row.id)
    ElMessage.success('已删除')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

async function confirmBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要批量删除 ${selected.value.length} 个帖子吗？`,
      '批量删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    const res: any = await api.post('/admin/posts/batch-delete', { ids: selected.value.map(s => s.id) })
    ElMessage.success(`已删除 ${res.removed} 个帖子`)
    selected.value = []
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(reload)
</script>

<style scoped>
.admin-posts { padding: 8px 4px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 700; }
.filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.filter-spacer { flex: 1; }
.post-title { font-weight: 500; }
.post-content { font-size: 12px; color: #9ca3af; max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
