# TỔNG HỢP TRẠNG THÁI API BACKEND CHO FRONTEND RENDER (CỨU HỘ)

Tài liệu này đối chiếu trực tiếp các Controller hiện tại của Backend (`RescueTeamController`, `RescueTeamMemberController`, `TeamSpecializationController`) với các chức năng hiển thị trên giao diện Đội Cứu Hộ để phân loại rõ: **Các API đã có sẵn (cần kết nối)** và **Các API còn thiếu (BE cần bổ sung)**.

---

## PHẦN A. CÁC API ĐÃ CÓ SẴN TRÊN BACKEND (FE CẦN KẾT NỐI / TÍCH HỢP)

Backend đã cài đặt các nhóm API cốt lõi dưới đây. Frontend cần chuyển đổi từ mock data sang gọi thực tế.

### 1. Nhóm API Quản lý Đội Cứu Hộ (Rescue Teams)
*Quản lý danh sách, chi tiết, thêm, sửa, xóa đội cứu hộ.*
* **Controller:** `RescueTeamController` (Base route: `/rescue-teams`)
* **Danh sách API:**
  1. **Tạo đội cứu hộ mới:**
     * `POST /rescue-teams`
     * DTO: `CreateRescueTeamValidationDto`
  2. **Lấy danh sách đội cứu hộ (phân trang + bộ lọc):**
     * `GET /rescue-teams`
     * Query Params: `page`, `limit`, và các trường lọc của `QueryRescueTeamValidationDto` (ví dụ: `provinceId`, `status`, `teamType`).
  3. **Lấy chi tiết một đội cứu hộ:**
     * `GET /rescue-teams/:teamId`
  4. **Cập nhật thông tin đội cứu hộ:**
     * `PATCH /rescue-teams/:teamId`
     * DTO: `UpdateRescueTeamValidationDto`
  5. **Cập nhật tọa độ vị trí đội cứu hộ (real-time GPS):**
     * `PATCH /rescue-teams/:teamId/location`
     * DTO: `UpdateRescueTeamLocationValidationDto` (chứa lat/lng)
  6. **Xóa đội cứu hộ:**
     * `DELETE /rescue-teams/:teamId`

---

### 2. Nhóm API Quản lý Thành viên Đội Cứu Hộ (Team Members)
*Hiển thị danh sách thành viên tại Tab "Thành viên" trong trang Chi tiết đội.*
* **Controller:** `RescueTeamMemberController` (Base route: `/teams/:teamId/members`)
* **Danh sách API:**
  1. **Thêm thành viên vào đội cứu hộ:**
     * `POST /teams/:teamId/members`
     * DTO: `AddMemberValidationDto`
  2. **Lấy danh sách thành viên trong đội:**
     * `GET /teams/:teamId/members`
     * Query: `isActive` (boolean, optional) - Lọc thành viên đang hoạt động hoặc ngoại tuyến.
  3. **Thay đổi chức vụ/vai trò của thành viên trong đội (Trưởng đội, Phó đội, v.v.):**
     * `PATCH /teams/:teamId/members/:memberId/role`
     * DTO: `UpdateMemberRoleValidationDto`
  4. **Xóa/Loại thành viên khỏi đội cứu hộ:**
     * `DELETE /teams/:teamId/members/:memberId`
  5. **Thành viên tự rời khỏi đội:**
     * `POST /teams/leave` (Sử dụng token để xác định User)

---

### 3. Nhóm API Quản lý Chuyên môn Đội Cứu Hộ (Team Specializations)
*Để hiển thị danh sách các chuyên môn khi tạo/sửa đội cứu hộ.*
* **Controller:** `TeamSpecializationController` (Base route: `/team-specializations`)
* **Danh sách API:**
  1. **Lấy danh sách chuyên môn (Specializations):**
     * `GET /team-specializations`
     * Query: `teamType`, `isActive`
  2. **Lấy chi tiết chuyên môn:**
     * `GET /team-specializations/:id`
  3. **Tạo chuyên môn mới:**
     * `POST /team-specializations`
  4. **Cập nhật chuyên môn:**
     * `PATCH /team-specializations/:id`
  5. **Xóa chuyên môn:**
     * `DELETE /team-specializations/:id`

---

## PHẦN B. CÁC API CÒN THIẾU TỪ BACKEND (FE ĐANG MOCK VÀ CẦN BE BỔ SUNG)

Các nhóm thông tin dưới đây hoàn toàn chưa có Controller hay Service xử lý trên Backend. Backend cần xây dựng mới các endpoint này.

### 1. API Quản lý Thiết bị & Phương tiện của Đội (Rescue Equipments)
*Tab "Thiết bị" hiển thị danh sách công cụ/phương tiện của từng đội (Ví dụ: Xe cứu thương, Thuyền phao, Máy phát điện, Máy cắt thủy lực, v.v.)*
* **Endpoint đề xuất:**
  * **Lấy danh sách thiết bị:** `GET /teams/:teamId/equipments`
  * **Cập nhật trạng thái/số lượng thiết bị:** `PUT /teams/:teamId/equipments/:equipmentId`
* **Response mẫu (Lấy danh sách):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Thuyền phao cứu hộ",
        "quantity": 3,
        "status": "GOOD" | "MAINTENANCE" | "BROKEN",
        "description": "Thuyền cao su gắn động cơ đầu nổ"
      }
    ]
  }
  ```

---

### 2. API Phân tích Hiệu suất & Thống kê Hoạt động (Analytics & Stats)
*Hiện tại các con số trên Dashboard và Tab "Hiệu suất" của Đội đều là mock.*
* **Endpoint đề xuất:**
  1. **Thống kê hiệu suất chi tiết của một Đội cứu hộ (Tab Hiệu suất):**
     * `GET /rescue-teams/:teamId/performance-stats`
     * **Response mẫu:**
       ```json
       {
         "success": true,
         "data": {
           "efficiencyRate": 85, // % Hiệu suất hoạt động
           "totalMissions": 156, // Tổng số nhiệm vụ đã nhận
           "completedMissions": 132, // Nhiệm vụ hoàn thành
           "rescuedCount": 248, // Số người cứu sống thành công
           "activeHours": 1248 // Số giờ hoạt động tích lũy
         }
       }
       ```
  2. **Thống kê tổng quan hoạt động hệ thống (Cho Rescue Dashboard):**
     * `GET /rescue-teams/dashboard-summary`
     * **Response mẫu:**
       ```json
       {
         "success": true,
         "data": {
           "totalTeams": 24,
           "activeTeams": 18,
           "onDutyTeams": 6,
           "readyTeams": 12,
           "totalRescued": 1056, // Tổng số người đã cứu sống trên hệ thống
           "totalEquipmentCount": 342, // Tổng số trang thiết bị hỗ trợ
           "totalActiveHours": 2856 // Tổng số giờ hoạt động
         }
       }
       ```

---

### 3. API Quản lý Phân ca trực (Shifts / Schedule)
*Giao diện Tab "Ca trực" trong trang chi tiết Đội Cứu Hộ đang hiển thị lịch trực giả lập.*
* **Endpoint đề xuất:**
  * **Lấy lịch trực của đội:** `GET /teams/:teamId/shifts`
  * **Query Params:** `startDate`, `endDate`
* **Response mẫu:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "shiftName": "Ca sáng",
        "startTime": "06:00:00",
        "endTime": "14:00:00",
        "date": "2026-06-15",
        "assignedMembers": [
          { "userId": 15, "fullName": "Trần Văn Hoàng" },
          { "userId": 18, "fullName": "Nguyễn Văn A" }
        ]
      }
    ]
  }
  ```

---

### 4. Yêu cầu Bổ sung thông tin các Schema hiện tại (Schema Updates)
Để Frontend render đầy đủ giao diện thiết kế, Backend cần mở rộng các trường dữ liệu trả về của các API hiện có:

1. **API lấy chi tiết đội cứu hộ (`GET /rescue-teams/:teamId`):**
   * Cần bổ sung các trường sau vào Entity/DTO trả về:
     * `email`: string (Email liên lạc của đội)
     * `foundingDate`: string/Date (Ngày thành lập đội)
     * `baseLocationAddress`: string (Địa chỉ văn phòng/trụ sở dạng text đọc được, ví dụ: *15 Lê Duẩn, Hải Châu, Đà Nẵng*)
     * `coverageAreaSize`: number (Diện tích phạm vi quản lý tính theo km²)

2. **API lấy vị trí real-time của đội cứu hộ:**
   * Cần đảm bảo tọa độ lat/lng từ `currentLocation` của đội cứu hộ được lấy đúng và trả về để hiển thị các Đội trực quan lên bản đồ tương tác ở trang Rescue Dashboard.
