# Hướng dẫn Tích hợp Frontend (FE) - Hệ thống Tự động Điều phối (Auto-Dispatch v6)

Tài liệu này hướng dẫn cách tích hợp các tính năng giao diện, kết nối WebSocket và cập nhật API cho thuật toán tự động điều phối (Auto-Dispatch v6), bao gồm điều phối kép (Dual Dispatch), hàng đợi chuyên môn và các trạng thái điều phối mới.

---

## 1. Cập nhật API SOS (`fe/src/apis/sos.api.ts`)

Chúng ta tạo mới file `fe/src/apis/sos.api.ts` để gom tất cả các endpoint quản lý SOS (trước đây nằm rải rác).

### Các API Endpoint cần hỗ trợ:
1. **Tạo yêu cầu SOS**:
   - `POST /api/v1/sos-requests`
   - Payload: Thêm trường `requiresEquipment?: boolean` (mặc định: `false`).
2. **Điều phối đội cứu hộ (Auto / Manual)**:
   - `PATCH /api/v1/sos-requests/:id/assign`
   - Payload: `{ teamId?: number }`. Nếu `teamId` trống hoặc `null` -> Tự động kích hoạt thuật toán Auto-Dispatch v6.
3. **Hủy yêu cầu cứu hộ**:
   - `DELETE /api/v1/sos-requests/:id`
   - Payload: `{ reason: string }`
4. **Lấy danh sách SOS / SOS lân cận**:
   - `GET /api/v1/sos-requests`
   - `GET /api/v1/sos-requests/nearby?lat=...&lng=...&radius=...`

---

## 2. Tích hợp WebSocket (`/dispatch` namespace)

Các sự kiện WebSocket cập nhật real-time từ gateway `/dispatch` cần được FE xử lý:

1. **`sos:status-updated`**:
   - Nhận thông tin khi một SOS được cập nhật trạng thái hoặc gán đội cứu hộ.
   - Payload có thể chứa thông tin điều phối:
     ```json
     {
       "sosId": 12,
       "status": "DISPATCHED", // Hoặc PENDING_SPECIALIST, ON_SITE, RESOLVED, CANCELLED
       "assignedTeamId": 3,   // Đội chính được gán
       "distanceMeters": 3500.5,
       "specialistPending": false,
       "specialistType": "PCCC" // Nếu đang đợi đội chuyên môn
     }
     ```
2. **`sos:no-team-available`**:
   - Nhận thông báo khi không tìm thấy đội cứu hộ nào khả dụng trong khu vực quét.
   - Hiển thị Toast cảnh báo đỏ: *"CẢNH BÁO: SOS-xxxx không tìm thấy đội cứu hộ khả dụng!"* và đề xuất điều phối thủ công.

---

## 3. Cập nhật Giao diện người dùng (UI)

### 3.1. Form Tạo yêu cầu SOS
- Thêm một checkbox: **"Yêu cầu thiết bị chuyên dụng"** (`requiresEquipment`).
- Trạng thái này sẽ kích hoạt cơ chế Dual Dispatch (điều phối song song 1 đội phản ứng nhanh và 1 đội chuyên môn) ở phía backend.

### 3.2. Hiển thị Badge trạng thái SOS
Hỗ trợ các màu sắc và trạng thái mới:
- **`PENDING`**: `Đang chờ xử lý` (Màu vàng/cam nhạt).
- **`PENDING_SPECIALIST`**: `Chờ đội chuyên môn` (Màu tím nhạt - Đội sơ cấp đang di chuyển hoặc đã tiếp cận, đang chờ đội chuyên môn xếp hàng).
- **`DISPATCHED`**: `Đang di chuyển` (Màu xanh dương).
- **`ON_SITE`**: `Đã tiếp cận` (Màu xanh lá cây nhạt).
- **`RESOLVED`**: `Đã xử lý xong` (Màu xám/xanh lá cây đậm).

### 3.3. Trực quan hóa Dual Dispatch trên Bản đồ và Chi tiết SOS
Khi một SOS có trạng thái Dual Dispatch (được gán đội chính và có đội chuyên môn xếp hàng):
- Hiển thị thông tin đội chính (Primary Team) đang di chuyển.
- Hiển thị badge: **`Hàng đợi Chuyên môn: [Tên đội chuyên môn]`** hoặc **`Chờ Đội Chuyên môn`** trên panel chi tiết của SOS đó.
- Vẽ đường chỉ đường (polyline) hoặc Marker biểu diễn cả 2 đội cứu hộ liên quan trên bản đồ GIS nếu có tọa độ.
