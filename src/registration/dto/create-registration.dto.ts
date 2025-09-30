import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  Matches,
  ValidateIf,
  IsIn,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { UNIVERSITIES } from '../constants/universities.constant';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  @IsNotEmpty({ message: 'Ngày sinh không được để trống' })
  dateOfBirth: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam)',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn trường học' })
  @IsIn(UNIVERSITIES, { message: 'Trường học không hợp lệ' })
  university: string;

  // Nếu chọn "Trường khác", cần điền tên trường
  @ValidateIf((o) => o.university === 'Trường khác')
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng điền tên trường của bạn' })
  otherUniversity?: string;

  // Các trường bắt buộc nếu KHÔNG chọn "Trường khác"
  @ValidateIf((o) => o.university !== 'Trường khác')
  @IsString()
  @IsNotEmpty({ message: 'Mã sinh viên không được để trống' })
  studentId?: string;

  @ValidateIf((o) => o.university !== 'Trường khác')
  @IsString()
  @IsNotEmpty({ message: 'Ngành học không được để trống' })
  major?: string;

  @ValidateIf((o) => o.university !== 'Trường khác')
  @IsString()
  @IsNotEmpty({ message: 'Lớp học phần không được để trống' })
  className?: string;

  @ValidateIf((o) => o.university !== 'Trường khác')
  @IsInt({ message: 'Năm học phải là số nguyên' })
  @Min(1, { message: 'Năm học phải từ 1 đến 6' })
  @Max(6, { message: 'Năm học phải từ 1 đến 6' })
  @IsNotEmpty({ message: 'Năm học không được để trống' })
  yearOfStudy?: number;

  @ValidateIf((o) => o.university !== 'Trường khác')
  @IsUrl({}, { message: 'Link Facebook không hợp lệ' })
  @IsNotEmpty({ message: 'Link Facebook không được để trống' })
  facebookLink?: string;
}