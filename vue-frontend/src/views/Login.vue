<template>
  <div class="login-page">
    <div class="bg-blob-1"></div>
    <div class="bg-blob-2"></div>
    <div class="login-card">
      <div class="card-header">
        <div class="logo">📚</div>
        <h1>{{ isLogin ? '欢迎回来' : '创建账户' }}</h1>
        <p>{{ isLogin ? '登录您的学习计划助手' : '开始您的学习之旅' }}</p>
      </div>
      <div class="card-body">
        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleSubmit">
          <el-form-item v-if="!isLogin" label="用户名" prop="name">
            <el-input v-model="form.name" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" type="email" placeholder="请输入邮箱地址" />
          </el-form-item>
          <el-form-item v-if="!isLogin" label="手机号" prop="phone">
            <el-input v-model="form.phone" type="tel" placeholder="请输入手机号（可选）" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          
          <el-button type="primary" :loading="loading" style="width: 100%;" @click="handleSubmit">
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

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
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
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
}

.login-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.card-header {
  background: linear-gradient(135deg, #1e40af 0%, #0d9488 100%);
  padding: 48px 40px;
  text-align: center;
}

.card-header .logo {
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
  font-size: 36px;
}

.card-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.card-header p {
  opacity: 0.9;
  font-size: 15px;
  color: white;
}

.card-body {
  padding: 40px;
}

.toggle-link {
  text-align: center;
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #e2e8f0;
}

.toggle-link span {
  font-size: 14px;
  color: #64748b;
}

.toggle-link button {
  background: none;
  border: none;
  color: #1e40af;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  margin-left: 4px;
}

.toggle-link button:hover {
  text-decoration: underline;
}

.footer {
  text-align: center;
  padding: 16px 40px 24px;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 12px;
}
</style>
