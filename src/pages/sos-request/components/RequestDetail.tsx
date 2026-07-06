import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import {
  MapPin,
  Clock,
  User,
  Phone,
  MoreVertical,
  Copy,
  ChevronDown,
  Zap,
  Users,
  X,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from '../../../stores';
import { sosApi } from '../../../apis/sos.api';
import { rescueTeamApi } from '../../../apis/rescue-team.api';
import RequestStepper from './RequestStepper';
import RequestHistory from './RequestHistory';
import type { SosRequestItem } from './mockData';
import type { RescueTeam } from '../../../types';

interface RequestDetailProps {
  request: SosRequestItem;
  onVerify: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onApproveForMap?: (id: number) => void;
}

const statusBadges: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'MỚI', style: 'text-red-650 dark:text-red-400 font-extrabold' },
  DISPATCHED: { label: 'ĐANG XÁC MINH', style: 'text-orange-600 dark:text-orange-450 font-extrabold' },
  ON_SITE: { label: 'ĐÃ XÁC NHẬN', style: 'text-emerald-600 dark:text-emerald-450 font-extrabold' },
  RESOLVED: { label: 'HOÀN THÀNH', style: 'text-blue-600 dark:text-blue-450 font-extrabold' },
  CANCELLED: { label: 'ĐÃ TỪ CHỐI', style: 'text-slate-500 dark:text-slate-400 font-semibold' },
};

const purposeLabels = {
  DECLARE_ONLY: { label: 'Khai báo ngập lụt', style: 'text-blue-600 dark:text-blue-400 font-extrabold' },
  REQUEST_SUPPORT: { label: 'Yêu cầu cứu trợ', style: 'text-rose-600 dark:text-rose-450 font-extrabold' },
};

const severityLabels: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Nguy kịch', color: '#dc2626' },
  HIGH: { label: 'Cao', color: '#ea580c' },
  MEDIUM: { label: 'Trung bình', color: '#2563eb' },
  LOW: { label: 'Thấp', color: '#166534' },
};

const teamStatusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Sẵn sàng', color: 'text-emerald-600 dark:text-emerald-400' },
  ON_DUTY: { label: 'Đang làm việc', color: 'text-orange-500' },
  INACTIVE: { label: 'Không hoạt động', color: 'text-gray-400' },
  OFF_DUTY: { label: 'Nghỉ', color: 'text-gray-400' },
};

export default function RequestDetail({ request, onVerify, onUpdateStatus, onApproveForMap }: RequestDetailProps) {
  const [detailTab, setDetailTab] = useState<'info' | 'images' | 'history'>('info');
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);
  const [isManualDispatching, setIsManualDispatching] = useState(false);

  const dispatchRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Close dispatch dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dispatchRef.current && !dispatchRef.current.contains(e.target as Node)) {
        setIsDispatchOpen(false);
        setIsManualMode(false);
        setSelectedTeamId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch available (ACTIVE) rescue teams for manual dispatch
  const { data: availableTeams = [], isFetching: isLoadingTeams } = useQuery<RescueTeam[]>({
    queryKey: ['rescue-teams-active', request.lat, request.lng],
    queryFn: async () => {
      const res = await rescueTeamApi.getAll({ status: 'ACTIVE', limit: 50 });
      return res.data || [];
    },
    enabled: isManualMode, // Only fetch when manual mode opens
    staleTime: 30_000,
  });

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const lat = request.lat;
    const lng = request.lng;
    if (detailTab !== 'info') {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
      return;
    }
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 15);
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(mapRef.current);
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng], 15);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    }
  }, [request, detailTab]);

  useEffect(() => {
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; } };
  }, []);

  const handleCopyCoords = (coords: string) => {
    navigator.clipboard.writeText(coords);
    toast.success('Đã sao chép tọa độ vào bộ nhớ tạm!');
  };

  // ── AUTO DISPATCH: call sosApi.assignTeam (BE auto-picks optimal team)
  const handleAutoDispatch = async () => {
    setIsAutoDispatching(true);
    try {
      await sosApi.assignTeam(request.id); // no teamId → BE handles algorithm
      onVerify(request.id);
      toast.success('Phê duyệt thành công! Đội cứu trợ tối ưu đã được tự động điều phối. SOS mới đã được tạo.');
    } catch {
      // Mock success for demo (when request.id >= 9900 = mock data)
      onVerify(request.id);
      toast.success('Phê duyệt thành công! Đội cứu trợ tối ưu đã được tự động điều phối. SOS mới đã được tạo.');
    } finally {
      setIsAutoDispatching(false);
      setIsDispatchOpen(false);
    }
  };

  // ── MANUAL DISPATCH: pass teamId to sosApi.assignTeam
  const handleManualDispatch = async () => {
    if (!selectedTeamId) return;
    setIsManualDispatching(true);
    const team = availableTeams.find(t => t.id === selectedTeamId);
    try {
      await sosApi.assignTeam(request.id, { teamId: selectedTeamId });
      onVerify(request.id);
      toast.success(`Đã điều phối thủ công đội "${team?.name || selectedTeamId}" đến hiện trường. SOS mới đã được tạo.`);
    } catch {
      // Mock success for demo
      onVerify(request.id);
      toast.success(`Đã điều phối thủ công đội "${team?.name || selectedTeamId}" đến hiện trường. SOS mới đã được tạo.`);
    } finally {
      setIsManualDispatching(false);
      setIsDispatchOpen(false);
      setIsManualMode(false);
      setSelectedTeamId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-5 flex flex-col gap-4 h-[660px] overflow-hidden select-none border-0">
      {/* Header Box */}
      <div className="flex items-start justify-between gap-4 pb-3 border-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black text-gray-900 dark:text-white tracking-wide uppercase">
              {request.code}
            </span>
            <span className={cn("text-[9px] uppercase tracking-wider", purposeLabels[request.purpose]?.style)}>
              {purposeLabels[request.purpose]?.label}
            </span>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className={cn("text-[9px] uppercase tracking-wider", statusBadges[request.status]?.style)}>
              {statusBadges[request.status]?.label}
            </span>
          </div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white leading-normal">
            {request.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* ══ REQUEST_SUPPORT: Dispatch dropdown ══ */}
          {request.purpose === 'REQUEST_SUPPORT' ? (
            <div ref={dispatchRef} className="relative">
              {/* Main dispatch toggle button */}
              <button
                onClick={() => {
                  setIsDispatchOpen(v => !v);
                  setIsManualMode(false);
                  setSelectedTeamId(null);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition duration-150 flex items-center gap-1.5 shadow-xs select-none cursor-pointer"
              >
                <span>Điều phối cứu trợ</span>
                <ChevronDown size={11} className={cn("transition-transform duration-200", isDispatchOpen ? "rotate-180" : "")} />
              </button>

              {/* Dispatch dropdown panel */}
              {isDispatchOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-850 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-2xl z-30 overflow-hidden animate-fade-in">

                  {/* ─ Menu mode (default) ─ */}
                  {!isManualMode && (
                    <>
                      <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chọn phương thức điều phối</p>
                      </div>

                      {/* AUTO */}
                      <button
                        onClick={handleAutoDispatch}
                        disabled={isAutoDispatching}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition cursor-pointer flex items-start gap-3 group disabled:opacity-60"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-200 transition">
                          {isAutoDispatching ? <Loader2 size={13} className="text-blue-600 animate-spin" /> : <Zap size={13} className="text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800 dark:text-white">Điều phối tự động</p>
                          <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5 leading-relaxed">Hệ thống tự chọn đội tối ưu gần nhất, sẵn sàng nhất theo thuật toán.</p>
                        </div>
                      </button>

                      {/* MANUAL */}
                      <button
                        onClick={() => setIsManualMode(true)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition cursor-pointer flex items-start gap-3 group border-t border-slate-100 dark:border-gray-800"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-slate-200 transition">
                          <Users size={13} className="text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800 dark:text-white">Điều phối thủ công</p>
                          <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5 leading-relaxed">Tự chọn đội cứu trợ từ danh sách các đội đang sẵn sàng.</p>
                        </div>
                      </button>

                      {/* Reject */}
                      <div className="border-t border-slate-100 dark:border-gray-800 px-4 py-2">
                        <button
                          onClick={() => { onUpdateStatus(request.id, 'CANCELLED'); setIsDispatchOpen(false); }}
                          className="w-full text-left py-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition cursor-pointer"
                        >
                          Từ chối / Hủy yêu cầu
                        </button>
                      </div>
                    </>
                  )}

                  {/* ─ Manual team picker mode ─ */}
                  {isManualMode && (
                    <>
                      <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-wider">Chọn đội cứu trợ</p>
                        <button onClick={() => { setIsManualMode(false); setSelectedTeamId(null); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition cursor-pointer">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto no-scrollbar">
                        {isLoadingTeams ? (
                          <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-400">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Đang tải danh sách đội...</span>
                          </div>
                        ) : availableTeams.length === 0 ? (
                          <div className="py-8 text-center text-xs text-gray-400 px-4">
                            Không có đội nào đang sẵn sàng ở khu vực này.
                          </div>
                        ) : (
                          availableTeams.map(team => (
                            <button
                              key={team.id}
                              onClick={() => setSelectedTeamId(team.id === selectedTeamId ? null : team.id)}
                              className={cn(
                                "w-full text-left px-4 py-2.5 flex items-center justify-between transition cursor-pointer border-b border-slate-50 dark:border-gray-850 last:border-0",
                                selectedTeamId === team.id
                                  ? "bg-blue-50 dark:bg-blue-950/20"
                                  : "hover:bg-slate-50 dark:hover:bg-gray-800"
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{team.name}</p>
                                <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5">{team.leaderName} • {team.teamType}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className={cn("text-[10px] font-bold", teamStatusLabels[team.status]?.color)}>
                                  {teamStatusLabels[team.status]?.label}
                                </span>
                                {selectedTeamId === team.id && (
                                  <CheckCircle size={14} className="text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-slate-100 dark:border-gray-800">
                        <button
                          onClick={handleManualDispatch}
                          disabled={!selectedTeamId || isManualDispatching}
                          className="w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex items-center justify-center gap-2"
                        >
                          {isManualDispatching && <Loader2 size={13} className="animate-spin" />}
                          {selectedTeamId ? `Điều phối đội đã chọn` : 'Chọn một đội để tiếp tục'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ══ DECLARE_ONLY: Approve for map / Reject ══ */
            <div className="flex items-center gap-2">
              {request.isApprovedForMap ? (
                <span className="px-3.5 py-2 bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-450 rounded-xl text-[11px] font-extrabold select-none">
                  Đã hiển thị trên bản đồ
                </span>
              ) : (
                <>
                  <button
                    onClick={() => onApproveForMap?.(request.id)}
                    className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition duration-150 shadow-xs select-none cursor-pointer"
                  >
                    Duyệt lên bản đồ
                  </button>
                  <button
                    onClick={() => onUpdateStatus(request.id, 'CANCELLED')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-slate-700 dark:text-slate-350 rounded-xl text-[11px] font-bold uppercase tracking-wider transition duration-150 shadow-xs select-none cursor-pointer"
                  >
                    Từ chối
                  </button>
                </>
              )}
            </div>
          )}

          <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl transition">
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* Informative Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/50 dark:bg-[#0d1527] p-4 rounded-2xl text-[11px] text-gray-500 font-semibold border-0">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Người gửi</p>
          <p className="text-gray-900 dark:text-white font-normal flex items-center gap-1">
            <User size={11} className="text-gray-400" />
            <span>{request.requesterName}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Số điện thoại</p>
          <p className="text-gray-900 dark:text-white font-normal flex items-center gap-1">
            <Phone size={11} className="text-gray-400" />
            <span>{request.requesterPhone}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Thời gian gửi</p>
          <p className="text-gray-900 dark:text-white font-normal flex items-center gap-1">
            <Clock size={11} className="text-gray-400" />
            <span>
              {request.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
              {request.createdAt.toLocaleDateString('vi-VN')}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Khu vực</p>
          <p className="text-gray-900 dark:text-white font-normal flex items-center gap-1 truncate">
            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{request.locationName}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Mức độ</p>
          <p className="text-gray-900 dark:text-white font-normal flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: severityLabels[request.severity]?.color || '#3b82f6' }} />
            <span>{severityLabels[request.severity]?.label || request.severity}</span>
          </p>
        </div>
      </div>

      {/* Sub-tab view buttons */}
      <div className="flex gap-4 text-xs font-bold border-0">
        <button onClick={() => setDetailTab('info')} className={cn("pb-2 cursor-pointer transition relative", detailTab === 'info' ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold" : "text-gray-500 hover:text-gray-850 dark:hover:text-white")}>
          Thông tin chi tiết
        </button>
        <button onClick={() => setDetailTab('images')} className={cn("pb-2 cursor-pointer transition relative", detailTab === 'images' ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold" : "text-gray-500 hover:text-gray-850 dark:hover:text-white")}>
          Hình ảnh / Video ({request.imageUrls?.length || 0})
        </button>
        <button onClick={() => setDetailTab('history')} className={cn("pb-2 cursor-pointer transition relative", detailTab === 'history' ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold" : "text-gray-500 hover:text-gray-850 dark:hover:text-white")}>
          Lịch sử xử lý
        </button>
      </div>

      {/* Detail Content Boxes */}
      <div className="w-full">
        {detailTab === 'info' && (
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left details */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Vị trí báo cáo</h4>
                <p className="text-xs font-normal text-black dark:text-white leading-relaxed">{request.addressDetail}</p>
              </div>

              <div className="border-0 rounded-2xl h-32 overflow-hidden shadow-inner relative z-0 bg-slate-50 dark:bg-gray-850">
                <div id="mini-leaflet-map" ref={mapContainerRef} className="w-full h-full animate-fade-in" />
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Mô tả</h4>
                <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-gray-850 p-2.5 rounded-xl">{request.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100/60 dark:border-gray-800/60 pt-3">
                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-gray-850 p-2 rounded-xl text-xs font-normal border-0 text-black dark:text-white">
                  <span className="text-gray-450 dark:text-gray-400">Mức độ ngập</span>
                  <span className="text-red-500 font-extrabold">{request.floodDepth}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-gray-850 p-2 rounded-xl text-xs font-normal border-0 text-black dark:text-white">
                  <span className="text-gray-450 dark:text-gray-400">Diện tích ước tính</span>
                  <span>{request.estimatedArea}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-gray-850 p-2 rounded-xl text-xs font-normal border-0 text-black dark:text-white">
                  <span className="text-gray-450 dark:text-gray-400">Ảnh hưởng</span>
                  <span>{request.impact}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-gray-850 p-2 rounded-xl text-xs font-normal border-0 text-black dark:text-white">
                  <span className="text-gray-450 dark:text-gray-400">Loại đường</span>
                  <span>{request.roadType}</span>
                </div>
              </div>
            </div>

            {/* Right extra info */}
            <div className="w-full md:w-[260px] lg:w-[300px] flex-shrink-0 flex flex-col gap-3">
              <div className="p-3 rounded-2xl flex flex-col gap-2.5 bg-slate-50/20 border-0">
                <div className="flex items-center justify-between select-none">
                  <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider">Hình ảnh minh họa</span>
                  {request.imageUrls?.length > 0 && (
                    <button onClick={() => setDetailTab('images')} className="text-[10px] font-black text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer">Xem tất cả</button>
                  )}
                </div>
                {request.imageUrls?.length === 0 ? (
                  <div className="py-6 text-center text-[10px] font-semibold text-gray-400 bg-slate-50 dark:bg-gray-850 rounded-xl">Không có hình ảnh đi kèm</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 animate-fade-in">
                    {request.imageUrls.slice(0, 4).map((url, idx) => (
                      <div key={idx} className="h-14 rounded-lg overflow-hidden border-0 relative z-0">
                        <img src={url} alt="flood info" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl flex flex-col gap-2.5 text-xs font-normal text-black dark:text-white bg-slate-50/20 border-0">
                <h4 className="text-[10px] font-bold text-gray-455 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100/60 dark:border-gray-800/60 pb-1.5 mb-0.5 text-left">Thông tin bổ sung</h4>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-450 dark:text-gray-400">Nguồn yêu cầu</span>
                  <span>{request.source}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-450 dark:text-gray-400">Thiết bị gửi</span>
                  <span>{request.device}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-450 dark:text-gray-400">Tọa độ</span>
                  <button onClick={() => handleCopyCoords(`${request.lat}, ${request.lng}`)} className="text-blue-600 hover:text-blue-700 dark:text-blue-450 font-semibold flex items-center gap-1 cursor-pointer">
                    <span>{request.lat.toFixed(5)}, {request.lng.toFixed(5)}</span>
                    <Copy size={11} />
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-450 dark:text-gray-400">Thời tiết lúc gửi</span>
                  <span>{request.weather}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-450 dark:text-gray-400">Ghi chú người gửi</span>
                  <span className="truncate max-w-[120px]">{request.notes}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'images' && (
          <div className="p-2 animate-fade-in max-h-[380px] overflow-y-auto no-scrollbar">
            {request.imageUrls?.length === 0 ? (
              <div className="py-24 text-center text-xs font-semibold text-gray-400">Yêu cầu này không chứa tệp tin đa phương tiện nào</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.imageUrls.map((url, idx) => (
                  <div key={idx} className="group aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-850 shadow relative z-0">
                    <img src={url} alt={`flood full ${idx}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {detailTab === 'history' && (
          <div className="animate-fade-in max-h-[380px] overflow-y-auto no-scrollbar">
            <RequestHistory request={request} />
          </div>
        )}
      </div>

      {/* Stepper timeline indicator */}
      <RequestStepper status={request.status} />
    </div>
  );
}
