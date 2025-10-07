import { IsEnum } from 'class-validator';
import { ExamSlot } from '../../common/enums/exam-slot.enum';

export class SelectExamSlotDto {
  @IsEnum(ExamSlot, { message: 'Ca thi không hợp lệ' })
  examSlot: ExamSlot;
}
