# 🚀 Deploy SecCom Backend lên Railway

## Tổng quan

Railway sẽ tự động:
- ✅ Build Docker image từ Dockerfile
- ✅ Provision PostgreSQL database
- ✅ Generate DATABASE_URL
- ✅ Deploy và auto-scale
- ✅ Provide HTTPS domain miễn phí

## Bước 1: Chuẩn bị Project

### 1.1. Commit và push code lên GitHub

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Bước 2: Tạo Project trên Railway

### 2.1. Đăng ký/Đăng nhập Railway
1. Truy cập: https://railway.app
2. Click **"Login"** → Chọn **"Login with GitHub"**
3. Authorize Railway truy cập GitHub

### 2.2. Tạo Project mới
1. Click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Chọn repository: **`seccom-be`**
4. Railway sẽ tự động detect Dockerfile và bắt đầu deploy

## Bước 3: Thêm PostgreSQL Database

### 3.1. Add Database Service
1. Trong project dashboard, click **"+ New"**
2. Chọn **"Database"**
3. Chọn **"Add PostgreSQL"**
4. Railway sẽ tự động provision database

### 3.2. Database Variables (Tự động)
Railway tự động tạo các biến:
- `DATABASE_URL` - Connection string đầy đủ
- `PGHOST` - Database host
- `PGPORT` - Database port (5432)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

## Bước 4: Cấu hình Environment Variables

### 4.1. Truy cập Settings
1. Click vào service **`seccom-be`** (không phải database)
2. Tab **"Variables"**

### 4.2. Thêm các biến sau:

#### **Application Settings**
```env
NODE_ENV=production
PORT=3000
```

#### **Database (Railway tự động inject, nhưng nếu cần custom)**
```env
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}
```

> **Lưu ý:** Railway có thể tự động map `DATABASE_URL`, nhưng nếu không được thì dùng syntax `${{Postgres.VARIABLE_NAME}}` để reference từ Postgres service.

#### **Email Configuration**
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
```

#### **Application URLs**
```env
APP_URL=https://your-railway-app.railway.app
FRONTEND_URL=https://your-frontend-domain.com
```

#### **JWT Settings**
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

#### **Cloudinary Configuration**
```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 4.3. Lưu và Redeploy
- Click **"Add"** hoặc **"Update"** sau mỗi biến
- Railway sẽ tự động redeploy sau khi thêm biến

## Bước 5: Cấu hình Database Connection

### Option 1: Sử dụng DATABASE_URL (Khuyến nghị)

Nếu Railway inject `DATABASE_URL`, cập nhật `app.module.ts`:

```typescript
// src/app.module.ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get('DATABASE_URL');

    if (databaseUrl) {
      // Railway provides DATABASE_URL
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [Registration, Question, Answer, ExamSession, ExamAnswer],
        synchronize: false, // IMPORTANT: Set to false in production
        logging: configService.get('NODE_ENV') === 'development',
        ssl: {
          rejectUnauthorized: false, // Railway requires SSL
        },
      };
    }

    // Fallback to individual env vars
    return {
      type: 'postgres',
      host: configService.get('DB_HOST'),
      port: +configService.get('DB_PORT'),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE'),
      entities: [Registration, Question, Answer, ExamSession, ExamAnswer],
      synchronize: configService.get('NODE_ENV') === 'development',
      logging: configService.get('NODE_ENV') === 'development',
      ssl: {
        rejectUnauthorized: false,
      },
    };
  },
  inject: [ConfigService],
}),
```

### Option 2: Sử dụng biến riêng lẻ

Giữ nguyên code hiện tại, nhưng đảm bảo thêm SSL config:

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: +configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [Registration, Question, Answer, ExamSession, ExamAnswer],
    synchronize: false, // NEVER true in production
    logging: false,
    ssl: {
      rejectUnauthorized: false, // Required for Railway
    },
  }),
  inject: [ConfigService],
}),
```

## Bước 6: Migration Database

### 6.1. Cài đặt TypeORM CLI (nếu chưa có)

```bash
npm install -D typeorm-ts-node-commonjs
```

### 6.2. Tạo migration

```bash
npm run typeorm migration:generate -- -n InitialMigration
```

### 6.3. Run migration trên Railway

**Option 1: Sử dụng Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run npm run typeorm migration:run
```

**Option 2: Sử dụng Railway Dashboard**
1. Tab **"Settings"** → **"Deploy"**
2. Add custom start command:
```bash
npm run typeorm migration:run && node dist/main.js
```

**Option 3: Connect trực tiếp (khuyến nghị cho lần đầu)**
1. Vào Postgres service → Tab **"Connect"**
2. Copy **"Postgres Connection URL"**
3. Dùng tool như **pgAdmin**, **DBeaver**, hoặc **psql** để connect
4. Chạy SQL script để tạo tables (nếu có)

## Bước 7: Verify Deployment

### 7.1. Kiểm tra Deploy Status
1. Vào service **`seccom-be`**
2. Tab **"Deployments"**
3. Đợi status thành **"Success"** (màu xanh)

### 7.2. Kiểm tra Logs
1. Tab **"Deployments"** → Click vào deployment mới nhất
2. Xem logs để đảm bảo không có lỗi:
```
✓ Database connected
✓ Nest application successfully started
✓ Application is running on: http://0.0.0.0:3000
```

### 7.3. Test API
1. Tab **"Settings"** → Copy **"Domains"** URL
2. Test endpoint:
```bash
curl https://your-app.railway.app

# Expected: {"message":"Welcome to SecCom API"}
```

## Bước 8: Cấu hình Domain (Tùy chọn)

### 8.1. Sử dụng Railway Domain (Miễn phí)
- Railway tự động cung cấp: `https://your-app.railway.app`
- SSL tự động

### 8.2. Sử dụng Custom Domain
1. Tab **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Nhập domain của bạn: `api.seccom.com`
4. Add CNAME record tại DNS provider:
```
CNAME api.seccom.com -> your-app.railway.app
```
5. Đợi DNS propagate (5-30 phút)

## Bước 9: Auto-Deploy on Push (Đã có sẵn)

Railway tự động deploy khi bạn push code lên GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway sẽ tự động:
1. Detect thay đổi từ GitHub
2. Build Docker image mới
3. Deploy phiên bản mới
4. Rollback nếu deploy fail

## Bước 10: Monitoring & Logs

### 10.1. View Logs
- Tab **"Deployments"** → Click deployment → View logs
- Realtime logs

### 10.2. Metrics
- Tab **"Metrics"** để xem:
  - CPU usage
  - Memory usage
  - Network traffic

### 10.3. Alerts (Pro plan)
- Setup alerts cho downtime, errors

## Troubleshooting

### ❌ Lỗi: "Application failed to respond"
**Nguyên nhân:** App không lắng nghe đúng PORT
**Giải pháp:** Đảm bảo `main.ts`:
```typescript
const port = process.env.PORT || 3000;
await app.listen(port, '0.0.0.0');
```

### ❌ Lỗi: "Cannot connect to database"
**Nguyên nhân:** Thiếu SSL config
**Giải pháp:** Thêm SSL trong TypeORM config (xem Bước 5)

### ❌ Lỗi: "Module not found"
**Nguyên nhân:** Dependencies không được install
**Giải pháp:**
1. Kiểm tra `package.json` đã có đầy đủ dependencies
2. Rebuild: Tab **"Settings"** → **"Redeploy"**

### ❌ Lỗi: "Table does not exist"
**Nguyên nhân:** Chưa run migration/sync
**Giải pháp:**
- Tạm thời set `synchronize: true` để tạo tables (không khuyến nghị production)
- Hoặc chạy migration (xem Bước 6)

### ❌ Lỗi: "JWT secret not configured"
**Nguyên nhân:** Thiếu environment variables
**Giải pháp:** Kiểm tra lại tất cả biến trong Bước 4

## So sánh Railway vs các platform khác

| Feature | Railway | Heroku | Render | Vercel |
|---------|---------|--------|--------|--------|
| Free tier database | ✅ 500MB | ❌ (chỉ có paid) | ✅ 256MB | ❌ |
| Auto SSL | ✅ | ✅ | ✅ | ✅ |
| Docker support | ✅ | ✅ | ✅ | ❌ |
| Auto deploy from Git | ✅ | ✅ | ✅ | ✅ |
| Easy setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Price (for scale) | $$ | $$$ | $$ | $ |

## Free Tier Limits (Railway)

- **Compute:** $5 credit/month (~500 hours)
- **Database:** 500MB storage, 5GB bandwidth
- **Memory:** 512MB RAM (có thể tăng bằng credit)
- **Bandwidth:** 100GB egress/month

> **Lưu ý:** Đủ cho development/testing, nhưng production nên nâng lên Pro ($5-20/month)

## Checklist Deploy

- [ ] Code đã push lên GitHub
- [ ] Tạo project trên Railway
- [ ] Add PostgreSQL database
- [ ] Configure tất cả environment variables
- [ ] Update TypeORM config với SSL
- [ ] Run database migration
- [ ] Verify deployment success
- [ ] Test API endpoints
- [ ] Configure custom domain (nếu có)
- [ ] Update FRONTEND_URL trong env variables

## Resources

- Railway Docs: https://docs.railway.app
- Railway Templates: https://railway.app/templates
- Community: https://discord.gg/railway

## Liên hệ

Nếu gặp vấn đề khi deploy, hãy kiểm tra logs và tham khảo phần Troubleshooting ở trên.
