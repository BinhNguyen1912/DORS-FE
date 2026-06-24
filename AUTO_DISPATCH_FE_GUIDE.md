# Tài liệu hướng dẫn tích hợp Frontend (FE): Yêu cầu SOS & Thuật toán Tự động Điều phối (Auto-Dispatch)

Tài liệu này dành cho Frontend Agent/Developer để triển khai giao diện người dùng, tích hợp các API tương tác, bản đồ GIS, hệ tọa độ và cấu hình cài đặt hệ thống cho chức năng SOS và tự động điều phối cứu hộ.

---

## 1. Bản đồ GIS & Định vị Tọa độ (Map & Geolocation)

### 1.1 Hệ tọa độ lưu trữ (PostGIS SRID 4326)
Hệ thống sử dụng hệ tọa độ chuẩn GPS toàn cầu **WGS 84 (SRID 4326)**. Khi lưu trữ hoặc gửi lên API, tọa độ có định dạng mảng GeoJSON Point: `[longitude, latitude]` (Kinh độ trước, Vĩ độ sau).
*   **Ví dụ**: `[106.7004, 10.7589]` (Kinh độ: 106.7004, Vĩ độ: 10.7589).

### 1.2 Lấy vị trí GPS hiện tại của thiết bị (Web/Mobile Browser)
Sử dụng **HTML5 Geolocation API** của trình duyệt. 
> ⚠️ **Bắt buộc**: Phải chạy giao thức bảo mật **HTTPS** (trừ môi trường `localhost`) thì trình duyệt mới cho phép xin quyền truy cập vị trí.

**Mã nguồn FE mẫu:**
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    // Điền tọa độ này vào form SOS hoặc định vị Marker trên Leaflet Map
    console.log("Tọa độ hiện tại:", lng, lat);
  },
  (error) => {
    console.error("Lỗi định vị:", error.message);
  },
  { enableHighAccuracy: true, timeout: 10000 }
);
```

### 1.3 Địa mã hóa (Geocoding): Chuyển Text địa chỉ thành Kinh/Vĩ độ
Nếu người dùng gõ text tìm kiếm địa chỉ (ví dụ: *"Phường Bến Nghé, Quận 1"*), FE có thể thực hiện gọi trực tiếp API công cộng OpenStreetMap Nominatim để lấy tọa độ Lng/Lat trước khi gửi API tạo SOS.
*   **Method**: `GET`
*   **URL**: `https://nominatim.openstreetmap.org/search?format=json&q={address_query}&limit=1`
*   **Headers**: Phải truyền `'User-Agent': 'RescueSystem/1.0'`
*   **Kết quả trả về**:
    ```json
    [
      {
        "lat": "10.7589...",
        "lon": "106.7004...",
        "display_name": "..."
      }
    ]
    ```
    *(FE sẽ lấy `parseFloat(lat)` và `parseFloat(lon)`).*

---

## 2. Các API Endpoint Phía Backend

### 2.1 API Tạo Yêu cầu SOS (Gửi SOS)
Dùng cho người dân (có thể là khách vãng lai chưa đăng nhập hoặc tài khoản công dân đã đăng nhập).
*   **Endpoint**: `POST /api/v1/sos-requests`
*   **Headers**: `Content-Type: application/json` (Nếu đã đăng nhập, đính kèm `Authorization: Bearer <token>`)
*   **Request Body (JSON)**:
    ```json
    {
      "requesterName": "Nguyễn Văn A", // Bắt buộc nếu là Khách vãng lai
      "requesterPhone": "0917234567", // Bắt buộc nếu là Khách vãng lai (phải là SĐT VN)
      "requestType": "FLOOD", // Enum: FLOOD, FIRE_FIGHTING, TRAFFIC_ACCIDENT, MEDICAL_EMERGENCY, NATURAL_DISASTER, OTHER
      "latitude": 10.7589, // Số thực (Vĩ độ)
      "longitude": 106.7004, // Số thực (Kinh độ)
      "description": "Nước ngập cao đến ngực, nhà có người già cần di dời",
      "severity": "HIGH", // Enum: CRITICAL, HIGH, MEDIUM, LOW
      "provinceId": 1, // ID Tỉnh quản lý (lấy từ dữ liệu hành chính)
      "adminUnitId": 12, // ID Xã/Phường quản lý
      "trappedPeopleCount": 3, // Số người bị kẹt
      "specialNeedsTags": ["ELDERLY"], // Array string: ELDERLY (người già), CHILD (trẻ em), PREGNANT (bà bầu), DISABLED (khuyết tật)
      "imageUrls": [
        "https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/general/171889-img.jpg"
      ] // Bắt buộc ít nhất 1 ảnh thực tế đối với Khách vãng lai
    }
    ```

---

### 2.2 API Điều phối Đội cứu hộ (Dispatch Team)
Dùng cho điều phối viên (Admin/Coordinator) trên Web Admin.
*   **Endpoint**: `PATCH /api/v1/sos-requests/:id/assign`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Body (JSON)**:
    *   **Trường hợp 1: Phân công THỦ CÔNG (Manual)**: Truyền rõ ID của đội.
        ```json
        {
          "teamId": 22
        }
        ```
    *   **Trường hợp 2: Kích hoạt TỰ ĐỘNG (Auto-dispatch)**: Để trống hoặc truyền null. Backend sẽ tự động chạy thuật toán quét mở rộng bán kính và chọn đội tối ưu nhất.
        ```json
        {}
        ```

### 2.3 API Hủy Yêu cầu SOS (Self-cancellation)
Dùng cho người dân (Citizen) hoặc khách vãng lai để tự hủy yêu cầu cứu hộ của mình.
*   **Endpoint**: `DELETE /api/v1/sos-requests/:id`
*   **Headers**: `Content-Type: application/json` (nếu đã đăng nhập, đính kèm `Authorization: Bearer <token>`)
*   **Request Body (JSON)**:
    ```json
    {
      "reason": "Gia đình đã tự di chuyển đến nơi an toàn bằng thuyền cá nhân."
    }
    ```

### 2.4 API Tìm kiếm SOS Lân cận (Nearby SOS)
Dùng cho đội cứu hộ hoặc Admin để quét các yêu cầu SOS xung quanh vị trí chỉ định.
*   **Endpoint**: `GET /api/v1/sos-requests/nearby`
*   **Headers**: `Authorization: Bearer <token>`
*   **Query Parameters**:
    *   `lat`: Vĩ độ (số thực, bắt buộc)
    *   `lng`: Kinh độ (số thực, bắt buộc)
    *   `radius`: Bán kính quét (đơn vị km, mặc định `5` nếu không truyền)
    *   `status`: Trạng thái SOS cần tìm (mặc định là `PENDING` nếu không truyền, xem danh sách enum trạng thái)

---

## 3. Quản lý & Cấu hình Thuật toán trên Web Admin Settings
Admin có thể tùy chỉnh các tham số của thuật toán Auto-dispatch từ màn hình cài đặt hệ thống. FE cần hiển thị biểu mẫu để chỉnh sửa các cấu hình này thông qua API Cài đặt hệ thống.

*   **API Cập nhật Cài đặt**: `PATCH /api/v1/system-settings`
    *   **Headers**: `Authorization: Bearer <token>`
    *   **Request Body (JSON)**: Một đối tượng dạng phẳng (flat Key-Value) chứa các thiết lập muốn cập nhật:
        ```json
        {
          "dispatch.radius_steps": "5000,10000,20000,40000,50000",
          "dispatch.weight_distance": "0.5"
        }
        ```
*   **API Lấy danh sách Cài đặt**: `GET /api/v1/system-settings`
    *   **Headers**: `Authorization: Bearer <token>`
    *   **Kết quả trả về**: Object Key-Value toàn bộ cấu hình hiện tại trong DB.

### 3.1 Các Key-Value cấu hình thuật toán cần quản lý:

| Key thiết lập | Kiểu dữ liệu | Ý nghĩa & Mô tả hiển thị trên UI | Giá trị mặc định |
| :--- | :--- | :--- | :--- |
| **`dispatch.radius_steps`** | Chuỗi (ngăn cách bằng dấu phẩy) | **Bán kính các vòng quét (mét)**. Ví dụ muốn quét 4 vòng: 5km, 10km, 20km, 50km thì nhập: `5000,10000,20000,50000`. | `5000,10000,20000,40000,50000` |
| **`dispatch.weight_distance`** | Số thực (`0.0` -> `1.0`) | **Trọng số khoảng cách**. Trọng số càng cao càng ưu tiên đội ở cực gần. | `0.5` |
| **`dispatch.weight_active_cases`** | Số thực (`0.0` -> `1.0`) | **Trọng số khối lượng công việc**. Trọng số càng cao càng tránh điều các đội đang bận xử lý nhiều ca khác. | `0.3` |
| **`dispatch.weight_skill_mismatch`** | Số thực (`0.0` -> `1.0`) | **Trọng số lệch chuyên môn**. Trọng số càng cao càng phạt nặng các đội không đúng chuyên ngành. | `0.2` |
| **`dispatch.skill_mapping`** | Chuỗi JSON | **Ánh xạ chuyên môn**. Xác định loại SOS nào thì loại đội cứu hộ nào phù hợp đáp ứng. | Xem mẫu JSON bên dưới |

> [!NOTE]
> Tổng 3 trọng số (`weight_distance` + `weight_active_cases` + `weight_skill_mismatch`) nên bằng **`1.0`** để điểm phạt chuẩn hóa được tính toán chính xác nhất.

#### Cấu trúc mặc định của `dispatch.skill_mapping` (JSON):
```json
{
  "FLOOD": ["DAN_PHONG", "QUAN_SU", "TONG_HOP"],
  "FIRE_FIGHTING": ["PCCC", "TONG_HOP"],
  "TRAFFIC_ACCIDENT": ["Y_TE", "PCCC", "TONG_HOP"],
  "MEDICAL_EMERGENCY": ["Y_TE", "TONG_HOP"],
  "NATURAL_DISASTER": ["QUAN_SU", "TONG_HOP"],
  "OTHER": ["DAN_PHONG", "PCCC", "QUAN_SU", "TINH_NGUYEN", "Y_TE", "TONG_HOP"]
}
```
*(FE hiển thị giao diện cấu hình dạng Checkbox/Select để Admin chọn loại đội phù hợp cho từng loại thiên tai, sau đó chuyển thành string JSON này để gửi về lưu).*

### 3.2 API Quản lý Danh mục (System Setting Categories)
Hỗ trợ quản lý động các danh mục như Loại đội cứu hộ (`team_type`), Loại sự cố cứu hộ (`sos_type` / `request_type`), ...
*   **Lấy danh mục theo loại**: `GET /api/v1/system-settings/categories/:type`
*   **Thêm mới danh mục**: `POST /api/v1/system-settings/categories`
    *   **Headers**: `Authorization: Bearer <token>`
    *   **Request Body (JSON)**:
        ```json
        {
          "type": "team_type",
          "code": "TINH_NGUYEN",
          "name": "Đội tình nguyện viên"
        }
        ```
*   **Xóa danh mục**: `DELETE /api/v1/system-settings/categories/:code`
    *   **Headers**: `Authorization: Bearer <token>`

---

## 4. Tích hợp WebSocket Real-time (Real-time WebSockets)
Hệ thống sử dụng các WebSocket Gateway (Socket.io) để đồng bộ hóa trạng thái cứu hộ tức thời và bắn thông báo khẩn cấp.

### 4.1 Namespace `/dispatch` (Dành cho Điều phối & Đội Cứu Hộ)
*   **URL kết nối**: `ws://<backend-domain>/dispatch`
*   **Tham số truy vấn kết nối (Handshake Query)**:
    *   Đối với Admin: Bắt buộc truyền `provinceId` và `role`.
        *   *Ví dụ*: `ws://localhost:3000/dispatch?provinceId=1&role=admin`
        *   *Hành vi backend*: Tự động cho socket tham gia vào room `province:<provinceId>` để nhận thông tin sự cố của tỉnh đó.
*   **Quy trình kết nối của Đội cứu hộ (Rescue Team)**:
    1.  Kết nối thông thường đến `ws://localhost:3000/dispatch`.
    2.  Gửi event (emit) `join:team` kèm theo body `{ "teamId": <teamId> }` để join vào room quản lý nhiệm vụ riêng của đội.
    3.  Backend sẽ phản hồi lại event `joined` kèm thông tin `{ "room": "team:<teamId>" }`.

#### Các sự kiện Client lắng nghe (Server -> Client):
*   **`sos:created`**: Nhận thông tin yêu cầu SOS mới vừa được tạo trong tỉnh.
    *   *Payload*: Object chi tiết SOS request.
*   **`sos:status-updated`**: Cập nhật trạng thái xử lý SOS và đội cứu hộ được điều phối.
    *   *Payload*:
        ```json
        {
          "sosId": 12,
          "status": "DISPATCHED",
          "assignedTeamId": 3,
          "distanceMeters": 3500.5
        }
        ```
*   **`sos:no-team-available`**: Cảnh báo khi hệ thống chạy auto-dispatch nhưng không tìm thấy đội cứu hộ rảnh/phù hợp nào trong toàn bộ các bán kính quét.
    *   *Payload*:
        ```json
        {
          "sosId": 12,
          "message": "Không tìm được đội cứu hộ phù hợp — cần điều phối thủ công"
        }
        ```
*   **`sos:assigned`**: Sự kiện gửi riêng cho Đội Cứu Hộ được phân công.
    *   *Payload*:
        ```json
        {
          "sosId": 12,
          "location": {
            "type": "Point",
            "coordinates": [106.7004, 10.7589]
          },
          "severity": "HIGH",
          "requestType": "FLOOD",
          "description": "Nước ngập cao đến ngực, nhà có người già cần di dời"
        }
        ```
*   **`sos:reassigned`**: Sự kiện gửi riêng cho Đội Cứu Hộ khi bị hủy/đổi phân công sang ca khác.

#### Các sự kiện Client gửi đi (Client -> Server):
*   **`join:team`**: Đăng ký nhận sự kiện riêng của đội.
    *   *Payload*: `{ "teamId": number }`
*   **`team:update-location`**: Đội cứu hộ liên tục cập nhật tọa độ GPS thời gian thực (định kỳ 10-30s khi di chuyển).
    *   *Payload*:
        ```json
        {
          "teamId": 3,
          "longitude": 106.7008,
          "latitude": 10.7592
        }
        ```

### 4.2 Namespace `/notification` (Dành cho Thông báo Người dùng / Citizen)
*   **URL kết nối**: `ws://<backend-domain>/notification`
*   **Tham số truy vấn kết nối (Handshake Query)**:
    *   Bắt buộc truyền `userId` và `device`.
        *   *Ví dụ*: `ws://localhost:3000/notification?userId=123&device=web`
        *   *Hành vi backend*: Tự động cho socket tham gia vào room `user:<userId>` và ghi nhận trạng thái **Online** của người dùng trên hệ thống thông qua Redis Presence. Khi ngắt kết nối, backend tự động chuyển trạng thái thành **Offline** sau khi tất cả các connection của user đóng.

#### Các sự kiện Client lắng nghe (Server -> Client):
*   **`notification:push`**: Nhận các thông báo đẩy thời gian thực từ hệ thống (khi SOS thay đổi trạng thái, tin khẩn cấp,...).
    *   *Payload*:
        ```json
        {
          "title": "Cứu hộ đã được phân công",
          "body": "Đội cứu hộ số 3 đang di chuyển đến vị trí của bạn.",
          "type": "sos_alert",
          "data": {
            "referenceId": "12"
          }
        }
        ```
*   **`notification:badge`**: Nhận số lượng thông báo chưa đọc mới để hiển thị Badge đếm trên app.
    *   *Payload*: `{ "badge": number }`

#### Các sự kiện Client gửi đi (Client -> Server):
*   **`notification:mark-read`**: Đánh dấu một thông báo đã đọc.
    *   *Payload*: `{ "notificationId": number }`
