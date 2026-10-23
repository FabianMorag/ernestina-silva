import { scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import { provisionAdmin } from './admin-provisioning.js'

const scrypt = promisify(scryptCallback)

describe('provisionAdmin', () => {
  const adminUser = {
    findUnique: vi.fn(),
    create: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('creates a production admin with a salted password hash', async () => {
    adminUser.findUnique.mockResolvedValue(null)
    adminUser.create.mockResolvedValue({ username: 'owner' })

    await provisionAdmin(
      { adminUser } as never,
      'owner',
      'a-long-unique-password',
    )

    expect(adminUser.create).toHaveBeenCalledWith({
      data: {
        username: 'owner',
        developmentOnly: false,
        passwordHash: expect.any(String),
      },
    })
    const stored = adminUser.create.mock.calls[0][0].data.passwordHash as string
    const [salt, digest] = stored.split(':')
    expect(salt).toMatch(/^[0-9a-f]{32}$/)
    expect(digest).toMatch(/^[0-9a-f]{128}$/)
    expect(
      ((await scrypt('a-long-unique-password', salt, 64)) as Buffer).toString(
        'hex',
      ),
    ).toBe(digest)
  })

  it('rejects an existing username without changing the account', async () => {
    adminUser.findUnique.mockResolvedValue({ username: 'owner' })

    await expect(
      provisionAdmin({ adminUser } as never, 'owner', 'a-long-unique-password'),
    ).rejects.toThrow('An admin with this username already exists')
    expect(adminUser.create).not.toHaveBeenCalled()
  })

  it.each([
    ['invalid username', 'bad name', 'a-long-unique-password'],
    ['short password', 'owner', 'short'],
  ])(
    'rejects %s before querying the database',
    async (_case, username, password) => {
      await expect(
        provisionAdmin({ adminUser } as never, username, password),
      ).rejects.toThrow()
      expect(adminUser.findUnique).not.toHaveBeenCalled()
      expect(adminUser.create).not.toHaveBeenCalled()
    },
  )
})
