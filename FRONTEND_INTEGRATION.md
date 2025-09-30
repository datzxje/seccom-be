# Hướng Dẫn Tích Hợp Frontend

## Thông tin API

- **Base URL**: `http://localhost:3000`
- **Endpoint đăng ký**: `POST /registration`
- **CORS**: Đã được enable

## Cấu trúc Form

### Trường bắt buộc luôn luôn:
1. **Họ và tên** (`fullName`): string
2. **Ngày sinh** (`dateOfBirth`): string (format: YYYY-MM-DD)
3. **Email** (`email`): string (phải đúng format email)
4. **Số điện thoại** (`phoneNumber`): string (format: 0XXXXXXXXX hoặc +84XXXXXXXXX)
5. **Trường học** (`university`): string (chọn từ dropdown)

### Trường bắt buộc khi chọn trường TRONG danh sách:
6. **Mã sinh viên** (`studentId`): string
7. **Ngành học** (`major`): string
8. **Lớp học phần** (`className`): string
9. **Năm học** (`yearOfStudy`): number (1-6)
10. **Link Facebook** (`facebookLink`): string (URL hợp lệ)

### Trường bắt buộc khi chọn "Trường khác":
6. **Tên trường** (`otherUniversity`): string

## Danh sách trường học cho dropdown

```javascript
const universities = [
  'BA - Học viện Ngân hàng',
  'FTU - Đại học Ngoại thương',
  'NEU - Đại học Kinh tế Quốc Dân',
  'AOF - Học viện Tài chính',
  'UEB - Trường Đại học Kinh tế - Đại học Quốc gia Hà Nội',
  'TMU - Đại học Thương mại',
  'FTU2 - Trường Đại học Ngoại thương cơ sở II',
  'UEH - Trường Đại học Kinh tế TP.HCM',
  'HUB - Trường Đại học Ngân hàng TP.HCM',
  'UEL - Trường Đại học Kinh tế - Luật - Đại học Quốc gia TP.HCM',
  'UEF - Trường Đại học Kinh tế - Tài chính TP.HCM',
  'RMIT - Trường Đại học RMIT',
  'Trường khác'
];
```

## Validation Frontend (Recommended)

### Email
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = emailRegex.test(email);
```

### Số điện thoại
```javascript
const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
const isValidPhone = phoneRegex.test(phoneNumber);
```

### URL Facebook
```javascript
const urlRegex = /^https?:\/\/.+/;
const isValidUrl = urlRegex.test(facebookLink);
```

## Logic hiển thị form

```javascript
// Khi user chọn trường
function handleUniversityChange(selectedUniversity) {
  if (selectedUniversity === 'Trường khác') {
    // Hiển thị: otherUniversity input
    // Ẩn: studentId, major, className, yearOfStudy, facebookLink
  } else {
    // Ẩn: otherUniversity input
    // Hiển thị: studentId, major, className, yearOfStudy, facebookLink
  }
}
```

## Example Code (React/Next.js)

```typescript
interface RegistrationForm {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  university: string;
  otherUniversity?: string;
  studentId?: string;
  major?: string;
  className?: string;
  yearOfStudy?: number;
  facebookLink?: string;
}

async function submitRegistration(data: RegistrationForm) {
  try {
    const response = await fetch('http://localhost:3000/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      // Success
      alert(result.message); // "Đăng ký thành công"
      console.log('Đăng ký thành công:', result.data);
    } else {
      // Validation error
      const errors = result.message;
      console.error('Lỗi validation:', errors);
      // Hiển thị errors cho user
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại');
  }
}
```

## Example Code (Vanilla JavaScript)

```javascript
const form = document.getElementById('registrationForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Convert yearOfStudy to number
  if (data.yearOfStudy) {
    data.yearOfStudy = parseInt(data.yearOfStudy);
  }

  try {
    const response = await fetch('http://localhost:3000/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert('Đăng ký thành công!');
      form.reset();
    } else {
      // Hiển thị lỗi
      const errors = result.message;
      if (Array.isArray(errors)) {
        alert(errors.join('\n'));
      } else {
        alert(errors);
      }
    }
  } catch (error) {
    alert('Có lỗi xảy ra, vui lòng thử lại');
  }
});
```

## Response Format

### Success (201)
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "id": "uuid-here",
    "fullName": "...",
    "dateOfBirth": "...",
    "email": "...",
    "phoneNumber": "...",
    "university": "...",
    "createdAt": "2025-09-30T10:30:00.000Z",
    ...
  }
}
```

### Validation Error (400)
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

### Duplicate Error (409)
```json
{
  "statusCode": 409,
  "message": "Email này đã được đăng ký"
}
```

## Error Handling

```javascript
function handleError(response, result) {
  switch (response.status) {
    case 400:
      // Validation errors
      const errors = Array.isArray(result.message) 
        ? result.message 
        : [result.message];
      displayValidationErrors(errors);
      break;
    
    case 409:
      // Duplicate entry
      alert(result.message); // "Email này đã được đăng ký"
      break;
    
    default:
      alert('Có lỗi xảy ra, vui lòng thử lại');
  }
}
```

## Testing

Sử dụng file `test-api-examples.http` để test API với REST Client extension trong VS Code, hoặc dùng Postman/Insomnia.

## Notes

1. Backend đã enable CORS, frontend có thể call API trực tiếp
2. Validation được xử lý tự động bởi backend
3. Email và số điện thoại không được trùng lặp
4. Năm học phải từ 1 đến 6
5. Link Facebook phải là URL hợp lệ (bắt đầu với http:// hoặc https://)
6. Số điện thoại chấp nhận cả format 0XXXXXXXXX và +84XXXXXXXXX