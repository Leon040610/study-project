<template>
  <div class="admin-resources">
    <div class="page-header">
      <h2>资源管理</h2>
      <el-button type="primary" @click="showAddModal = true">
        <el-icon><Plus /></el-icon>
        <span>添加资源</span>
      </el-button>
    </div>
    <el-card>
      <el-table :data="resources" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="资源名称" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="type" label="类型">
          <template #default="scope">
            <el-tag>{{ getTypeName(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="downloadCount" label="下载次数" width="100" />
        <el-table-column prop="rating" label="评分" width="80" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="editResource(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteResource(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddModal" :title="editingResource ? '编辑资源' : '添加资源'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="资源名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="资源分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="电子书" value="ebook" />
            <el-option label="视频教程" value="video" />
            <el-option label="文档资料" value="document" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源描述">
          <el-textarea v-model="form.description" rows="3" placeholder="请输入资源描述" />
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

interface Resource {
  id: string
  title: string
  category: string
  type: string
  description: string
  downloadCount: number
  rating: number
  created_at: string
}

const categories = ['编程开发', '数据科学', '数据库', '网络技术', '操作系统', '前端开发', '人工智能', '其他']

const resources = ref<Resource[]>([])
const showAddModal = ref(false)
const editingResource = ref<Resource | null>(null)
const formRef = ref()

const form = reactive({
  title: '',
  description: '',
  category: '',
  type: ''
})

const rules = {
  title: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择资源分类', trigger: 'blur' }],
  type: [{ required: true, message: '请选择资源类型', trigger: 'blur' }]
}

function getTypeName(type: string) {
  const names: Record<string, string> = {
    'ebook': '电子书',
    'video': '视频教程',
    'document': '文档资料',
    'other': '其他'
  }
  return names[type] || '其他'
}

async function fetchResources() {
  try {
    const data = await api.get('/resources')
    resources.value = data || []
  } catch {
    resources.value = []
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})
  
  try {
    if (editingResource.value) {
      await api.put(`/resources/${editingResource.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await api.post('/resources', form)
      ElMessage.success('添加成功')
    }
    showAddModal.value = false
    fetchResources()
  } catch {
    ElMessage.error('操作失败')
  }
}

function editResource(resource: Resource) {
  editingResource.value = resource
  form.title = resource.title
  form.description = resource.description
  form.category = resource.category
  form.type = resource.type
  showAddModal.value = true
}

async function deleteResource(resource: Resource) {
  await api.delete(`/resources/${resource.id}`).catch(() => {})
  resources.value = resources.value.filter(r => r.id !== resource.id)
  ElMessage.success('删除成功')
}

onMounted(fetchResources)
</script>

<style scoped>
.admin-resources {
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