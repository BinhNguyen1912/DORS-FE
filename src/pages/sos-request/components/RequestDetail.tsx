import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Clock,
  User,
  Phone,
  MoreVertical,
  Copy,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { toast } from '../../../stores';
import RequestStepper from './RequestStepper';
import RequestHistory from './RequestHistory';
import type { SosRequestItem } from './mockData';

interface RequestDetailProps {
  request: SosRequestItem;
  onVerify: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
}

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

export default function RequestDetail({ request, onVerify, onUpdateStatus }: RequestDetailProps) {
  const [detailTab, setDetailTab] = useState<'info' | 'images' | 'history'>('info');
  const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const lat = request.lat;
    const lng = request.lng;

    // Reset map if tab is not 'info'
    if (detailTab !== 'info') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

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
  }, [request, detailTab]);

  // Clean map on unmount or tab change
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleCopyCoords = (coords: string) => {
    navigator.clipboard.writeText(coords);
    toast.success('Đã sao chép tọa độ vào bộ nhớ tạm!');
  };

  return (
    <div className="lg:col-span-8 bg-white dark:bg-gray-900 border border-slate-150 dark:border-gray-800 rounded-3xl p-5 flex flex-col gap-4 max-h-[660px] overflow-y-auto no-scrollbar shadow-sm">
      {/* Header Box */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-900 dark:text-white tracking-wide uppercase">
              {request.code}
            </span>
            <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border", statusBadges[request.status]?.style)}>
              {statusBadges[request.status]?.label}
            </span>
          </div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white leading-normal">
            {request.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 relative">
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
                    onVerify(request.id);
                    setIsVerifyDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                >
                  Phê duyệt & Điều phối live
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(request.id, 'ON_SITE');
                    setIsVerifyDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                >
                  Đánh dấu đã tiếp cận
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(request.id, 'RESOLVED');
                    setIsVerifyDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                >
                  Hoàn tất xử lý
                </button>
                <hr className="border-slate-100 dark:border-gray-700 my-1" />
                <button
                  onClick={() => {
                    onUpdateStatus(request.id, 'CANCELLED');
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
          <p className="text-gray-855 dark:text-white font-extrabold flex items-center gap-1">
            <User size={11} className="text-gray-400" />
            <span>{request.requesterName}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Số điện thoại</p>
          <p className="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
            <Phone size={11} className="text-gray-400" />
            <span>{request.requesterPhone}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Thời gian gửi</p>
          <p className="text-gray-800 dark:text-white font-extrabold flex items-center gap-1">
            <Clock size={11} className="text-gray-400" />
            <span>
              {request.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
              {request.createdAt.toLocaleDateString('vi-VN')}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Khu vực</p>
          <p className="text-gray-800 dark:text-white font-extrabold flex items-center gap-1 truncate">
            <MapPin size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{request.locationName}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Mức độ</p>
          <p className="font-extrabold flex items-center gap-1.5" style={{ color: severityLabels[request.severity]?.color || '#3b82f6' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: severityLabels[request.severity]?.color || '#3b82f6' }} />
            <span>{severityLabels[request.severity]?.label || request.severity}</span>
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
          Hình ảnh / Video ({request.imageUrls?.length || 0})
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
                  {request.addressDetail}
                </p>
              </div>

              {/* Mini leaflet map container */}
              <div className="border border-slate-200 dark:border-gray-800 rounded-2xl h-44 overflow-hidden shadow-inner relative z-0">
                <div id="mini-leaflet-map" ref={mapContainerRef} className="w-full h-full animate-fade-in" />
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Mô tả</h4>
                <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed bg-slate-50 dark:bg-gray-850 p-3 rounded-xl">
                  {request.description}
                </p>
              </div>

              {/* Specs specifications */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                  <span className="text-gray-400">Mức độ ngập</span>
                  <span className="text-red-500 font-extrabold">{request.floodDepth}</span>
                </div>
                <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                  <span className="text-gray-400">Diện tích ước tính</span>
                  <span className="text-gray-700 dark:text-white font-extrabold">{request.estimatedArea}</span>
                </div>
                <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                  <span className="text-gray-400">Ảnh hưởng</span>
                  <span className="text-gray-700 dark:text-white font-extrabold">{request.impact}</span>
                </div>
                <div className="flex items-center justify-between border border-slate-100 dark:border-gray-800 p-2.5 rounded-xl text-xs font-bold">
                  <span className="text-gray-400">Loại đường</span>
                  <span className="text-gray-700 dark:text-white font-extrabold">{request.roadType}</span>
                </div>
              </div>
            </div>

            {/* Right extra info (col-span-5) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {/* Pictures teaser panel */}
              <div className="border border-slate-150 dark:border-gray-800 rounded-2xl p-3 flex flex-col gap-2.5 bg-slate-50/20">
                <div className="flex items-center justify-between select-none">
                  <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider">Hình ảnh minh họa</span>
                  {request.imageUrls?.length > 0 && (
                    <button onClick={() => setDetailTab('images')} className="text-[10px] font-black text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer">Xem tất cả</button>
                  )}
                </div>

                {request.imageUrls?.length === 0 ? (
                  <div className="py-8 text-center text-[10.5px] font-semibold text-gray-400 bg-slate-50 dark:bg-gray-850 rounded-xl">Không có hình ảnh đi kèm</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 animate-fade-in">
                    {request.imageUrls.slice(0, 4).map((url, idx) => (
                      <div key={idx} className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-850 relative z-0">
                        <img src={url} alt="flood info" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Supplementary specifications card */}
              <div className="border border-slate-150 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-3 text-xs font-bold bg-white dark:bg-gray-900">
                <h4 className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1 text-left">Thông tin bổ sung</h4>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">Nguồn yêu cầu</span>
                  <span className="text-gray-800 dark:text-white font-extrabold">{request.source}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">Thiết bị gửi</span>
                  <span className="text-gray-800 dark:text-white font-extrabold">{request.device}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">Tọa độ</span>
                  <button
                    onClick={() => handleCopyCoords(`${request.lat}, ${request.lng}`)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-450 font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{request.lat.toFixed(5)}, {request.lng.toFixed(5)}</span>
                    <Copy size={11} />
                  </button>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">Thời tiết lúc gửi</span>
                  <span className="text-gray-800 dark:text-white font-extrabold">{request.weather}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-400">Ghi chú người gửi</span>
                  <span className="text-gray-800 dark:text-white font-extrabold truncate max-w-[120px]">{request.notes}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === 'images' && (
          <div className="p-2 animate-fade-in">
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
          <div className="animate-fade-in">
            <RequestHistory request={request} />
          </div>
        )}
      </div>

      {/* Stepper timeline indicator */}
      <RequestStepper status={request.status} />
    </div>
  );
}
