import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService, sessionToken } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { cookie?: string } }>();
    const user = await this.auth.currentUser(sessionToken(request.headers.cookie));
    if (!user) throw new UnauthorizedException();
    return true;
  }
}
