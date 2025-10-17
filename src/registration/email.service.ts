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
    <title>Đăng ký thành công - Cuộc thi Bản lĩnh Nhà đầu tư 2025</title>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            line-height: 1.6;
            color: #000;
            margin: 40px;
        }
        h2 {
            text-align: center;
            color: #0066cc;
            font-weight: bold;
        }
        b {
            font-weight: bold;
        }
        ul {
            margin-top: 0;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .footer {
            background-color: rgb(33,65,89);
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
        }
        .footer a {
            color: #66b3ff;
        }
        .social-icons {
            margin: 20px 0;
        }
        .social-icons a {
            display: inline-block;
            background-color: white;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            margin: 0 10px;
            line-height: 45px;
            text-align: center;
            transition: 0.3s;
        }
        .social-icons a:hover {
            background-color: #d9d9d9;
            transform: scale(1.05);
        }
        .social-icons img {
            width: 24px;
            vertical-align: middle;
        }
        .highlight {
            font-weight: bold;
        }
        .right-align {
      text-align: right;
      color: #0066cc;
      font-weight: bold;
    }
    </style>
</head>
<body>

    <h2>ĐĂNG KÝ THÀNH CÔNG VÒNG 1 - TEST ONLINE</h2>

    <p><b><i>Thân gửi bạn <strong>${fullName}</strong>!</i></b></p>
    <p>
        BTC Cuộc thi <b>Bản lĩnh Nhà đầu tư 2025</b> chân thành cảm ơn bạn đã dành sự quan tâm và đăng ký tham gia 
        <b>Cuộc thi Bản lĩnh Nhà đầu tư 2025</b>.
    </p>

    <p>BTC xin gửi bạn thông tin chi tiết để tham dự <b>Vòng 1 - Test Online:</b></p>
    <ul>
        <li><b>Tài khoản:</b> <strong>${username}</strong></li>
        <li><b>Mật khẩu:</b> <strong>${password}</strong></li>
    </ul>

    <p><b>Hướng dẫn trước khi làm bài:</b></p>
    <ul>
        <li>Bài thi gồm các câu hỏi trắc nghiệm kiểm tra kiến thức về lĩnh vực <b>Kinh tế - Tài chính - Chứng khoán, IQ,...</b> 
            Ở mỗi câu hỏi, các thí sinh chỉ được lựa chọn <b>01 đáp án duy nhất.</b></li>
        <li><b>Thời gian làm bài:</b> 20 phút.</li>
        <li>Bạn vui lòng truy cập vào link <i><a href="${appUrl}">${appUrl}</a></i> để bắt đầu thi.</li>
    </ul>

    <p>Nếu có thắc mắc về <b>Vòng 1 Cuộc thi Bản lĩnh Nhà đầu tư 2025</b>, bạn vui lòng liên hệ Fanpage 
        <a href="https://www.facebook.com/banlinhnhadautu.sec" target="_blank">https://www.facebook.com/banlinhnhadautu.sec</a> 
        hoặc gửi mail về địa chỉ <a href="mailto:notify.blndt@gmail.com">notify.blndt@gmail.com</a> để BTC có thể giải đáp.
    </p>

    <p>Cảm ơn bạn đã dành thời gian quan tâm đến cuộc thi và chúc bạn hoàn thành tốt bài thi của mình!</p>

    <p><b>LƯU Ý:</b><br>
        Với mỗi IP máy tính, các bạn chỉ được dự thi <b>MỘT lần duy nhất!</b> Vì vậy, bạn hãy chuẩn bị đầy đủ kiến thức 
        và đảm bảo kết nối đường truyền máy tính của mình thật ổn định để tránh những lỗi đáng tiếc có thể xảy ra!
    </p>

    <p><i><b>Trân trọng!</b></i></p>

    <p class="right-align"><b style="color:#0066cc;">BTC Cuộc thi Bản lĩnh Nhà đầu tư</b></p>

    <div class="footer">
        <div class="social-icons">
           <a href="https://www.facebook.com/banlinhnhadautu.sec" target="_blank">
                <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook">
            </a>
            <a href="mailto:notify.blndt@gmail.com" title="Email">
                <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email">
            </a>
            <a href="https://www.youtube.com/@clbchungkhoansec-ba" target="_blank">
                <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube">
            </a>
        </div> </div>
<p style="text-align:center;">
            <b>Mọi chi tiết vui lòng liên hệ:</b><br>
            <b>Fanpage CLB Chứng khoán Học viện Ngân hàng – SEC</b><br>
            <a href="https://www.google.com/maps/place/12+Chùa+Bộc,+Kim+Liên,+Hà+Nội" target="_blank">12 Chùa Bộc, Kim Liên, Hà Nội</a><br>
            <b>Hotline:</b> 0968 763 960 (Ms. Phương Anh)<br>
            0332 178 886 (Mr. Bùi Thanh)
        </p>
   

</body>
</html>

    `;
  }
}
