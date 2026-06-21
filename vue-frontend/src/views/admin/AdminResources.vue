<template>
  <div class="admin-resources">
    <div class="page-header">
      <h2 class="page-title">资源管理</h2>
      <div class="header-actions">
        <el-button :icon="Upload" type="primary" @click="showUpload = true">批量上传</el-button>
      </div>
    </div>

    <el-card>
      <!-- 搜索筛选 -->
      <div class="filter-bar">
        <el-input v-model="filters.q" placeholder="搜索标题/描述/上传者" clearable style="width: 240px" @keyup.enter="reload" @clear="reload" />
        <el-select v-model="filters.category" placeholder="全部分类" clearable style="width: 160px" @change="reload">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
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
        <el-table-column prop="id" label="ID" width="100" show-overflow-tooltip />
        <el-table-column label="资源" min-width="200">
          <template #default="{ row }">
            <div class="cell-title">
              <span>{{ row.title || row.fileName }}</span>
              <el-tag v-if="row.uploader" size="small" type="info" effect="plain" style="margin-left: 6px">
                {{ row.uploader }}
              </el-tag>
            </div>
            <div class="cell-desc">{{ row.description || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="typeColor(row.type)">{{ typeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下载" width="80" prop="downloadCount" />
        <el-table-column label="评分" width="80" prop="rating" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
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

    <!-- 编辑对话框 -->
    <el-dialog v-model="editVisible" :title="form.id ? '编辑资源' : '编辑资源'" width="560px" @closed="resetForm">
      <el-form :model="form" label-width="100px">
        <el-form-item label="资源标题">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="资源分类">
          <el-select v-model="form.category" placeholder="选择分类" filterable allow-create style="width: 100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
            <el-option label="电子书" value="ebook" />
            <el-option label="视频教程" value="video" />
            <el-option label="文档资料" value="document" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入资源描述" />
        </el-form-item>
        <el-form-item label="资源文件">
          <el-upload
            :auto-upload="true"
            :show-file-list="false"
            :http-request="handleEditFileUpload"
            :accept="acceptList"
          >
            <el-button type="primary" plain>选择新文件替换</el-button>
            <template #tip>
              <div class="el-upload__tip" v-if="form.fileName">
                当前文件：{{ form.fileName }}
              </div>
              <div class="el-upload__tip" v-else>
                当前文件URL：{{ form.fileUrl || '无' }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="文件URL">
          <el-input v-model="form.fileUrl" placeholder="/uploads/xxx" />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="form.fileName" placeholder="原文件名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量上传 -->
    <el-dialog v-model="showUpload" title="批量上传资源" width="560px" @closed="resetUpload">
      <el-form label-width="100px">
        <el-form-item label="目标分类">
          <el-select v-model="uploadForm.category" placeholder="选择分类" filterable allow-create style="width: 100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="uploadForm.type" placeholder="选择类型" style="width: 100%">
            <el-option label="电子书" value="ebook" />
            <el-option label="视频教程" value="video" />
            <el-option label="文档资料" value="document" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            drag multiple :auto-upload="false"
            :file-list="uploadForm.files"
            :on-change="onFileChange" :on-remove="onFileRemove"
            :accept="acceptList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽文件或<em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 pdf/doc/ppt/xls/zip/mp4 等，最大 50MB × 20 个</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">开始上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile, type UploadFiles } from 'element-plus'
import { Upload, UploadFilled, Delete } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const items = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const categories = ref<string[]>([])
const selected = ref<any[]>([])

const filters = reactive({ q: '', category: '', page: 1, pageSize: 10 })

const editVisible = ref(false)
const showUpload = ref(false)
const form = reactive({ id: '', title: '', category: '', type: 'document', description: '', fileUrl: '', fileName: '' })
const uploadForm = reactive({ category: '', type: 'document', files: [] as UploadFile[] })
const uploadRef = ref()
const acceptList = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.mp4,.mp3,.jpg,.png,.txt,.md'

function typeName(t: string) { return { ebook: '电子书', video: '视频', document: '文档', other: '其他' }[t] || '其他' }
function typeColor(t: string) { return ({ ebook: 'success', video: 'warning', document: 'primary', other: 'info' } as any)[t] || 'info' }
function formatDate(s: string) { return s ? new Date(s).toLocaleString('zh-CN') : '-' }

async function reload() {
  loading.value = true
  try {
    const data: any = await api.get('/admin/resources', { params: filters })
    items.value = data.items || []
    total.value = data.total || 0
    if (data.categories) categories.value = data.categories
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.q = ''; filters.category = ''; filters.page = 1
  reload()
}

function resetForm() {
  Object.assign(form, { id: '', title: '', category: '', type: 'document', description: '', fileUrl: '', fileName: '' })
}

function openEdit(row: any) {
  Object.assign(form, {
    id: row.id, title: row.title || '', category: row.category || '',
    type: row.type || 'document', description: row.description || '',
    fileUrl: row.fileUrl || '', fileName: row.fileName || ''
  })
  editVisible.value = true
}

async function handleEditFileUpload(options: any) {
  const file = options.file
  if (!file) return
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('category', form.category || '其他')
    fd.append('type', form.type || 'document')
    const token = localStorage.getItem('token') || ''
    const res = await fetch('/api/resources/upload', {
      method: 'POST', body: fd,
      headers: { Authorization: 'Bearer ' + token }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '文件上传失败')
    form.fileUrl = data.fileUrl || data.url || ''
    form.fileName = data.fileName || file.name
    ElMessage.success('文件上传成功，点击保存以应用更改')
  } catch (e: any) {
    ElMessage.error(e?.message || '文件上传失败')
  }
}

async function saveEdit() {
  if (!form.title) return ElMessage.warning('请输入资源标题')
  saving.value = true
  try {
    await api.put('/admin/resources/' + form.id, {
      title: form.title, category: form.category, type: form.type,
      description: form.description, fileUrl: form.fileUrl, fileName: form.fileName
    })
    ElMessage.success('保存成功')
    editVisible.value = false
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除资源 "${row.title || row.fileName}" 吗？此操作不可恢复。`,
      '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await api.delete('/resources/' + row.id)
    ElMessage.success('已删除')
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

async function confirmBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要批量删除 ${selected.value.length} 个资源吗？此操作不可恢复。`,
      '批量删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    const res: any = await api.post('/admin/resources/batch-delete', { ids: selected.value.map(s => s.id) })
    ElMessage.success(`已删除 ${res.removed} 个资源`)
    selected.value = []
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

function onFileChange(_file: UploadFile, files: UploadFiles) { uploadForm.files = files as any }
function onFileRemove(_file: UploadFile, files: UploadFiles) { uploadForm.files = files as any }
function resetUpload() { uploadForm.category = ''; uploadForm.type = 'document'; uploadForm.files = [] }

async function submitUpload() {
  if (!uploadForm.category) return ElMessage.warning('请选择分类')
  if (uploadForm.files.length === 0) return ElMessage.warning('请选择文件')
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('category', uploadForm.category)
    fd.append('type', uploadForm.type)
    for (const f of uploadForm.files) {
      if (f.raw) fd.append('files', f.raw)
    }
    const token = localStorage.getItem('token') || ''
    const res = await fetch('/api/admin/resources/batch-upload', {
      method: 'POST', body: fd,
      headers: { Authorization: 'Bearer ' + token }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '上传失败')
    ElMessage.success(`成功上传 ${data.count} 个资源`)
    showUpload.value = false
    resetUpload()
    reload()
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

onMounted(reload)
</script>

<style scoped>
.admin-resources { padding: 8px 4px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 20px; font-weight: 700; }
.filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.filter-spacer { flex: 1; }
.cell-title { font-weight: 500; }
.cell-desc { font-size: 12px; color: #9ca3af; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
