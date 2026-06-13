# Vietnam Rescue System — Frontend Project Rules

Ràng buộc và tiêu chuẩn lập trình dành cho hệ thống Front-End (Vite + React + TypeScript + Tailwind CSS). 

---

## 📁 Cấu trúc Thư mục và Tổ chức Schema

### Quy định chung về Validation Schema
Tất cả các schema xác thực biểu mẫu bằng **Zod** KHÔNG được định nghĩa nội bộ (inline) bên trong component của trang/form. Chúng phải được tách biệt hoàn toàn vào thư mục `src/schemas/` theo từng mô-đun chức năng.

### Cấu trúc Thư mục mẫu:
```text
src/
└── schemas/
    ├── auth/
    │   ├── login.schema.ts      # Định nghĩa loginSchema & type LoginForm
    │   ├── register.schema.ts   # Định nghĩa registerSchema & type RegisterForm
    │   └── index.ts             # Export tất cả schema thuộc module auth
    └── index.ts                 # Export tất cả module schemas trong hệ thống
```

### Cách triển khai một Schema mới:
1. Tạo tệp schema mới dưới dạng `<name>.schema.ts` bên trong thư mục mô-đun tương ứng.
2. Định nghĩa schema bằng Zod, export schema và kiểu dữ liệu được suy diễn (Zod Infer).
   ```typescript
   import { z } from 'zod';

   export const registerSchema = z.object({ ... });
   export type RegisterForm = z.infer<typeof registerSchema>;
   ```
3. Export qua mô-đun `index.ts` và root `schemas/index.ts`.
4. Import trực tiếp vào component:
   ```typescript
   import { registerSchema, type RegisterForm } from '../../schemas';
   ```

---

## 🎨 Thiết kế Giao diện (Design & Aesthetic Guidelines)

### 1. Phong cách Kính mờ (Glassmorphism / Frosted-Glass)
*   Sử dụng hình nền sống động chất lượng cao phù hợp chủ đề (ví dụ: cứu trợ thiên tai `/auth-bg.png`).
*   Lớp phủ nền tối mờ (`bg-black/40 backdrop-blur-[1.5px]`) để bảo đảm độ tương phản.
*   Bảng biểu mẫu dạng thẻ kính mờ nằm giữa màn hình:
    *   Nền mờ: `bg-black/40` hoặc `bg-slate-900/35` kết hợp `backdrop-blur-md` hoặc `backdrop-blur-lg`.
    *   Viền mỏng: `border border-white/20`.
    *   Góc bo lớn: `rounded-3xl` hoặc `rounded-[32px]`.
    *   Bóng đổ mềm: `shadow-2xl`.

### 2. Định dạng Trường Nhập liệu (Input Fields)
*   **Không sử dụng Floating Labels** cho phong cách thiết kế kính mờ tối giản. Sử dụng placeholder rõ nghĩa trong ô nhập liệu (ví dụ: "Số Điện Thoại").
*   Độ tương phản cao: chữ màu trắng (`text-white`), placeholder màu trắng mờ (`placeholder:text-white/60`).
*   Biểu tượng bên trái: Luôn đặt biểu tượng tương ứng (nhập họ tên dùng `User`, SĐT dùng `Phone`, mật khẩu dùng `Lock`, tỉnh thành dùng `MapPin`) căn lề trái tuyệt đối bên trong ô nhập liệu.
*   Focus state: Đổi màu viền và có hiệu ứng phát sáng nhẹ (`focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`).

---

## 🔌 Liên kết & Ràng buộc Dữ liệu Backend

### 1. Dropdown Tỉnh/Thành Phố
*   Tỉnh thành phải được tải động từ API `GET /locations/provinces`.
*   Phải có lớp dữ liệu dự phòng (fallback) dạng mảng tĩnh các tỉnh thành lớn của Việt Nam để tránh lỗi giao diện trống nếu API hoặc DB bị lỗi/chưa seed.
*   Hiển thị trạng thái tải (`isLoadingProvinces ? 'Đang tải...' : 'Tỉnh/Thành Phố'`) trực quan.

### 2. Ràng buộc trường ẩn khi đăng ký
*   Nếu giao diện đăng ký không có trường nhập liệu cho các cột bắt buộc của Backend (như CCCD/`nationalId`, ngày sinh/`dateOfBirth`, giới tính/`gender`), Client phải tự sinh dữ liệu hợp lệ:
    *   `nationalId`: Sinh số ngẫu nhiên 12 chữ số (`Math.floor(100000000000 + Math.random() * 900000000000).toString()`) để tránh trùng khóa chính.
    *   `dateOfBirth`: Mặc định chuỗi ngày ISO `2000-01-01T00:00:00.000Z`.
    *   `gender`: Mặc định giá trị `'OTHER'`.
