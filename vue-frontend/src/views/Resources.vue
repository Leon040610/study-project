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

    <el-dialog v-model="showUploadModal" title="上传资源" width="600px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="资源名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入资源名称" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="资源分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="电子书" value="ebook" />
            <el-option label="视频教程" value="video" />
            <el-option label="文档资料" value="document" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入资源描述、内容简介、用途说明等"
            maxlength="500"
            show-word-limit
            resize="vertical"
          />
        </el-form-item>
        <el-form-item label="资源文件">
          <el-upload
            class="upload-demo"
            :auto-upload="false"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-preview="handleFilePreview"
            ref="uploadRef"
            list-type="text"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持图片、视频、文档等任意文件，最大 50MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelUpload">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showViewModal" title="资源详情" width="720px" top="6vh">
      <div v-if="selectedResource" class="resource-detail">
        <!-- 预览区：按类型显示 -->
        <div class="preview-area">
          <img
            v-if="isImage(selectedResource)"
            :src="selectedResource.fileUrl"
            :alt="selectedResource.title"
            class="preview-image"
            @error="onPreviewError"
          />
          <video
            v-else-if="isVideo(selectedResource)"
            :src="selectedResource.fileUrl"
            controls
            class="preview-video"
            preload="metadata"
          />
          <audio
            v-else-if="isAudio(selectedResource)"
            :src="selectedResource.fileUrl"
            controls
            class="preview-audio"
          />
          <div v-else class="preview-document">
            <div class="doc-icon">{{ getIcon(selectedResource.type) }}</div>
            <div class="doc-info">
              <div class="doc-name">{{ selectedResource.originalName || selectedResource.title }}</div>
              <div class="doc-meta">
                {{ formatMime(selectedResource.mimeType) }}
                <span v-if="selectedResource.fileSize"> · {{ formatSize(selectedResource.fileSize) }}</span>
              </div>
              <div class="doc-hint">该类型文件暂不支持在线预览，请下载查看</div>
            </div>
          </div>
          <div v-if="previewError" class="preview-fallback">
            <div class="doc-icon">📁</div>
            <div class="doc-info">
              <div class="doc-name">{{ selectedResource.title }}</div>
              <div class="doc-hint">预览加载失败，请下载查看</div>
            </div>
          </div>
        </div>

        <h3 class="detail-title">{{ selectedResource.title }}</h3>
        <div class="detail-info">
          <div class="info-row">
            <span class="label">分类：</span>
            <el-tag size="small">{{ selectedResource.category }}</el-tag>
          </div>
          <div class="info-row">
            <span class="label">类型：</span>
            <span>{{ getTypeName(selectedResource.type) }}</span>
          </div>
          <div class="info-row">
            <span class="label">下载次数：</span>
            <span>{{ selectedResource.downloadCount || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">评分：</span>
            <span>⭐ {{ selectedResource.rating || '暂无' }}</span>
          </div>
          <div class="info-row" v-if="selectedResource.fileSize">
            <span class="label">文件大小：</span>
            <span>{{ formatSize(selectedResource.fileSize) }}</span>
          </div>
        </div>
        <div class="detail-desc">
          <h4>资源描述</h4>
          <p>{{ selectedResource.description || '暂无描述' }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showViewModal = false">关闭</el-button>
        <el-button
          type="primary"
          @click="downloadResource(selectedResource)"
          :disabled="!selectedResource || !selectedResource.fileUrl"
        >
          下载
        </el-button>
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
  mimeType?: string
  fileSize?: number
  originalName?: string
  author?: string
  createdAt?: string
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
const loading = ref(false)
const uploading = ref(false)
const previewError = ref(false)

const form = reactive({
  title: '',
  description: '',
  category: '',
  type: ''
})

const rules = {
  title: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择资源分类', trigger: 'change' }],
  type: [{ required: true, message: '请选择资源类型', trigger: 'change' }]
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

function isImage(r: Resource) {
  if (!r.fileUrl) return false
  const mt = (r.mimeType || '').toLowerCase()
  if (mt.startsWith('image/')) return true
  const ext = (r.originalName || r.fileUrl).toLowerCase()
  return /\.(png|jpe?g|gif|bmp|webp|svg|ico)$/i.test(ext)
}

function isVideo(r: Resource) {
  if (!r.fileUrl) return false
  const mt = (r.mimeType || '').toLowerCase()
  if (mt.startsWith('video/')) return true
  const ext = (r.originalName || r.fileUrl).toLowerCase()
  return /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(ext)
}

function isAudio(r: Resource) {
  if (!r.fileUrl) return false
  const mt = (r.mimeType || '').toLowerCase()
  if (mt.startsWith('audio/')) return true
  const ext = (r.originalName || r.fileUrl).toLowerCase()
  return /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(ext)
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function formatMime(mt?: string) {
  if (!mt) return '未知类型'
  const map: Record<string, string> = {
    'application/pdf': 'PDF 文档',
    'application/zip': 'ZIP 压缩包',
    'application/x-rar-compressed': 'RAR 压缩包',
    'application/msword': 'Word 文档',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 文档',
    'application/vnd.ms-excel': 'Excel 表格',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 表格',
    'application/vnd.ms-powerpoint': 'PPT 演示',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT 演示',
    'text/plain': '文本文件',
    'text/markdown': 'Markdown',
    'application/json': 'JSON',
    'application/octet-stream': '二进制文件'
  }
  return map[mt] || mt
}

function onPreviewError() {
  previewError.value = true
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.category = ''
  form.type = ''
  fileList.value = []
  previewError.value = false
}

async function fetchResources() {
  loading.value = true
  try {
    const data = await api.get('/resources')
    resources.value = data || []
  } catch (e) {
    console.error('加载资源失败:', e)
    resources.value = []
  } finally {
    loading.value = false
  }
}

async function handleUpload() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  uploading.value = true
  try {
    let fileUrl = ''
    let mimeType = ''
    let fileSize = 0
    let originalName = ''
    if (fileList.value.length > 0 && fileList.value[0].raw) {
      const raw = fileList.value[0].raw
      const uploadRes: any = await uploadFile(raw)
      if (uploadRes && uploadRes.fileUrl) {
        fileUrl = uploadRes.fileUrl
        mimeType = uploadRes.mimetype || raw.type || ''
        fileSize = uploadRes.size || raw.size || 0
        originalName = uploadRes.originalName || raw.name || ''
      } else {
        throw new Error('文件上传失败')
      }
    }

    const newResource: any = await api.post('/resources', {
      title: form.title,
      description: form.description,
      category: form.category,
      type: form.type,
      fileUrl,
      mimeType,
      fileSize,
      originalName
    })

    ElMessage.success('上传成功')
    showUploadModal.value = false
    resetForm()
    fetchResources()
    if (newResource && newResource.id) {
      setTimeout(() => viewResource(newResource), 300)
    }
  } catch (e: any) {
    ElMessage.error(typeof e === 'string' ? e : (e && e.message) || '操作失败')
  } finally {
    uploading.value = false
  }
}

function uploadFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    fetch('/api/resources/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) resolve(data)
        else reject(new Error(data.message || '上传失败'))
      })
      .catch(err => reject(err))
  })
}

function handleFileChange(file: any) {
  fileList.value = [file]
}

function handleFileRemove() {
  fileList.value = []
}

function handleFilePreview() {
  // 阻止默认预览
}

function cancelUpload() {
  showUploadModal.value = false
  resetForm()
}

function viewResource(resource: Resource) {
  selectedResource.value = resource
  previewError.value = false
  showViewModal.value = true
}

async function downloadResource(resource: Resource | null) {
  if (!resource) return
  if (!resource.fileUrl) {
    ElMessage.warning('该资源未上传文件，无法下载')
    return
  }
  try {
    const token = localStorage.getItem('token') || ''
    const res = await fetch(`/api/resources/${resource.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '下载失败' }))
      ElMessage.error(err.message || '下载失败')
      return
    }
    const disp = res.headers.get('Content-Disposition') || ''
    let filename = resource.originalName || resource.title
    const m = disp.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i)
    if (m && m[1]) {
      try { filename = decodeURIComponent(m[1]) } catch { filename = m[1] }
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    ElMessage.success('下载完成')
  } catch (e: any) {
    ElMessage.error('下载失败: ' + (e && e.message ? e.message : ''))
  }
  setTimeout(() => fetchResources(), 1200)
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

.preview-area {
  background: #0f172a;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  min-height: 220px;
  max-height: 360px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 8px;
}

.preview-video {
  max-width: 100%;
  max-height: 320px;
  border-radius: 8px;
}

.preview-audio {
  width: 100%;
}

.preview-document,
.preview-fallback {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #fff;
  text-align: left;
}

.preview-document .doc-icon,
.preview-fallback .doc-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.preview-document .doc-info,
.preview-fallback .doc-info {
  flex: 1;
  min-width: 0;
}

.preview-document .doc-name,
.preview-fallback .doc-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  word-break: break-all;
  color: #f1f5f9;
}

.preview-document .doc-meta,
.preview-fallback .doc-meta {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.preview-document .doc-hint,
.preview-fallback .doc-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
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

.detail-title {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 700;
}

.resource-detail h3 {
  margin: 0 0 20px;
  font-size: 24px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  text-align: left;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

.info-row {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-row .label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
  text-align: right;
}

.detail-desc {
  text-align: left;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

.detail-desc h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #475569;
}

.detail-desc p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
