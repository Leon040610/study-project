import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

// Set test env
process.env.JWT_SECRET = 'test-secret-key'

// Mock express
const mockRequest = (headers: Record<string, string> = {}) =>
  ({ headers } as any)

const mockResponse = () => {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

const mockNext = vi.fn()

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject request without authorization header', async () => {
    const { authenticate } = await import('../../api/middleware/auth')
    const req = mockRequest()
    const res = mockResponse()

    authenticate(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: '未授权访问' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should reject request with malformed authorization header', async () => {
    const { authenticate } = await import('../../api/middleware/auth')
    const req = mockRequest({ authorization: 'InvalidFormat token' })
    const res = mockResponse()

    authenticate(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should reject request with invalid token', async () => {
    const { authenticate } = await import('../../api/middleware/auth')
    const req = mockRequest({ authorization: 'Bearer invalid-token' })
    const res = mockResponse()

    authenticate(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: '无效的token' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should accept request with valid token and attach user', async () => {
    const { authenticate } = await import('../../api/middleware/auth')
    const token = jwt.sign({ id: 'user1', email: 'test@test.com', role: 'student' }, 'test-secret-key')
    const req = mockRequest({ authorization: `Bearer ${token}` })
    const res = mockResponse()

    authenticate(req, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.user).toBeDefined()
    expect(req.user?.id).toBe('user1')
    expect(req.user?.email).toBe('test@test.com')
    expect(req.user?.role).toBe('student')
  })

  it('should accept admin token', async () => {
    const { authenticate } = await import('../../api/middleware/auth')
    const token = jwt.sign({ id: 'admin1', email: 'admin@test.com', role: 'admin' }, 'test-secret-key')
    const req = mockRequest({ authorization: `Bearer ${token}` })
    const res = mockResponse()

    authenticate(req, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.user?.role).toBe('admin')
  })
})

describe('requireAdmin Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject non-admin user', async () => {
    const { requireAdmin } = await import('../../api/middleware/auth')
    const req = { user: { id: '1', email: 'test@test.com', role: 'student' } } as any
    const res = mockResponse()

    requireAdmin(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: '无权访问' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should accept admin user', async () => {
    const { requireAdmin } = await import('../../api/middleware/auth')
    const req = { user: { id: '1', email: 'admin@test.com', role: 'admin' } } as any
    const res = mockResponse()

    requireAdmin(req, res, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  it('should reject when user is undefined', async () => {
    const { requireAdmin } = await import('../../api/middleware/auth')
    const req = { user: undefined } as any
    const res = mockResponse()

    requireAdmin(req, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockNext).not.toHaveBeenCalled()
  })
})
