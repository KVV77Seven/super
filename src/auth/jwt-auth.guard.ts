import { AuthService } from './auth.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.['access_token'];

    if (!token) {
      throw new UnauthorizedException('Authorization token missing');
    }

    const payload = this.authService.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    try {
      (req as any).user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
