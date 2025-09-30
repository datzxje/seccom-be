# Tổng Quan Hệ Thống Đăng Ký Thí Sinh

## 📋 Tổng Quan

Hệ thống backend API cho phép đăng ký thí sinh với đầy đủ validation và kiểm tra dữ liệu.

## 🏗️ Cấu Trúc Dự Án

```
src/
├── main.ts                          # Entry point, config ValidationPipe & CORS
├── app.module.ts                    # Root module
└── registration/
    ├── constants/
    │   └── universities.constant.ts # Danh sách 13 trường
    ├── dto/
    │   └── create-registration.dto.ts # Validation rules
    ├── entities/
    │   └── registration.entity.ts   # Data model
    ├── registration.controller.ts   # API endpoints
    ├── registration.service.ts      # Business logic
    ├── registration.module.ts       # Module definition
    └── README.md                    # API documentation
```

## ✨ Tính Năng

### 1. Validation Tự Động
- **Email**: Phải đúng format, không được trùng
- **Số điện thoại**: Format Việt Nam (0XXXXXXXXX hoặc +84XXXXXXXXX), không được trùng
- **Ngày sinh**: Format ISO 8601 (YYYY-MM-DD)
- **Năm học**: Số nguyên từ 1-6
- **Link Facebook**: Phải là URL hợp lệ

### 2. Logic Điều Kiện
- **Trường trong danh sách**: Bắt buộc điền đầy đủ thông tin sinh viên
- **Trường khác**: Chỉ cần điền tên trường, không cần thông tin sinh viên

### 3. Kiểm Tra Trùng Lặp
- Email không được trùng
- Số điện thoại không được trùng

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/registration` | Đăng ký mới |
| GET | `/registration` | Lấy tất cả đăng ký |
| GET | `/registration/statistics` | Lấy thống kê |
| GET | `/registration/:id` | Lấy đăng ký theo ID |

## 📝 Quy Tắc Validation

### Trường Bắt Buộc Luôn
1. ✅ Họ và tên
2. ✅ Ngày sinh
3. ✅ Email (valid + unique)
4. ✅ Số điện thoại (valid + unique)
5. ✅ Trường học (chọn từ 13 trường)

### Trường Bắt Buộc Có Điều Kiện

**Nếu chọn trường TRONG danh sách:**
6. ✅ Mã sinh viên
7. ✅ Ngành học
8. ✅ Lớp học phần
9. ✅ Năm học (1-6)
10. ✅ Link Facebook (URL)

**Nếu chọn "Trường khác":**
6. ✅ Tên trường (otherUniversity)

## 🎓 Danh Sách Trường

1. BA - Học viện Ngân hàng
2. FTU - Đại học Ngoại thương
3. NEU - Đại học Kinh tế Quốc Dân
4. AOF - Học viện Tài chính
5. UEB - Trường Đại học Kinh tế - Đại học Quốc gia Hà Nội
6. TMU - Đại học Thương mại
7. FTU2 - Trường Đại học Ngoại thương cơ sở II
8. UEH - Trường Đại học Kinh tế TP.HCM
9. HUB - Trường Đại học Ngân hàng TP.HCM
10. UEL - Trường Đại học Kinh tế - Luật - Đại học Quốc gia TP.HCM
11. UEF - Trường Đại học Kinh tế - Tài chính TP.HCM
12. RMIT - Trường Đại học RMIT
13. **Trường khác** (cho phép nhập tên trường khác)

## 🚀 Cách Chạy

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

Server chạy tại: `http://localhost:3000`

## 🧪 Testing

### Sử dụng REST Client (VS Code)
1. Cài extension "REST Client"
2. Mở file `test-api-examples.http`
3. Click "Send Request" để test

### Sử dụng cURL
```bash
# Test đăng ký thành công
curl -X POST http://localhost:3000/registration \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "2003-05-15",
    "email": "test@example.com",
    "phoneNumber": "0912345678",
    "university": "BA - Học viện Ngân hàng",
    "studentId": "SV001",
    "major": "CNTT",
    "className": "K65",
    "yearOfStudy": 2,
    "facebookLink": "https://facebook.com/test"
  }'
```

### Sử dụng Postman/Insomnia
Import các request từ file `test-api-examples.http`

## 📊 Response Format

### ✅ Success (201 Created)
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": { ... }
}
```

### ❌ Validation Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "Email không hợp lệ",
    "Số điện thoại không hợp lệ"
  ],
  "error": "Bad Request"
}
```

### ❌ Duplicate Error (409 Conflict)
```json
{
  "statusCode": 409,
  "message": "Email này đã được đăng ký"
}
```

## 🔐 Security Features

1. **Input Validation**: Class-validator tự động validate
2. **Whitelist**: Chỉ chấp nhận fields được định nghĩa trong DTO
3. **Transform**: Tự động convert kiểu dữ liệu
4. **CORS**: Đã enable cho phép frontend call API

## 📁 Files Quan Trọng

1. **`src/registration/dto/create-registration.dto.ts`**
   - Định nghĩa tất cả validation rules
   - Logic điều kiện với `@ValidateIf()`

2. **`src/registration/registration.service.ts`**
   - Kiểm tra duplicate email/phone
   - Lưu trữ data (in-memory)

3. **`src/registration/registration.controller.ts`**
   - Định nghĩa các API endpoints
   - Format response

4. **`FRONTEND_INTEGRATION.md`**
   - Hướng dẫn tích hợp frontend
   - Example code React/JavaScript

5. **`test-api-examples.http`**
   - Các test case mẫu
   - Bao gồm cả success và error cases

## 🔄 Workflow

1. User submit form từ frontend
2. Request gửi đến API endpoint `POST /registration`
3. ValidationPipe tự động validate theo DTO rules
4. Nếu validation pass:
   - Service kiểm tra duplicate email/phone
   - Lưu data và trả về success response
5. Nếu validation fail:
   - Trả về 400 với chi tiết lỗi
6. Nếu duplicate:
   - Trả về 409 với message cụ thể

## 🎯 Next Steps (Tùy chọn)

1. **Database Integration**
   - Cài đặt TypeORM hoặc Prisma
   - Kết nối PostgreSQL/MySQL

2. **Email Notification**
   - Gửi email xác nhận sau khi đăng ký

3. **Admin Panel**
   - Xem, quản lý danh sách đăng ký
   - Export Excel/CSV

4. **Authentication**
   - JWT auth cho admin
   - Role-based access control

## 📞 Support

Nếu có vấn đề, check các file:
- `src/registration/README.md` - API docs
- `FRONTEND_INTEGRATION.md` - Frontend guide
- `test-api-examples.http` - Test examples