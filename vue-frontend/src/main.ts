import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 全局错误处理器，用于定位导航渲染异常
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', err)
  console.error('[Global Error] Component:', instance?.$.type?.name || instance?.$.type?.__name || 'unknown')
  console.error('[Global Error] Info:', info)
}

// 初始化主题（store 会自动从 localStorage 读取并应用）
useThemeStore()

app.mount('#app')
