# SecCom Backend - Hệ thống thi trắc nghiệm 

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository

### 2. Cấu hình môi trường

Copy file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

### 3. Chạy ứng dụng với Docker

#### Khởi động services:

```bash
docker-compose up -d --build
```

#### Dừng services:

```bash
docker-compose down
```

#### Xem logs:

```bash
# Xem logs của app
docker logs sec-com-app -f

# Xem logs của database
docker logs sec-com-postgres -f
```

## 🐳 Docker Commands

```bash
# Build và start
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker logs sec-com-app -f
docker logs sec-com-postgres -f

# Restart services
docker-compose restart

# Remove all (including volumes)
docker-compose down -v
```

## 📄 License

[MIT licensed](LICENSE)
