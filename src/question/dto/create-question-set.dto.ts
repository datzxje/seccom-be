import { IsString, IsOptional, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export class CreateQuestionSetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(20, { message: 'Bộ đề phải có đúng 20 câu hỏi' })
  @ArrayMaxSize(20, { message: 'Bộ đề phải có đúng 20 câu hỏi' })
  questions: CreateQuestionDto[];
}
