export const UNIVERSITIES = [
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
  'Trường khác',
] as const;

export type UniversityType = typeof UNIVERSITIES[number];