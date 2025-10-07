import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('start')
  async startExam(@Request() req) {
    return this.examService.startExam(req.user.userId);
  }

  @Post('submit')
  async submitExam(@Request() req, @Body() submitExamDto: SubmitExamDto) {
    return this.examService.submitExam(req.user.userId, submitExamDto);
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.examService.getHistory(req.user.userId);
  }

  @Get(':sessionId')
  async getSessionDetail(@Request() req, @Param('sessionId') sessionId: string) {
    return this.examService.getSessionDetail(req.user.userId, sessionId);
  }
}
