import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CloudinaryService } from '../common/services/cloudinary.service';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const { answers, ...questionData } = createQuestionDto;

    // Validate at least one correct answer
    const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      throw new BadRequestException(
        'Question must have at least one correct answer',
      );
    }

    const question = this.questionRepository.create(questionData);
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

    return this.findOne(savedQuestion.id);
  }

  async findAll(includeInactive: boolean = false): Promise<Question[]> {
    const query = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.answers', 'answers')
      .orderBy('question.createdAt', 'DESC')
      .addOrderBy('answers.order', 'ASC');

    if (!includeInactive) {
      query.where('question.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findRandomActive(limit: number = 40): Promise<Question[]> {
    const questions = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.answers', 'answers')
      .where('question.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .addOrderBy('answers.order', 'ASC')
      .limit(limit)
      .getMany();

    return questions;
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['answers'],
      order: {
        answers: {
          order: 'ASC',
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.findOne(id);
    const { answers, ...questionData } = updateQuestionDto;

    // Update question data
    Object.assign(question, questionData);
    await this.questionRepository.save(question);

    // Update answers if provided
    if (answers && answers.length > 0) {
      const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
      if (!hasCorrectAnswer) {
        throw new BadRequestException(
          'Question must have at least one correct answer',
        );
      }

      // Delete old answers
      await this.answerRepository.delete({ questionId: id });

      // Create new answers
      const answerEntities = answers.map((answerDto, index) =>
        this.answerRepository.create({
          ...answerDto,
          order: answerDto.order ?? index,
          questionId: id,
        }),
      );

      await this.answerRepository.save(answerEntities);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);

    // Delete images from Cloudinary if they exist
    if (question.imageUrl) {
      try {
        await this.cloudinaryService.deleteFile(question.imageUrl);
      } catch (error) {
        console.error('Failed to delete question image:', error);
      }
    }

    // Delete answer images
    for (const answer of question.answers) {
      if (answer.imageUrl) {
        try {
          await this.cloudinaryService.deleteFile(answer.imageUrl);
        } catch (error) {
          console.error('Failed to delete answer image:', error);
        }
      }
    }

    await this.questionRepository.remove(question);
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return this.cloudinaryService.uploadFile(file, 'questions');
  }
}
