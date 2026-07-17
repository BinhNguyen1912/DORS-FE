import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import {
  Briefcase,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  Eye,
  X,
} from 'lucide-react';
import { toast } from '../../stores';
import { cn } from '../../lib/utils';
import RequestDetail from '../sos-request/components/RequestDetail';
import { sosApi } from '../../apis';
import { useSocket } from '../../providers/SocketProvider';
import { DISPATCH_EVENTS } from '../../constants/websocket.constant';
import { mapSosRequestToItem } from './utils/missionHelper';

const severityLabels: Record<string, { label: string; color: string; border: string; bg: string }> = {
  CRITICAL: { label: 'Nguy kịch', color: 'text-red-600 dark:text-red-400', border: 'border-red-500/20 dark:border-red-500/30', bg: 'bg-red-500/10' },
  HIGH: { label: 'Cao', color: 'text-orange-500', border: 'border-orange-500/20 dark:border-orange-500/30', bg: 'bg-orange-500/10' },
  MEDIUM: { label: 'Trung bình', color: 'text-blue-500', border: 'border-blue-500/20 dark:border-blue-500/30', bg: 'bg-blue-500/10' },
  LOW: { label: 'Thấp', color: 'text-green-600 dark:text-green-400', border: 'border-green-500/20 dark:border-green-500/30', bg: 'bg-green-500/10' },
};

const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
  DISPATCHED: { label: 'Đang di chuyển', bg: 'bg-amber-50/80 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  ON_SITE: { label: 'Đã tiếp cận', bg: 'bg-indigo-50/80 border border-indigo-200/50 dark:bg-indigo-950/20 dark:border-indigo-900/30', text: 'text-indigo-650 dark:text-indigo-400' },
  RESOLVED: { label: 'Hoàn thành', bg: 'bg-emerald-50/80 border border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-900/30', text: 'text-emerald-650 dark:text-emerald-455' },
};

export default function MissionsListPage() {
  const queryClient = useQueryClient();
  const { dispatchSocket } = useSocket();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  // Sub-tabs: 'ACTIVE' (DISPATCHED, ON_SITE) | 'COMPLETED' (RESOLVED)
  const [activeSubTab, setActiveSubTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Fetch SOS Requests
  const {
    data: sosResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['sosRequests'],
    queryFn: () => sosApi.getAll({ limit: 100 }),
    retry: 1,
    staleTime: 30_000,
  });

  // Map backend format to SosRequestItem
  const missions = useMemo(() => {
    const rawItems = sosResponse?.data || [];
    const filteredMissions = rawItems.filter(
      (item: any) =>
        item.assignedTeamId !== null ||
        item.assignedTeam !== null ||
        ['DISPATCHED', 'ON_SITE', 'RESOLVED'].includes(item.status)
    );
    return filteredMissions.map(mapSosRequestToItem);
  }, [sosResponse]);

  // Filter requests based on selected sub-tab, search query, and severity filter button
  const filteredMissions = useMemo(() => {
    return missions.filter((req: any) => {
      // Global Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = req.title?.toLowerCase().includes(query);
        const matchesAddress = req.addressDetail?.toLowerCase().includes(query);
        const matchesPhone = req.requesterPhone?.includes(query);
        const matchesRequester = req.requesterName?.toLowerCase().includes(query);
        const matchesTeam = (req as any).assignedTeam?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAddress && !matchesPhone && !matchesRequester && !matchesTeam) {
          return false;
        }
      }

      // Severity Button Filter
      if (severityFilter !== 'ALL' && req.severity !== severityFilter) {
        return false;
      }

      // Sub-tab filter (Active vs Completed)
      if (activeSubTab === 'ACTIVE') {
        return req.status === 'DISPATCHED' || req.status === 'ON_SITE';
      } else {
        return req.status === 'RESOLVED';
      }
    });
  }, [missions, activeSubTab, searchQuery, severityFilter]);

  const selectedRequest = useMemo(() => {
    return missions.find((r) => r.id === selectedRequestId) || null;
  }, [missions, selectedRequestId]);

  // Mutation to update status of a mission
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return sosApi.updateStatus(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMapTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAlerts'] });
      toast.success('Đã cập nhật trạng thái nhiệm vụ cứu hộ thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi cập nhật trạng thái nhiệm vụ');
    },
  });

  // Socket: Auto refetch when SOS requests or status updates
  useEffect(() => {
    if (!dispatchSocket) return;

    const handleRefetch = () => {
      queryClient.invalidateQueries({ queryKey: ['sosRequests'] });
    };

    dispatchSocket.on(DISPATCH_EVENTS.SOS_CREATED, handleRefetch);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleRefetch);
    dispatchSocket.on(DISPATCH_EVENTS.TEAM_ASSIGNED, handleRefetch);

    return () => {
      dispatchSocket.off(DISPATCH_EVENTS.SOS_CREATED, handleRefetch);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleRefetch);
      dispatchSocket.off(DISPATCH_EVENTS.TEAM_ASSIGNED, handleRefetch);
    };
  }, [dispatchSocket, queryClient]);

  useEffect(() => {
    if (isError) {
      console.error('[MissionsListPage] Lỗi tải danh sách nhiệm vụ:', error);
      toast.error('Không thể tải danh sách nhiệm vụ.');
    }
  }, [isError, error]);

  const handleOpenDetail = (id: number) => {
    setSelectedRequestId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 text-left text-gray-855 dark:text-gray-200 min-h-[calc(100vh-3.5rem)] select-none">
      {/* TAB CONTROLLER */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('ACTIVE')}
          className={cn(
            'pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative',
            activeSubTab === 'ACTIVE'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-500 hover:text-gray-850 dark:hover:text-white'
          )}
        >
          <Clock size={16} />
          <span>Nhiệm vụ đang thực hiện</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-black leading-none',
              activeSubTab === 'ACTIVE'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-955 dark:text-amber-400'
                : 'bg-slate-100 text-gray-500 dark:bg-gray-800'
            )}
          >
            {missions.filter(m => m.status === 'DISPATCHED' || m.status === 'ON_SITE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('COMPLETED')}
          className={cn(
            'pb-3 text-sm font-extrabold flex items-center gap-2 transition cursor-pointer relative',
            activeSubTab === 'COMPLETED'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-850 dark:hover:text-white'
          )}
        >
          <CheckCircle size={16} />
          <span>Nhiệm vụ đã hoàn thành</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-black leading-none',
              activeSubTab === 'COMPLETED'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-955 dark:text-blue-400'
                : 'bg-slate-100 text-gray-500 dark:bg-gray-800'
            )}
          >
            {missions.filter(m => m.status === 'RESOLVED').length}
          </span>
        </button>
      </div>

      {/* FILTER BUTTONS & CONTROLS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-2">Mức độ khẩn cấp:</span>
          {[
            { key: 'ALL', label: 'Tất cả', style: 'bg-slate-100 text-gray-600 hover:bg-slate-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-750' },
            { key: 'CRITICAL', label: '🚨 Nguy kịch', style: 'bg-red-50 text-red-650 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400' },
            { key: 'HIGH', label: '🟠 Cao', style: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/20 dark:text-orange-400' },
            { key: 'MEDIUM', label: '🔵 Trung bình', style: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400' },
            { key: 'LOW', label: '🟢 Thấp', style: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setSeverityFilter(btn.key)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs border border-slate-200 dark:border-slate-700 cursor-pointer',
                severityFilter === btn.key
                  ? 'border-amber-500 bg-amber-500 text-white dark:border-amber-500 dark:bg-amber-500'
                  : btn.style
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => refetch()}
            title="Làm mới danh sách"
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <RefreshCw size={13} className={cn(isFetching && 'animate-spin')} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE VIEW */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-xs">Đang tải danh sách nhiệm vụ...</p>
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="text-gray-300 dark:text-gray-655 mb-3" size={48} />
            <h3 className="text-sm font-extrabold text-gray-550 dark:text-gray-400">Không tìm thấy nhiệm vụ nào</h3>
            <p className="text-xs text-gray-400 dark:text-gray-555 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                  <th className="py-3.5 px-4 w-28">Mã Nhiệm Vụ</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Loại Sự Cố / Tiêu Đề</th>
                  <th className="py-3.5 px-4">Đội Đảm Nhận</th>
                  <th className="py-3.5 px-4 w-24">Mức Độ</th>
                  <th className="py-3.5 px-4 w-44">Trạng Thái</th>
                  <th className="py-3.5 px-4 max-w-[250px]">Khu Vực</th>
                  <th className="py-3.5 px-4 text-center w-20">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white font-medium">
                {filteredMissions.map((req) => {
                  const severity = severityLabels[req.severity] || severityLabels.LOW;
                  const statusInfo = statusLabels[req.status] || statusLabels.DISPATCHED;
                  const teamName = (req as any).assignedTeam?.name || `Đội ID: ${(req as any).assignedTeamId || 'Chưa gán'}`;

                  return (
                    <tr
                      key={req.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 px-4 font-mono font-bold text-gray-900 dark:text-white">
                        {req.code}
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white max-w-[300px] truncate">
                        {req.title}
                      </td>

                      {/* Team Name */}
                      <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {teamName}
                      </td>

                      {/* Severity Badge */}
                      <td className="py-4 px-4">
                        <span className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wide border whitespace-nowrap',
                          severity.bg, severity.color, severity.border
                        )}>
                          {severity.label}
                        </span>
                      </td>

                      {/* Status select dropdown */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={req.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            updateStatusMutation.mutate({ id: req.id, status: newStatus });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none cursor-pointer",
                            statusInfo.bg, statusInfo.text
                          )}
                        >
                          <option value="DISPATCHED" className="bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400">Đang di chuyển</option>
                          <option value="ON_SITE" className="bg-white dark:bg-gray-800 text-indigo-650 dark:text-indigo-400">Đã tiếp cận</option>
                          <option value="RESOLVED" className="bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400">Hoàn thành</option>
                        </select>
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 max-w-[250px] truncate text-gray-550 dark:text-gray-400 font-normal" title={req.addressDetail}>
                        {req.addressDetail}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(req.id)}
                          title="Xem chi tiết & Bản đồ"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-blue-500 hover:text-blue-600 dark:text-blue-450 dark:hover:text-blue-400 transition cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL WITH LEAFLET MAP & TABS */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-2 rounded-3xl max-w-4xl w-full mx-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition z-40 cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
            <div className="overflow-y-auto max-h-[85vh]">
              <RequestDetail
                request={selectedRequest}
                activeTab="SOS_KHAN_CAP"
                onVerify={() => {}}
                onUpdateStatus={(id, status) => {
                  updateStatusMutation.mutate({ id, status });
                }}
                onApproveForMap={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
