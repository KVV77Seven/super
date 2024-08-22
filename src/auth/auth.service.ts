import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwtPayload';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEmailDto } from './dto/user-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async registration(dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    const payload: JwtPayload = { sub: user.id };
    const tokens = await this.generateTokens(payload);

    void this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        updatedAt: new Date(),
      },
    });

    return { user, tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const payload: JwtPayload = { sub: user.id };
    const tokens = await this.generateTokens(payload);

    return {
      user,
      tokens,
    };
  }

  async logout(dto: UserEmailDto, refreshToken: string) {
    const user = await this.getUserByEmailOrThrow(dto.email);
    void this.deleteRefreshTokenFromDb(refreshToken);
  }

  async refresh(dto: UserEmailDto, refreshToken: string) {
    const user = await this.getUserByEmailOrThrow(dto.email);

    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException(`User not authorized`);
    }

    const wasInDb = await this.updateRefreshTokenInDb(refreshToken);
    if (!wasInDb) {
      throw new UnauthorizedException(`User not authorized`);
    }

    const newTokensPayload: JwtPayload = { sub: user.id };
    const tokens = await this.generateTokens(newTokensPayload);

    return { user, tokens };
  }

  verifyAccessToken(token: string): JwtPayload | null {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });
  }

  private verifyRefreshToken(token: string): JwtPayload | null {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.getUserByEmailOrThrow(dto.email);

    const isPasswordValid = await compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(`Invalid password`);
    }

    const { password, ...result } = user;
    return result;
  }

  private async generateTokens(payload: JwtPayload) {
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_ACCESS_TTL,
        secret: process.env.JWT_ACCESS_SECRET,
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_REFRESH_TTL,
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    };
  }

  private async getUserByEmailOrThrow(email: string) {
    const user = await this.userService.findyEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        `User with email "${email}" does not exist`,
      );
    }

    return user;
  }

  private async deleteRefreshTokenFromDb(token: string): Promise<boolean> {
    try {
      await this.prisma.refreshToken.delete({ where: { token: token } });
      return true;
    } catch {
      return false;
    }
  }

  private async updateRefreshTokenInDb(token: string): Promise<boolean> {
    try {
      await this.prisma.refreshToken.update({
        where: { token: token },
        data: { updatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }
}
