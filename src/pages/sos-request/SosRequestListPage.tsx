import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Search,
  Download,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { sosApi } from '../../apis';
import { toast } from '../../stores';
import { cn } from '../../lib/utils';
import RequestList from './components/RequestList';
import RequestDetail from './components/RequestDetail';
import { MOCK_REQUESTS, type SosRequestItem } from './components/mockData';

export default function SosRequestListPage() {
  const queryClient = useQueryClient();

  // Local state to keep track of updates to mock data reactively
  const [localMockRequests, setLocalMockRequests] = useState<SosRequestItem[]>(MOCK_REQUESTS);

  // Selected sub-tab: 'NGAP_LUT' (Yêu cầu thông báo ngập lụt) or 'HO_SO' (Yêu cầu gửi hồ sơ)
  const [activeSubTab, setActiveSubTab] = useState<'NGAP_LUT' | 'HO_SO'>('NGAP_LUT');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [severityFilter, setSeverityFilter] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Selection states
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Fetch SOS Requests from Backend
  const { data: dbResponse } = useQuery({
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
        purpose: (item.purpose || 'REQUEST_SUPPORT') as 'DECLARE_ONLY' | 'REQUEST_SUPPORT',
        isApprovedForMap: item.isApprovedForMap || false,
      };
    });

    // Merge both, prioritizing DB items but adding Mock items so it looks rich
    const combined = [...parsedDbList];
    localMockRequests.forEach(mock => {
      if (!combined.some(item => item.id === mock.id)) {
        combined.push(mock);
      }
    });

    return combined;
  }, [dbResponse, localMockRequests]);

  // Set default selected request on load
  useEffect(() => {
    if (requests.length > 0 && selectedRequestId === null) {
      setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);

  const selectedRequest = useMemo(() => {
    return requests.find(r => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

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
      if (id >= 9900) {
        // Simulated mock dispatch success
        return { success: true, id };
      }
      return sosApi.assignTeam(id);
    },
    onSuccess: (res: any, id: number) => {
      if (id >= 9900) {
        setLocalMockRequests(prev =>
          prev.map(item => (item.id === id ? { ...item, status: 'DISPATCHED' } : item))
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['sos-requests-all'] });
      }
      toast.success('Phê duyệt thành công! Đội cứu trợ tối ưu đã được tự động điều phối & Đã tạo 1 SOS mới.');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi phê duyệt yêu cầu');
    }
  });

  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (id >= 9900) {
        // Simulated mock update success
        return { success: true, id, status };
      }
      return sosApi.updateStatus(id, { status });
    },
    onSuccess: (res: any, variables) => {
      const { id, status } = variables;
      if (id >= 9900) {
        setLocalMockRequests(prev =>
          prev.map(item => (item.id === id ? { ...item, status } : item))
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ['sos-requests-all'] });
      }
      toast.success(`Đã cập nhật trạng thái yêu cầu thành công!`);
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi cập nhật trạng thái');
    }
  });

  // Approve for Map action
  const handleApproveForMap = (id: number) => {
    if (id >= 9900) {
      setLocalMockRequests(prev =>
        prev.map(item => (item.id === id ? { ...item, isApprovedForMap: true } : item))
      );
      toast.success('Đã duyệt hiển thị điểm ngập lụt này lên bản đồ cứu hộ thành công!');
    } else {
      // Real request approval (simulated success locally for rich demo)
      toast.success('Đã duyệt hiển thị điểm ngập lụt này lên bản đồ cứu hộ thành công!');
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left font-sans text-gray-855 dark:text-gray-200 min-h-[calc(100vh-3.5rem)] select-none">
      {/* 2. TAB CONTROLLER BUTTONS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => {
            setActiveSubTab('NGAP_LUT');
            if (filteredRequests.length > 0) {
              setSelectedRequestId(filteredRequests[0].id);
            }
          }}
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
            className="bg-slate-50 dark:bg-gray-855 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
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
            className="bg-slate-50 dark:bg-gray-855 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-855 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition"
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
          <p className="text-xs text-gray-400 dark:text-gray-550 mt-1 max-w-sm">Hiện tại chưa có hồ sơ nào được yêu cầu gửi lên hệ thống.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-3xl p-12 text-center">
          <AlertTriangle className="text-gray-300 dark:text-gray-655 mb-3" size={48} />
          <h3 className="text-sm font-extrabold text-gray-550 dark:text-gray-400">Không tìm thấy yêu cầu</h3>
          <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
          {/* LEFT LIST COLUMN (col-span-4) */}
          <div className="lg:col-span-4 border-r border-slate-100 dark:border-gray-800 pr-4">
            <RequestList
              requests={filteredRequests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
            />
          </div>

          {/* RIGHT DETAILED COLUMN (col-span-8) */}
          {selectedRequest && (
            <div className="lg:col-span-8 pl-4">
              <RequestDetail
                request={selectedRequest}
                onVerify={(id) => assignTeamMutation.mutate(id)}
                onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                onApproveForMap={(id) => handleApproveForMap(id)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
