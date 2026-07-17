import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { dashboardApi } from '../../../apis/dashboard.api';
import { useState } from 'react';

// Thuật toán Catmull-Rom Spline để tính đường cong Bézier trơn tru tự nhiên nhất
function getBezierPath(points: [number, number][]) {
  if (points.length === 0) return '';
  
  const line = (pointA: [number, number], pointB: [number, number]) => {
    const lengthX = pointB[0] - pointA[0];
    const lengthY = pointB[1] - pointA[1];
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  const controlPoint = (
    current: [number, number],
    previous: [number, number] | undefined,
    next: [number, number] | undefined,
    reverse?: boolean,
  ) => {
    const p = previous || current;
    const n = next || current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * 0.12;
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    return [x, y];
  };

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const prev = points[i - 1];
    const nextNext = points[i + 2];
    
    const cp1 = controlPoint(curr, prev, next, false);
    const cp2 = controlPoint(next, curr, nextNext, true);
    
    d += ` C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${next[0]} ${next[1]}`;
  }
  return d;
}

interface RegionalStatsPanelProps {
  provinceId: number | null;
  startDate?: string;
  endDate?: string;
  adminUnitId?: number | null;
}

export default function RegionalStatsPanel({ provinceId, startDate, endDate, adminUnitId }: RegionalStatsPanelProps) {
  const [hoveredSector, setHoveredSector] = useState<'total' | 'saved' | 'ongoing' | 'failed'>('total');
  const [hoveredRegionIndex, setHoveredRegionIndex] = useState<number | null>(null);

  // Query dữ liệu Map & Tasks (chứa danh sách tiến độ nhiệm vụ)
  const { data: mapTasksResponse, isLoading: isMapTasksLoading } = useQuery({
    queryKey: ['dashboardMapTasks', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getMapTasks(provinceId, startDate, endDate, adminUnitId),
  });

  // Query dữ liệu Alerts (chứa danh sách SOS mới nhất)
  const { data: alertsResponse, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboardAlerts', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getAlerts(provinceId, startDate, endDate, adminUnitId),
  });

  // Query dữ liệu Charts (chứa tỷ lệ nhiệm vụ cứu hộ)
  const { data: chartsResponse, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboardCharts', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getCharts(provinceId, startDate, endDate, adminUnitId),
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

  // Thống kê SOS theo khu vực (lấy từ dữ liệu biểu đồ backend)
  const sosByRegion = chartsResponse?.data?.sosByRegion || [];

  const maxRegionVal = Math.max(...sosByRegion.slice(0, 5).map((r: any) => r.count), 10);
  const regionChartHeight = 100;
  const regionChartWidth = 195;
  const regionStartX = 25;
  const regionStartY = 15;

  const regionPoints = sosByRegion.slice(0, 5).map((r: any, i: number) => {
    const x = regionStartX + (i / Math.max(sosByRegion.slice(0, 5).length - 1, 1)) * regionChartWidth;
    const y = regionChartHeight - (r.count / maxRegionVal) * (regionChartHeight - regionStartY);
    return [x, y] as [number, number];
  });

  const regionLinePath = getBezierPath(regionPoints);
  const regionAreaPath = regionPoints.length > 0
    ? `${regionLinePath} L ${regionPoints[regionPoints.length - 1][0]} ${regionChartHeight} L ${regionPoints[0][0]} ${regionChartHeight} Z`
    : '';

  const missionProgress = mapTasksData.missions;

  const latestSos = alertsData.latestSos;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* SOS Theo Khu Vực */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            SOS theo khu vực
          </h2>
          <Link to={ROUTES.DISASTER_LIST} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem trên bản đồ
          </Link>
        </div>

        <div className="h-32 relative w-full pt-1">
          {sosByRegion.length > 0 ? (
            <svg className="w-full h-full" viewBox="0 0 240 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="regionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 30, 60, 90, 100].map((y, idx) => (
                <line key={idx} x1="25" y1={y} x2="230" y2={y} stroke="#e2e8f0" strokeDasharray="3,3" className="dark:stroke-gray-700" />
              ))}

              {/* Y-Axis Line */}
              <line x1="25" y1={regionStartY} x2="25" y2={regionChartHeight} stroke="#94a3b8" strokeWidth="1" className="dark:stroke-gray-600" />

              {/* Y-Axis Labels */}
              <text x="20" y="103" textAnchor="end" fontSize="7" fontWeight="bold" fill="#94a3b8">0</text>
              <text x="20" y="60.5" textAnchor="end" fontSize="7" fontWeight="bold" fill="#94a3b8">{Math.round(maxRegionVal * 0.5)}</text>
              <text x="20" y="18" textAnchor="end" fontSize="7" fontWeight="bold" fill="#94a3b8">{maxRegionVal}</text>

              {/* Horizontal Projection Lines connecting peaks to Y-axis */}
              {regionPoints.map((pt: [number, number], i: number) => (
                <line
                  key={`proj-${i}`}
                  x1="25"
                  y1={pt[1]}
                  x2={pt[0]}
                  y2={pt[1]}
                  stroke={hoveredRegionIndex === i ? '#3b82f6' : '#cbd5e1'}
                  strokeWidth={hoveredRegionIndex === i ? '1' : '0.6'}
                  strokeDasharray="2,2"
                  className={hoveredRegionIndex === i ? '' : 'dark:stroke-gray-700'}
                />
              ))}

              {/* Area path */}
              <path d={regionAreaPath} fill="url(#regionGrad)" />

              {/* Line path */}
              <path
                d={regionLinePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Active Dotted Hover Line */}
              {hoveredRegionIndex !== null && regionPoints[hoveredRegionIndex] && (
                <line
                  x1={regionPoints[hoveredRegionIndex][0]}
                  y1={regionStartY}
                  x2={regionPoints[hoveredRegionIndex][0]}
                  y2={regionChartHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  className="dark:stroke-gray-600"
                />
              )}

              {/* Data dots */}
              {regionPoints.map((pt: [number, number], i: number) => (
                <circle
                  key={i}
                  cx={pt[0]}
                  cy={pt[1]}
                  r={hoveredRegionIndex === i ? 4 : 2.5}
                  fill="#3b82f6"
                  stroke="#fff"
                  strokeWidth={hoveredRegionIndex === i ? 1.5 : 1}
                  className="transition-all duration-150"
                />
              ))}

              {/* Invisible Hover Rectangles */}
              {sosByRegion.slice(0, 5).map((_: any, i: number) => {
                const x = regionStartX + (i / Math.max(sosByRegion.slice(0, 5).length - 1, 1)) * regionChartWidth;
                const colWidth = regionChartWidth / Math.max(sosByRegion.slice(0, 5).length - 1, 1);
                const rectX = i === 0 ? 20 : x - colWidth / 2;
                const rectW = i === 0 || i === sosByRegion.slice(0, 5).length - 1 ? colWidth / 2 : colWidth;
                return (
                  <rect
                    key={i}
                    x={rectX}
                    y={0}
                    width={rectW}
                    height={regionChartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRegionIndex(i)}
                    onMouseLeave={() => setHoveredRegionIndex(null)}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">Không có dữ liệu SOS</div>
          )}

          {/* Floating Tooltip Card */}
          {hoveredRegionIndex !== null && sosByRegion[hoveredRegionIndex] && (
            <div
              className="absolute bg-white/95 dark:bg-gray-950/95 border border-slate-200/80 dark:border-gray-700/80 backdrop-blur-md rounded-xl p-2 shadow-lg pointer-events-none z-10 text-left min-w-[125px] transition-all duration-150"
              style={{
                left: `${(regionPoints[hoveredRegionIndex][0] / 240) * 100}%`,
                top: `5px`,
                transform: `translateX(${hoveredRegionIndex > 2 ? '-105%' : '5%'})`,
              }}
            >
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider truncate max-w-[110px]">
                {sosByRegion[hoveredRegionIndex].region}
              </p>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">Yêu cầu:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{sosByRegion[hoveredRegionIndex].count}</span>
              </div>
            </div>
          )}
        </div>

        {/* X Axis Labels */}
        {sosByRegion.length > 0 && (
          <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1 px-1.5">
            {sosByRegion.slice(0, 5).map((r: any, i: number) => {
              const shortRegion = r.region.length > 8 ? r.region.slice(0, 7) + '.' : r.region;
              return (
                <span key={i} className="truncate max-w-[42px]" title={r.region}>
                  {shortRegion}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Tình Trạng Nhiệm Vụ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <h2 className="text-sm font-bold text-black dark:text-white">
          Tình trạng nhiệm vụ cứu hộ
        </h2>

        <div className="relative flex justify-center items-center my-4">
          <svg width="120" height="120" viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.5" className="dark:stroke-gray-700" />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#10b981"
              strokeWidth={hoveredSector === 'saved' ? '5' : '4'}
              strokeDasharray={`${savedStroke} ${100 - savedStroke}`}
              strokeDashoffset="0"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSector('saved')}
              onMouseLeave={() => setHoveredSector('total')}
            />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#3b82f6"
              strokeWidth={hoveredSector === 'ongoing' ? '5' : '4'}
              strokeDasharray={`${ongoingStroke} ${100 - ongoingStroke}`}
              strokeDashoffset={ongoingOffset}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSector('ongoing')}
              onMouseLeave={() => setHoveredSector('total')}
            />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#94a3b8"
              strokeWidth={hoveredSector === 'failed' ? '5' : '4'}
              strokeDasharray={`${pendingStroke} ${100 - pendingStroke}`}
              strokeDashoffset={pendingOffset}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSector('failed')}
              onMouseLeave={() => setHoveredSector('total')}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none transition-colors duration-200">
              {hoveredSector === 'saved' ? 'Hoàn thành' : hoveredSector === 'ongoing' ? 'Đang chạy' : hoveredSector === 'failed' ? 'Chờ xử lý' : 'Tổng cộng'}
            </span>
            <span className={`text-lg font-black mt-0.5 transition-colors duration-200 ${
              hoveredSector === 'saved' ? 'text-emerald-500' : hoveredSector === 'ongoing' ? 'text-blue-500' : hoveredSector === 'failed' ? 'text-slate-400' : 'text-gray-900 dark:text-white'
            }`}>
              {hoveredSector === 'saved' ? outcomes.saved : hoveredSector === 'ongoing' ? outcomes.ongoing : hoveredSector === 'failed' ? outcomes.failed : outcomes.total}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div
            className={`flex items-center justify-between text-[11px] p-1 rounded transition-all duration-150 cursor-pointer ${hoveredSector === 'saved' ? 'bg-emerald-50 dark:bg-emerald-950/20 scale-[1.02] font-bold' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('saved')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500 dark:text-gray-400 font-semibold">Hoàn thành</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.saved} <span className="text-[10px] text-gray-400 font-normal">({savedPercent}%)</span></span>
          </div>
          <div
            className={`flex items-center justify-between text-[11px] p-1 rounded transition-all duration-150 cursor-pointer ${hoveredSector === 'ongoing' ? 'bg-blue-50 dark:bg-blue-950/20 scale-[1.02] font-bold' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('ongoing')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500 dark:text-gray-400 font-semibold">Đang thực hiện</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.ongoing} <span className="text-[10px] text-gray-400 font-normal">({ongoingPercent}%)</span></span>
          </div>
          <div
            className={`flex items-center justify-between text-[11px] p-1 rounded transition-all duration-150 cursor-pointer ${hoveredSector === 'failed' ? 'bg-slate-100 dark:bg-slate-700/20 scale-[1.02] font-bold' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('failed')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-gray-500 dark:text-gray-400 font-semibold">Chờ xử lý</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.failed} <span className="text-[10px] text-gray-400 font-normal">({pendingPercent}%)</span></span>
          </div>
        </div>
      </div>

      {/* Tiến Độ Nhiệm Vụ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Tiến độ nhiệm vụ
          </h2>
          <Link to={ROUTES.SOS_REQUEST_LIST} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </Link>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[180px] pr-1">
          {missionProgress.slice(0, 4).map((mission: any, idx: number) => (
            <div key={idx} className="space-y-1.5 group cursor-help transition-all duration-150 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700/20">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-900 dark:text-white truncate max-w-[70%] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150">{mission.name}</span>
                <span className="text-gray-400 truncate max-w-[25%]">{mission.team}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${mission.color || 'bg-blue-500'} rounded-full transition-all duration-300 group-hover:brightness-110`}
                    style={{ width: `${mission.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-black w-8 text-right group-hover:scale-105 transition-transform duration-150">{mission.percent}%</span>
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
          <Link to={ROUTES.SOS_REQUEST_LIST} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </Link>
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
