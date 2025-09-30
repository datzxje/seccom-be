import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Registration } from './entities/registration.entity';
import { EmailService } from './email.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<Registration> {
    // Check existing email
    const existingEmail = await this.registrationRepository.findOne({
      where: { email: createRegistrationDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    // Check existing phone
    const existingPhone = await this.registrationRepository.findOne({
      where: { phoneNumber: createRegistrationDto.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictException('Số điện thoại này đã được đăng ký');
    }

    // Generate username and password
    const username = this.generateUsername(createRegistrationDto.email);
    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check username uniqueness
    const existingUsername = await this.registrationRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username này đã tồn tại');
    }

    // Create registration
    const registration = this.registrationRepository.create({
      ...createRegistrationDto,
      username,
      password: hashedPassword,
      emailSent: false,
    });

    const savedRegistration = await this.registrationRepository.save(registration);

    // Send email asynchronously
    this.sendRegistrationEmail(savedRegistration, plainPassword);

    return savedRegistration;
  }

  private generateUsername(email: string): string {
    return email.split('@')[0];
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async sendRegistrationEmail(
    registration: Registration,
    plainPassword: string,
  ): Promise<void> {
    try {
      const emailSent = await this.emailService.sendRegistrationEmail(
        registration,
        plainPassword,
      );

      if (emailSent) {
        await this.registrationRepository.update(registration.id, {
          emailSent: true,
        });
        this.logger.log(`Email sent successfully for registration ${registration.id}`);
      } else {
        this.logger.error(`Failed to send email for registration ${registration.id}`);
      }
    } catch (error) {
      this.logger.error(
        `Error sending email for registration ${registration.id}`,
        error.stack,
      );
    }
  }

  async findAll(): Promise<Registration[]> {
    return await this.registrationRepository.find();
  }

  async findOne(id: string): Promise<Registration | null> {
    return await this.registrationRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Registration | null> {
    return await this.registrationRepository.findOne({ where: { email } });
  }

  async getStatistics(): Promise<{ total: number; byUniversity: Record<string, number> }> {
    const registrations = await this.registrationRepository.find();
    const universityStats: Record<string, number> = {};

    registrations.forEach((reg) => {
      const uni = reg.university;
      universityStats[uni] = (universityStats[uni] ?? 0) + 1;
    });

    return {
      total: registrations.length,
      byUniversity: universityStats,
    };
  }

  async findByUsername(username: string): Promise<Registration | null> {
    return await this.registrationRepository.findOne({ where: { username } });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedRefreshToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.registrationRepository.update(userId, { refreshToken: hashedRefreshToken });
  }

  async createAdmin(fullName: string, email: string, username: string, password: string): Promise<Registration> {
    // Check existing email
    const existingEmail = await this.registrationRepository.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // Check existing username
    const existingUsername = await this.registrationRepository.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Username này đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = this.registrationRepository.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role: Role.ADMIN,
      dateOfBirth: '2000-01-01', // Default value for admin
      phoneNumber: `admin_${Date.now()}`, // Unique phone for admin
      university: 'Admin',
      emailSent: true,
    });

    return await this.registrationRepository.save(admin);
  }
}