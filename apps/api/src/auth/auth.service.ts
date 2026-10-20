import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service.js';

const scrypt = promisify(scryptCallback);
const SESSION_MS = 8 * 60 * 60 * 1000;

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, digest] = stored.split(':');
  if (!salt || !digest || !/^[0-9a-f]{128}$/.test(digest)) return false;
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(hash, Buffer.from(digest, 'hex'));
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOCAL_ADMIN !== 'true') return;
    if ((await this.prisma.adminUser.count()) !== 0) return;
    await this.prisma.adminUser.create({
      data: { username: 'admin', passwordHash: await hashPassword('admin'), developmentOnly: true },
    });
  }

  async login(username: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { username } });
    if (!user || (user.developmentOnly && (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOCAL_ADMIN !== 'true')) || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.adminSession.create({
      data: {
        userId: user.id,
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + SESSION_MS),
      },
    });
    return { username: user.username, token };
  }

  async currentUser(token: string | undefined) {
    if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });
    return session && session.expiresAt > new Date() && !(session.user.developmentOnly && (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOCAL_ADMIN !== 'true'))
      ? { username: session.user.username }
      : null;
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.adminSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
  }
}

export function sessionToken(cookieHeader: string | undefined): string | undefined {
  return cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith('es_session='))?.slice(11);
}
