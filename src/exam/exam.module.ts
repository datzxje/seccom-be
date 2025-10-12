import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { ExamSession } from './entities/exam-session.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Question } from '../question/entities/question.entity';
import { QuestionSet } from '../question/entities/question-set.entity';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamSession, ExamAnswer, Question, QuestionSet]),
    QuestionModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
