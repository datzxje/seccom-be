import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Answer } from './answer.entity';
import { QuestionSet } from './question-set.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'question_set_id', nullable: true })
  questionSetId?: string;

  @ManyToOne(() => QuestionSet, (questionSet) => questionSet.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_set_id' })
  questionSet?: QuestionSet;

  @OneToMany(() => Answer, (answer) => answer.question, {
    cascade: true,
    eager: true,
  })
  answers: Answer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
