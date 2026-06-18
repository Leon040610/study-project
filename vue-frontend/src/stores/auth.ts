import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string, captcha?: string) {
    const params = captcha ? { email, password, captcha } : { email, password }
    const response = await api.post('/auth/login', params)
    token.value = response.token
    user.value = response.user
    localStorage.setItem('token', response.token)
    return response
  }

  async function register(data: RegisterData) {
    const response = await api.post('/auth/register', data)
    return response
  }

  async function getProfile() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/profile')
      // 只有当返回的数据有效时才更新，避免覆盖已有的用户信息
      if (response && response.name && response.email) {
        user.value = response
      }
      return response
    } catch {
      // 获取 profile 失败时不覆盖已有用户信息
      // 保留登录时获取的用户信息
    }
  }

  async function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  async function updateProfile(data: Partial<UserInfo>) {
    const response = await api.put('/auth/profile', data)
    user.value = response
    return response
  }

  async function getCaptcha() {
    const response = await api.get('/auth/captcha')
    return response
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    register,
    getProfile,
    logout,
    updateProfile,
    getCaptcha
  }
})

export interface UserInfo {
  id: string
  name: string
  email: string
  phone?: string
  role: 'student' | 'admin'
  created_at: string
}

export interface RegisterData {
  name: string
  email: string
  phone?: string
  password: string
}
