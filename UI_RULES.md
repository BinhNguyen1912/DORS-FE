# Quy tắc Thiết kế & Phát triển Giao diện (UI/UX Rules)

Tài liệu này ghi chú lại toàn bộ các quy chuẩn thiết kế giao diện (UI) và trải nghiệm người dùng (UX) đã được thiết lập và thống nhất trong hệ thống. Vui lòng tuân thủ các quy tắc này khi chỉnh sửa hoặc phát triển trang mới.

---

## 1. Biểu mẫu & Nhập liệu (Forms & Inputs)

### Trường bắt buộc nhập `(*)`
- Mọi nhãn của trường bắt buộc phải có ký hiệu dấu sao màu đỏ, nằm trong dấu ngoặc đơn và có khoảng cách nhẹ với chữ: `(*)` màu đỏ.
- **Mã nguồn mẫu**:
  ```tsx
  Họ và tên <span className="text-red-500 ml-1">(*)</span>
  ```

### Nút Tạo Mới (Create Buttons)
- Các nút dành cho các hàm tạo mới (thêm mới đối tượng gì đó) sử dụng màu cam (màu cam nhạt/dịu mắt hơn, ví dụ: `bg-amber-500/90` hoặc `bg-amber-500 hover:bg-amber-600/90`).
- Tránh dùng các tông màu cam quá chói.

### Trình tải ảnh đại diện (Avatar Upload Widget)
- Thiết kế hình tròn gọn gàng, không có chữ hướng dẫn rườm rà.
- Chỉ hiển thị Icon tải lên (`Upload`) khi trống, hoặc ảnh đại diện khi đã tải lên.
- **Hiệu ứng hover**: Khi rê chuột vào ảnh đại diện đã tải lên, hiển thị một lớp phủ tối màu mờ (`bg-black/40`) và icon Máy ảnh (`Camera`).
- Giới hạn dung lượng tải lên tối đa là **5MB** và định dạng hình ảnh hợp lệ (PNG, JPG, WEBP...).

---

## 2. Bảng Dữ liệu (Tables)

### Quy chuẩn văn bản & Tiêu đề
- **Tiêu đề cột (Header)**: Phải sử dụng chữ màu đen, in đậm rõ ràng cho tất cả các bảng dữ liệu trên mọi trang.
  - Sử dụng class Tailwind: `text-black font-bold dark:text-white`
- **Nội dung hàng (Cells)**: Phải đưa về màu chữ đen mặc định hoặc xám tối ở chế độ dark mode và sử dụng chữ thường (`font-normal`), không được in đậm tùy tiện.
  - Sử dụng class Tailwind: `text-black dark:text-white font-normal`
- **Tránh vỡ/xuống dòng**: Đối với các cột chứa Huy hiệu/Nhãn (Badge) như Vai trò hay Trạng thái, bắt buộc sử dụng lớp `whitespace-nowrap` để tránh chữ bị xuống dòng làm xấu bố cục.

### Cấu hình ẩn/hiện cột (Column Visibility Settings)
- Tất cả các tệp tin hiển thị bảng dữ liệu (Table) bắt buộc phải gắn nút Cấu hình cột chung `<TableSettings>`.
- Cho phép người dùng tùy chọn ẩn/hiện các cột mong muốn.
- Các lựa chọn cấu hình cột phải được lưu tự động vào `localStorage` theo từng trang riêng biệt (ví dụ: `user_table_columns`, `role_table_columns`,...) để giữ nguyên trạng thái khi người dùng tải lại trang.
- Không cho phép ẩn các cột định danh bắt buộc (như **STT**, **Thao tác**).

### Hiển thị chữ số
- Các con số thông thường trong bảng (như số ID, số thứ tự, các chỉ số phụ không quá quan trọng) **không in đậm**, chỉ để dạng chữ thường (`font-normal`).
- Chỉ in đậm các con số mang tính chất tổng hợp, tổng số liệu quan trọng.

---

## 3. Tiêu đề Trang & Bố cục (Page Titles & Layouts)

### Loại bỏ Tiêu đề danh sách và Breadcrumbs
- Trong các trang danh sách (Page List - ví dụ: danh sách đội cứu hộ, danh sách người dùng...), **bỏ hoàn toàn** phần tiêu đề hiển thị ở đầu trang (ví dụ: "Danh sách đội cứu hộ") cũng như đường dẫn liên kết (breadcrumbs) bên dưới tiêu đề đó.
- Layout trang danh sách sẽ trực tiếp bắt đầu bằng khu vực bộ lọc (Filter Row) và bảng dữ liệu.

---

## 4. Biểu tượng (Icons)

- Tất cả các biểu tượng (Icon) được lấy từ thư viện **FontAwesome** (đã được liên kết trong file HTML chính của hệ thống).
- **Quy tắc sử dụng**:
  - Không được tự ý thêm icon vào giao diện. Nếu cần phải dùng icon thì chỉ được sử dụng các biểu tượng đã được ghi nhận và thống nhất trong thiết kế hiện tại.
- **Thiết kế Icon**:
  - Không sử dụng background (nền) có màu cho các icon. Chỉ hiển thị icon đơn giản và trực quan.
  - Màu sắc của icon sử dụng màu cơ bản/mặc định (màu nhẹ nhàng, tạm chấp nhận được từ Tailwind hoặc CSS cơ bản).

---

## 5. Trang chi tiết & Hộp thoại (Details & Modals)

### Hiển thị thông tin
- Phần thông tin Enum/Dữ liệu khi hiển thị chi tiết (ví dụ: Giới tính, Trạng thái, Chức vụ...) **không in đậm** giá trị hiển thị, giữ font chữ thường (`font-normal`) để bố cục trang nhã, dễ quét thông tin.
- Toàn bộ chữ hiển thị trên modal/detail pane mặc định sử dụng màu đen (`text-black`).

---

## 6. Gợi ý Địa chỉ Thông minh (Address Autocomplete Suggestions)

Mọi trường nhập địa chỉ chi tiết (như số nhà, tên đường) cần sử dụng cơ chế gợi ý tự động qua Nominatim OpenStreetMap API với các nguyên tắc:
- **Thời gian trễ (Debounce)**: Trì hoãn gửi request **600ms** sau khi người dùng ngừng gõ để tránh vượt quá giới hạn lượt gọi (Rate-limit) của API.
- **Ràng buộc địa lý theo Tỉnh**:
  - Phải gọi API lấy tọa độ trung tâm (Center Lat/Lng) của Tỉnh/Thành phố đang được chọn.
  - Thiết lập vùng bao (`viewbox`) với bán kính khoảng 80km xung quanh tâm của Tỉnh đó kết hợp tham số `bounded=1` để ép buộc kết quả trả về **chỉ nằm trong tỉnh thành đang chọn** (Ví dụ: Đã chọn TP. HCM thì gõ tên đường trùng lặp sẽ không bao giờ ra kết quả ở Nha Trang hay Hà Nội).
- **Làm sạch từ khóa tìm kiếm**: Loại bỏ các tiền tố hành chính phổ biến tiếng Việt như "Thành phố ", "Tỉnh ", "Phường ", "Xã " trước khi gửi lên API để tối ưu kết quả tìm kiếm của OpenStreetMap.

---

## 7. Cấu trúc Thư mục & Tách biệt File (Folder Structure & File Separation)

- **Nguyên tắc phân rã Component**:
  - Không dồn tất cả code giao diện, logic xử lý, form thêm mới (create/add form), form chỉnh sửa (update/edit form), hay bảng dữ liệu (table/list) vào chung một file tổng duy nhất của Page.
  - Tách biệt từng cấu phần giao diện của một Feature/Page ra thành các component con riêng biệt. Ví dụ:
    - Component danh sách/bảng: `UserTable.tsx`, `RescueTeamTable.tsx`
    - Component tạo mới: `AddUserModal.tsx`, `CreateRescueTeamModal.tsx`
    - Component chỉnh sửa: `EditUserModal.tsx`, `UpdateRescueTeamModal.tsx`
  - Các component con này sẽ được import và lắp ghép lại trong file tổng của trang (ví dụ: `UserListPage.tsx`, `RescueTeamDetailPage.tsx`) để tạo ra một cấu trúc gọn gàng, dễ đọc và dễ bảo trì.
