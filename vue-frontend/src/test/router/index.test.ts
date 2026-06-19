import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the auth store
const mockAuthStore = {
  isLoggedIn: false,
  isAdmin: false,
}

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Use vi.hoisted to capture the guard before module evaluation
const holder = vi.hoisted(() => ({ guard: null as any }))

// Mock vue-router with a functional createRouter
vi.mock('vue-router', () => ({
  createRouter: (options: any) => {
    const router = {
      options,
      beforeEach: (guard: any) => {
        holder.guard = guard
      },
    }
    return router
  },
  createWebHistory: vi.fn(),
}))

import router from '@/router/index'

describe('Router Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockAuthStore.isLoggedIn = false
    mockAuthStore.isAdmin = false
  })

  describe('route definitions', () => {
    it('should have login route', () => {
      const loginRoute = router.options.routes.find((r: any) => r.path === '/login')
      expect(loginRoute).toBeDefined()
    })

    it('should have dashboard as default redirect', () => {
      const rootRoute = router.options.routes.find((r: any) => r.path === '/')
      const defaultChild = rootRoute?.children?.find((c: any) => c.path === '')
      expect(defaultChild?.redirect).toBe('/dashboard')
    })

    it('should define all main routes', () => {
      const rootRoute = router.options.routes.find((r: any) => r.path === '/')
      const paths = rootRoute?.children?.map((c: any) => c.path) || []
      expect(paths).toContain('/dashboard')
      expect(paths).toContain('/goals')
      expect(paths).toContain('/plans')
      expect(paths).toContain('/calendar')
      expect(paths).toContain('/resources')
      expect(paths).toContain('/posts')
      expect(paths).toContain('/reminders')
      expect(paths).toContain('/profile')
    })

    it('should define admin routes', () => {
      const rootRoute = router.options.routes.find((r: any) => r.path === '/')
      const paths = rootRoute?.children?.map((c: any) => c.path) || []
      expect(paths).toContain('/admin')
      expect(paths).toContain('/admin/students')
      expect(paths).toContain('/admin/plans')
      expect(paths).toContain('/admin/resources')
      expect(paths).toContain('/admin/posts')
      expect(paths).toContain('/admin/announcements')
    })
  })

  describe('navigation guard', () => {
    it('should redirect to /dashboard when logged in and visiting /login', () => {
      mockAuthStore.isLoggedIn = true
      const next = vi.fn()

      holder.guard({ path: '/login' } as any, {} as any, next)

      expect(next).toHaveBeenCalledWith('/dashboard')
    })

    it('should allow /login when not logged in', () => {
      mockAuthStore.isLoggedIn = false
      const next = vi.fn()

      holder.guard({ path: '/login' } as any, {} as any, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should redirect to /login when not logged in and visiting protected route', () => {
      mockAuthStore.isLoggedIn = false
      const next = vi.fn()

      holder.guard({ path: '/dashboard' } as any, {} as any, next)

      expect(next).toHaveBeenCalledWith('/login')
    })

    it('should allow access to protected route when logged in', () => {
      mockAuthStore.isLoggedIn = true
      const next = vi.fn()

      holder.guard({ path: '/dashboard' } as any, {} as any, next)

      expect(next).toHaveBeenCalledWith()
    })
  })
})
