import { Users, AlertTriangle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../apis/dashboard.api';

interface MapAndMissionsPanelProps {
  provinceId: number | null;
}

// Hàm phóng chiếu đơn giản để vẽ kinh/vĩ độ Việt Nam lên hệ tọa độ SVG 300x200
function getSvgCoords(lat: number, lng: number): [number, number] {
  // Khoảng tọa độ địa lý tương đối của Việt Nam
  const minLng = 102;
  const maxLng = 110;
  const minLat = 8;
  const maxLat = 23;
  
  const x = ((lng - minLng) / (maxLng - minLng)) * 240 + 30;
  // Trục Y của SVG đi từ trên xuống dưới
  const y = 200 - (((lat - minLat) / (maxLat - minLat)) * 160 + 20);
  
  return [
    Math.max(15, Math.min(285, x)),
    Math.max(15, Math.min(185, y))
  ];
}

export default function MapAndMissionsPanel({ provinceId }: MapAndMissionsPanelProps) {
  // Query dữ liệu bản đồ
  const { data: mapResponse, isLoading: isMapLoading } = useQuery({
    queryKey: ['dashboardMapTasks', provinceId],
    queryFn: () => dashboardApi.getMapTasks(provinceId),
  });

  // Query dữ liệu stats cho phần thông tin nhanh
  const { data: statsResponse, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', provinceId],
    queryFn: () => dashboardApi.getStats(provinceId),
  });

  if (isMapLoading || isStatsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
      </div>
    );
  }

  const mapData = mapResponse?.data || { markers: [], missions: [] };
  const statsData = statsResponse?.data || {
    activeRescueTeams: { value: 0 },
    activeSosRequests: { value: 0 },
    ongoingDisasters: { value: 0 },
  };

  const markers = mapData.markers;
  const missions = mapData.missions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Bản đồ tình hình thiên tai và SOS (7 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Bản đồ tình hình thiên tai và SOS
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem bản đồ chi tiết →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch flex-1 pt-2">
          {/* Map preview */}
          <div className="md:col-span-2 bg-[#e2e8f0]/40 dark:bg-gray-900/60 rounded-2xl relative overflow-hidden border border-slate-200/40 dark:border-gray-700/40 h-64 md:h-auto flex items-center justify-center">
            {/* Sông/Đường viền giả lập */}
            <svg className="w-full h-full absolute inset-0 opacity-40 dark:opacity-20" viewBox="0 0 300 200">
              <path d="M10,20 Q40,60 80,40 T150,90 T240,60 T300,100" fill="none" stroke="#94a3b8" strokeWidth="1" />
              <path d="M50,150 Q100,130 180,170 T290,140" fill="none" stroke="#94a3b8" strokeWidth="1" />
            </svg>

            {/* Vẽ động các markers từ Database */}
            {markers.map((marker: any, idx: number) => {
              const [x, y] = getSvgCoords(marker.lat, marker.lng);
              const isTeam = marker.type === 'team';
              const colorClass = isTeam 
                ? (marker.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-blue-500') 
                : (marker.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-amber-500');

              return (
                <div 
                  key={idx} 
                  className="absolute flex flex-col items-center group transition-all duration-300 hover:scale-110"
                  style={{ left: `${(x / 300) * 100}%`, top: `${(y / 200) * 100}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${colorClass} border-2 border-white shadow-md cursor-pointer`} />
                  
                  {/* Tooltip khi hover */}
                  <div className="absolute bottom-5 bg-gray-950/90 text-white text-[8px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {marker.title} ({isTeam ? 'Đội cứu hộ' : 'SOS'})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legends and fast stats */}
          <div className="flex flex-col justify-between py-1 space-y-4">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chú thích</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>SOS Nguy kịch (Critical)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>SOS Thường / Cần cứu hộ</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Đội cứu hộ Sẵn sàng (Available)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thông tin nhanh</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg">
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none">
                      {statsData.ongoingDisasters.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Khu vực thiên tai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
                    <Activity size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none">
                      {statsData.activeSosRequests.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">SOS đang hoạt động</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
                    <Users size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none">
                      {statsData.activeRescueTeams.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Đội đang hoạt động</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nhiệm vụ đang thực hiện (4 cols) */}
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Nhiệm vụ đang thực hiện
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[220px]">
          {missions.map((mission: any, idx: number) => (
            <div key={idx} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center border border-slate-100 dark:border-gray-600 shrink-0 text-slate-500">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {mission.name}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400`}>
                    {mission.percent === 75 ? 'Đang cứu hộ' : 'Đang tiếp cận'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  {mission.team}
                </p>
                
                {/* Progress bar inside card */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-1.5 flex-1 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${mission.color} rounded-full`} style={{ width: `${mission.percent}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-gray-500 w-6 text-right">{mission.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
