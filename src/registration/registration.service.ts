import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Registration } from './entities/registration.entity';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  async create(
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<Registration> {
    const existingEmail = await this.registrationRepository.findOne({
      where: { email: createRegistrationDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    const existingPhone = await this.registrationRepository.findOne({
      where: { phoneNumber: createRegistrationDto.phoneNumber },
    });
    if (existingPhone) {
      throw new ConflictException('Số điện thoại này đã được đăng ký');
    }

    const registration = this.registrationRepository.create(
      createRegistrationDto,
    );
    return await this.registrationRepository.save(registration);
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
}