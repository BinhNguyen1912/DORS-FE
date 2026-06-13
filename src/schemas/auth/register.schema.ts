import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên là bắt buộc (tối thiểu 2 ký tự).'),
  phone: z.string()
    .min(10, 'Số điện thoại phải từ 10 số.')
    .max(11, 'Số điện thoại không hợp lệ.')
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại Việt Nam không hợp lệ.'),
  provinceId: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành Phố.'),
  adminUnitId: z.string().optional(),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên.'),
  confirmPassword: z.string(),
  isVolunteer: z.boolean(),
  needsHelp: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không khớp.',
  path: ['confirmPassword'],
});

export type RegisterForm = z.infer<typeof registerSchema>;
