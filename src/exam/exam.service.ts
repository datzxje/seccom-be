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
import { QuestionSetService } from '../question/question-set.service';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class ExamService {
  private readonly EXAM_DURATION_MINUTES = 20;

  constructor(
    @InjectRepository(ExamSession)
    private examSessionRepository: Repository<ExamSession>,
    @InjectRepository(ExamAnswer)
    private examAnswerRepository: Repository<ExamAnswer>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private questionSetService: QuestionSetService,
  ) {}

  async startExam(userId: string) {
    // Check if user already completed an exam
    const completedSession = await this.examSessionRepository.findOne({
      where: { userId, status: ExamStatus.COMPLETED },
    });

    if (completedSession) {
      throw new BadRequestException('Bạn đã hoàn thành bài thi rồi, không thể thi lại');
    }

    // Check if user has an existing IN_PROGRESS session
    const existingSession = await this.examSessionRepository.findOne({
      where: { userId, status: ExamStatus.IN_PROGRESS },
      order: { createdAt: 'DESC' },
    });

    if (existingSession) {
      // Check if session has expired (more than 20 minutes)
      const now = new Date();
      const sessionStart = new Date(existingSession.startTime);
      const elapsedMinutes = (now.getTime() - sessionStart.getTime()) / (1000 * 60);

      if (elapsedMinutes > this.EXAM_DURATION_MINUTES) {
        // Auto-submit with current answers (or empty if no answers)
        await this.autoSubmitExpiredSession(existingSession);
        throw new BadRequestException('Phiên thi của bạn đã hết hạn (quá 20 phút). Bài thi đã được tự động nộp.');
      }

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
        totalQuestions: 20,
        startTime: existingSession.startTime,
        isResumed: true,
      };
    }

    // Get random active question set (bộ đề)
    const randomQuestionSet = await this.questionSetService.findRandomActive();

    if (!randomQuestionSet) {
      throw new BadRequestException(
        'Không có bộ đề nào đang hoạt động. Vui lòng liên hệ admin.',
      );
    }

    if (!randomQuestionSet.questions || randomQuestionSet.questions.length !== 20) {
      const actualCount = randomQuestionSet.questions?.length || 0;
      throw new BadRequestException(
        `Bộ đề "${randomQuestionSet.name}" không hợp lệ (có ${actualCount} câu hỏi thay vì 20). Vui lòng liên hệ admin.`,
      );
    }

    // Shuffle questions randomly
    const questions = this.shuffleArray([...randomQuestionSet.questions]);

    const questionIds = questions.map((q) => q.id);

    // Create exam session
    const session = this.examSessionRepository.create({
      userId,
      startTime: new Date(),
      totalQuestions: 20,
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
      totalQuestions: 20,
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

    // Check if session has expired (more than 20 minutes)
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const elapsedMinutes = (now.getTime() - sessionStart.getTime()) / (1000 * 60);

    if (elapsedMinutes > this.EXAM_DURATION_MINUTES) {
      throw new BadRequestException('Phiên thi đã hết hạn (quá 20 phút). Không thể nộp bài.');
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

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Auto-submit expired session (after 20 minutes)
   * Grade only the answers that were submitted before expiration
   */
  private async autoSubmitExpiredSession(session: ExamSession): Promise<void> {
    // Get all answers submitted for this session
    const submittedAnswers = await this.examAnswerRepository.find({
      where: { examSessionId: session.id },
    });

    let correctCount = 0;

    // Grade only submitted answers
    for (const examAnswer of submittedAnswers) {
      const question = await this.questionRepository.findOne({
        where: { id: examAnswer.questionId },
        relations: ['answers'],
      });

      if (question) {
        const correctAnswer = question.answers.find((a) => a.isCorrect);
        const isCorrect = examAnswer.selectedAnswerId === correctAnswer?.id;

        // Update answer correctness
        examAnswer.isCorrect = isCorrect;
        if (isCorrect) correctCount++;

        await this.examAnswerRepository.save(examAnswer);
      }
    }

    // Calculate score based on submitted answers
    const score = (correctCount / session.totalQuestions) * 100;

    // Update session
    session.correctAnswers = correctCount;
    session.score = score;
    session.status = ExamStatus.COMPLETED;
    session.endTime = new Date();

    await this.examSessionRepository.save(session);
  }
}
