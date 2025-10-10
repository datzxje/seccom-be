# 🚀 Railway Deploy - Hướng dẫn nhanh

## TL;DR - 5 bước đơn giản

### 1️⃣ Push code lên GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2️⃣ Deploy trên Railway
1. Truy cập: https://railway.app
2. Login với GitHub
3. **"New Project"** → **"Deploy from GitHub repo"** → Chọn `seccom-be`
4. Đợi deploy xong (~2-3 phút)

### 3️⃣ Add PostgreSQL Database
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway tự động tạo database và connect với app

### 4️⃣ Config Environment Variables
Click vào service `seccom-be` → Tab **"Variables"** → Add các biến sau:

#### Required (Bắt buộc):
```env
NODE_ENV=production
PORT=3000

# Email (Thay bằng thông tin của bạn)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=your-email@gmail.com

# JWT (Đổi secret key!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cloudinary (Lấy từ dashboard.cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (Update sau khi deploy frontend)
FRONTEND_URL=*
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

#### Optional (Railway tự động inject):
Railway sẽ tự động inject các biến database:
- `DATABASE_URL` - Connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 5️⃣ Verify & Test
1. Đợi redeploy xong
2. Tab **"Deployments"** → Check logs có dòng:
   ```
   🚀 Application is running on: http://0.0.0.0:3000
   ```
3. Tab **"Settings"** → Copy domain URL
4. Test API:
   ```bash
   curl https://your-app.railway.app
   ```

---

## ⚙️ Database Setup

Railway tự động tạo database, nhưng bạn cần chạy migration/seed:

### Option 1: Auto sync (Development only)
Railway đã config `synchronize: true` cho development, tables sẽ tự động tạo lần đầu.

> ⚠️ **Warning:** Production nên dùng migration thay vì synchronize

### Option 2: Manual SQL (Khuyến nghị)
1. Vào Postgres service → Tab **"Data"** hoặc **"Connect"**
2. Copy connection string
3. Connect bằng pgAdmin/DBeaver
4. Chạy SQL script tạo tables (nếu có)

### Option 3: TypeORM Migration
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login và link project
railway login
railway link

# Run migration
railway run npx typeorm migration:run
```

---

## 🔧 Các file đã chuẩn bị sẵn

✅ **Dockerfile** - Multi-stage build (tối ưu size)
✅ **docker-compose.yml** - Local development
✅ **railway.json** - Railway config
✅ **.railwayignore** - Ignore files khi deploy
✅ **app.module.ts** - Hỗ trợ DATABASE_URL + SSL
✅ **main.ts** - Listen trên 0.0.0.0 (Docker-friendly)

---

## 📝 Checklist

- [ ] Code pushed lên GitHub
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Deployment successful (check logs)
- [ ] API endpoint works
- [ ] Database connected (check logs)
- [ ] Update FRONTEND_URL sau khi deploy frontend

---

## 🎯 Các thông tin cần chuẩn bị

### 1. Gmail App Password (cho MAIL_PASSWORD)
1. Truy cập: https://myaccount.google.com/security
2. Bật **"2-Step Verification"**
3. Vào **"App passwords"**
4. Tạo password cho "Mail" → Copy và paste vào `MAIL_PASSWORD`

### 2. Cloudinary Credentials
1. Truy cập: https://cloudinary.com/console
2. Dashboard sẽ hiển thị:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### 3. JWT Secret (Tạo random)
```bash
# Generate random secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚨 Common Issues

### "Application failed to respond"
→ Check PORT config và ensure app listen trên `0.0.0.0`

### "Cannot connect to database"
→ Railway đã tự động inject DATABASE_URL, không cần config thêm

### "CORS error from frontend"
→ Update `FRONTEND_URL` trong Railway variables

### "Email sending failed"
→ Check MAIL_PASSWORD là App Password, không phải password Gmail thường

---

## 📊 Free Tier Limits

**Railway Free Trial:**
- $5 credit/month (~500 compute hours)
- PostgreSQL: 500MB storage
- Bandwidth: 100GB/month

**Sau khi hết trial:**
- Hobby Plan: $5/month
- Hoặc pay-as-you-go

---

## 🔗 Links hữu ích

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Cloudinary Dashboard: https://cloudinary.com/console
- Chi tiết đầy đủ: Xem file `RAILWAY_DEPLOY.md`

---

## 💡 Tips

1. **Monitor logs:** Tab Deployments → Click deployment → View logs realtime
2. **Rollback:** Nếu deploy lỗi, click vào deployment cũ → "Redeploy"
3. **Custom domain:** Settings → Domains → Add Custom Domain
4. **Auto-deploy:** Railway tự động deploy khi push lên GitHub
5. **Database backup:** Railway tự động backup, hoặc export manual qua pgAdmin

---

**Chúc bạn deploy thành công! 🎉**

Nếu gặp vấn đề, check logs đầu tiên: Tab "Deployments" → Click deployment → View logs
