import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

const STORAGE_KEY = 'study-app-theme'

/**
 * 主题管理 Store
 * - 支持 light / dark / auto 三种模式
 * - auto 模式跟随系统偏好，并实时响应系统切换
 * - 用户选择持久化到 localStorage
 */
export const useThemeStore = defineStore('theme', () => {
  // 读取本地存储的初始值，默认 auto
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  const mode = ref<ThemeMode>(stored || 'auto')

  // 系统偏好（实时响应）
  const systemDark = ref(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })

  // 实际生效的主题
  const isDark = computed(() => {
    if (mode.value === 'auto') {
      return systemDark.value
    }
    return mode.value === 'dark'
  })

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    return isDark.value ? 'dark' : 'light'
  })

  // 将主题类应用到 <html> 元素
  function applyTheme() {
    const html = document.documentElement
    html.classList.remove('light', 'dark')
    html.classList.add(resolvedTheme.value)
    // 同步 color-scheme 属性，让原生控件（滚动条等）也适配
    html.style.colorScheme = resolvedTheme.value
  }

  // 监听变化并应用 + 持久化
  watch(
    [mode, systemDark],
    () => {
      applyTheme()
      localStorage.setItem(STORAGE_KEY, mode.value)
    },
    { immediate: true }
  )

  function setMode(newMode: ThemeMode) {
    mode.value = newMode
  }

  function toggle() {
    // 在 light / dark 之间切换（跳过 auto）
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return {
    mode,
    isDark,
    resolvedTheme,
    setMode,
    toggle
  }
})
