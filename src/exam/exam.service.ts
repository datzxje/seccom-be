import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamSession, ExamStatus } from './entities/exam-session.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Question } from '../question/entities/question.entity';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(ExamSession)
    private examSessionRepository: Repository<ExamSession>,
    @InjectRepository(ExamAnswer)
    private examAnswerRepository: Repository<ExamAnswer>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async startExam(userId: string) {
    // Check if user has an existing IN_PROGRESS session
    const existingSession = await this.examSessionRepository.findOne({
      where: { userId, status: ExamStatus.IN_PROGRESS },
      order: { createdAt: 'DESC' },
    });

    if (existingSession) {
      // Return existing session with same questions
      const questions = await this.questionRepository
        .createQueryBuilder('question')
        .leftJoinAndSelect('question.answers', 'answers')
        .where('question.id IN (:...ids)', { ids: existingSession.questionIds })
        .orderBy('answers.order', 'ASC')
        .getMany();

      const questionsWithoutCorrectFlag = questions.map((q) => ({
        id: q.id,
        content: q.content,
        imageUrl: q.imageUrl,
        answers: q.answers.map((a) => ({
          id: a.id,
          content: a.content,
          imageUrl: a.imageUrl,
          order: a.order,
        })),
      }));

      return {
        sessionId: existingSession.id,
        questions: questionsWithoutCorrectFlag,
        totalQuestions: 40,
        startTime: existingSession.startTime,
        isResumed: true,
      };
    }

    // Get 40 random active question IDs first
    const randomQuestionIds = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.id')
      .where('question.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .limit(40)
      .getRawMany();

    if (randomQuestionIds.length < 40) {
      throw new BadRequestException(
        `Không đủ 40 câu hỏi active. Hiện có ${randomQuestionIds.length} câu.`,
      );
    }

    const questionIds = randomQuestionIds.map((q) => q.question_id);

    // Get full questions with answers
    const questions = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.answers', 'answers')
      .where('question.id IN (:...ids)', { ids: questionIds })
      .orderBy('answers.order', 'ASC')
      .getMany();

    // Create exam session
    const session = this.examSessionRepository.create({
      userId,
      startTime: new Date(),
      totalQuestions: 40,
      status: ExamStatus.IN_PROGRESS,
      questionIds,
    });

    const savedSession = await this.examSessionRepository.save(session);

    // Hide isCorrect field from answers
    const questionsWithoutCorrectFlag = questions.map((q) => ({
      id: q.id,
      content: q.content,
      imageUrl: q.imageUrl,
      answers: q.answers.map((a) => ({
        id: a.id,
        content: a.content,
        imageUrl: a.imageUrl,
        order: a.order,
      })),
    }));

    return {
      sessionId: savedSession.id,
      questions: questionsWithoutCorrectFlag,
      totalQuestions: 40,
      startTime: savedSession.startTime,
      isResumed: false,
    };
  }

  async submitExam(userId: string, submitExamDto: SubmitExamDto) {
    const { sessionId, answers } = submitExamDto;

    // Validate session
    const session = await this.examSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Phiên thi không tồn tại');
    }

    if (session.status === ExamStatus.COMPLETED) {
      throw new BadRequestException('Bài thi đã được nộp trước đó');
    }

    // Grade exam
    let correctCount = 0;
    const examAnswers: ExamAnswer[] = [];
    const details: any[] = [];

    for (const userAnswer of answers) {
      // Get question with correct answer
      const question = await this.questionRepository.findOne({
        where: { id: userAnswer.questionId },
        relations: ['answers'],
      });

      if (!question) {
        continue; // Skip invalid question
      }

      const correctAnswer = question.answers.find((a) => a.isCorrect);
      const isCorrect = userAnswer.answerId === correctAnswer?.id;

      if (isCorrect) {
        correctCount++;
      }

      // Save exam answer
      const examAnswer = this.examAnswerRepository.create({
        examSessionId: sessionId,
        questionId: userAnswer.questionId,
        selectedAnswerId: userAnswer.answerId,
        isCorrect,
      });
      examAnswers.push(examAnswer);

      // Add to details
      details.push({
        questionId: userAnswer.questionId,
        selectedAnswerId: userAnswer.answerId,
        correctAnswerId: correctAnswer?.id,
        isCorrect,
      });
    }

    // Save all exam answers
    await this.examAnswerRepository.save(examAnswers);

    // Calculate score
    const score = (correctCount / session.totalQuestions) * 100;

    // Update session
    session.correctAnswers = correctCount;
    session.score = score;
    session.status = ExamStatus.COMPLETED;
    session.endTime = new Date();
    await this.examSessionRepository.save(session);

    return {
      sessionId: session.id,
      score: parseFloat(score.toFixed(2)),
      correctAnswers: correctCount,
      totalQuestions: session.totalQuestions,
      details,
    };
  }

  async getHistory(userId: string) {
    const sessions = await this.examSessionRepository.find({
      where: { userId, status: ExamStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => ({
      sessionId: session.id,
      score: parseFloat(session.score.toString()),
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      startTime: session.startTime,
      endTime: session.endTime,
      createdAt: session.createdAt,
    }));
  }

  async getSessionDetail(userId: string, sessionId: string) {
    const session = await this.examSessionRepository.findOne({
      where: { id: sessionId, userId },
      relations: ['answers', 'answers.question', 'answers.selectedAnswer'],
    });

    if (!session) {
      throw new NotFoundException('Phiên thi không tồn tại');
    }

    if (session.status !== ExamStatus.COMPLETED) {
      throw new BadRequestException('Bài thi chưa được nộp');
    }

    return {
      sessionId: session.id,
      score: parseFloat(session.score.toString()),
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
      startTime: session.startTime,
      endTime: session.endTime,
      answers: session.answers.map((a) => ({
        questionId: a.questionId,
        questionContent: a.question.content,
        selectedAnswerId: a.selectedAnswerId,
        selectedAnswerContent: a.selectedAnswer.content,
        isCorrect: a.isCorrect,
      })),
    };
  }
}
