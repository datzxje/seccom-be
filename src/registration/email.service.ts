import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Registration } from './entities/registration.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPassword = this.configService.get('SMTP_PASSWORD');

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn(
        'SMTP configuration not complete. Email sending will fail.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10) || 587,
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP connection error:', error);
      } else {
        this.logger.log('SMTP Server is ready to send emails');
      }
    });
  }

  async sendRegistrationEmail(
    registration: Registration,
    plainPassword: string,
  ): Promise<boolean> {
    const appUrl = this.configService.get('APP_URL', 'https://seccom.com');
    const fromEmail = this.configService.get(
      'MAIL_FROM',
      'noreply@yourdomain.com',
    );
    const fromName = this.configService.get(
      'MAIL_FROM_NAME',
      'SEC - Cuộc thi Bản lĩnh Nhà đầu tư',
    );

    const emailContent = this.buildEmailTemplate(
      registration.fullName,
      registration.username,
      plainPassword,
      appUrl,
    );

    try {
      this.logger.log(`Sending registration email to ${registration.email}`);

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: registration.email,
        subject: '[Cuộc thi Bản lĩnh Nhà đầu tư 2025] Vòng 1 - Test online',
        html: emailContent,
      });

      this.logger.log(
        `Email sent successfully to ${registration.email}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending email to ${registration.email}`,
        error.stack,
      );
      return false;
    }
  }

  private buildEmailTemplate(
    fullName: string,
    username: string,
    password: string,
    appUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông tin đăng ký</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #0066cc;
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 5px;
        }
        .credentials {
            background-color: #fff;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #0066cc;
        }
            .btc-right {
                text-align: right;
                color: #0066cc;
                font-weight: bold;
            }
        .important {
            background-color: #fff3cd;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #666;
        }
        a {
            color: #0066cc;
        }
        a:hover {
            text-decoration: underline;
        }
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 8px 0;

        }

    </style>
</head>
<body>
    <div class="header">
        <h2>Đăng ký thành công Vòng 1 - Test Online</h2>
    </div>

    <div class="content">
        <p>Thân gửi bạn <strong>${fullName}</strong>,</p>

        <p>CLB Chứng khoán Học viện Ngân hàng - SEC chân thành cảm ơn bạn đã dành sự quan tâm và đăng ký tham gia <strong>Cuộc thi Bản lĩnh Nhà đầu tư 2025</strong>.</p>

        <p>BTC xin gửi bạn thông tin chi tiết để tham dự <strong>Vòng 1 - Test Online</strong>:</p>

        <div class="credentials">
            <p><strong>· Tài khoản:</strong> ${username}</p>
            <p><strong>· Mật khẩu:</strong> ${password}</p>
        </div>

        <h3>Hướng dẫn trước khi làm bài:</h3>
        <ul>
            <li>Bài thi gồm các câu hỏi trắc nghiệm kiểm tra kiến thức về lĩnh vực <strong>Kinh tế - Tài chính - Chứng khoán, IQ,...</strong> Ở mỗi câu hỏi, các thí sinh chỉ được lựa chọn <strong>01 đáp án duy nhất</strong>.</li>
        <li>Thời gian làm bài: <strong>30 phút</strong>.</li>
            <li>Bạn vui lòng truy cập vào link <a href="${appUrl}">${appUrl}</a> để bắt đầu thi.</li>
        </ul>

        <p>Nếu có thắc mắc về Vòng 1 Cuộc thi Bản lĩnh Nhà đầu tư 2025, bạn vui lòng liên hệ Fanpage <a href="https://www.facebook.com/banlinhnhadautu.sec">https://www.facebook.com/banlinhnhadautu.sec</a> hoặc gửi mail về địa chỉ <a href="mailto:notify.blndt@gmail.com">notify.blndt@gmail.com</a> để BTC có thể giải đáp.</p>

        <p><strong>Cảm ơn bạn đã dành thời gian quan tâm đến cuộc thi và chúc bạn hoàn thành tốt bài thi của mình!</strong></p>

        <div class="important">
            <h3>LƯU Ý:</h3>
            <ul>
                <li>Với mỗi <strong>IP máy tính</strong>, các bạn chỉ được dự thi <strong>MỘT lần duy nhất</strong>!</li>
                <li>Vì vậy, bạn hãy chuẩn bị đầy đủ kiến thức và đảm bảo kết nối đường truyền máy tính của mình thật ổn định để tránh những lỗi đáng tiếc có thể xảy ra!</li>
            </ul>
        </div>

        <p><strong>Trân trọng!</strong></p>
        <p class="btc-right">BTC Cuộc thi Bản lĩnh Nhà đầu tư</p>

        <div class="footer">
            <p><strong>Mọi chi tiết vui lòng liên hệ:</strong></p>
            <ul>
                <li>Fanpage CLB Chứng khoán Học viện Ngân hàng – SEC: <a href="https://www.facebook.com/sec.bav/">https://www.facebook.com/sec.bav/</a></li>
                <li>Fanpage Cuộc thi: <a href="https://www.facebook.com/banlinhnhadautu.sec">https://www.facebook.com/banlinhnhadautu.sec</a></li>
                <li>Email: <a href="mailto:notify.blndt@gmail.com">notify.blndt@gmail.com</a></li>
                <li>Hotline: 0968 763 960 (Ms. Phuong Anh)</li>
            </ul>
        </div>
    </div>
</body>
</html>

    `;
  }
}
