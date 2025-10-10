# 📁 Các file cấu hình trong project

## Files đã được cấu hình sẵn

### 🐳 Docker & Container

#### `Dockerfile`
Multi-stage build để tối ưu size image:
- **Build stage:** Compile TypeScript → JavaScript
- **Runtime stage:** Chỉ chứa code đã build + production dependencies
- Size cuối cùng: ~200MB (thay vì ~800MB)

#### `docker-compose.yml`
Chạy local development với Docker:
```bash
docker-compose up -d
```
Bao gồm:
- PostgreSQL container
- App container
- Auto-restart và health checks

#### `.dockerignore`
Ignore files không cần thiết khi build Docker image:
- node_modules
- dist
- .git
- logs, etc.

---

### 🚂 Railway Deployment

#### `railway.json`
Config cho Railway platform:
- Build method: Dockerfile
- Start command: `node dist/main.js`
- Health check path: `/`
- Restart policy: ON_FAILURE

#### `.railwayignore`
Ignore files khi deploy lên Railway (giống .dockerignore)

#### `RAILWAY_DEPLOY.md`
Hướng dẫn chi tiết deploy lên Railway (12 bước)

#### `DEPLOY_QUICKSTART.md`
Hướng dẫn nhanh deploy lên Railway (5 bước)

---

### ⚙️ Environment Variables

#### `.env.example`
Template cho environment variables:
- Database config (PostgreSQL)
- Email config (Gmail SMTP)
- JWT secrets
- **Cloudinary config** (thay thế AWS S3)
- Application URLs

**Copy và rename:**
```bash
cp .env.example .env
# Sau đó update các giá trị
```

#### `.env` (Not in git)
File chứa giá trị thực tế của environment variables.
⚠️ **KHÔNG commit file này lên Git!**

---

### 🗃️ Database

#### TypeORM Config (trong `app.module.ts`)
Đã config để support:
- ✅ Local development (individual env vars)
- ✅ Railway (DATABASE_URL)
- ✅ SSL for production
- ✅ Auto-sync cho development
- ✅ Logging cho development

**Connection priority:**
1. Nếu có `DATABASE_URL` → dùng (Railway)
2. Nếu không → dùng DB_HOST, DB_PORT, etc. (Local)

---

### 🔐 Security

#### CORS (trong `main.ts`)
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
})
```
- Development: Accept tất cả origins (*)
- Production: Chỉ accept FRONTEND_URL

#### Validation (Global Pipe)
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Remove unknown properties
    forbidNonWhitelisted: true, // Throw error if unknown properties
    transform: true,            // Auto-transform types
  }),
)
```

---

### 📦 Package Management

#### `package.json`
Scripts quan trọng:
- `npm run build` - Build production
- `npm run start:prod` - Start production
- `npm run start:dev` - Start development (auto-reload)

Dependencies chính:
- **NestJS** - Framework
- **TypeORM** - ORM for PostgreSQL
- **Passport JWT** - Authentication
- **Cloudinary** - File storage (thay AWS S3)
- **ExcelJS** - Export Excel
- **Nodemailer** - Email sending

---

### 🎨 Code Style

#### `.prettierrc`
Prettier config cho code formatting:
```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

#### `eslint.config.mjs`
ESLint config cho code quality

#### `tsconfig.json`
TypeScript compiler config

---

## 🔄 Migration từ S3 sang Cloudinary

### Files đã thay đổi:

✅ **Removed:**
- `src/common/services/s3.service.ts` (đã xóa)
- AWS SDK packages (đã uninstall)

✅ **Added:**
- `src/common/services/cloudinary.service.ts` (mới)
- `src/common/cloudinary.module.ts` (mới)
- Cloudinary package (đã install)

✅ **Updated:**
- `src/question/question.module.ts` - Import CloudinaryModule
- `src/question/question.service.ts` - Dùng CloudinaryService
- `.env.example` - Cloudinary variables

---

## 📚 Documentation Files

| File | Mục đích |
|------|----------|
| `README.md` | Tổng quan project, setup local |
| `RAILWAY_DEPLOY.md` | Chi tiết 12 bước deploy Railway |
| `DEPLOY_QUICKSTART.md` | Nhanh 5 bước deploy Railway |
| `CONFIG_FILES.md` | File này - giải thích các config |

---

## 🚀 Quick Commands

### Local Development
```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start with Docker
docker-compose up -d

# Or start without Docker
npm run start:dev
```

### Production Build
```bash
# Build
npm run build

# Start production
npm run start:prod
```

### Deploy to Railway
```bash
# Push to GitHub
git add .
git commit -m "Deploy to Railway"
git push origin main

# Railway auto-deploys từ GitHub
```

---

## 🔧 Environment Variables Checklist

### Development (.env)
- [ ] Database (local or Docker)
- [ ] Email (optional for testing)
- [ ] JWT secret (any string)
- [ ] Cloudinary (optional cho file upload)

### Production (Railway)
- [ ] NODE_ENV=production
- [ ] PORT=3000
- [ ] DATABASE_URL (Railway auto-inject)
- [ ] Email credentials (bắt buộc)
- [ ] JWT secret (strong random string)
- [ ] Cloudinary credentials (bắt buộc)
- [ ] FRONTEND_URL (update sau deploy frontend)

---

## 📞 Support

Nếu có câu hỏi về config files:
1. Check file documentation tương ứng
2. Check logs để debug
3. Tham khảo docs chính thức của từng tool

---

**Tất cả files đã được config sẵn và ready to deploy! 🎉**
