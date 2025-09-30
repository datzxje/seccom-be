import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRegistrationDto: CreateRegistrationDto) {
    const registration = await this.registrationService.create(
      createRegistrationDto,
    );
    return {
      success: true,
      message: 'Đăng ký thành công',
      data: registration,
    };
  }

  @Get()
  async findAll() {
    const registrations = await this.registrationService.findAll();
    return {
      success: true,
      data: registrations,
      total: registrations.length,
    };
  }

  @Get('statistics')
  async getStatistics() {
    const stats = await this.registrationService.getStatistics();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const registration = await this.registrationService.findOne(id);
    if (!registration) {
      return {
        success: false,
        message: 'Không tìm thấy đăng ký',
      };
    }
    return {
      success: true,
      data: registration,
    };
  }
}