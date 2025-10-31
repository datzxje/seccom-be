import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegistrationModule } from './registration/registration.module';
import { AuthModule } from './auth/auth.module';
import { QuestionModule } from './question/question.module';
import { ExamModule } from './exam/exam.module';
import { Registration } from './registration/entities/registration.entity';
import { Question } from './question/entities/question.entity';
import { Answer } from './question/entities/answer.entity';
import { QuestionSet } from './question/entities/question-set.entity';
import { ExamSession } from './exam/entities/exam-session.entity';
import { ExamAnswer } from './exam/entities/exam-answer.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';

        // Railway provides DATABASE_URL
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [Registration, Question, Answer, QuestionSet, ExamSession, ExamAnswer],
            synchronize: !isProduction,
            logging: !isProduction,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            extra: {
              max: 20, // Maximum pool size
              min: 5, // Minimum pool size
              idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
              connectionTimeoutMillis: 10000, // Timeout when acquiring connection
            },
          };
        }

        // Fallback to individual env vars (local development)
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: +configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [Registration, Question, Answer, QuestionSet, ExamSession, ExamAnswer],
          synchronize: !isProduction,
          logging: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: {
            max: 20, // Maximum pool size
            min: 5, // Minimum pool size
            idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
            connectionTimeoutMillis: 10000, // Timeout when acquiring connection
          },
        };
      },
      inject: [ConfigService],
    }),
    RegistrationModule,
    AuthModule,
    QuestionModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
