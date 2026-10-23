import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { hashPassword } from './password.js'

describe('AuthService', () => {
  const user = {
    id: 'admin-id',
    username: 'admin',
    passwordHash: '',
    developmentOnly: true,
  }
  const prisma = {
    adminUser: { count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    adminSession: { create: vi.fn(), findUnique: vi.fn(), deleteMany: vi.fn() },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENABLE_LOCAL_ADMIN = 'true'
  })

  it('seeds admin/admin only in local development and validates the password', async () => {
    prisma.adminUser.count.mockResolvedValue(0)
    prisma.adminUser.create.mockImplementation(async ({ data }) => {
      user.passwordHash = data.passwordHash
      return user
    })
    prisma.adminUser.findUnique.mockImplementation(async () => user)
    prisma.adminSession.create.mockResolvedValue({})
    const service = new AuthService(prisma as never)

    await service.onModuleInit()
    expect(prisma.adminUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: 'admin',
        developmentOnly: true,
      }),
    })
    await expect(service.login('admin', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
    await expect(service.login('admin', 'admin')).resolves.toMatchObject({
      username: 'admin',
      token: expect.any(String),
    })
  })

  it('never seeds the default account in production', async () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      await new AuthService(prisma as never).onModuleInit()
      expect(prisma.adminUser.create).not.toHaveBeenCalled()
      prisma.adminUser.findUnique.mockResolvedValue(user)
      await expect(
        new AuthService(prisma as never).login('admin', 'admin'),
      ).rejects.toBeInstanceOf(UnauthorizedException)
    } finally {
      process.env.NODE_ENV = original
    }
  })

  it('accepts a persistent non-development admin in production', async () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      prisma.adminUser.findUnique.mockResolvedValue({
        id: 'production-admin',
        username: 'owner',
        passwordHash: await hashPassword('a-long-unique-password'),
        developmentOnly: false,
      })
      prisma.adminSession.create.mockResolvedValue({})
      await expect(
        new AuthService(prisma as never).login(
          'owner',
          'a-long-unique-password',
        ),
      ).resolves.toMatchObject({ username: 'owner', token: expect.any(String) })
      expect(prisma.adminSession.create).toHaveBeenCalledOnce()
    } finally {
      process.env.NODE_ENV = original
    }
  })
})
