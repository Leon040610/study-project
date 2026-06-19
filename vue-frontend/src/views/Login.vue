<template>
  <div class="login-page">
    <div class="bg-blob-1"></div>
    <div class="bg-blob-2"></div>
    <div class="bg-blob-3"></div>

    <div class="login-card">
      <div class="card-header">
        <div class="logo">
          <el-icon :size="36"><Reading /></el-icon>
        </div>
        <h1>{{ isLogin ? '欢迎回来' : '创建账户' }}</h1>
        <p>{{ isLogin ? '登录您的学习计划助手' : '开始您的学习之旅' }}</p>
      </div>
      <div class="card-body">
        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleSubmit" label-position="top">
          <el-form-item v-if="!isLogin" label="用户名" prop="name">
            <el-input v-model="form.name" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" type="email" placeholder="请输入邮箱地址" :prefix-icon="Message" />
          </el-form-item>
          <el-form-item v-if="!isLogin" label="手机号" prop="phone">
            <el-input v-model="form.phone" type="tel" placeholder="请输入手机号（可选）" :prefix-icon="Phone" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
          </el-form-item>

          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleSubmit">
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form>
        <div class="toggle-link">
          <span>{{ isLogin ? '还没有账户？' : '已有账户？' }}</span>
          <button @click="toggleMode">{{ isLogin ? '立即注册' : '立即登录' }}</button>
        </div>
      </div>
      <div class="footer">© 2026 智能学习计划助手 | 让学习更高效</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Reading, User, Message, Phone, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const loading = ref(false)
const formRef = ref()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: ''
})

const rules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})

  loading.value = true
  try {
    if (isLogin.value) {
      await authStore.login(form.email, form.password)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      await authStore.register({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password
      })
      ElMessage.success('注册成功，请登录')
      toggleMode()
    }
  } catch (error: any) {
    ElMessage.error(error || '操作失败')
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  form.name = ''
  form.email = ''
  form.phone = ''
  form.password = ''
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--gradient-sidebar);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
}

.bg-blob-1 {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 500px;
  height: 500px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  filter: blur(60px);
  animation: float 8s ease-in-out infinite;
}

.bg-blob-2 {
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 50%;
  filter: blur(60px);
  animation: float 10s ease-in-out infinite reverse;
}

.bg-blob-3 {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 50%;
  filter: blur(80px);
  transform: translate(-50%, -50%);
  animation: pulse 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

.login-card {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  position: relative;
  z-index: var(--z-dropdown);
  animation: cardEnter 0.6s ease-out;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header {
  background: var(--gradient-primary);
  padding: var(--space-12) var(--space-10);
  text-align: center;
}

.logo {
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-full);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto var(--space-5);
  color: white;
}

.card-header h1 {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: white;
  margin-bottom: var(--space-2);
  letter-spacing: -0.02em;
}

.card-header p {
  opacity: 0.9;
  font-size: var(--text-sm);
  color: white;
}

.card-body {
  padding: var(--space-10);
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: var(--text-base);
  font-weight: 600;
  margin-top: var(--space-2);
}

.toggle-link {
  text-align: center;
  margin-top: var(--space-7);
  padding-top: var(--space-7);
  border-top: 1px solid var(--border-default);
}

.toggle-link span {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.toggle-link button {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  font-size: var(--text-sm);
  margin-left: var(--space-1);
  transition: color var(--transition-fast);
}

.toggle-link button:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.footer {
  text-align: center;
  padding: var(--space-4) var(--space-10) var(--space-6);
  border-top: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

/* ---- 响应式 ---- */
@media (max-width: 480px) {
  .login-page {
    padding: var(--space-4);
  }

  .card-header {
    padding: var(--space-8) var(--space-6);
  }

  .card-header h1 {
    font-size: var(--text-2xl);
  }

  .card-body {
    padding: var(--space-6);
  }

  .footer {
    padding: var(--space-4) var(--space-6) var(--space-5);
  }
}
</style>
