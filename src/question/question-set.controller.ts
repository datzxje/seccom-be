import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { QuestionSetService } from './question-set.service';
import { CreateQuestionSetDto } from './dto/create-question-set.dto';
import { UpdateQuestionSetDto } from './dto/update-question-set.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('question-sets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class QuestionSetController {
  constructor(private readonly questionSetService: QuestionSetService) {}

  @Post()
  async create(@Body() createQuestionSetDto: CreateQuestionSetDto) {
    const questionSet = await this.questionSetService.create(createQuestionSetDto);
    return {
      success: true,
      message: 'Tạo bộ đề thành công',
      data: questionSet,
    };
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    const questionSets = await this.questionSetService.findAll(include);
    return {
      success: true,
      data: questionSets,
      total: questionSets.length,
    };
  }

  @Get('statistics')
  async getStatistics() {
    const stats = await this.questionSetService.getStatistics();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const questionSet = await this.questionSetService.findOne(id);
    return {
      success: true,
      data: questionSet,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateQuestionSetDto: UpdateQuestionSetDto,
  ) {
    const questionSet = await this.questionSetService.update(id, updateQuestionSetDto);
    return {
      success: true,
      message: 'Cập nhật bộ đề thành công',
      data: questionSet,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.questionSetService.remove(id);
    return {
      success: true,
      message: 'Xóa bộ đề thành công',
    };
  }
}
