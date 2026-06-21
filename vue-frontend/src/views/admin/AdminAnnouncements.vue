<template>
  <div class="admin-announcements">
    <div class="page-header">
      <h2>公告管理</h2>
      <el-button type="primary" @click="openAdd">
        <el-icon><Plus /></el-icon>
        <span>发布公告</span>
      </el-button>
    </div>
    <el-card>
      <el-table :data="announcements" border>
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
        <el-table-column prop="title" label="公告标题" min-width="160" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)">{{ getPriorityText(scope.row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="300">
          <template #default="scope">
            {{ (scope.row.content || '').slice(0, 50) }}{{ (scope.row.content || '').length > 50 ? '...' : '' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editAnnouncement(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAnnouncement(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddModal" :title="editingAnnouncement ? '编辑公告' : '发布公告'" width="600px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="紧急" value="high" />
            <el-option label="普通" value="normal" />
            <el-option label="一般" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  created_at: string
}

const announcements = ref<Announcement[]>([])
const showAddModal = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)
const formRef = ref()
const submitting = ref(false)

const form = reactive({
  title: '',
  content: '',
  priority: 'normal'
})

const rules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = {
    'high': 'danger',
    'normal': '',
    'low': 'success'
  }
  return map[priority] || ''
}

function getPriorityText(priority: string) {
  const map: Record<string, string> = {
    'high': '紧急',
    'normal': '普通',
    'low': '一般'
  }
  return map[priority] || '普通'
}

async function fetchAnnouncements() {
  try {
    const data = await api.get('/announcements')
    announcements.value = data || []
  } catch {
    announcements.value = []
  }
}

function resetForm() {
  form.title = ''
  form.content = ''
  form.priority = 'normal'
  editingAnnouncement.value = null
  formRef.value?.clearValidate?.()
}

function openAdd() {
  resetForm()
  showAddModal.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    if (editingAnnouncement.value) {
      await api.put(`/announcements/${editingAnnouncement.value.id}`, { ...form })
      ElMessage.success('修改成功')
    } else {
      await api.post('/announcements', { ...form })
      ElMessage.success('发布成功')
    }
    showAddModal.value = false
    resetForm()
    fetchAnnouncements()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function editAnnouncement(announcement: Announcement) {
  editingAnnouncement.value = announcement
  form.title = announcement.title
  form.content = announcement.content || ''
  form.priority = announcement.priority || 'normal'
  showAddModal.value = true
}

async function deleteAnnouncement(announcement: Announcement) {
  try {
    await ElMessageBox.confirm(`确定删除公告「${announcement.title}」吗？`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  try {
    await api.delete(`/announcements/${announcement.id}`)
    announcements.value = announcements.value.filter(a => a.id !== announcement.id)
    ElMessage.success('删除成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(fetchAnnouncements)
</script>

<style scoped>
.admin-announcements {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
</style>