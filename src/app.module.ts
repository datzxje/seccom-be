import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegistrationModule } from './registration/registration.module';
import { AuthModule } from './auth/auth.module';
import { QuestionModule } from './question/question.module';
import { ExamModule } from './exam/exam.module';
import { Registration } from './registration/entities/registration.entity';
import { Question } from './question/entities/question.entity';
import { Answer } from './question/entities/answer.entity';
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
            entities: [Registration, Question, Answer, ExamSession, ExamAnswer],
            synchronize: !isProduction,
            logging: !isProduction,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
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
          entities: [Registration, Question, Answer, ExamSession, ExamAnswer],
          synchronize: !isProduction,
          logging: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const mailPort = +configService.get('MAIL_PORT');
        const mailHost = configService.get('MAIL_HOST');
        const mailUser = configService.get('MAIL_USER');
        const mailPassword = configService.get('MAIL_PASSWORD');
        const mailFrom = configService.get('MAIL_FROM');

        // Debug log
        console.log('📧 Email Config Debug:');
        console.log('MAIL_HOST:', mailHost);
        console.log('MAIL_PORT:', mailPort);
        console.log('MAIL_USER:', mailUser);
        console.log('MAIL_PASSWORD:', mailPassword ? `${mailPassword.substring(0, 10)}...` : 'NOT SET');
        console.log('MAIL_FROM:', mailFrom);
        console.log('Secure:', mailPort === 465);

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailPort === 465, // true for 465, false for other ports (587, 25)
            auth: {
              user: mailUser,
              pass: mailPassword,
            },
          },
          defaults: {
            from: mailFrom,
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
