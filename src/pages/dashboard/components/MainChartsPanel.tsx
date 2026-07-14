import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../apis/dashboard.api';

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
    const length = o.length * 0.12; // Hệ số căng nhỏ hơn để đường cong tự nhiên, thanh mảnh
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

interface MainChartsPanelProps {
  provinceId: number | null;
}

export default function MainChartsPanel({ provinceId }: MainChartsPanelProps) {
  // Query dữ liệu biểu đồ từ Backend API
  const { data: chartsResponse, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboardCharts', provinceId],
    queryFn: () => dashboardApi.getCharts(provinceId),
  });

  // Query dữ liệu cảnh báo từ Backend API
  const { data: alertsResponse, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboardAlerts', provinceId],
    queryFn: () => dashboardApi.getAlerts(provinceId),
  });

  const chartsData = chartsResponse?.data || {
    sosOverTime: [],
    rescueOutcomes: { total: 152, saved: 112, ongoing: 28, failed: 12 },
  };

  const alertsData = alertsResponse?.data || {
    disasters: [],
    latestSos: [],
  };

  const sosOverTime = chartsData.sosOverTime;
  const outcomes = chartsData.rescueOutcomes;

  // Map points dynamically
  const maxVal = Math.max(...sosOverTime.map((d: any) => d.total), 10);
  const chartHeight = 180;
  const chartWidth = 450;
  const startX = 30;
  const startY = 20;

  const totalPoints = sosOverTime.map((d: any, i: number) => {
    const x = startX + (i / (sosOverTime.length - 1)) * chartWidth;
    const y = chartHeight - (d.total / maxVal) * (chartHeight - startY);
    return [x, y] as [number, number];
  });

  const resolvedPoints = sosOverTime.map((d: any, i: number) => {
    const x = startX + (i / (sosOverTime.length - 1)) * chartWidth;
    const y = chartHeight - (d.resolved / maxVal) * (chartHeight - startY);
    return [x, y] as [number, number];
  });

  const pendingPoints = sosOverTime.map((d: any, i: number) => {
    const x = startX + (i / (sosOverTime.length - 1)) * chartWidth;
    const y = chartHeight - (d.pending / maxVal) * (chartHeight - startY);
    return [x, y] as [number, number];
  });

  const totalPath = getBezierPath(totalPoints);
  const totalArea = totalPoints.length > 0
    ? `${totalPath} L ${totalPoints[totalPoints.length - 1][0]} ${chartHeight} L ${totalPoints[0][0]} ${chartHeight} Z`
    : '';

  const resolvedPath = getBezierPath(resolvedPoints);
  const resolvedArea = resolvedPoints.length > 0
    ? `${resolvedPath} L ${resolvedPoints[resolvedPoints.length - 1][0]} ${chartHeight} L ${resolvedPoints[0][0]} ${chartHeight} Z`
    : '';

  const pendingPath = getBezierPath(pendingPoints);
  const pendingArea = pendingPoints.length > 0
    ? `${pendingPath} L ${pendingPoints[pendingPoints.length - 1][0]} ${chartHeight} L ${pendingPoints[0][0]} ${chartHeight} Z`
    : '';

  if (isChartsLoading || isAlertsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
      </div>
    );
  }

  // Cận tính phần trăm kết quả
  const totalSum = outcomes.total || 1;
  const savedPercent = ((outcomes.saved / totalSum) * 100).toFixed(1);
  const ongoingPercent = ((outcomes.ongoing / totalSum) * 100).toFixed(1);
  const failedPercent = ((outcomes.failed / totalSum) * 100).toFixed(1);

  // SVG dasharrays for the Outcomes Ring
  // total circumference = 2 * PI * 15.915 = 100
  const savedStroke = (outcomes.saved / totalSum) * 100;
  const ongoingStroke = (outcomes.ongoing / totalSum) * 100;
  const failedStroke = (outcomes.failed / totalSum) * 100;

  const ongoingOffset = -savedStroke;
  const failedOffset = -(savedStroke + ongoingStroke);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* SOS Theo thời gian (6 cols) */}
      <div className="lg:col-span-6 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            SOS theo thời gian
          </h2>
          <select className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
          </select>
        </div>

        {/* Legends */}
        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Tổng SOS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Đã xử lý</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Chưa xử lý</span>
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className="h-64 relative w-full pt-2">
          {sosOverTime.length > 0 ? (
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 45, 90, 135, 180].map((y, idx) => (
                <line key={idx} x1="30" y1={y} x2="480" y2={y} stroke="#e2e8f0" strokeDasharray="3,3" className="dark:stroke-gray-700" />
              ))}
              
              {/* Areas */}
              <path d={totalArea} fill="url(#totalGrad)" />
              <path d={resolvedArea} fill="url(#resolvedGrad)" />
              <path d={pendingArea} fill="url(#pendingGrad)" />

              {/* Lines */}
              <path
                d={totalPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d={resolvedPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d={pendingPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.3"
                strokeLinecap="round"
              />

              {/* Data Dots for the latest date */}
              {totalPoints.length > 0 && (
                <circle cx={totalPoints[totalPoints.length - 1][0]} cy={totalPoints[totalPoints.length - 1][1]} r="3" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
              )}
              {resolvedPoints.length > 0 && (
                <circle cx={resolvedPoints[resolvedPoints.length - 1][0]} cy={resolvedPoints[resolvedPoints.length - 1][1]} r="3" fill="#10b981" stroke="#fff" strokeWidth="1" />
              )}
              {pendingPoints.length > 0 && (
                <circle cx={pendingPoints[pendingPoints.length - 1][0]} cy={pendingPoints[pendingPoints.length - 1][1]} r="3" fill="#ef4444" stroke="#fff" strokeWidth="1" />
              )}
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">Không có dữ liệu đồ thị</div>
          )}

          {/* X Axis Labels */}
          <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-6">
            {sosOverTime.map((d: any, i: number) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tỷ lệ kết quả cứu hộ (3 cols) */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <h2 className="text-sm font-bold text-black dark:text-white">
          Tỷ lệ kết quả cứu hộ
        </h2>

        <div className="relative flex justify-center items-center my-6">
          <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" className="dark:stroke-gray-700" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray={`${savedStroke} ${100 - savedStroke}`} strokeDashoffset="0" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray={`${ongoingStroke} ${100 - ongoingStroke}`} strokeDashoffset={ongoingOffset} />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray={`${failedStroke} ${100 - failedStroke}`} strokeDashoffset={failedOffset} />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Tổng</span>
            <span className="text-xl font-black text-gray-900 dark:text-white mt-1">{outcomes.total}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-500 font-semibold">Đã cứu sống</span>
            </div>
            <span className="font-extrabold">{outcomes.saved} <span className="text-[10px] text-gray-400">({savedPercent}%)</span></span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-gray-500 font-semibold">Đang cứu</span>
            </div>
            <span className="font-extrabold">{outcomes.ongoing} <span className="text-[10px] text-gray-400">({ongoingPercent}%)</span></span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-gray-500 font-semibold">Chưa xử lý</span>
            </div>
            <span className="font-extrabold">{outcomes.failed} <span className="text-[10px] text-gray-400">({failedPercent}%)</span></span>
          </div>
        </div>
      </div>

      {/* Cảnh báo khẩn cấp (3 cols) */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Cảnh báo khẩn cấp
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[220px]">
          {alertsData.disasters.map((alert: any, idx: number) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl mt-0.5">
                <AlertTriangle size={15} />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {alert.title}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold leading-none ${alert.badgeColor} shrink-0`}>
                    {alert.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {alert.desc}
                </p>
                <p className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${alert.statusDot}`} />
                  <span>{alert.time}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 py-2 bg-slate-50 dark:bg-gray-700/40 hover:bg-slate-100/80 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors flex items-center justify-center gap-1">
          <span>Xem tất cả cảnh báo</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
