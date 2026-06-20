<template>
  <div class="profile-page">
    <!-- 个人信息卡片 -->
    <el-card class="profile-card">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar">
            <el-icon :size="40"><User /></el-icon>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { useThemeStore } from '@/stores/theme'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'
import {
  User, Camera, Brush, EditPen, Lock, DataLine,
  FolderOpened, CircleCheck, Aim, Document,
  Sunny, Moon, Monitor, Bell, Setting
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
  ElMessage.info('头像上传功能开发中')
}

function goToReminders() {
  router.push('/reminders')
}

onMounted(() => {
  syncUserForm()
  fetchStats()
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
</style>
