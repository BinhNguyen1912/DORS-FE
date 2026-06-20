# Quy định phát triển giao diện (Frontend Development Guidelines)

Tài liệu này chứa các quy tắc thiết kế giao diện hệ thống Dashboard & Bản đồ cứu hộ thiên tai nhằm duy trì tính nhất quán, hiệu năng cao và trải nghiệm người dùng cao cấp.

---

## 1. Font chữ (Typography)

Dự án sử dụng bộ font stack tối ưu cao về hiệu năng và độ rõ nét cho các dữ liệu số/bản đồ:

- **Font chính (Primary Font)**: **Inter** (được import trực tiếp từ Google Fonts).
- **Hệ thống Font Fallback**:
  - `SF Pro` (`-apple-system, BlinkMacSystemFont` trên macOS / iOS)
  - `Segoe UI` (trên Windows)
  - `Roboto` (trên Android)
  - `Helvetica`, `Arial`, `sans-serif` (dự phòng tối thiểu)

### Cấu hình CSS (`src/index.css`)
```css
@theme {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
```

---

## 2. Icon hệ thống (Icons Library)

Tất cả các icon trong hệ thống **bắt buộc** phải sử dụng bộ thư viện **Font Awesome v6**. 

### Quy định sử dụng:
1. **Không** import và sử dụng thư viện `lucide-react` để tránh phình to kích thước bundle và gây bất đồng bộ giao diện.
2. Nhúng stylesheet Font Awesome CDN trực tiếp trong file [index.html](file:///d:/DoAn/DOAN/fe/index.html).
3. Sử dụng các thẻ `<i>` của Font Awesome:
   - **Ví dụ**: `<i className="fa-solid fa-map-pin"></i>` thay cho `<MapPin />`.
   - **Chỉnh cỡ**: Dùng thuộc tính CSS `font-size` hoặc Tailwind CSS (ví dụ: `text-[14px]`).

---

## 3. Quy chuẩn Bo góc (Corner Rounding)

Để giao diện cân đối, đáng tin cậy và chuyên nghiệp cho một dashboard cứu hộ, hạn chế bo góc quá đà:
- Tránh sử dụng các góc bo quá lớn như `rounded-2xl` hay `rounded-xl` đối với các thành phần phụ trong form, input hay button nhỏ.
- Sử dụng tiêu chuẩn bo góc gọn gàng: **`rounded-lg`** hoặc **`rounded-md`**.
