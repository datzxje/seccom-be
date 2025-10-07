import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { SelectExamSlotDto } from './dto/select-exam-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    const registrations = await this.registrationService.findAll();
    return {
      success: true,
      data: registrations,
      total: registrations.length,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('statistics')
  async getStatistics() {
    const stats = await this.registrationService.getStatistics();
    return {
      success: true,
      data: stats,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('export/excel')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.registrationService.exportUsersToExcel();

    const filename = `danh-sach-thi-sinh-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('select-exam-slot')
  async selectExamSlot(@Request() req, @Body() selectExamSlotDto: SelectExamSlotDto) {
    const user = await this.registrationService.selectExamSlot(
      req.user.userId,
      selectExamSlotDto.examSlot,
    );
    return {
      success: true,
      message: 'Chọn ca thi thành công',
      data: {
        examSlot: user.examSlot,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const registration = await this.registrationService.findOne(id);
    if (!registration) {
      return {
        success: false,
        message: 'Không tìm thấy đăng ký',
      };
    }

    // Only allow users to view their own registration or admin to view any
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin này');
    }

    return {
      success: true,
      data: registration,
    };
  }
}