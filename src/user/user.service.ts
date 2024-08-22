import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (user)
      throw new ConflictException(
        `User with email "${dto.email}" already exist`,
      );

    const hashedPassword = await hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });

    const { password, ...result } = newUser;
    return result;
  }

  async findyEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email: email } });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({ where: { id: id } });
  }
}
