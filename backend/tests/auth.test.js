jest.mock('../shared/utils/userService', () => ({
  saveUser: jest.fn(),
  getUserByEmail: jest.fn(),
  verifyUserPassword: jest.fn(),
  createSession: jest.fn(),
  getActiveSession: jest.fn(),
  getSessionById: jest.fn(),
  updateSessionActivity: jest.fn(),
  endSession: jest.fn(),
  getUser: jest.fn(),
  getUserWithPasswordHash: jest.fn(),
  updateUserPassword: jest.fn(),
}))

const userService = require('../shared/utils/userService')
const authRouter = require('../routes/auth')
const { agent, createTestApp } = require('./helpers/httpTest')

describe('auth API', () => {
  let app
  let testAgent

  beforeEach(() => {
    jest.clearAllMocks()
    app = createTestApp()
    app.use('/api/auth', authRouter)
    testAgent = agent(app)
  })

  afterEach(async () => {
    await testAgent.close()
  })

  test('TC-01: registers a new user and creates session', async () => {
    userService.getUserByEmail.mockResolvedValue(null)
    userService.saveUser.mockResolvedValue({
      uid: 'user_123',
      email: 'testuser@strathmore.edu',
      name: 'Test User',
      role: 'student',
    })
    userService.createSession.mockResolvedValue({ session_id: 'session_abc' })

    const res = await testAgent.post('/api/auth/register', {
      email: 'testuser@strathmore.edu',
      password: 'Test@1234',
      name: 'Test User',
      role: 'student',
    })

    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.email).toBe('testuser@strathmore.edu')
    expect(res.body.user.sessionId).toBe('session_abc')
  })

  test('rejects registration when email already exists', async () => {
    userService.getUserByEmail.mockResolvedValue({ uid: 'existing' })

    const res = await testAgent.post('/api/auth/register', {
      email: 'testuser@strathmore.edu',
      password: 'Test@1234',
      name: 'Test User',
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email already registered')
  })

  test('TC-02: logs in with valid credentials', async () => {
    userService.getUserWithPasswordHash.mockResolvedValue({ uid: 'user_123' })
    userService.verifyUserPassword.mockResolvedValue('user_123')
    userService.getUser.mockResolvedValue({
      uid: 'user_123',
      email: 'testuser@strathmore.edu',
      name: 'Test User',
      role: 'student',
    })
    userService.createSession.mockResolvedValue({ session_id: 'session_xyz' })

    const res = await testAgent.post('/api/auth/login', {
      email: 'testuser@strathmore.edu',
      password: 'Test@1234',
    })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.role).toBe('student')
    expect(res.body.user.sessionId).toBe('session_xyz')
  })

  test('TC-03: rejects login with invalid credentials', async () => {
    userService.getUserWithPasswordHash.mockResolvedValue({ uid: 'user_123' })
    userService.verifyUserPassword.mockResolvedValue(null)

    const res = await testAgent.post('/api/auth/login', {
      email: 'testuser@strathmore.edu',
      password: 'WrongPassword!',
    })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid email or password')
  })

  test('TC-04: admin login with super-admin credentials', async () => {
    const originalEmail = process.env.SUPER_ADMIN_EMAIL
    const originalPassword = process.env.SUPER_ADMIN_PASSWORD
    process.env.SUPER_ADMIN_EMAIL = 'superadmin@indoor.local'
    process.env.SUPER_ADMIN_PASSWORD = 'Admin@2026!'

    userService.getUserByEmail.mockResolvedValue({
      uid: 'admin_1',
      email: 'superadmin@indoor.local',
      name: 'Super Admin',
      role: 'admin',
    })
    userService.createSession.mockResolvedValue({ session_id: 'admin_session' })

    const res = await testAgent.post('/api/auth/admin/login', {
      email: 'superadmin@indoor.local',
      password: 'Admin@2026!',
    })

    process.env.SUPER_ADMIN_EMAIL = originalEmail
    process.env.SUPER_ADMIN_PASSWORD = originalPassword

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.role).toBe('admin')
    expect(res.body.requiresPasswordReset).toBe(true)
  })

  test('logout ends session when sessionId is provided', async () => {
    userService.endSession.mockResolvedValue(true)

    const res = await testAgent.post('/api/auth/logout', {
      sessionId: 'session_abc',
    })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(userService.endSession).toHaveBeenCalledWith('session_abc')
  })

  test('GET /me returns 401 without sessionId', async () => {
    const res = await testAgent.get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Session ID required')
  })
})
