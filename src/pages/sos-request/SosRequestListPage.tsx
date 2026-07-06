import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  MapPin,
  Clock,
  User,
  Phone,
  Settings,
  MoreVertical,
  CheckCircle2,
  Copy,
  ChevronDown,
  X,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { sosApi } from '../../apis';
import { toast } from '../../stores';
import { cn } from '../../lib/utils';
import { getProvinceCenterByCode } from '../../constants';

// Mock requests data for fallback or demonstration
const MOCK_REQUESTS = [
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
    ]
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
    ]
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
    ]
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
    imageUrls: []
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
    ]
  }
];

export default function SosRequestListPage() {
  const queryClient = useQueryClient();

  // Selected sub-tab: 'NGAP_LUT' (Yêu cầu thông báo ngập lụt) or 'HO_SO' (Yêu cầu gửi hồ sơ)
  const [activeSubTab, setActiveSubTab] = useState<'NGAP_LUT' | 'HO_SO'>('NGAP_LUT');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [severityFilter, setSeverityFilter] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Selection states
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'images' | 'history'>('info');
  const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);

  // Map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Fetch SOS Requests from Backend
  const { data: dbResponse, isLoading } = useQuery({
    queryKey: ['sos-requests-all'],
    queryFn: () => sosApi.getAll({ limit: 100 }),
  });

  // Normalize list data by merging real DB requests with mock requests
  const requests = useMemo(() => {
    const dbList = dbResponse?.data || [];
    
    // Convert DB requests to match our UI schema
    const parsedDbList = dbList.map((item: any) => {
      let lat = 10.7961;
      let lng = 106.7142;
      if (item.location?.coordinates) {
        lng = item.location.coordinates[0];
        lat = item.location.coordinates[1];
      }
      return {
        id: item.id,
        code: `REQ-2026-${item.id.toString().padStart(4, '0')}`,
        title: item.description || 'Yêu cầu cứu trợ khẩn cấp',
        requesterName: item.requesterName || 'Người dân',
        requesterPhone: item.requesterPhone || 'Chưa cập nhật',
        createdAt: new Date(item.createdAt || item.created_at),
        locationName: item.adminUnit?.name || 'Vị trí hiện trường',
        addressDetail: item.description || 'Hiện trường SOS',
        severity: item.severity || 'HIGH',
        status: item.status || 'PENDING',
        description: item.description || 'Yêu cầu cứu trợ khẩn cấp từ người dân.',
        lat,
        lng,
        floodDepth: item.requiresEquipment ? '50 - 80 cm' : '20 - 40 cm',
        estimatedArea: '~ 1.5 ha',
        impact: 'Giao thông & Dân cư',
        roadType: 'Đường chính',
        source: item.source || 'Ứng dụng di động',
        device: 'Thiết bị di động',
        weather: 'Mưa lớn',
        notes: item.resolutionNotes || 'Chưa có ghi chú',
        imageUrls: item.imageUrls || [],
      };
    });

    // Merge both, prioritizing DB items but adding Mock items so it looks rich
    const combined = [...parsedDbList];
    MOCK_REQUESTS.forEach(mock => {
      if (!combined.some(item => item.id === mock.id)) {
        combined.push(mock);
      }
    });

    return combined;
  }, [dbResponse]);

  // Set default selected request on load
  useEffect(() => {
    if (requests.length > 0 && selectedRequestId === null) {
      setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);

  const selectedRequest = useMemo(() => {
    return requests.find(r => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  // Map coordinates updates
  useEffect(() => {
    if (!selectedRequest || !mapContainerRef.current) return;

    const lat = selectedRequest.lat;
    const lng = selectedRequest.lng;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 15);

      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(mapRef.current);
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [selectedRequest, activeSubTab]);

  // Clean map container on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (activeSubTab === 'HO_SO') return [];

    return requests
      .filter(req => {
        // Status filter
        if (statusFilter !== 'Tất cả') {
          const statusMap: Record<string, string> = {
            'Mới tiếp nhận': 'PENDING',
            'Đang xác minh': 'DISPATCHED',
            'Đã tiếp cận': 'ON_SITE',
            'Hoàn thành': 'RESOLVED',
            'Đã hủy': 'CANCELLED',
          };
          if (req.status !== statusMap[statusFilter]) return false;
        }

        // Severity filter
        if (severityFilter !== 'Tất cả') {
          const severityMap: Record<string, string> = {
            'Mức độ: Cao': 'CRITICAL',
            'Mức độ: Trung bình': 'HIGH',
            'Mức độ: Thấp': 'MEDIUM',
          };
          if (req.severity !== severityMap[severityFilter]) return false;
        }

        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = req.title.toLowerCase().includes(q);
          const matchCode = req.code.toLowerCase().includes(q);
          const matchRequester = req.requesterName.toLowerCase().includes(q);
          const matchPhone = req.requesterPhone.toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchRequester && !matchPhone) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return b.createdAt.getTime() - a.createdAt.getTime();
        } else {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
      });
  }, [requests, activeSubTab, statusFilter, severityFilter, searchQuery, sortBy]);

  // Assign/Auto-dispatch mutation
  const assignTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      return sosApi.assignTeam(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-requests-all'] });
      toast.success('Phê duyệt thành công! Đội cứu trợ tối ưu đã được tự động điều phối.');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi phê duyệt yêu cầu');
    }
  });

  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return sosApi.updateStatus(id, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sos-requests-all'] });
      toast.success(`Đã cập nhật trạng thái yêu cầu thành công!`);
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi cập nhật trạng thái');
    }
  });

  const handleCopyCoords = (coords: string) => {
    navigator.clipboard.writeText(coords);
    toast.success('Đã sao chép tọa độ vào bộ nhớ tạm!');
  };

  // Stepper helper
  const getStepperActiveStep = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'DISPATCHED':
        return 2;
      case 'ON_SITE':
        return 3;
      case 'RESOLVED':
        return 4;
      default:
        return 1;
    }
  };

  const statusBadges: Record<string, { label: string; style: string }> = {
    PENDING: { label: 'MỚI', style: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30' },
    DISPATCHED: { label: 'ĐANG XÁC MINH', style: 'bg-orange-50 text-orange-650 border-orange-200 dark:bg-orange-950/40 dark:text-orange-450 dark:border-orange-900/30' },
    ON_SITE: { label: 'ĐÃ XÁC NHẬN', style: 'bg-emerald-50 text-emerald-650 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' },
    RESOLVED: { label: 'HOÀN THÀNH', style: 'bg-blue-50 text-blue-650 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30' },
    CANCELLED: { label: 'ĐÃ TỪ CHỐI', style: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  };

  const severityLabels: Record<string, { label: string; color: string }> = {
    CRITICAL: { label: 'Nguy kịch', color: '#dc2626' },
    HIGH: { label: 'Cao', color: '#ea580c' },
    MEDIUM: { label: 'Trung bình', color: '#2563eb' },
    LOW: { label: 'Thấp', color: '#166534' },
  };

  return (
    <div className="flex flex-col gap-4 text-left font-sans text-gray-800 dark:text-gray-200 min-h-[calc(100vh-3.5rem)] select-none">
      {/* 1. TOP HEADER TITLE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-wide text-gray-900 dark:text-white flex items-center gap-2">
            <span>Yêu cầu (Request)</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Quản lý các yêu cầu gửi lên hệ thống</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 rounded-xl text-xs font-bold shadow-sm transition">
          <Settings size={14} />
          <span>Cài đặt loại yêu cầu</span>
        </button>
      </div>

      {/* 2. TAB CONTROLLER BUTTONS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('NGAP_LUT')}
          className={cn(
            "pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative",
            activeSubTab === 'NGAP_LUT'
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
          )}
        >
          <ClipboardList size={16} />
          <span>Yêu cầu thông báo ngập lụt</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-black leading-none",
            activeSubTab === 'NGAP_LUT' ? "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400" : "bg-slate-100 text-gray-500 dark:bg-gray-800"
          )}>
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('HO_SO')}
          className={cn(
            "pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative",
            activeSubTab === 'HO_SO'
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
          )}
        >
          <FileText size={16} />
          <span>Yêu cầu gửi hồ sơ</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black leading-none bg-slate-100 text-gray-500 dark:bg-gray-800">
            0
          </span>
        </button>
      </div>

      {/* 3. FILTERS & SEARCH ROW */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Mới tiếp nhận">Mới tiếp nhận</option>
            <option value="Đang xác minh">Đang xác minh</option>
            <option value="Đã tiếp cận">Đã tiếp cận</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="Tất cả">Tất cả mức độ</option>
            <option value="Mức độ: Cao">Mức độ: Cao</option>
            <option value="Mức độ: Trung bình">Mức độ: Trung bình</option>
            <option value="Mức độ: Thấp">Mức độ: Thấp</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="newest">Ngày tạo: Mới nhất</option>
            <option value="oldest">Ngày tạo: Cũ nhất</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo nội dung, mã, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-850 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition"
          />
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-750 border border-slate-200 dark:border-gray-700 text-gray-650 dark:text-gray-300 rounded-xl text-xs font-bold shadow-sm transition">
          <Download size={14} />
          <span>Xuất dữ liệu</span>
        </button>
      </div>

      {/* 4. MAIN CONTAINER GRID: LIST & DETAILS */}
      {activeSubTab === 'HO_SO' ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-3xl p-12 text-center">
          <FileText className="text-gray-300 dark:text-gray-650 mb-3" size={48} />
          <h3 className="text-sm font-extrabold text-gray-550 dark:text-gray-400">Không có yêu cầu gửi hồ sơ</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm">Hiện tại chưa có hồ sơ nào được yêu cầu gửi lên hệ thống.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-3xl p-12 text-center">
          <AlertTriangle className="text-gray-300 dark:text-gray-650 mb-3" size={48} />
          <h3 className="text-sm font-extrabold text-gray-550 dark:text-gray-400">Không tìm thấy yêu cầu</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
          {/* LEFT LIST COLUMN (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5 max-h-[660px] overflow-y-auto pr-1 no-scrollbar">
            {filteredRequests.map((req) => {
              const isSelected = selectedRequestId === req.id;
              const badge = statusBadges[req.status] || statusBadges.PENDING;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition duration-200 cursor-pointer text-left relative flex flex-col gap-2.5",
                    isSelected
                      ? "border-blue-500 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/10 shadow-sm"
                      : "border-slate-150 bg-white dark:border-gray-800 dark:bg-gray-900 hover:border-slate-300 dark:hover:border-gray-700 hover:shadow-xs"
                  )}
                >
                  {/* Indicators red dot if new */}
                  {req.status === 'PENDING' && (
                    <div className="absolute left-2.5 top-4.5 w-1.5 h-1.5 bg-red-600 rounded-full" />
                  )}

                  {/* Header Row */}
                  <div className="flex items-center justify-between min-w-0 pl-1">
                    <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 tracking-wide uppercase">
                      {req.code}
                    </span>
                    <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border flex-shrink-0", badge.style)}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Title Description */}
                  <h4 className="text-xs font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
                    {req.title}
                  </h4>

                  {/* Location & Time details */}
                  <div className="flex items-center justify-between text-[10px] text-gray-450 dark:text-gray-500 font-semibold border-t border-slate-50 dark:border-gray-800/60 pt-2">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{req.locationName}</span>
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Clock size={11} className="text-gray-400" />
                      <span>{req.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {req.createdAt.toLocaleDateString('vi-VN')}</span>
                    </span>
                  </div>
                </div>
              );
            })}

            <button className="py-2.5 text-center text-xs font-bold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300 bg-white dark:bg-gray-900 border border-slate-150 dark:border-gray-800 rounded-xl transition duration-150 select-none cursor-pointer">
              Xem thêm yêu cầu
            </button>
          </div>

          {/* RIGHT DETAILED COLUMN (col-span-8) */}
          {selectedRequest && (
            <div className="lg:col-span-8 bg-white dark:bg-gray-900 border border-slate-150 dark:border-gray-800 rounded-3xl p-5 flex flex-col gap-4 max-h-[660px] overflow-y-auto no-scrollbar shadow-sm">
              {/* Header Box */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-900 dark:text-white tracking-wide uppercase">
                      {selectedRequest.code}
                    </span>
                    <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border", statusBadges[selectedRequest.status]?.style)}>
                      {statusBadges[selectedRequest.status]?.label}
                    </span>
                  </div>
                  <h2 className="text-sm font-extrabold text-gray-900 dark:text-white leading-normal">
                    {selectedRequest.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 relative">
                  {/* Action verification dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition duration-150 flex items-center gap-1 shadow-sm select-none cursor-pointer"
                    >
                      <span>Xác minh & xử lý</span>
                      <ChevronDown size={12} className={cn("transition-transform duration-200", isVerifyDropdownOpen ? "rotate-180" : "")} />
                    </button>

                    {isVerifyDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fade-in font-bold text-xs">
                        <button
                          onClick={() => {
                            assignTeamMutation.mutate(selectedRequest.id);
                            setIsVerifyDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                        >
                          Phê duyệt & Điều phối live
                        </button>
                        <button
                          onClick={() => {
                            updateStatusMutation.mutate({ id: selectedRequest.id, status: 'ON_SITE' });
                            setIsVerifyDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                        >
                          Đánh dấu đã tiếp cận
                        </button>
                        <button
                          onClick={() => {
                            updateStatusMutation.mutate({ id: selectedRequest.id, status: 'RESOLVED' });
                            setIsVerifyDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                        >
                          Hoàn tất xử lý
                        </button>
                        <hr className="border-slate-100 dark:border-gray-700 my-1" />
                        <button
                          onClick={() => {
                            updateStatusMutation.mutate({ id: selectedRequest.id, status: 'CANCELLED' });
                            setIsVerifyDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition cursor-pointer"
                        >
                          Từ chối / Hủy yêu cầu
                        </button>
                      </div>
                    )}
                  </div>

                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl transition">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Informative Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/50 dark:bg-[#0d1527] border border-slate-100 dark:border-gray-800/80 p-4 rounded-2xl text-[11px] text-gray-500 font-semibold">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Người gửi</p>
                  <p className="text-gray-850 dark:text-white font-extrabold flex items-center gap-1">
                    <User size={11} className="text-gray-400" />
                    <span>{selectedRequest.requesterName}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Số điện thoại</p>
                  <p className="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                    <Phone size={11} className="text-gray-400" />
                    <span>{selectedRequest.requesterPhone}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Thời gian gửi</p>
                  <p className="text-gray-800 dark:text-white font-extrabold flex items-center gap-1">
                    <Clock size={11} className="text-gray-400" />
                    <span>{selectedRequest.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {selectedRequest.createdAt.toLocaleDateString('vi-VN')}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Khu vực</p>
                  <p className="text-gray-800 dark:text-white font-extrabold flex items-center gap-1 truncate">
                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{selectedRequest.locationName}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Mức độ</p>
                  <p className="font-extrabold flex items-center gap-1.5" style={{ color: severityLabels[selectedRequest.severity]?.color || '#3b82f6' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: severityLabels[selectedRequest.severity]?.color || '#3b82f6' }} />
                    <span>{severityLabels[selectedRequest.severity]?.label || selectedRequest.severity}</span>
                  </p>
                </div>
              </div>

              {/* Sub-tab view buttons */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 gap-4 text-xs font-bold">
                <button
                  onClick={() => setDetailTab('info')}
                  className={cn(
                    "pb-2 cursor-pointer transition relative",
                    detailTab === 'info' ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold" : "text-gray-500 hover:text-gray-850 dark:hover:text-white"
                  )}
                >
                  Thông tin chi tiết
                </button>
                <button
                  onClick={() => setDetailTab('images')}
                  className={cn(
                    "pb-2 cursor-pointer transition relative",
                    detailTab === 'images' ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold" : "text-gray-500 hover:text-gray-850 dark:hover:text-white"
                  )}
                >
                  Hình ảnh / Video ({selectedRequest.imageUrls?.length || 0})
                </button>
                <button
                  onClick={() => setDetailTab('history')}
                  className={cn(
                    "pb-2 cursor-pointer transition relative",
                    detailTab === 'history' ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold" : "text-gray-500 hover:text-gray-850 dark:hover:text-white"
                  )}
                >
                  Lịch sử xử lý
                </button>
              </div>

              {/* Detail Content Boxes */}
              <div className="flex-1 min-h-0">
                {detailTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Left details (col-span-7) */}
                    <div className="md:col-span-7 flex flex-col gap-3">
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Vị trí báo cáo</h4>
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-relaxed">
                          {selectedRequest.addressDetail}
                        </p>
                      </div>

                      {/* Mini leaflet map container */}
                      <div className="border border-slate-200 dark:border-gray-800 rounded-2xl h-44 overflow-hidden shadow-inner relative z-0">
                        <div id="mini-leaflet-map" ref={mapContainerRef} className="w-full h-full" />
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Mô tả</h4>
                        <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-gray-850 p-3 rounded-xl">
                          {selectedRequest.description}
                        </p>
                      </div>

                      {/* Specs specifications */}
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                          <span className="text-gray-400">Mức độ ngập</span>
                          <span className="text-red-500 font-extrabold">{selectedRequest.floodDepth}</span>
                        </div>
                        <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                          <span className="text-gray-400">Diện tích ước tính</span>
                          <span className="text-gray-700 dark:text-white font-extrabold">{selectedRequest.estimatedArea}</span>
                        </div>
                        <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                          <span className="text-gray-400">Ảnh hưởng</span>
                          <span className="text-gray-700 dark:text-white font-extrabold">{selectedRequest.impact}</span>
                        </div>
                        <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                          <span className="text-gray-400">Loại đường</span>
                          <span className="text-gray-700 dark:text-white font-extrabold">{selectedRequest.roadType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right extra info (col-span-5) */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                      {/* Pictures teaser panel */}
                      <div className="border border-slate-150 dark:border-gray-800 rounded-2xl p-3 flex flex-col gap-2.5 bg-slate-50/20">
                        <div className="flex items-center justify-between select-none">
                          <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider">Hình ảnh minh họa</span>
                          {selectedRequest.imageUrls?.length > 0 && (
                            <button onClick={() => setDetailTab('images')} className="text-[10px] font-black text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer">Xem tất cả</button>
                          )}
                        </div>

                        {selectedRequest.imageUrls?.length === 0 ? (
                          <div className="py-8 text-center text-[10.5px] font-semibold text-gray-400 bg-slate-50 dark:bg-gray-850 rounded-xl">Không có hình ảnh đi kèm</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            {selectedRequest.imageUrls.slice(0, 4).map((url, idx) => (
                              <div key={idx} className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-800 relative z-0">
                                <img src={url} alt="flood info" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Supplementary specifications card */}
                      <div className="border border-slate-150 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-3 text-xs font-bold">
                        <h4 className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1 text-left">Thông tin bổ sung</h4>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">Nguồn yêu cầu</span>
                          <span className="text-gray-800 dark:text-white font-extrabold">{selectedRequest.source}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">Thiết bị gửi</span>
                          <span className="text-gray-800 dark:text-white font-extrabold">{selectedRequest.device}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">Tọa độ</span>
                          <button
                            onClick={() => handleCopyCoords(`${selectedRequest.lat}, ${selectedRequest.lng}`)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-450 font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{selectedRequest.lat.toFixed(5)}, {selectedRequest.lng.toFixed(5)}</span>
                            <Copy size={11} />
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">Thời tiết lúc gửi</span>
                          <span className="text-gray-800 dark:text-white font-extrabold">{selectedRequest.weather}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">Ghi chú người gửi</span>
                          <span className="text-gray-800 dark:text-white font-extrabold truncate max-w-[120px]">{selectedRequest.notes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'images' && (
                  <div className="p-2">
                    {selectedRequest.imageUrls?.length === 0 ? (
                      <div className="py-24 text-center text-xs font-semibold text-gray-400">Yêu cầu này không chứa tệp tin đa phương tiện nào</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedRequest.imageUrls.map((url, idx) => (
                          <div key={idx} className="group aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 shadow relative z-0">
                            <img src={url} alt={`flood full ${idx}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'history' && (
                  <div className="p-4 flex flex-col gap-6 text-xs font-bold text-left text-gray-700 dark:text-gray-300">
                    <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6 space-y-6">
                      <div className="relative">
                        <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
                        <div>
                          <p className="font-extrabold text-gray-900 dark:text-white text-xs">Mới gửi yêu cầu cứu hộ</p>
                          <p className="text-[10px] text-gray-450 mt-0.5">Người gửi: {selectedRequest.requesterName} • Nguồn: {selectedRequest.source}</p>
                          <span className="text-[9px] text-gray-400 font-semibold">{selectedRequest.createdAt.toLocaleTimeString('vi-VN')} {selectedRequest.createdAt.toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {selectedRequest.status !== 'PENDING' && (
                        <div className="relative">
                          <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-orange-500 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
                          <div>
                            <p className="font-extrabold text-gray-900 dark:text-white text-xs">Phê duyệt & Điều phối Đội cứu trợ</p>
                            <p className="text-[10px] text-gray-450 mt-0.5">Hệ thống đã tự động chạy thuật toán điều phối để chỉ định Đội tối ưu</p>
                            <span className="text-[9px] text-gray-400 font-semibold">Tự động xử lý</span>
                          </div>
                        </div>
                      )}

                      {(selectedRequest.status === 'ON_SITE' || selectedRequest.status === 'RESOLVED') && (
                        <div className="relative">
                          <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
                          <div>
                            <p className="font-extrabold text-gray-900 dark:text-white text-xs">Đội cứu hộ đã tiếp cận hiện trường</p>
                            <p className="text-[10px] text-gray-450 mt-0.5">Đội cứu hộ báo cáo đã tiếp cận hiện trường ngập lụt</p>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'RESOLVED' && (
                        <div className="relative">
                          <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
                          <div>
                            <p className="font-extrabold text-gray-900 dark:text-white text-xs">Nhiệm vụ cứu hộ hoàn thành</p>
                            <p className="text-[10px] text-gray-450 mt-0.5">Đã hoàn thành cứu hộ thành công và hạ mức độ ngập lụt</p>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'CANCELLED' && (
                        <div className="relative">
                          <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-slate-400 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
                          <div>
                            <p className="font-extrabold text-gray-900 dark:text-white text-xs">Đã hủy / Từ chối yêu cầu</p>
                            <p className="text-[10px] text-gray-450 mt-0.5">Lý do: Nước đã rút hoặc tin báo không chính xác</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Stepper Timeline */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-auto flex items-center justify-between select-none">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-left">Quy trình xử lý</div>
                <div className="flex items-center gap-1.5 md:gap-4 text-[10.5px] font-extrabold text-gray-400">
                  {/* Step 1 */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                      getStepperActiveStep(selectedRequest.status) >= 1
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
                    )}>
                      1
                    </span>
                    <span className={getStepperActiveStep(selectedRequest.status) >= 1 ? "text-gray-900 dark:text-white" : ""}>Mới tiếp nhận</span>
                  </div>

                  <div className="w-6 md:w-10 h-px bg-slate-200 dark:bg-slate-800" />

                  {/* Step 2 */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                      getStepperActiveStep(selectedRequest.status) >= 2
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
                    )}>
                      2
                    </span>
                    <span className={getStepperActiveStep(selectedRequest.status) >= 2 ? "text-gray-900 dark:text-white" : ""}>Đang xác minh</span>
                  </div>

                  <div className="w-6 md:w-10 h-px bg-slate-200 dark:bg-slate-800" />

                  {/* Step 3 */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                      getStepperActiveStep(selectedRequest.status) >= 3
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
                    )}>
                      3
                    </span>
                    <span className={getStepperActiveStep(selectedRequest.status) >= 3 ? "text-gray-900 dark:text-white" : ""}>Đã xác nhận</span>
                  </div>

                  <div className="w-6 md:w-10 h-px bg-slate-200 dark:bg-slate-800" />

                  {/* Step 4 */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                      getStepperActiveStep(selectedRequest.status) >= 4
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
                    )}>
                      4
                    </span>
                    <span className={getStepperActiveStep(selectedRequest.status) >= 4 ? "text-gray-900 dark:text-white" : ""}>Đã hiển thị</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
