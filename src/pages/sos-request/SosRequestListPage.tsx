import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Download,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from '../../stores';
import { cn } from '../../lib/utils';
import RequestList from './components/RequestList';
import RequestDetail from './components/RequestDetail';
import { floodRequestApi, sosApi } from '../../apis';
import { useSocket } from '../../providers/SocketProvider';
import { DISPATCH_EVENTS } from '../../constants/websocket.constant';
import type { SosRequestItem } from './components/mockData';

export default function SosRequestListPage() {
  const queryClient = useQueryClient();
  const { dispatchSocket } = useSocket();
  const location = useLocation();

  // Selected sub-tab: 'SOS_KHAN_CAP' | 'NGAP_LUT' | 'HO_SO'
  const [activeSubTab, setActiveSubTab] = useState<'SOS_KHAN_CAP' | 'NGAP_LUT' | 'HO_SO'>('SOS_KHAN_CAP');

  // Query SOS Requests
  const {
    data: sosResponse,
    isLoading: isLoadingSos,
    isError: isSosError,
    error: sosError,
    refetch: refetchSos,
  } = useQuery({
    queryKey: ['sosRequests'],
    queryFn: () => sosApi.getAll({ limit: 100 }),
    retry: 1,
    staleTime: 30_000,
  });

  // Query Flood/Support Requests
  const {
    data: rawResponse,
    isLoading: isLoadingRequests,
    isError: isFloodError,
    error: floodError,
    refetch: refetchFlood,
  } = useQuery({
    queryKey: ['floodRequests'],
    queryFn: () => floodRequestApi.getAll({ limit: 100 }),
    retry: 1,
    staleTime: 30_000,
  });

  const isLoading = activeSubTab === 'SOS_KHAN_CAP' ? isLoadingSos : isLoadingRequests;
  const isError = activeSubTab === 'SOS_KHAN_CAP' ? isSosError : isFloodError;
  const error = activeSubTab === 'SOS_KHAN_CAP' ? sosError : floodError;
  const refetch = activeSubTab === 'SOS_KHAN_CAP' ? refetchSos : refetchFlood;

  const requests = useMemo<SosRequestItem[]>(() => {
    if (activeSubTab === 'SOS_KHAN_CAP') {
      const items = sosResponse?.data || [];
      return items.map((item: any) => ({
        id: item.id,
        code: `SOS-2026-${String(item.id).padStart(4, '0')}`,
        title: `Cứu hộ khẩn cấp: ${
          item.requestType === 'FLOOD'
            ? 'Ngập lụt'
            : item.requestType === 'MEDICAL'
            ? 'Y tế khẩn cấp'
            : item.requestType === 'FOOD'
            ? 'Tiếp tế lương thực'
            : item.requestType
        }`,
        requesterName: item.requesterName || 'Người dân ẩn danh',
        requesterPhone: item.requesterPhone || 'Không có',
        createdAt: new Date(item.createdAt),
        locationName: item.description || 'Hiện trường SOS',
        addressDetail: item.description || 'Hiện trường SOS',
        severity: item.severity,
        status: item.status,
        description: item.description || '',
        lat: item.latitude || item.location?.coordinates?.[1] || 10.7989,
        lng: item.longitude || item.location?.coordinates?.[0] || 106.6804,
        floodDepth: '0 cm',
        estimatedArea: '0 ha',
        impact: 'Nguy hiểm',
        roadType: 'Không rõ',
        source:
          item.source === 'APP'
            ? 'Ứng dụng di động'
            : item.source === 'WEB'
            ? 'Cổng thông tin Web'
            : item.source || 'Không rõ',
        device: 'Không rõ',
        weather: 'Không rõ',
        notes: item.resolutionNotes || '',
        imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [],
        purpose: 'REQUEST_SUPPORT',
        isApprovedForMap: true,
      }));
    }

    const items = rawResponse?.data || [];
    return items.map((item: any) => ({
      id: item.id,
      code: `REQ-2026-${String(item.id).padStart(4, '0')}`,
      title: item.title,
      requesterName: item.requesterName,
      requesterPhone: item.requesterPhone,
      createdAt: new Date(item.createdAt),
      locationName: item.locationName || '',
      addressDetail: item.addressDetail || '',
      severity: item.severity,
      status: item.status,
      description: item.description || '',
      lat: item.lat || 10.7989,
      lng: item.lng || 106.6804,
      floodDepth:
        item.floodDepthCmMin !== null && item.floodDepthCmMin !== undefined
          ? item.floodDepthCmMax
            ? `${item.floodDepthCmMin} - ${item.floodDepthCmMax} cm`
            : `${item.floodDepthCmMin} cm`
          : '0 cm',
      estimatedArea:
        item.estimatedAreaHa !== null && item.estimatedAreaHa !== undefined
          ? `~ ${item.estimatedAreaHa} ha`
          : '0 ha',
      impact: item.impact || 'Không rõ',
      roadType: item.roadType || 'Không rõ',
      source:
        item.source === 'APP'
          ? 'Ứng dụng di động'
          : item.source === 'WEB'
          ? 'Cổng thông tin Web'
          : item.source,
      device: item.deviceInfo || 'Không rõ',
      weather: item.weather || 'Không rõ',
      notes: item.notes || '',
      imageUrls: item.imageUrls || [],
      purpose: item.purpose,
      isApprovedForMap: item.isApprovedForMap,
    }));
  }, [rawResponse, sosResponse, activeSubTab]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [severityFilter, setSeverityFilter] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Filter dropdown open state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Selection state
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Show error in console so it's visible during development
  useEffect(() => {
    if (isError) {
      console.error('[SosRequestListPage] Lỗi tải danh sách yêu cầu:', error);
      toast.error('Không thể tải danh sách yêu cầu — kiểm tra token/kết nối backend.');
    }
  }, [isError, error]);

  // Socket: auto-refetch khi có flood request hoặc SOS mới / cập nhật
  useEffect(() => {
    if (!dispatchSocket) return;

    const handleNewFloodRequest = (req: any) => {
      console.log('📡 [WS] flood-request:created ->', req);
      queryClient.invalidateQueries({ queryKey: ['floodRequests'] });
      toast.info(`🚨 Yêu cầu ngập lụt mới: ${req?.title || 'Không rõ tiêu đề'}`);
    };

    const handleFloodRequestUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['floodRequests'] });
    };

    const handleNewSos = (req: any) => {
      console.log('📡 [WS] sos:created ->', req);
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
      toast.info(`🚨 Yêu cầu SOS mới: ${req?.requestType || 'Không rõ'}`);
    };

    const handleSosUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
    };

    dispatchSocket.on(DISPATCH_EVENTS.FLOOD_REQUEST_CREATED, handleNewFloodRequest);
    dispatchSocket.on(DISPATCH_EVENTS.FLOOD_REQUEST_UPDATED, handleFloodRequestUpdated);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_CREATED, handleNewSos);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleSosUpdated);

    return () => {
      dispatchSocket.off(DISPATCH_EVENTS.FLOOD_REQUEST_CREATED, handleNewFloodRequest);
      dispatchSocket.off(DISPATCH_EVENTS.FLOOD_REQUEST_UPDATED, handleFloodRequestUpdated);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_CREATED, handleNewSos);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleSosUpdated);
    };
  }, [dispatchSocket, queryClient]);

  // Listen to redirect state from navigation
  useEffect(() => {
    if (location.state?.selectedSosId) {
      setActiveSubTab('SOS_KHAN_CAP');
      setSelectedRequestId(location.state.selectedSosId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Reset selected request ID when tab changes
  useEffect(() => {
    if (!location.state?.selectedSosId) {
      setSelectedRequestId(null);
    }
  }, [activeSubTab, location.state]);

  // Set default selected request on load
  useEffect(() => {
    if (requests.length > 0 && selectedRequestId === null) {
      setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);

  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  // Count active filters (excluding search & sort)
  const activeFilterCount = [
    statusFilter !== 'Tất cả',
    severityFilter !== 'Tất cả',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length;

  const hasActiveFilter = activeFilterCount > 0 || searchQuery.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('Tất cả');
    setSeverityFilter('Tất cả');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setFilterOpen(false);
  };

  // Filter + sort
  const filteredRequests = useMemo(() => {
    if (activeSubTab === 'HO_SO') return [];

    return requests
      .filter((req) => {
        // Status
        if (statusFilter !== 'Tất cả') {
          if (activeSubTab === 'SOS_KHAN_CAP') {
            const statusMap: Record<string, string> = {
              'Chờ điều phối': 'PENDING',
              'Chờ đội chuyên môn': 'PENDING_SPECIALIST',
              'Đang cứu hộ': 'DISPATCHED',
              'Đã tiếp cận': 'ON_SITE',
              'Hoàn thành': 'RESOLVED',
              'Đã hủy': 'CANCELLED',
            };
            if (req.status !== statusMap[statusFilter]) return false;
          } else {
            const statusMap: Record<string, string> = {
              'Mới tiếp nhận': 'PENDING',
              'Đang xác minh': 'VERIFYING',
              'Đã duyệt': 'APPROVED',
              'Đã điều phối': 'DISPATCHED',
              'Đã tiếp cận': 'ON_SITE',
              'Hoàn thành': 'RESOLVED',
              'Đã từ chối': 'REJECTED',
              'Đã hủy': 'CANCELLED',
            };
            if (req.status !== statusMap[statusFilter]) return false;
          }
        }

        // Severity
        if (severityFilter !== 'Tất cả') {
          const severityMap: Record<string, string> = {
            'Mức độ: Nguy kịch': 'CRITICAL',
            'Mức độ: Cao': 'HIGH',
            'Mức độ: Trung bình': 'MEDIUM',
            'Mức độ: Thấp': 'LOW',
          };
          if (req.severity !== severityMap[severityFilter]) return false;
        }

        // Date range
        if (dateFrom !== '') {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (req.createdAt < from) return false;
        }
        if (dateTo !== '') {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (req.createdAt > to) return false;
        }

        // Search
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const match =
            req.title.toLowerCase().includes(q) ||
            req.code.toLowerCase().includes(q) ||
            req.requesterName.toLowerCase().includes(q) ||
            req.requesterPhone.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) =>
        sortBy === 'newest'
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime()
      );
  }, [requests, activeSubTab, statusFilter, severityFilter, searchQuery, sortBy, dateFrom, dateTo]);

  // Dispatch mutation trigger refetch
  const assignTeamMutation = useMutation({
    mutationFn: async (id: number) => ({ success: true, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
      queryClient.invalidateQueries({ queryKey: ['floodRequests'] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (activeSubTab === 'SOS_KHAN_CAP') {
        return sosApi.updateStatus(id, { status });
      } else {
        return floodRequestApi.updateStatus(id, { status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
      queryClient.invalidateQueries({ queryKey: ['floodRequests'] });
      toast.success('Đã cập nhật trạng thái yêu cầu thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi cập nhật trạng thái');
    },
  });

  // Approve for Map mutation
  const approveForMapMutation = useMutation({
    mutationFn: async (id: number) => {
      return floodRequestApi.approveMap(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floodRequests'] });
      toast.success('Đã duyệt hiển thị điểm ngập lụt này lên bản đồ cứu hộ thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi duyệt lên bản đồ');
    },
  });

  // Approve for Map
  const handleApproveForMap = (id: number) => {
    approveForMapMutation.mutate(id);
  };

  return (
    <div className="flex flex-col gap-4 text-left text-gray-855 dark:text-gray-200 min-h-[calc(100vh-3.5rem)] select-none">
      {/* TAB CONTROLLER */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('SOS_KHAN_CAP')}
          className={cn(
            'pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative',
            activeSubTab === 'SOS_KHAN_CAP'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
          )}
        >
          <AlertTriangle size={16} className="text-red-500 animate-pulse" />
          <span>SOS Khẩn cấp</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-black leading-none',
              activeSubTab === 'SOS_KHAN_CAP'
                ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                : 'bg-slate-100 text-gray-500 dark:bg-gray-800'
            )}
          >
            {sosResponse?.data?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('NGAP_LUT')}
          className={cn(
            'pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative',
            activeSubTab === 'NGAP_LUT'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
          )}
        >
          <ClipboardList size={16} />
          <span>Báo cáo ngập lụt</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-black leading-none',
              activeSubTab === 'NGAP_LUT'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'bg-slate-100 text-gray-500 dark:bg-gray-800'
            )}
          >
            {rawResponse?.data?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('HO_SO')}
          className={cn(
            'pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative',
            activeSubTab === 'HO_SO'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
          )}
        >
          <FileText size={16} />
          <span>Yêu cầu gửi hồ sơ</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black leading-none bg-slate-100 text-gray-500 dark:bg-gray-800">
            0
          </span>
        </button>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo nội dung, mã, SĐT..."
            className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-gray-855 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl focus:outline-none focus:bg-white dark:focus:bg-gray-900 transition border-0 shadow-xs"
          />
        </div>

        {/* Filter button + dropdown */}
        <div ref={filterRef} className="relative">
          <button
            id="filter-dropdown-btn"
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border-0 shadow-xs cursor-pointer',
              filterOpen || activeFilterCount > 0
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'
            )}
          >
            <SlidersHorizontal size={14} />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-blue-600 text-[9px] font-black leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-100 dark:border-gray-800 p-4 flex flex-col gap-4">
              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-gray-855 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none border-0 shadow-xs w-full"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  {activeSubTab === 'SOS_KHAN_CAP' ? (
                    <>
                      <option value="Chờ điều phối">Chờ điều phối</option>
                      <option value="Chờ đội chuyên môn">Chờ đội chuyên môn</option>
                      <option value="Đang cứu hộ">Đang cứu hộ</option>
                      <option value="Đã tiếp cận">Đã tiếp cận</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </>
                  ) : (
                    <>
                      <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                      <option value="Đang xác minh">Đang xác minh</option>
                      <option value="Đã duyệt">Đã duyệt</option>
                      <option value="Đã điều phối">Đã điều phối</option>
                      <option value="Đã tiếp cận">Đã tiếp cận</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Đã từ chối">Đã từ chối</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </>
                  )}
                </select>
              </div>

              {/* Severity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Mức độ</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-gray-855 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none border-0 shadow-xs w-full"
                >
                  <option value="Tất cả">Tất cả mức độ</option>
                  <option value="Mức độ: Nguy kịch">Nguy kịch</option>
                  <option value="Mức độ: Cao">Cao</option>
                  <option value="Mức độ: Trung bình">Trung bình</option>
                  <option value="Mức độ: Thấp">Thấp</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Sắp xếp</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 dark:bg-gray-855 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none border-0 shadow-xs w-full"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Khoảng thời gian</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-gray-855 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none border-0 shadow-xs"
                    title="Từ ngày"
                  />
                  <span className="text-gray-400 text-xs font-bold flex-shrink-0">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-gray-855 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none border-0 shadow-xs"
                    title="Đến ngày"
                  />
                </div>
              </div>

              {/* Apply / Reset row */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-gray-800">
                <button
                  onClick={clearFilters}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                >
                  <X size={12} />
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clear filter chip (outside) */}
        {hasActiveFilter && !filterOpen && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition border-0 shadow-xs cursor-pointer"
          >
            <X size={12} />
            Xóa lọc
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          title="Làm mới danh sách"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-655 dark:text-gray-300 hover:text-blue-600 rounded-xl text-xs font-bold shadow-xs transition border-0"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>

        {/* Export */}
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-655 dark:text-gray-300 rounded-xl text-xs font-bold shadow-xs transition border-0">
          <Download size={14} />
          <span>Xuất</span>
        </button>
      </div>

      {/* MAIN CONTAINER GRID */}
      {activeSubTab === 'HO_SO' ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-xs">
          <FileText className="text-gray-300 dark:text-gray-650 mb-3" size={48} />
          <h3 className="text-sm font-extrabold text-gray-550 dark:text-gray-400">Không có yêu cầu gửi hồ sơ</h3>
          <p className="text-xs text-gray-400 dark:text-gray-550 mt-1 max-w-sm">Hiện tại chưa có hồ sơ nào được yêu cầu gửi lên hệ thống.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-3xl p-12 text-center shadow-xs">
          <AlertTriangle className="text-gray-300 dark:text-gray-655 mb-3" size={48} />
          <h3 className="text-sm font-extrabold text-gray-550 dark:text-gray-400">Không tìm thấy yêu cầu</h3>
          <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border-0">
          {/* LEFT LIST COLUMN */}
          <div className="lg:col-span-4 border-r border-slate-100 dark:border-gray-800 pr-4">
            <RequestList
              requests={filteredRequests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
            />
          </div>

          {/* RIGHT DETAIL COLUMN */}
          {selectedRequest && (
            <div className="lg:col-span-8 pl-4">
              <RequestDetail
                request={selectedRequest}
                activeTab={activeSubTab}
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
