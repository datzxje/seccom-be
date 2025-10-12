import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionSet } from './entities/question-set.entity';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { CreateQuestionSetDto } from './dto/create-question-set.dto';
import { UpdateQuestionSetDto } from './dto/update-question-set.dto';

@Injectable()
export class QuestionSetService {
  constructor(
    @InjectRepository(QuestionSet)
    private questionSetRepository: Repository<QuestionSet>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
  ) {}

  async create(createQuestionSetDto: CreateQuestionSetDto): Promise<QuestionSet> {
    const { questions, ...questionSetData } = createQuestionSetDto;

    // Validate: must have exactly 20 questions
    if (questions.length !== 20) {
      throw new BadRequestException('Bộ đề phải có đúng 20 câu hỏi');
    }

    // Validate: each question must have at least one correct answer
    for (const questionDto of questions) {
      const hasCorrectAnswer = questionDto.answers.some((answer) => answer.isCorrect);
      if (!hasCorrectAnswer) {
        throw new BadRequestException(
          'Mỗi câu hỏi phải có ít nhất một đáp án đúng',
        );
      }
    }

    // Create question set
    const questionSet = this.questionSetRepository.create(questionSetData);
    const savedQuestionSet = await this.questionSetRepository.save(questionSet);

    // Create questions
    for (let i = 0; i < questions.length; i++) {
      const { answers, ...questionData } = questions[i];

      const question = this.questionRepository.create({
        ...questionData,
        questionSetId: savedQuestionSet.id,
      });

      const savedQuestion = await this.questionRepository.save(question);

      // Create answers
      const answerEntities = answers.map((answerDto, index) =>
        this.answerRepository.create({
          ...answerDto,
          order: answerDto.order ?? index,
          questionId: savedQuestion.id,
        }),
      );

      await this.answerRepository.save(answerEntities);
    }

    return this.findOne(savedQuestionSet.id);
  }

  async findAll(includeInactive: boolean = false): Promise<QuestionSet[]> {
    const query = this.questionSetRepository
      .createQueryBuilder('questionSet')
      .leftJoinAndSelect('questionSet.questions', 'questions')
      .leftJoinAndSelect('questions.answers', 'answers')
      .orderBy('questionSet.createdAt', 'DESC')
      .addOrderBy('answers.order', 'ASC');

    if (!includeInactive) {
      query.where('questionSet.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<QuestionSet> {
    const questionSet = await this.questionSetRepository.findOne({
      where: { id },
      relations: ['questions', 'questions.answers'],
    });

    if (!questionSet) {
      throw new NotFoundException(`Bộ đề với ID ${id} không tồn tại`);
    }

    // Sort answers by order
    questionSet.questions.forEach((question) => {
      question.answers.sort((a, b) => a.order - b.order);
    });

    return questionSet;
  }

  async findRandomActive(): Promise<QuestionSet | null> {
    // First, get a random active question set ID
    const randomSet = await this.questionSetRepository
      .createQueryBuilder('questionSet')
      .where('questionSet.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();

    if (!randomSet) {
      return null;
    }

    // Then load it with all relations
    return this.findOne(randomSet.id);
  }

  async update(
    id: string,
    updateQuestionSetDto: UpdateQuestionSetDto,
  ): Promise<QuestionSet> {
    const questionSet = await this.findOne(id);
    const { questions, ...questionSetData } = updateQuestionSetDto;

    // Update question set data
    Object.assign(questionSet, questionSetData);
    await this.questionSetRepository.save(questionSet);

    // Update questions if provided
    if (questions && questions.length > 0) {
      if (questions.length !== 20) {
        throw new BadRequestException('Bộ đề phải có đúng 20 câu hỏi');
      }

      // Delete old questions (cascade will delete answers)
      await this.questionRepository.delete({ questionSetId: id });

      // Create new questions
      for (let i = 0; i < questions.length; i++) {
        const { answers, ...questionData } = questions[i];

        const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
        if (!hasCorrectAnswer) {
          throw new BadRequestException(
            'Mỗi câu hỏi phải có ít nhất một đáp án đúng',
          );
        }

        const question = this.questionRepository.create({
          ...questionData,
          questionSetId: id,
        });

        const savedQuestion = await this.questionRepository.save(question);

        const answerEntities = answers.map((answerDto, index) =>
          this.answerRepository.create({
            ...answerDto,
            order: answerDto.order ?? index,
            questionId: savedQuestion.id,
          }),
        );

        await this.answerRepository.save(answerEntities);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const questionSet = await this.findOne(id);
    await this.questionSetRepository.remove(questionSet);
  }

  async getStatistics(): Promise<any> {
    const total = await this.questionSetRepository.count();
    const active = await this.questionSetRepository.count({
      where: { isActive: true },
    });

    return {
      total,
      active,
      inactive: total - active,
    };
  }
}
