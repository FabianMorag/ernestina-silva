import type { PrismaClient } from '../generated/prisma/client.js'
import { hashPassword } from './password.js'

type AdminStore = Pick<PrismaClient, 'adminUser'>

export async function provisionAdmin(
  prisma: AdminStore,
  username: string,
  password: string,
): Promise<void> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(username)) {
    throw new Error(
      'Username must be 3–64 characters and contain only letters, digits, dots, underscores, or hyphens',
    )
  }
  const passwordBytes = Buffer.byteLength(password, 'utf8')
  if (passwordBytes < 12 || passwordBytes > 1024 || /[\r\n\0]/.test(password)) {
    throw new Error('Password must be 12–1024 bytes and contain no line breaks')
  }
  if (await prisma.adminUser.findUnique({ where: { username } })) {
    throw new Error('An admin with this username already exists')
  }
  await prisma.adminUser.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      developmentOnly: false,
    },
  })
}
