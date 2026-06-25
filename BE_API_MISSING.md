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

### 1. API Quản lý Thiết bị & Phương tiện của Đội (Rescue Equipments) - **[ĐÃ HOÀN THÀNH / DONE]**
*Tab "Thiết bị" hiển thị danh sách công cụ/phương tiện của từng đội (Ví dụ: Xe cứu thương, Thuyền phao, Máy phát điện, Máy cắt thủy lực, v.v.)*
* **Các Endpoint thực tế đã triển khai:**
  * **Lấy danh sách thiết bị:** `GET /teams/:teamId/equipments`
  * **Thêm thiết bị mới:** `POST /teams/:teamId/equipments` (DTO validation: `name`, `quantity`, `status`, `description`)
  * **Cập nhật thiết bị (tên, trạng thái, số lượng, mô tả):** `PUT /teams/:teamId/equipments/:equipmentId`
  * **Xóa thiết bị:** `DELETE /teams/:teamId/equipments/:equipmentId`
* **Response mẫu (Lấy danh sách):**
  ```json
  [
    {
      "id": 1,
      "teamId": 2,
      "name": "Thuyền phao cứu hộ",
      "quantity": 3,
      "status": "GOOD",
      "description": "Thuyền cao su gắn động cơ đầu nổ",
      "createdAt": "2026-06-24T07:15:00.000Z",
      "updatedAt": "2026-06-24T07:15:00.000Z"
    }
  ]
  ```

---

### 2. API Phân tích Hiệu suất & Thống kê Hoạt động (Analytics & Stats) - CHƯA CẦN LÀM
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

### 3. API Quản lý Phân ca trực (Shifts / Schedule) - CHƯA CẦN LÀM
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

### 4. Yêu cầu Bổ sung thông tin các Schema hiện tại (Schema Updates) - **[ĐÃ HOÀN THÀNH / DONE]**
Để Frontend render đầy đủ giao diện thiết kế, Backend đã mở rộng các trường dữ liệu trả về và bổ sung các Endpoint:

1. **API lấy chi tiết đội cứu hộ (`GET /rescue-teams/:teamId`) & Cập nhật (`PATCH /rescue-teams/:teamId`):** - **[XONG]**
   * Đã bổ sung các trường sau vào Entity/DTO trả về và cho phép cập nhật:
     * `email`: string (Email liên lạc của đội)
     * `foundingDate`: string/Date (Ngày thành lập đội)
     * `baseLocationAddress`: string (Địa chỉ văn phòng/trụ sở dạng text)
     * `coverageAreaSize`: number (Diện tích phạm vi quản lý)

2. **API lấy vị trí real-time của đội cứu hộ:** - **[XONG]**
   * Tọa độ `currentLocation` của đội cứu hộ dạng GeoJSON `{ type: "Point", coordinates: [lng, lat] }` đã được trả về đầy đủ qua các API lấy danh sách/chi tiết.

3. **API lấy chi tiết yêu cầu SOS (`GET /sos-requests/:id`):** - **[XONG]**
   * Đã mở rộng `SosRequestController` để hỗ trợ Endpoint `GET /sos-requests/:id` và trả về đầy đủ các thực thể quan hệ (`relations: ['province', 'adminUnit', 'user', 'assignedTeam']`).

4. **API lấy lịch sử xử lý (timeline) của yêu cầu SOS (`GET /sos-requests/:id/timeline`):** - **[XONG - ĐÃ NÂNG CẤP]**
   * Endpoint tự động ưu tiên đọc từ bảng `sos_status_history` (mới). Nếu SOS cũ chưa có, fallback sang `audit_log`.
   * **Response mẫu (mới — đầy đủ hơn):**
     ```json
     [
       {
         "id": 1,
         "time": "2026-06-24T06:32:00.000Z",
         "title": "SOS được tạo",
         "desc": "Khách gửi yêu cầu khẩn cấp qua cổng web.",
         "eventType": "CREATED",
         "fromStatus": null,
         "toStatus": "PENDING",
         "teamId": null,
         "teamName": null,
         "changedById": null,
         "changedByName": null,
         "dispatchMethod": null
       },
       {
         "id": 2,
         "time": "2026-06-24T06:34:00.000Z",
         "title": "Đã tiếp nhận & phân công",
         "desc": "Tự động phân công đội cứu hộ #5.",
         "eventType": "TEAM_ASSIGNED",
         "fromStatus": "PENDING",
         "toStatus": "DISPATCHED",
         "teamId": 5,
         "teamName": "Đội PCCC Quận Hải Châu",
         "changedById": 12,
         "changedByName": "Nguyễn Điều Phối",
         "dispatchMethod": "AUTO"
       }
     ]
     ```
   * **Giá trị `eventType` có thể nhận:**

     | eventType | Ý nghĩa |
     |---|---|
     | `CREATED` | SOS vừa được tạo |
     | `STATUS_CHANGED` | Thay đổi trạng thái (ON_SITE, DISPATCHED...) |
     | `TEAM_ASSIGNED` | Gán đội cứu hộ lần đầu |
     | `TEAM_REASSIGNED` | Chuyển sang đội khác |
     | `TEAM_RELEASED` | Giải phóng đội |
     | `RESOLVED` | Hoàn thành nhiệm vụ |
     | `CANCELLED` | Hủy yêu cầu |
     | `QUEUED` | Xếp hàng chờ đội |
     | `SPECIALIST_PENDING` | Chờ đội chuyên môn |

5. **API lấy lịch sử trạng thái SOS (`GET /sos-requests/:id/history`):** - **[MỚI / ĐÃ XONG]**
   * Alias của `GET /sos-requests/:id/timeline` — cùng response format.
   * **Bảng `sos_status_history` (mới tạo)** ghi nhận **tất cả** sự kiện thay đổi trạng thái và phân công đội, kể cả:
     - Auto-dispatch (Orchestrator tự động gán)
     - Manual dispatch (điều phối viên gán tay)
     - Reassign (chuyển đội)
     - Queued / Specialist pending
     - Handoff (đội hoàn thành ca và nhận ca tiếp theo từ queue)
   * Endpoint yêu cầu Bearer token và permission `SOS_READ`.

---

## PHẦN C. TỔNG HỢP NHANH — TẤT CẢ API HIỆN ĐÃ SẴN SÀNG CHO FE

> Dùng bảng dưới làm checklist khi build UI mới.

| # | Endpoint | Method | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 1 | `/rescue-teams` | GET | ✅ Sẵn sàng | Pagination + filter |
| 2 | `/rescue-teams` | POST | ✅ Sẵn sàng | Tạo đội mới |
| 3 | `/rescue-teams/:id` | GET | ✅ Sẵn sàng | Chi tiết đội (có email, foundingDate, baseLocationAddress...) |
| 4 | `/rescue-teams/:id` | PATCH | ✅ Sẵn sàng | Cập nhật đội |
| 5 | `/rescue-teams/:id` | DELETE | ✅ Sẵn sàng | Xóa đội |
| 6 | `/rescue-teams/:id/location` | PATCH | ✅ Sẵn sàng | Cập nhật GPS |
| 7 | `/teams/:id/members` | GET | ✅ Sẵn sàng | Danh sách thành viên |
| 8 | `/teams/:id/members` | POST | ✅ Sẵn sàng | Thêm thành viên |
| 9 | `/teams/:id/members/:mid/role` | PATCH | ✅ Sẵn sàng | Đổi vai trò |
| 10 | `/teams/:id/members/:mid` | DELETE | ✅ Sẵn sàng | Xóa thành viên |
| 11 | `/teams/leave` | POST | ✅ Sẵn sàng | Tự rời đội |
| 12 | `/team-specializations` | GET | ✅ Sẵn sàng | Danh sách chuyên môn |
| 13 | `/team-specializations/:id` | GET/POST/PATCH/DELETE | ✅ Sẵn sàng | CRUD chuyên môn |
| 14 | `/teams/:id/equipments` | GET | ✅ Sẵn sàng | Danh sách thiết bị |
| 15 | `/teams/:id/equipments` | POST | ✅ Sẵn sàng | Thêm thiết bị |
| 16 | `/teams/:id/equipments/:eid` | PUT | ✅ Sẵn sàng | Cập nhật thiết bị |
| 17 | `/teams/:id/equipments/:eid` | DELETE | ✅ Sẵn sàng | Xóa thiết bị |
| 18 | `/sos-requests` | GET | ✅ Sẵn sàng | Danh sách SOS (paginate + filter) |
| 19 | `/sos-requests` | POST | ✅ Sẵn sàng | Gửi SOS (public) |
| 20 | `/sos-requests/:id` | GET | ✅ Sẵn sàng | Chi tiết SOS (full relations) |
| 21 | `/sos-requests/:id/status` | PATCH | ✅ Sẵn sàng | Cập nhật trạng thái |
| 22 | `/sos-requests/:id/assign` | PATCH | ✅ Sẵn sàng | Phân công / auto-dispatch đội |
| 23 | `/sos-requests/:id` | DELETE | ✅ Sẵn sàng | Hủy SOS (public) |
| 24 | `/sos-requests/:id/timeline` | GET | ✅ Sẵn sàng | **Timeline đầy đủ** (sos_status_history + fallback) |
| 25 | `/sos-requests/:id/history` | GET | ✅ Sẵn sàng | Alias của timeline |
| 26 | `/sos-requests/nearby` | GET | ✅ Sẵn sàng | Tìm SOS lân cận (lat/lng/radius) |
| 27 | `/rescue-teams/performance-stats` | GET | ⏳ Chưa làm | Chưa cần |
| 28 | `/rescue-teams/dashboard-summary` | GET | ⏳ Chưa làm | Chưa cần |
| 29 | `/teams/:id/shifts` | GET | ⏳ Chưa làm | Chưa cần |


