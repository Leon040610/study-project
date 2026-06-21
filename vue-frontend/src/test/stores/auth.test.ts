import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock the api module
vi.mock('@/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Import after mock
import { api } from '@/utils/api'

// Mock localStorage
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

// Mock window.location
const mockLocation = {
  pathname: '/dashboard',
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty token when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useAuthStore()
      expect(store.token).toBe('')
      expect(store.user).toBeNull()
    })

    it('should initialize with token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('existing-token-123')
      const store = useAuthStore()
      expect(store.token).toBe('existing-token-123')
    })
  })

  describe('isLoggedIn', () => {
    it('should return false when token is empty', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(false)
    })

    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('some-token')
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(true)
    })
  })

  describe('isAdmin', () => {
    it('should return false when user is null', () => {
      localStorageMock.getItem.mockReturnValue('token')
      const store = useAuthStore()
      expect(store.isAdmin).toBe(false)
    })

    it('should return false when user role is student', () => {
      localStorageMock.getItem.mockReturnValue('token')
      const store = useAuthStore()
      store.user = { id: '1', name: 'test', email: 'test@test.com', role: 'student', created_at: '' }
      expect(store.isAdmin).toBe(false)
    })

    it('should return true when user role is admin', () => {
      localStorageMock.getItem.mockReturnValue('token')
      const store = useAuthStore()
      store.user = { id: '1', name: 'admin', email: 'admin@test.com', role: 'admin', created_at: '' }
      expect(store.isAdmin).toBe(true)
    })
  })

  describe('login', () => {
    it('should set token and user on successful login', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: { id: '1', name: 'test', email: 'test@test.com', role: 'student', created_at: '2024-01-01' },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)
      localStorageMock.getItem.mockReturnValue(null)

      const store = useAuthStore()
      await store.login('test@test.com', 'password123')

      expect(store.token).toBe('jwt-token-123')
      expect(store.user).toEqual(mockResponse.user)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'jwt-token-123')
    })

    it('should send captcha when provided', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: { id: '1', name: 'test', email: 'test@test.com', role: 'student', created_at: '2024-01-01' },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)
      localStorageMock.getItem.mockReturnValue(null)

      const store = useAuthStore()
      await store.login('test@test.com', 'password123', 'ABCD')

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
        captcha: 'ABCD',
      })
    })

    it('should not send captcha when not provided', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: { id: '1', name: 'test', email: 'test@test.com', role: 'student', created_at: '2024-01-01' },
      }
      vi.mocked(api.post).mockResolvedValue(mockResponse)
      localStorageMock.getItem.mockReturnValue(null)

      const store = useAuthStore()
      await store.login('test@test.com', 'password123')

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      })
    })

    it('should throw on login failure', async () => {
      vi.mocked(api.post).mockRejectedValue('Invalid credentials')
      localStorageMock.getItem.mockReturnValue(null)

      const store = useAuthStore()
      await expect(store.login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials')
      expect(store.token).toBe('')
      expect(store.user).toBeNull()
    })
  })

  describe('register', () => {
    it('should call register API with data', async () => {
      const mockResponse = { token: 'token', user: {} }
      vi.mocked(api.post).mockResolvedValue(mockResponse)
      localStorageMock.getItem.mockReturnValue(null)

      const store = useAuthStore()
      const registerData = { name: 'test', email: 'test@test.com', password: 'pass123' }
      await store.register(registerData)

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData)
    })
  })

  describe('logout', () => {
    it('should clear token and user', async () => {
      localStorageMock.getItem.mockReturnValue('some-token')
      const store = useAuthStore()
      store.user = { id: '1', name: 'test', email: 'test@test.com', role: 'student', created_at: '' }

      await store.logout()

      expect(store.token).toBe('')
      expect(store.user).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('getProfile', () => {
    it('should return early when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useAuthStore()
      const result = await store.getProfile()
      expect(result).toBeUndefined()
      expect(api.get).not.toHaveBeenCalled()
    })

    it('should update user on successful profile fetch', async () => {
      const mockProfile = { id: '1', name: 'test', email: 'test@test.com', role: 'student', created_at: '' }
      vi.mocked(api.get).mockResolvedValue(mockProfile)
      localStorageMock.getItem.mockReturnValue('token')

      const store = useAuthStore()
      await store.getProfile()

      expect(store.user).toEqual(mockProfile)
    })

    it('should not overwrite user when profile fetch returns invalid data', async () => {
      vi.mocked(api.get).mockResolvedValue(null)
      localStorageMock.getItem.mockReturnValue('token')

      const store = useAuthStore()
      store.user = { id: '1', name: 'existing', email: 'test@test.com', role: 'student', created_at: '' }
      await store.getProfile()

      // Should keep existing user
      expect(store.user?.name).toBe('existing')
    })

    it('should not throw on profile fetch failure', async () => {
      vi.mocked(api.get).mockRejectedValue('Network error')
      localStorageMock.getItem.mockReturnValue('token')

      const store = useAuthStore()
      store.user = { id: '1', name: 'existing', email: 'test@test.com', role: 'student', created_at: '' }

      await expect(store.getProfile()).resolves.toBeUndefined()
      expect(store.user?.name).toBe('existing')
    })
  })

  describe('updateProfile', () => {
    it('should update user on successful profile update', async () => {
      const mockResponse = { id: '1', name: 'updated', email: 'test@test.com', role: 'student', created_at: '' }
      vi.mocked(api.put).mockResolvedValue(mockResponse)
      localStorageMock.getItem.mockReturnValue('token')

      const store = useAuthStore()
      await store.updateProfile({ name: 'updated' })

      expect(store.user).toEqual(mockResponse)
    })
  })

  describe('getCaptcha', () => {
    it('should call captcha API', async () => {
      const mockCaptcha = { image: 'data:image/svg+xml;base64,...', captcha: 'ABCD' }
      vi.mocked(api.get).mockResolvedValue(mockCaptcha)
      localStorageMock.getItem.mockReturnValue(null)

      const store = useAuthStore()
      const result = await store.getCaptcha()

      expect(api.get).toHaveBeenCalledWith('/auth/captcha')
      expect(result).toEqual(mockCaptcha)
    })
  })
})
