import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard.js';
import { AuthService, sessionToken } from './auth.service.js';

type CookieRequest = { headers: { cookie?: string } };
type CookieReply = { header(name: string, value: string): void };

@ApiTags('Admin authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiBody({
    description: 'Sign in to set the browser session cookie for protected operations.',
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string', format: 'password' },
      },
    },
  })
  async login(@Body() body: { username?: unknown; password?: unknown }, @Res({ passthrough: true }) reply: CookieReply) {
    if (typeof body?.username !== 'string' || typeof body.password !== 'string') {
      throw new BadRequestException('Username and password are required');
    }
    const { username, token } = await this.auth.login(body.username, body.password);
    reply.header('Set-Cookie', `es_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return { username };
  }

  @ApiCookieAuth('es_session')
  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() request: CookieRequest) {
    return this.auth.currentUser(sessionToken(request.headers.cookie));
  }

  @ApiCookieAuth('es_session')
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() request: CookieRequest, @Res({ passthrough: true }) reply: CookieReply) {
    await this.auth.logout(sessionToken(request.headers.cookie));
    reply.header('Set-Cookie', `es_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return { status: 'ok' };
  }
}
