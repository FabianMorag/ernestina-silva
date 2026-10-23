import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { provisionAdmin } from '../src/auth/admin-provisioning.js'

async function readPassword(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error(
      'Pipe the password through stdin; do not put it in command arguments',
    )
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 1026) throw new Error('Password input is too long')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
    .toString('utf8')
    .replace(/\r?\n$/, '')
}

async function main(): Promise<void> {
  const [username, ...unexpected] = process.argv.slice(2)
  if (!username || unexpected.length) {
    throw new Error('Usage: pnpm admin:create <username> (password via stdin)')
  }
  const password = await readPassword()
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required')

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
  try {
    await provisionAdmin(prisma, username, password)
    process.stdout.write(`Created admin ${username}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  if (
    error instanceof Error &&
    /^(Usage:|Pipe the password|Password input|Username must|Password must|An admin with this username|DATABASE_URL)/.test(
      error.message,
    )
  ) {
    process.stderr.write(`${error.message}\n`)
  } else {
    process.stderr.write(
      'Could not create admin; check database connection and migrations\n',
    )
  }
  process.exitCode = 1
})
