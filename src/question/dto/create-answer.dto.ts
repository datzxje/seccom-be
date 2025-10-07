import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
