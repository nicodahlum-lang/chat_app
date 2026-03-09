import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: signupDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(signupDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: signupDto.email,
          password: hashedPassword,
          name: signupDto.name,
          avatarurl: signupDto.avatarUrl,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarurl: true,
        },
      });

      const token = this.jwtService.sign({ sub: user.id, email: user.email });

      this.logger.log(`User signed up: ${user.email}`);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarurl,
        },
      };
    } catch (error) {
      this.logger.error('Signup error', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({ sub: user.id, email: user.email });

      this.logger.log(`User logged in: ${user.email}`);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarurl,
        },
      };
    } catch (error) {
      this.logger.error('Login error', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarurl: true,
          createdat: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarurl,
        createdAt: user.createdat.toISOString(),
      };
    } catch (error) {
      this.logger.error('Get profile error', error);
      throw error;
    }
  }
}
