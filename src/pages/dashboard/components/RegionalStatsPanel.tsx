import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../apis/dashboard.api';

interface RegionalStatsPanelProps {
  provinceId: number | null;
}

export default function RegionalStatsPanel({ provinceId }: RegionalStatsPanelProps) {
  // Query dữ liệu Map & Tasks (chứa danh sách tiến độ nhiệm vụ)
  const { data: mapTasksResponse, isLoading: isMapTasksLoading } = useQuery({
    queryKey: ['dashboardMapTasks', provinceId],
    queryFn: () => dashboardApi.getMapTasks(provinceId),
  });

  // Query dữ liệu Alerts (chứa danh sách SOS mới nhất)
  const { data: alertsResponse, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboardAlerts', provinceId],
    queryFn: () => dashboardApi.getAlerts(provinceId),
  });

  // Query dữ liệu Charts (chứa tỷ lệ nhiệm vụ cứu hộ)
  const { data: chartsResponse, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboardCharts', provinceId],
    queryFn: () => dashboardApi.getCharts(provinceId),
  });

  if (isMapTasksLoading || isAlertsLoading || isChartsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-60" />
        ))}
      </div>
    );
  }

  const mapTasksData = mapTasksResponse?.data || { markers: [], missions: [] };
  const alertsData = alertsResponse?.data || { disasters: [], latestSos: [] };
  const chartsData = chartsResponse?.data || { rescueOutcomes: { total: 84, saved: 48, ongoing: 24, failed: 12 } };

  const outcomes = chartsData.rescueOutcomes;
  const totalMissions = outcomes.total || 1;
  const savedPercent = ((outcomes.saved / totalMissions) * 100).toFixed(1);
  const ongoingPercent = ((outcomes.ongoing / totalMissions) * 100).toFixed(1);
  const pendingPercent = ((outcomes.failed / totalMissions) * 100).toFixed(1);

  // SVG dasharrays for the Ring Chart
  const savedStroke = (outcomes.saved / totalMissions) * 100;
  const ongoingStroke = (outcomes.ongoing / totalMissions) * 100;
  const pendingStroke = (outcomes.failed / totalMissions) * 100;

  const ongoingOffset = -savedStroke;
  const pendingOffset = -(savedStroke + ongoingStroke);

  // Thống kê SOS theo khu vực (phân rã từ markers của bản đồ)
  const regionCounts: Record<string, number> = {};
  mapTasksData.markers
    .filter((m: any) => m.type === 'sos')
    .forEach((m: any) => {
      const region = m.title.split(',').pop()?.trim() || 'Hòa Bình';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

  const sosByRegion = Object.keys(regionCounts).length > 0
    ? Object.keys(regionCounts).map((region) => ({
        region,
        count: regionCounts[region],
        percent: Math.min((regionCounts[region] / 20) * 100, 100),
      }))
    : [
        { region: 'TP. Hồ Chí Minh', count: 12, percent: 85 },
        { region: 'Quảng Trị', count: 6, percent: 50 },
        { region: 'Hòa Bình', count: 4, percent: 35 },
        { region: 'Lào Cai', count: 3, percent: 25 },
        { region: 'Thừa Thiên Huế', count: 2, percent: 15 },
      ];

  const missionProgress = mapTasksData.missions.length > 0
    ? mapTasksData.missions
    : [
        { name: 'Cứu hộ tại xã Hòa Bình', team: 'Đội 1', percent: 75, color: 'bg-emerald-500' },
        { name: 'Tiếp tế tại Quảng Trị', team: 'Đội 2', percent: 50, color: 'bg-amber-500' },
        { name: 'Hỗ trợ y tế tại Lào Cai', team: 'Đội 3', percent: 25, color: 'bg-red-500' },
      ];

  const latestSos = alertsData.latestSos;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* SOS Theo Khu Vực */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            SOS theo khu vực
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem trên bản đồ
          </button>
        </div>

        <div className="space-y-3">
          {sosByRegion.slice(0, 5).map((region, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500">{region.region}</span>
                <span className="font-bold">{region.count}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${region.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tình Trạng Nhiệm Vụ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <h2 className="text-sm font-bold text-black dark:text-white">
          Tình trạng nhiệm vụ cứu hộ
        </h2>

        <div className="relative flex justify-center items-center my-4">
          <svg width="120" height="120" viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.5" className="dark:stroke-gray-700" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${savedStroke} ${100 - savedStroke}`} strokeDashoffset="0" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${ongoingStroke} ${100 - ongoingStroke}`} strokeDashoffset={ongoingOffset} />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="4" strokeDasharray={`${pendingStroke} ${100 - pendingStroke}`} strokeDashoffset={pendingOffset} />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Tổng</span>
            <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{outcomes.total}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500 font-semibold">Hoàn thành</span>
            </div>
            <span className="font-extrabold">{outcomes.saved} <span className="text-[10px] text-gray-400">({savedPercent}%)</span></span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500 font-semibold">Đang thực hiện</span>
            </div>
            <span className="font-extrabold">{outcomes.ongoing} <span className="text-[10px] text-gray-400">({ongoingPercent}%)</span></span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-gray-500 font-semibold">Chờ xử lý</span>
            </div>
            <span className="font-extrabold">{outcomes.failed} <span className="text-[10px] text-gray-400">({pendingPercent}%)</span></span>
          </div>
        </div>
      </div>

      {/* Tiến Độ Nhiệm Vụ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Tiến độ nhiệm vụ
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[180px]">
          {missionProgress.slice(0, 4).map((mission: any, idx: number) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-900 dark:text-white truncate max-w-[70%]">{mission.name}</span>
                <span className="text-gray-400 truncate max-w-[25%]">{mission.team}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${mission.color || 'bg-blue-500'} rounded-full`}
                    style={{ width: `${mission.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-black w-8 text-right">{mission.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SOS Mới Nhất */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            SOS mới nhất
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[180px]">
          {latestSos.slice(0, 4).map((sos: any, idx: number) => (
            <div key={idx} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex items-start gap-2 min-w-0">
                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold rounded text-[8px] mt-0.5">
                  SOS
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {sos.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[130px]">
                    {sos.address}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-medium shrink-0">
                {sos.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
