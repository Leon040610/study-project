import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

// Helper to mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('ThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    // Reset matchMedia to light mode by default
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  })

  describe('initial state', () => {
    it('should default to auto mode when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useThemeStore()
      expect(store.mode).toBe('auto')
    })

    it('should load stored mode from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = useThemeStore()
      expect(store.mode).toBe('dark')
    })

    it('should load light mode from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = useThemeStore()
      expect(store.mode).toBe('light')
    })
  })

  describe('isDark computed', () => {
    it('should return false in auto mode when system is light', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useThemeStore()
      expect(store.isDark).toBe(false)
    })

    it('should return true when mode is dark', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = useThemeStore()
      expect(store.isDark).toBe(true)
    })

    it('should return false when mode is light', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = useThemeStore()
      expect(store.isDark).toBe(false)
    })
  })

  describe('resolvedTheme', () => {
    it('should return dark when isDark is true', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = useThemeStore()
      expect(store.resolvedTheme).toBe('dark')
    })

    it('should return light when isDark is false', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = useThemeStore()
      expect(store.resolvedTheme).toBe('light')
    })
  })

  describe('setMode', () => {
    it('should set mode to dark', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useThemeStore()
      store.setMode('dark')
      expect(store.mode).toBe('dark')
    })

    it('should set mode to light', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useThemeStore()
      store.setMode('light')
      expect(store.mode).toBe('light')
    })

    it('should set mode to auto', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = useThemeStore()
      store.setMode('auto')
      expect(store.mode).toBe('auto')
    })

    it('should persist mode to localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useThemeStore()
      store.setMode('dark')
      await nextTick()
      expect(localStorageMock.setItem).toHaveBeenCalledWith('study-app-theme', 'dark')
    })
  })

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const store = useThemeStore()
      store.toggle()
      expect(store.mode).toBe('dark')
    })

    it('should toggle from dark to light', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = useThemeStore()
      store.toggle()
      expect(store.mode).toBe('light')
    })

    it('should toggle from auto (light system) to dark', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useThemeStore()
      // auto + light system => isDark=false => toggle to dark
      store.toggle()
      expect(store.mode).toBe('dark')
    })
  })

  describe('applyTheme side effects', () => {
    it('should add dark class to html element when dark', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      useThemeStore()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should add light class to html element when light', () => {
      localStorageMock.getItem.mockReturnValue('light')
      useThemeStore()
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })

    it('should set colorScheme style on html element', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      useThemeStore()
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })
  })
})
