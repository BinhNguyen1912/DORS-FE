import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Vui lòng nhập Số điện thoại hoặc Email đăng nhập.'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên.'),
});

export type LoginForm = z.infer<typeof loginSchema>;
