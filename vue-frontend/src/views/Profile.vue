<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar">
            <el-icon style="font-size: 40px;"><User /></el-icon>
          </div>
          <el-button type="primary" size="small" @click="changeAvatar">更换头像</el-button>
        </div>
        <div class="profile-info">
          <h2>{{ user.name }}</h2>
          <p>{{ user.email }}</p>
          <el-tag :type="user.role === 'admin' ? 'danger' : ''">
            {{ user.role === 'admin' ? '管理员' : '学生' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="form-card">
      <template #header>
        <span>个人信息</span>
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

    <el-card class="form-card">
      <template #header>
        <span>修改密码</span>
      </template>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="stats-card">
      <template #header>
        <span>学习统计</span>
      </template>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.plans }}</div>
            <div class="stat-label">学习计划</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completedTasks }}</div>
            <div class="stat-label">已完成任务</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.goals }}</div>
            <div class="stat-label">学习目标</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">📚</div>
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
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

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

async function loadUser() {
  // 不再调用 getProfile，直接使用 authStore 中已有的用户信息
  // 登录时已经获取了用户信息，这里只需要同步到表单
  syncUserForm()
}

async function fetchStats() {
  try {
    await dataStore.fetchAllData()
    stats.plans = dataStore.plans.length
    stats.completedTasks = dataStore.tasks.filter((t: { completed: boolean }) => t.completed).length
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

onMounted(() => {
  syncUserForm()
  loadUser()
  fetchStats()
})
</script>

<style scoped>
.profile-page {
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.profile-card {
  grid-column: 1 / -1;
  padding: 32px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #1e40af 0%, #0d9488 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}

.profile-info h2 {
  margin: 0 0 8px;
  font-size: 28px;
}

.profile-info p {
  margin: 0 0 12px;
  color: #64748b;
}

.form-card {
  padding: 24px;
}

.stats-card {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

@media (max-width: 900px) {
  .profile-page {
    grid-template-columns: 1fr;
  }
}
</style>
