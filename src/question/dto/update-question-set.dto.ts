import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionSetDto } from './create-question-set.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateQuestionSetDto extends PartialType(CreateQuestionSetDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
