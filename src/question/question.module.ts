import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { QuestionSetService } from './question-set.service';
import { QuestionSetController } from './question-set.controller';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { QuestionSet } from './entities/question-set.entity';
import { CloudinaryModule } from '../common/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Answer, QuestionSet]),
    CloudinaryModule,
  ],
  controllers: [QuestionController, QuestionSetController],
  providers: [QuestionService, QuestionSetService],
  exports: [QuestionService, QuestionSetService],
})
export class QuestionModule {}
