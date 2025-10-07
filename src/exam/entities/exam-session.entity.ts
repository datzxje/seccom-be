import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Registration } from '../../registration/entities/registration.entity';
import { ExamAnswer } from './exam-answer.entity';

export enum ExamStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('exam_sessions')
export class ExamSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Registration)
  @JoinColumn({ name: 'user_id' })
  user: Registration;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'total_questions', type: 'int', default: 40 })
  totalQuestions: number;

  @Column({ name: 'correct_answers', type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({
    type: 'enum',
    enum: ExamStatus,
    default: ExamStatus.IN_PROGRESS,
  })
  status: ExamStatus;

  @Column({ name: 'question_ids', type: 'jsonb' })
  questionIds: string[];

  @OneToMany(() => ExamAnswer, (answer) => answer.examSession, {
    cascade: true,
  })
  answers: ExamAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
