import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ExamSession } from './exam-session.entity';
import { Question } from '../../question/entities/question.entity';
import { Answer } from '../../question/entities/answer.entity';

@Entity('exam_answers')
export class ExamAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exam_session_id' })
  examSessionId: string;

  @ManyToOne(() => ExamSession, (session) => session.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_session_id' })
  examSession: ExamSession;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'selected_answer_id' })
  selectedAnswerId: string;

  @ManyToOne(() => Answer)
  @JoinColumn({ name: 'selected_answer_id' })
  selectedAnswer: Answer;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
