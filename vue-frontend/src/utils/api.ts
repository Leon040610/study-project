import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response } = error
    // 只有真正的 401 未授权才登出，其他错误（404、500等）不触发登出
    if (response?.status === 401) {
      const authStore = useAuthStore()
      // 只在非登录页面才执行登出跳转
      if (!window.location.pathname.includes('/login')) {
        authStore.logout()
        window.location.href = '/login'
      }
    }
    // 返回错误信息，不中断 Promise 链
    return Promise.reject(response?.data?.message || error.message)
  }
)

export const api = {
  get: (url: string, params?: object) => instance.get(url, { params }),
  post: (url: string, data?: object) => instance.post(url, data),
  put: (url: string, data?: object) => instance.put(url, data),
  delete: (url: string) => instance.delete(url)
}
