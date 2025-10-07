import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { ExamSlot } from '../../common/enums/exam-slot.enum';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'phone_number', unique: true })
  phoneNumber: string;

  @Column()
  university: string;

  @Column({ name: 'other_university', nullable: true })
  otherUniversity?: string;

  @Column({ name: 'student_id', nullable: true })
  studentId?: string;

  @Column({ nullable: true })
  major?: string;

  @Column({ name: 'class_name', nullable: true })
  className?: string;

  @Column({ name: 'year_of_study', type: 'int', nullable: true })
  yearOfStudy?: number;

  @Column({ name: 'facebook_link', nullable: true })
  facebookLink?: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({
    name: 'exam_slot',
    type: 'enum',
    enum: ExamSlot,
    nullable: true,
  })
  examSlot?: ExamSlot;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}