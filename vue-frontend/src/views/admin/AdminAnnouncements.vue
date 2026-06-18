<template>
  <div class="admin-announcements">
    <div class="page-header">
      <h2>公告管理</h2>
      <el-button type="primary" @click="showAddModal = true">
        <el-icon><Plus /></el-icon>
        <span>发布公告</span>
      </el-button>
    </div>
    <el-card>
      <el-table :data="announcements" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="公告标题" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)">{{ getPriorityText(scope.row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="300">
          <template #default="scope">
            {{ scope.row.content.slice(0, 50) }}{{ scope.row.content.length > 50 ? '...' : '' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="editAnnouncement(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAnnouncement(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddModal" :title="editingAnnouncement ? '编辑公告' : '发布公告'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="请选择优先级">
            <el-option label="紧急" value="high" />
            <el-option label="普通" value="normal" />
            <el-option label="一般" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-textarea v-model="form.content" rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'
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

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})
  
  try {
    if (editingAnnouncement.value) {
      await api.put(`/announcements/${editingAnnouncement.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await api.post('/announcements', form)
      ElMessage.success('发布成功')
    }
    showAddModal.value = false
    fetchAnnouncements()
  } catch {
    ElMessage.error('操作失败')
  }
}

function editAnnouncement(announcement: Announcement) {
  editingAnnouncement.value = announcement
  form.title = announcement.title
  form.content = announcement.content
  form.priority = announcement.priority
  showAddModal.value = true
}

async function deleteAnnouncement(announcement: Announcement) {
  await api.delete(`/announcements/${announcement.id}`).catch(() => {})
  announcements.value = announcements.value.filter(a => a.id !== announcement.id)
  ElMessage.success('删除成功')
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
}
</style>