import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegistrationService } from '../registration/registration.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Registration is handled by RegistrationService
  // This method is kept for backward compatibility but not recommended
  async register(email: string, password: string, name?: string) {
    throw new UnauthorizedException('Please use /registration endpoint for registration');
  }

  async login(username: string, password: string) {
    const registration = await this.registrationService.findByUsername(username);
    if (!registration) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, registration.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(registration.id, registration.username, registration.role);
    await this.registrationService.updateRefreshToken(registration.id, tokens.refreshToken);

    return {
      user: {
        id: registration.id,
        username: registration.username,
        email: registration.email,
        fullName: registration.fullName,
        role: registration.role
      },
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const registration = await this.registrationService.findOne(userId);
    if (!registration || !registration.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, registration.refreshToken);
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(registration.id, registration.username, registration.role);
    await this.registrationService.updateRefreshToken(registration.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.registrationService.updateRefreshToken(userId, null);
  }

  async createAdmin(createAdminDto: any) {
    const admin = await this.registrationService.createAdmin(
      createAdminDto.fullName,
      createAdminDto.email,
      createAdminDto.username,
      createAdminDto.password,
    );

    return {
      success: true,
      message: 'Tạo tài khoản admin thành công',
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  private async generateTokens(userId: string, username: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username, role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, username, role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}