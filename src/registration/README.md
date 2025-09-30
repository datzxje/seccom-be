# API Đăng Ký Thí Sinh

## Endpoints

### 1. Đăng ký mới
**POST** `/registration`

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "2003-05-15",
  "email": "nguyenvana@example.com",
  "phoneNumber": "0912345678",
  "university": "BA - Học viện Ngân hàng",
  "studentId": "SV001",
  "major": "Công nghệ thông tin",
  "className": "CNTT-K65",
  "yearOfStudy": 2,
  "facebookLink": "https://facebook.com/nguyenvana"
}
```

**Trường hợp chọn "Trường khác":**
```json
{
  "fullName": "Nguyễn Văn B",
  "dateOfBirth": "2003-05-15",
  "email": "nguyenvanb@example.com",
  "phoneNumber": "0987654321",
  "university": "Trường khác",
  "otherUniversity": "Đại học Bách Khoa Hà Nội"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "id": "uuid-here",
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "2003-05-15",
    "email": "nguyenvana@example.com",
    "phoneNumber": "0912345678",
    "university": "BA - Học viện Ngân hàng",
    "studentId": "SV001",
    "major": "Công nghệ thông tin",
    "className": "CNTT-K65",
    "yearOfStudy": 2,
    "facebookLink": "https://facebook.com/nguyenvana",
    "createdAt": "2025-09-30T10:30:00.000Z"
  }
}
```

**Response Error (Validation):**
```json
{
  "statusCode": 400,
  "message": [
    "Email không hợp lệ",
    "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam)"
  ],
  "error": "Bad Request"
}
```

**Response Error (Duplicate):**
```json
{
  "statusCode": 409,
  "message": "Email này đã được đăng ký"
}
```

### 2. Lấy danh sách tất cả đăng ký
**GET** `/registration`

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 10
}
```

### 3. Lấy thống kê
**GET** `/registration/statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "byUniversity": {
      "BA - Học viện Ngân hàng": 3,
      "FTU - Đại học Ngoại thương": 5,
      "Trường khác": 2
    }
  }
}
```

### 4. Lấy đăng ký theo ID
**GET** `/registration/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    ...
  }
}
```

## Validation Rules

### 1. Họ và tên
- Không được để trống

### 2. Ngày sinh
- Không được để trống
- Phải đúng định dạng ISO 8601 (YYYY-MM-DD)

### 3. Email
- Không được để trống
- Phải đúng định dạng email
- Không được trùng với email đã đăng ký

### 4. Số điện thoại
- Không được để trống
- Phải là số điện thoại Việt Nam hợp lệ
- Format: `0[3|5|7|8|9]XXXXXXXX` hoặc `+84[3|5|7|8|9]XXXXXXXX`
- Không được trùng với số điện thoại đã đăng ký

### 5. Trường học
- Phải chọn 1 trong các trường có sẵn
- Nếu chọn "Trường khác", phải điền tên trường vào field `otherUniversity`

### 6. Thông tin sinh viên (bắt buộc nếu KHÔNG chọn "Trường khác")
- **Mã sinh viên**: Không được để trống
- **Ngành học**: Không được để trống
- **Lớp học phần**: Không được để trống
- **Năm học**: Phải là số nguyên từ 1 đến 6
- **Link Facebook**: Phải là URL hợp lệ

## Danh sách trường học

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
13. Trường khác

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server sẽ chạy tại `http://localhost:3000`

API endpoint: `http://localhost:3000/registration`