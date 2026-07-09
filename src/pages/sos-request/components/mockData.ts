export interface SosRequestItem {
  id: number;
  code: string;
  title: string;
  requesterName: string;
  requesterPhone: string;
  createdAt: Date;
  locationName: string;
  addressDetail: string;
  severity: string;
  status: string;
  description: string;
  lat: number;
  lng: number;
  floodDepth: string;
  estimatedArea: string;
  impact: string;
  roadType: string;
  source: string;
  device: string;
  weather: string;
  notes: string;
  imageUrls: string[];
  purpose: 'DECLARE_ONLY' | 'REQUEST_SUPPORT';
  isApprovedForMap?: boolean;
}

export const MOCK_REQUESTS: SosRequestItem[] = [
  {
    id: 9901,
    code: 'REQ-2026-0516',
    title: 'Ngập sâu trên đường Nguyễn Hữu Cảnh',
    requesterName: 'Nguyễn Văn A',
    requesterPhone: '0901 234 567',
    createdAt: new Date('2026-05-24T10:30:00'),
    locationName: 'Bình Thạnh, TP. Hồ Chí Minh',
    addressDetail: 'Đường Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
    severity: 'HIGH',
    status: 'PENDING',
    description: 'Ngập sâu khoảng 50-60cm, xe máy không di chuyển được, ô tô di chuyển khó khăn.',
    lat: 10.7961,
    lng: 106.7142,
    floodDepth: '50 - 60 cm',
    estimatedArea: '~ 2.5 ha',
    impact: 'Giao thông',
    roadType: 'Đường chính',
    source: 'Ứng dụng di động',
    device: 'iPhone 14 Pro',
    weather: 'Mưa to',
    notes: 'Không có',
    imageUrls: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1492011221367-f47e3ccd77a0?auto=format&fit=crop&w=500&q=80',
    ],
    purpose: 'REQUEST_SUPPORT',
  },
  {
    id: 9902,
    code: 'REQ-2026-0515',
    title: 'Ngập tại khu vực chợ Thủ Đức',
    requesterName: 'Trần Thị B',
    requesterPhone: '0903 987 654',
    createdAt: new Date('2026-05-24T09:15:00'),
    locationName: 'Thủ Đức, TP. Hồ Chí Minh',
    addressDetail: 'Khu vực chợ Thủ Đức, Linh Tây, Thủ Đức, TP. Hồ Chí Minh',
    severity: 'CRITICAL',
    status: 'DISPATCHED',
    description: 'Nước ngập tràn vào nhà dân xung quanh chợ, nhiều tiểu thương phải dọn đồ chạy ngập.',
    lat: 10.8524,
    lng: 106.7583,
    floodDepth: '70 - 90 cm',
    estimatedArea: '~ 4.0 ha',
    impact: 'Dân cư & Kinh doanh',
    roadType: 'Khu dân cư',
    source: 'Ứng dụng di động',
    device: 'Samsung S23 Ultra',
    weather: 'Mưa rất to',
    notes: 'Cần hỗ trợ bao cát chống ngập',
    imageUrls: [
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=500&q=80',
    ],
    purpose: 'REQUEST_SUPPORT',
  },
  {
    id: 9903,
    code: 'REQ-2026-0514',
    title: 'Ngập trên đường Lê Văn Lương',
    requesterName: 'Lê Văn C',
    requesterPhone: '0988 777 666',
    createdAt: new Date('2026-05-24T08:45:00'),
    locationName: 'Nhà Bè, TP. Hồ Chí Minh',
    addressDetail: 'Cầu Rạch Đỉa, Lê Văn Lương, Phước Kiển, Nhà Bè, TP. Hồ Chí Minh',
    severity: 'MEDIUM',
    status: 'ON_SITE',
    description: 'Ngập do triều cường kết hợp mưa lớn, ngập sâu nửa bánh xe máy.',
    lat: 10.7228,
    lng: 106.7029,
    floodDepth: '30 - 40 cm',
    estimatedArea: '~ 1.8 ha',
    impact: 'Giao thông',
    roadType: 'Đường liên xã',
    source: 'Web Admin',
    device: 'Chrome Browser Desktop',
    weather: 'Mưa vừa, triều cường',
    notes: 'Có chốt gác cảnh báo của dân phòng',
    imageUrls: [
      'https://images.unsplash.com/photo-1492011221367-f47e3ccd77a0?auto=format&fit=crop&w=500&q=80',
    ],
    purpose: 'DECLARE_ONLY',
    isApprovedForMap: false,
  },
  {
    id: 9904,
    code: 'REQ-2026-0513',
    title: 'Nước rút, không còn ngập',
    requesterName: 'Phạm Minh D',
    requesterPhone: '0912 345 678',
    createdAt: new Date('2026-05-24T07:30:00'),
    locationName: 'Quận 7, TP. Hồ Chí Minh',
    addressDetail: 'Đường Trần Xuân Soạn, Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    severity: 'LOW',
    status: 'CANCELLED',
    description: 'Triều cường đã rút hoàn toàn, các phương tiện lưu thông bình thường.',
    lat: 10.7483,
    lng: 106.6967,
    floodDepth: '0 cm',
    estimatedArea: '0 ha',
    impact: 'Không ảnh hưởng',
    roadType: 'Đường bờ kè',
    source: 'Ứng dụng di động',
    device: 'iPhone 13',
    weather: 'Hửng nắng',
    notes: 'Người dân báo tin nước rút',
    imageUrls: [],
    purpose: 'DECLARE_ONLY',
    isApprovedForMap: false,
  },
  {
    id: 9905,
    code: 'REQ-2026-0512',
    title: 'Ngập trước cổng trường học',
    requesterName: 'Hoàng Văn E',
    requesterPhone: '0977 123 456',
    createdAt: new Date('2026-05-24T07:10:00'),
    locationName: 'Gò Vấp, TP. Hồ Chí Minh',
    addressDetail: 'Trường Tiểu học Nguyễn Thượng Hiền, Gò Vấp, TP. Hồ Chí Minh',
    severity: 'HIGH',
    status: 'RESOLVED',
    description: 'Cống thoát nước bị nghẹt rác gây ngập cục bộ trước cổng trường lúc học sinh tan học.',
    lat: 10.8252,
    lng: 106.6802,
    floodDepth: '40 - 50 cm',
    estimatedArea: '~ 0.5 ha',
    impact: 'Dân cư & Trường học',
    roadType: 'Đường nội bộ',
    source: 'Cuộc gọi tổng đài',
    device: 'Landline Phone',
    weather: 'Mưa lớn cục bộ',
    notes: 'Công nhân vệ sinh môi trường đang xử lý rác nghẹt cống',
    imageUrls: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=500&q=80',
    ],
    purpose: 'REQUEST_SUPPORT',
  }
];
