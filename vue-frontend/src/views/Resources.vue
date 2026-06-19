<template>
  <div class="resources-page">
    <div class="page-header">
      <h2>共享资源中心</h2>
      <el-button type="primary" @click="showUploadModal = true">
        <el-icon><Upload /></el-icon>
        <span>上传资源</span>
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索资源" style="width: 200px;">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedCategory" placeholder="选择分类">
        <el-option label="全部" value="" />
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
      <el-select v-model="selectedType" placeholder="选择类型">
        <el-option label="全部" value="" />
        <el-option label="电子书" value="ebook" />
        <el-option label="视频教程" value="video" />
        <el-option label="文档资料" value="document" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>

    <div class="resources-grid">
      <el-card v-for="resource in filteredResources" :key="resource.id" class="resource-card">
        <div class="resource-header">
          <div class="resource-icon" :style="{ background: getIconBg(resource.type) }">
            {{ getIcon(resource.type) }}
          </div>
          <div class="resource-info">
            <h3>{{ resource.title }}</h3>
            <p class="resource-meta">
              <span>{{ resource.category }}</span>
              <span>·</span>
              <span>{{ getTypeName(resource.type) }}</span>
            </p>
          </div>
        </div>
        <p class="resource-desc">{{ resource.description }}</p>
        <div class="resource-footer">
          <div class="stats">
            <span>📥 {{ resource.downloadCount }} 次下载</span>
            <span>⭐ {{ resource.rating }} 评分</span>
          </div>
          <div class="actions">
            <el-button size="small" @click="downloadResource(resource)">下载</el-button>
            <el-button size="small" type="primary" @click="viewResource(resource)">查看</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="filteredResources.length === 0" class="empty-state">
      <el-icon style="font-size: 48px; color: var(--text-tertiary);"><Document /></el-icon>
      <p>暂无资源</p>
    </div>

    <el-dialog v-model="showUploadModal" title="上传资源" width="500px">
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
        <el-form-item label="资源文件">
          <el-upload
            class="upload-demo"
            action="/api/resources/upload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :auto-upload="false"
            :file-list="fileList"
            ref="uploadRef"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadModal = false">取消</el-button>
        <el-button type="primary" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showViewModal" title="资源详情" width="600px">
      <div v-if="selectedResource" class="resource-detail">
        <div class="detail-icon" :style="{ background: getIconBg(selectedResource.type) }">
          {{ getIcon(selectedResource.type) }}
        </div>
        <h3>{{ selectedResource.title }}</h3>
        <div class="detail-info">
          <div class="info-row">
            <span class="label">分类：</span>
            <span>{{ selectedResource.category }}</span>
          </div>
          <div class="info-row">
            <span class="label">类型：</span>
            <span>{{ getTypeName(selectedResource.type) }}</span>
          </div>
          <div class="info-row">
            <span class="label">下载次数：</span>
            <span>{{ selectedResource.downloadCount }}</span>
          </div>
          <div class="info-row">
            <span class="label">评分：</span>
            <span>⭐ {{ selectedResource.rating }}</span>
          </div>
        </div>
        <div class="detail-desc">
          <h4>描述</h4>
          <p>{{ selectedResource.description }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showViewModal = false">关闭</el-button>
        <el-button type="primary" @click="downloadResource(selectedResource)">下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Upload, Search, Document } from '@element-plus/icons-vue'

interface Resource {
  id: string
  title: string
  description: string
  category: string
  type: string
  downloadCount: number
  rating: number
  fileUrl?: string
}

const categories = ['编程开发', '数据科学', '数据库', '网络技术', '操作系统', '前端开发', '人工智能', '其他']

const resources = ref<Resource[]>([])
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedType = ref('')
const showUploadModal = ref(false)
const showViewModal = ref(false)
const selectedResource = ref<Resource | null>(null)
const formRef = ref()
const uploadRef = ref()

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

const fileList = ref<any[]>([])

const filteredResources = computed(() => {
  return resources.value.filter(r => {
    const matchKeyword = !searchKeyword.value || r.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) || r.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchCategory = !selectedCategory.value || r.category === selectedCategory.value
    const matchType = !selectedType.value || r.type === selectedType.value
    return matchKeyword && matchCategory && matchType
  })
})

function getIcon(type: string) {
  const icons: Record<string, string> = {
    'ebook': '📚',
    'video': '🎬',
    'document': '📄',
    'other': '📁'
  }
  return icons[type] || '📁'
}

function getIconBg(type: string) {
  const colors: Record<string, string> = {
    'ebook': '#dbeafe',
    'video': '#fce7f3',
    'document': '#d1fae5',
    'other': '#fef3c7'
  }
  return colors[type] || '#f1f5f9'
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
    resources.value = [
      { id: '1', title: 'Python从入门到精通', description: '全面讲解Python编程基础和进阶知识', category: '编程开发', type: 'ebook', downloadCount: 1256, rating: 4.8 },
      { id: '2', title: '高等数学视频教程', description: '考研数学高等数学全套视频课程', category: '数据科学', type: 'video', downloadCount: 892, rating: 4.9 },
      { id: '3', title: 'SQL学习手册', description: 'SQL数据库查询和优化技巧详解', category: '数据库', type: 'document', downloadCount: 654, rating: 4.7 },
      { id: '4', title: 'Vue3实战项目', description: '使用Vue3构建企业级应用的实战教程', category: '前端开发', type: 'video', downloadCount: 523, rating: 4.8 },
      { id: '5', title: '机器学习入门', description: '从零开始学习机器学习算法', category: '人工智能', type: 'ebook', downloadCount: 432, rating: 4.6 },
      { id: '6', title: 'Linux命令速查', description: '常用Linux命令大全', category: '操作系统', type: 'document', downloadCount: 389, rating: 4.5 },
      { id: '7', title: '网络协议详解', description: 'TCP/IP协议栈原理与实现', category: '网络技术', type: 'ebook', downloadCount: 276, rating: 4.7 },
      { id: '8', title: '算法与数据结构', description: '经典算法实现和数据结构讲解', category: '编程开发', type: 'video', downloadCount: 567, rating: 4.9 }
    ]
  }
}

async function handleUpload() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})
  
  try {
    await api.post('/resources', form)
    ElMessage.success('上传成功')
    showUploadModal.value = false
    fetchResources()
  } catch {
    ElMessage.error('操作失败')
  }
}

function handleUploadSuccess() {
  ElMessage.success('文件上传成功')
}

function handleUploadError() {
  ElMessage.error('文件上传失败')
}

function viewResource(resource: Resource) {
  selectedResource.value = resource
  showViewModal.value = true
}

function downloadResource(resource: Resource | null) {
  if (!resource) return
  ElMessage.success('开始下载')
}

fetchResources()
</script>

<style scoped>
.resources-page {
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

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.resource-card {
  padding: 20px;
}

.resource-header {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.resource-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
}

.resource-info h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.resource-meta {
  font-size: 13px;
  color: var(--text-tertiary);
}

.resource-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0 0 16px;
  line-height: 1.5;
}

.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  font-size: 13px;
  color: var(--text-tertiary);
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  color: var(--text-tertiary);
}

.empty-state p {
  margin-top: 12px;
}

.resource-detail {
  padding: 24px;
  text-align: center;
}

.detail-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  margin: 0 auto 20px;
}

.resource-detail h3 {
  margin: 0 0 20px;
  font-size: 24px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.info-row {
  font-size: 15px;
}

.info-row .label {
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-desc h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.detail-desc p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
