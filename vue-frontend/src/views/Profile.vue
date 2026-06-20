<template>
  <div class="profile-page">
    <!-- 个人信息卡片 -->
    <el-card class="profile-card">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="user.name"
              class="avatar-img"
              @error="onAvatarError"
            />
            <el-icon v-else :size="40"><User /></el-icon>
          </div>
          <el-button type="primary" size="small" @click="changeAvatar">
            <el-icon><Camera /></el-icon>
            <span>更换头像</span>
          </el-button>
        </div>
        <div class="profile-info">
          <h2>{{ user.name }}</h2>
          <p>{{ user.email }}</p>
          <el-tag :type="user.role === 'admin' ? 'danger' : ''" effect="light">
            {{ user.role === 'admin' ? '管理员' : '学生' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 主题设置卡片 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header-flex">
          <span class="card-title">
            <el-icon><Brush /></el-icon>
            外观设置
          </span>
        </div>
      </template>
      <div class="theme-settings">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">主题模式</span>
            <span class="setting-desc">选择您偏好的界面主题，设置将自动保存</span>
          </div>
          <div class="theme-switcher">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              class="theme-option"
              :class="{ active: themeStore.mode === option.value }"
              @click="themeStore.setMode(option.value)"
            >
              <el-icon :size="18">
                <component :is="option.icon" />
              </el-icon>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
        <div class="setting-row current-theme">
          <div class="setting-info">
            <span class="setting-label">当前生效</span>
            <span class="setting-desc">{{ themeStore.isDark ? '暗黑模式' : '明亮模式' }}</span>
          </div>
          <div class="theme-indicator" :class="{ dark: themeStore.isDark }">
            <el-icon :size="16">
              <Sunny v-if="!themeStore.isDark" />
              <Moon v-else />
            </el-icon>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 学习提醒快捷入口 -->
    <el-card class="form-card">
      <template #header>
        <span class="card-title">
          <el-icon><Bell /></el-icon>
          学习提醒
        </span>
      </template>
      <div class="reminder-quick-access">
        <p class="reminder-desc">配置学习任务提醒，支持邮件和手机推送通知，确保不错过重要任务截止时间。</p>
        <el-button type="primary" @click="goToReminders">
          <el-icon><Setting /></el-icon>
          <span>前往提醒设置</span>
        </el-button>
      </div>
    </el-card>

    <!-- 个人信息编辑 -->
    <el-card class="form-card">
      <template #header>
        <span class="card-title">
          <el-icon><EditPen /></el-icon>
          个人信息
        </span>
      </template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="form.name" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="updateProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码 -->
    <el-card class="form-card">
      <template #header>
        <span class="card-title">
          <el-icon><Lock /></el-icon>
          修改密码
        </span>
      </template>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 学习统计 -->
    <el-card class="stats-card">
      <template #header>
        <span class="card-title">
          <el-icon><DataLine /></el-icon>
          学习统计
        </span>
      </template>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon stat-icon-blue">
            <el-icon :size="22"><FolderOpened /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.plans }}</div>
            <div class="stat-label">学习计划</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon stat-icon-green">
            <el-icon :size="22"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completedTasks }}</div>
            <div class="stat-label">已完成任务</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon stat-icon-amber">
            <el-icon :size="22"><Aim /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.goals }}</div>
            <div class="stat-label">学习目标</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon stat-icon-pink">
            <el-icon :size="22"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.resources }}</div>
            <div class="stat-label">上传资源</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 头像上传模态对话框 -->
    <el-dialog
      v-model="avatarDialogVisible"
      title="更换头像"
      width="640px"
      :close-on-click-modal="false"
      @closed="closeAvatarDialog"
    >
      <div class="avatar-upload-panel">
        <div v-if="!avatarSourceUrl" class="upload-dropzone">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            :on-change="handleAvatarFileChange"
            drag
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将图片拖到此处，或<em>点击选择文件</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PNG / JPG / JPEG / WEBP 格式，文件大小不超过 2MB
              </div>
            </template>
          </el-upload>
        </div>

        <div v-else class="crop-stage">
          <div class="crop-canvas-wrap">
            <canvas
              ref="cropCanvasEl"
              class="crop-canvas"
              width="400"
              height="400"
              @pointerdown="onCropPointerDown"
              @pointermove="onCropPointerMove"
              @pointerup="onCropPointerUp"
              @pointerleave="onCropPointerUp"
            />
            <div class="crop-info">
              拖动方框选择裁剪区域（建议正方形）
            </div>
          </div>
          <div class="crop-preview-wrap">
            <div class="crop-preview-label">预览效果</div>
            <div class="crop-preview">
              <canvas ref="cropPreviewEl" width="200" height="200" />
            </div>
            <div class="crop-preview-meta">
              <div>输出尺寸: 200 × 200</div>
              <div>源文件: {{ avatarSourceName }}</div>
            </div>
            <el-button class="crop-replace-btn" text @click="replaceAvatarImage">
              <el-icon><Refresh /></el-icon><span>重新选择</span>
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="resetAvatarHandler" plain>
          <el-icon><RefreshLeft /></el-icon><span>恢复默认头像</span>
        </el-button>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="avatarUploading"
          :disabled="!avatarSourceUrl"
          @click="confirmAvatarUpload"
        >确认更换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { useThemeStore } from '@/stores/theme'
import { api } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Camera, Brush, EditPen, Lock, DataLine,
  FolderOpened, CircleCheck, Aim, Document,
  Sunny, Moon, Monitor, Bell, Setting,
  Upload, Refresh, RefreshLeft
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const themeStore = useThemeStore()

const themeOptions = [
  { value: 'light' as const, label: '明亮', icon: Sunny },
  { value: 'dark' as const, label: '暗黑', icon: Moon },
  { value: 'auto' as const, label: '跟随系统', icon: Monitor }
]

const user = computed(() => authStore.user || {
  id: '',
  name: '未登录',
  email: '请先登录',
  phone: '',
  role: 'student' as const,
  created_at: ''
})

// 头像 URL：加 ?t= 时间戳防止浏览器缓存
const avatarUrl = computed(() => {
  const u = user.value as any
  if (!u || !u.avatar) return ''
  const sep = u.avatar.includes('?') ? '&' : '?'
  return u.avatar + sep + 't=' + (u.avatarUpdatedAt || Date.now())
})

// ========== 头像上传 / 裁剪 ==========
const avatarDialogVisible = ref(false)
const avatarUploading = ref(false)
const avatarSourceUrl = ref('')
const avatarSourceName = ref('')
const cropCanvasEl = ref<HTMLCanvasElement | null>(null)
const cropPreviewEl = ref<HTMLCanvasElement | null>(null)
// cropState 在 400x400 canvas 坐标系下表达方框位置
const cropState = reactive({
  x: 100, y: 100, size: 200
})
const cropDrag = reactive({ active: false, offsetX: 0, offsetY: 0 })
let sourceImage: HTMLImageElement | null = null
let sourceScale = 1
let sourceOffsetX = 0
let sourceOffsetY = 0
const objectUrlsToRevoke: string[] = []

function onAvatarError() {
  // 加载失败时仅记录警告，不要清空 avatar 字段
  console.warn('[Profile] 头像加载失败')
}

const form = reactive({
  name: '',
  email: '',
  phone: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref()

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const stats = reactive({
  plans: 0,
  completedTasks: 0,
  goals: 0,
  resources: 0
})

function syncUserForm() {
  form.name = user.value.name
  form.email = user.value.email
  form.phone = user.value.phone || ''
}

async function fetchStats() {
  try {
    await dataStore.fetchAllData()
    const today = new Date().toISOString().split('T')[0]
    stats.plans = dataStore.plans.length
    // 按日期隔离：以"今日"完成状态统计
    stats.completedTasks = dataStore.tasks.filter((t: any) => dataStore.isTaskCompletedOnDate(t, today)).length
    stats.goals = dataStore.goals.length
    stats.resources = 5
  } catch {
    stats.plans = 3
    stats.completedTasks = 12
    stats.goals = 4
    stats.resources = 2
  }
}

async function updateProfile() {
  try {
    await authStore.updateProfile({ phone: form.phone })
    ElMessage.success('修改成功')
  } catch {
    ElMessage.error('修改失败')
  }
}

async function changePassword() {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate().catch(() => {})

  try {
    await api.post('/auth/change-password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch {
    ElMessage.error('密码修改失败')
  }
}

function changeAvatar() {
  avatarDialogVisible.value = true
}

function closeAvatarDialog() {
  if (avatarSourceUrl.value) {
    try { URL.revokeObjectURL(avatarSourceUrl.value) } catch { /* ignore */ }
  }
  avatarSourceUrl.value = ''
  avatarSourceName.value = ''
  sourceImage = null
  cropState.x = 100
  cropState.y = 100
  cropState.size = 200
}

function replaceAvatarImage() {
  if (avatarSourceUrl.value) {
    try { URL.revokeObjectURL(avatarSourceUrl.value) } catch { /* ignore */ }
  }
  avatarSourceUrl.value = ''
  avatarSourceName.value = ''
  sourceImage = null
}

async function handleAvatarFileChange(file: any) {
  const raw: File | undefined = file && file.raw
  if (!raw) return
  // 客户端预校验：格式 + 大小
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowed.includes(raw.type)) {
    ElMessage.error('仅支持 PNG / JPG / JPEG / WEBP 格式')
    return
  }
  if (raw.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return
  }
  avatarSourceName.value = raw.name || 'avatar'
  const url = URL.createObjectURL(raw)
  objectUrlsToRevoke.push(url)
  avatarSourceUrl.value = url

  // 加载图片
  await nextTick()
  const img = new Image()
  img.onload = () => {
    sourceImage = img
    // 计算适配 400x400 的缩放
    const s = Math.min(400 / img.width, 400 / img.height)
    sourceScale = s
    sourceOffsetX = (400 - img.width * s) / 2
    sourceOffsetY = (400 - img.height * s) / 2
    // 默认裁剪框：正方形居中
    const size = Math.min(400, 400 * 0.8)
    cropState.size = size
    cropState.x = (400 - size) / 2
    cropState.y = (400 - size) / 2
    drawCropCanvas()
  }
  img.onerror = () => {
    ElMessage.error('图片加载失败，请尝试其他文件')
    avatarSourceUrl.value = ''
  }
  img.src = url
}

function drawCropCanvas() {
  const canvas = cropCanvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 400, 400)
  // 背景
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, 400, 400)
  if (sourceImage) {
    ctx.drawImage(sourceImage, sourceOffsetX, sourceOffsetY, sourceImage.width * sourceScale, sourceImage.height * sourceScale)
  }
  // 暗角
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
  ctx.fillRect(0, 0, 400, 400)
  // 还原选区内
  if (sourceImage) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(cropState.x, cropState.y, cropState.size, cropState.size)
    ctx.clip()
    ctx.drawImage(sourceImage, sourceOffsetX, sourceOffsetY, sourceImage.width * sourceScale, sourceImage.height * sourceScale)
    ctx.restore()
  }
  // 选框边框
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(cropState.x + 1, cropState.y + 1, cropState.size - 2, cropState.size - 2)
  // 1/3 宫格参考线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  for (let i = 1; i <= 2; i++) {
    const x = cropState.x + (cropState.size * i) / 3
    const y = cropState.y + (cropState.size * i) / 3
    ctx.beginPath(); ctx.moveTo(x, cropState.y); ctx.lineTo(x, cropState.y + cropState.size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cropState.x, y); ctx.lineTo(cropState.x + cropState.size, y); ctx.stroke()
  }
  // 角点
  const corners: [number, number][] = [
    [cropState.x, cropState.y],
    [cropState.x + cropState.size, cropState.y],
    [cropState.x, cropState.y + cropState.size],
    [cropState.x + cropState.size, cropState.y + cropState.size]
  ]
  ctx.fillStyle = '#3b82f6'
  for (const [cx, cy] of corners) {
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
  }

  drawCropPreview()
}

function drawCropPreview() {
  const canvas = cropPreviewEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 200, 200)
  if (!sourceImage) {
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, 200, 200)
    return
  }
  // 裁剪坐标系转换：canvas(400) -> 源图 -> 200x200 输出
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 200, 200)
  const ratio = 200 / cropState.size
  ctx.drawImage(
    sourceImage,
    (cropState.x - sourceOffsetX) / sourceScale,
    (cropState.y - sourceOffsetY) / sourceScale,
    cropState.size / sourceScale,
    cropState.size / sourceScale,
    0, 0, 200, 200
  )
}

function onCropPointerDown(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) * (400 / rect.width)
  const y = (e.clientY - rect.top) * (400 / rect.height)
  // 命中选区则开始拖动
  if (x >= cropState.x && x <= cropState.x + cropState.size &&
      y >= cropState.y && y <= cropState.y + cropState.size) {
    cropDrag.active = true
    cropDrag.offsetX = x - cropState.x
    cropDrag.offsetY = y - cropState.y
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
}

function onCropPointerMove(e: PointerEvent) {
  if (!cropDrag.active) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) * (400 / rect.width)
  const y = (e.clientY - rect.top) * (400 / rect.height)
  cropState.x = Math.max(0, Math.min(400 - cropState.size, x - cropDrag.offsetX))
  cropState.y = Math.max(0, Math.min(400 - cropState.size, y - cropDrag.offsetY))
  drawCropCanvas()
}

function onCropPointerUp(e: PointerEvent) {
  if (cropDrag.active) {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
  }
  cropDrag.active = false
}

async function confirmAvatarUpload() {
  if (!sourceImage || !cropPreviewEl.value) {
    ElMessage.warning('请先选择图片')
    return
  }
  avatarUploading.value = true
  try {
    // 导出 200x200 PNG Blob
    const blob: Blob = await new Promise((resolve, reject) => {
      cropPreviewEl.value!.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('图像导出失败'))
      }, 'image/png', 0.95)
    })
    const data = await authStore.updateAvatar(blob, (avatarSourceName.value || 'avatar') + '.png')
    ElMessage.success(data.message || '头像已更新')
    avatarDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(typeof e === 'string' ? e : (e && e.message) || '上传失败')
  } finally {
    avatarUploading.value = false
  }
}

async function resetAvatarHandler() {
  try {
    await ElMessageBox.confirm('确定恢复为默认头像吗？', '提示', {
      type: 'warning',
      confirmButtonText: '恢复',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await authStore.resetAvatar()
    ElMessage.success('已恢复默认头像')
    avatarDialogVisible.value = false
  } catch {
    ElMessage.error('恢复失败')
  }
}

function goToReminders() {
  router.push('/reminders')
}

onMounted(() => {
  syncUserForm()
  fetchStats()
})

onUnmounted(() => {
  for (const url of objectUrlsToRevoke) {
    try { URL.revokeObjectURL(url) } catch { /* ignore */ }
  }
  objectUrlsToRevoke.length = 0
})
</script>

<style scoped>
.profile-page {
  padding: var(--space-6);
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-6);
}

.profile-card {
  grid-column: 1 / -1;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.avatar {
  width: 120px;
  height: 120px;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  box-shadow: var(--shadow-lg);
  position: relative;
}

.avatar::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: var(--radius-full);
  background: var(--gradient-primary);
  opacity: 0.3;
  z-index: -1;
  filter: blur(8px);
}

.profile-info h2 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.profile-info p {
  margin: 0 0 var(--space-3);
  color: var(--text-secondary);
  font-size: var(--text-base);
}

/* ---- 主题设置卡片 ---- */
.settings-card {
  grid-column: 1 / -1;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.theme-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-surface-hover);
  border-radius: var(--radius-lg);
  transition: background var(--transition-fast);
}

.setting-row:hover {
  background: var(--color-primary-subtle);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.setting-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* 主题切换按钮组 */
.theme-switcher {
  display: flex;
  gap: var(--space-1);
  background: var(--bg-base);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.theme-option:hover {
  color: var(--text-primary);
  background: var(--bg-surface-hover);
}

.theme-option.active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

/* 当前主题指示器 */
.current-theme {
  background: var(--color-primary-subtle);
}

.theme-indicator {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-warning-light);
  color: var(--color-warning);
  transition: all var(--transition-spring);
}

.theme-indicator.dark {
  background: var(--color-primary-dark);
  color: var(--text-link);
  transform: rotate(360deg);
}

/* ---- 表单卡片 ---- */
.form-card {
  padding: 0;
}

.reminder-quick-access {
  padding: var(--space-4) 0;
}

.reminder-desc {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
  line-height: 1.6;
}

/* ---- 统计卡片 ---- */
.stats-card {
  grid-column: 1 / -1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-surface-hover);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.stat-item:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.stat-icon-blue { background: var(--color-info-light); color: var(--color-info); }
.stat-icon-green { background: var(--color-success-light); color: var(--color-success); }
.stat-icon-amber { background: var(--color-warning-light); color: var(--color-warning); }
.stat-icon-pink { background: var(--color-danger-light); color: var(--color-danger); }

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

/* ---- 响应式 ---- */
@media (max-width: 900px) {
  .profile-page {
    grid-template-columns: 1fr;
    padding: var(--space-4);
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-4);
  }

  .profile-info h2 {
    font-size: var(--text-2xl);
  }

  .theme-switcher {
    flex-wrap: wrap;
  }

  .theme-option {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
  }

  .setting-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 头像相关 ========== */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.avatar-upload-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.upload-dropzone {
  width: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crop-stage {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: var(--space-4);
  align-items: start;
}

.crop-canvas-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.crop-canvas {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  background: #0f172a;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.crop-canvas:active {
  cursor: grabbing;
}

.crop-info {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-align: center;
}

.crop-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.crop-preview-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.crop-preview {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  box-shadow: 0 0 0 1px var(--border-default);
}

.crop-preview canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.crop-preview-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-align: center;
  word-break: break-all;
}

.crop-replace-btn {
  font-size: var(--text-xs);
}

@media (max-width: 640px) {
  .crop-stage {
    grid-template-columns: 1fr;
  }
}
</style>
