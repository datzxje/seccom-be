import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { CloudinaryModule } from '../common/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Answer]), CloudinaryModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
