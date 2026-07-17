import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { dashboardApi } from '../../../apis/dashboard.api';
import { useState, useMemo } from 'react';

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
    const length = o.length * 0.12; // Hệ số căng nhỏ hơn để đường cong thanh mảnh, tự nhiên
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
  startDate?: string;
  endDate?: string;
  adminUnitId?: number | null;
}

export default function MainChartsPanel({ provinceId, adminUnitId }: MainChartsPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSector, setHoveredSector] = useState<'total' | 'saved' | 'ongoing' | 'failed'>('total');
  const [daysRange, setDaysRange] = useState(7);

  // Compute effective start date based on daysRange select state
  const effectiveStartDate = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - (daysRange - 1));
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [daysRange]);

  const effectiveEndDate = useMemo(() => {
    const end = new Date();
    const yyyy = end.getFullYear();
    const mm = String(end.getMonth() + 1).padStart(2, '0');
    const dd = String(end.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Query dữ liệu biểu đồ từ Backend API
  const { data: chartsResponse, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboardCharts', provinceId, effectiveStartDate, effectiveEndDate, adminUnitId],
    queryFn: () => dashboardApi.getCharts(provinceId, effectiveStartDate, effectiveEndDate, adminUnitId),
  });

  // Query dữ liệu cảnh báo từ Backend API
  const { data: alertsResponse, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboardAlerts', provinceId, effectiveStartDate, effectiveEndDate, adminUnitId],
    queryFn: () => dashboardApi.getAlerts(provinceId, effectiveStartDate, effectiveEndDate, adminUnitId),
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
          <select 
            value={daysRange} 
            onChange={(e) => setDaysRange(Number(e.target.value))}
            className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-650 dark:text-gray-300 cursor-pointer focus:outline-none"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
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

              {/* Y-Axis Line */}
              <line x1="30" y1={startY} x2="30" y2={chartHeight} stroke="#94a3b8" strokeWidth="1" className="dark:stroke-gray-600" />

              {/* Y-Axis Labels */}
              <text x="24" y="183" textAnchor="end" fontSize="8" fontWeight="bold" fill="#94a3b8">0</text>
              <text x="24" y="103" textAnchor="end" fontSize="8" fontWeight="bold" fill="#94a3b8">{Math.round(maxVal * 0.5)}</text>
              <text x="24" y="23" textAnchor="end" fontSize="8" fontWeight="bold" fill="#94a3b8">{maxVal}</text>

              {/* Default Horizontal Projection Lines for latest date (when not hovering) */}
              {hoveredIndex === null && totalPoints.length > 0 && (
                <>
                  <line x1="30" y1={totalPoints[totalPoints.length - 1][1]} x2={totalPoints[totalPoints.length - 1][0]} y2={totalPoints[totalPoints.length - 1][1]} stroke="#3b82f6" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.6" />
                  <line x1="30" y1={resolvedPoints[resolvedPoints.length - 1][1]} x2={resolvedPoints[resolvedPoints.length - 1][0]} y2={resolvedPoints[resolvedPoints.length - 1][1]} stroke="#10b981" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.6" />
                  <line x1="30" y1={pendingPoints[pendingPoints.length - 1][1]} x2={pendingPoints[pendingPoints.length - 1][0]} y2={pendingPoints[pendingPoints.length - 1][1]} stroke="#ef4444" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.6" />
                </>
              )}

              {/* Dynamic Horizontal Projection Lines on Hover */}
              {hoveredIndex !== null && (
                <>
                  <line x1="30" y1={totalPoints[hoveredIndex][1]} x2={totalPoints[hoveredIndex][0]} y2={totalPoints[hoveredIndex][1]} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="2,2" />
                  <line x1="30" y1={resolvedPoints[hoveredIndex][1]} x2={resolvedPoints[hoveredIndex][0]} y2={resolvedPoints[hoveredIndex][1]} stroke="#10b981" strokeWidth="1.2" strokeDasharray="2,2" />
                  <line x1="30" y1={pendingPoints[hoveredIndex][1]} x2={pendingPoints[hoveredIndex][0]} y2={pendingPoints[hoveredIndex][1]} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2,2" />
                </>
              )}
              
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

              {/* Active Dotted Hover Line */}
              {hoveredIndex !== null && totalPoints[hoveredIndex] && (
                <line
                  x1={totalPoints[hoveredIndex][0]}
                  y1={startY}
                  x2={totalPoints[hoveredIndex][0]}
                  y2={chartHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  className="dark:stroke-gray-600"
                />
              )}

              {/* Data Dots for the latest date (only visible when not hovering) */}
              {hoveredIndex === null && (
                <>
                  {totalPoints.length > 0 && (
                    <circle cx={totalPoints[totalPoints.length - 1][0]} cy={totalPoints[totalPoints.length - 1][1]} r="3" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
                  )}
                  {resolvedPoints.length > 0 && (
                    <circle cx={resolvedPoints[resolvedPoints.length - 1][0]} cy={resolvedPoints[resolvedPoints.length - 1][1]} r="3" fill="#10b981" stroke="#fff" strokeWidth="1" />
                  )}
                  {pendingPoints.length > 0 && (
                    <circle cx={pendingPoints[pendingPoints.length - 1][0]} cy={pendingPoints[pendingPoints.length - 1][1]} r="3" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                  )}
                </>
              )}

              {/* Hovered points dots */}
              {hoveredIndex !== null && (
                <>
                  <circle
                    cx={totalPoints[hoveredIndex][0]}
                    cy={totalPoints[hoveredIndex][1]}
                    r="4.5"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={resolvedPoints[hoveredIndex][0]}
                    cy={resolvedPoints[hoveredIndex][1]}
                    r="4.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={pendingPoints[hoveredIndex][0]}
                    cy={pendingPoints[hoveredIndex][1]}
                    r="4.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </>
              )}

              {/* Invisible Hover Rectangles */}
              {sosOverTime.map((_: any, i: number) => {
                const x = startX + (i / (sosOverTime.length - 1)) * chartWidth;
                const colWidth = chartWidth / (sosOverTime.length - 1);
                const rectX = i === 0 ? 30 : x - colWidth / 2;
                const rectW = i === 0 || i === sosOverTime.length - 1 ? colWidth / 2 : colWidth;
                return (
                  <rect
                    key={i}
                    x={rectX}
                    y={0}
                    width={rectW}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">Không có dữ liệu đồ thị</div>
          )}

          {/* Tooltip Card */}
          {hoveredIndex !== null && sosOverTime[hoveredIndex] && (
            <div
              className="absolute bg-white/95 dark:bg-gray-950/95 border border-slate-200/80 dark:border-gray-700/80 backdrop-blur-md rounded-xl p-3 shadow-xl pointer-events-none transition-all duration-150 z-25 text-left"
              style={{
                left: `${(totalPoints[hoveredIndex][0] / 500) * 100}%`,
                top: `10px`,
                transform: `translateX(${hoveredIndex > sosOverTime.length / 2 ? '-105%' : '5%'})`,
              }}
            >
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                Ngày {sosOverTime[hoveredIndex].date}
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Tổng SOS:</span>
                  </div>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {sosOverTime[hoveredIndex].total}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Đã xử lý:</span>
                  </div>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {sosOverTime[hoveredIndex].resolved}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Chưa xử lý:</span>
                  </div>
                  <span className="font-extrabold text-red-600 dark:text-red-400">
                    {sosOverTime[hoveredIndex].pending}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* X Axis Labels */}
          <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-2 px-6">
            {sosOverTime.map((d: any, i: number) => {
              if (sosOverTime.length > 10) {
                const isFirst = i === 0;
                const isLast = i === sosOverTime.length - 1;
                const isStep = i % 5 === 0;
                if (!isFirst && !isLast && !isStep) {
                  return <span key={i} className="invisible w-0" />;
                }
              }
              return (
                <span key={i} className="truncate max-w-[35px] text-center">
                  {d.date}
                </span>
              );
            })}
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
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#10b981"
              strokeWidth={hoveredSector === 'saved' ? '4.5' : '3.5'}
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
              stroke="#f59e0b"
              strokeWidth={hoveredSector === 'ongoing' ? '4.5' : '3.5'}
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
              stroke="#ef4444"
              strokeWidth={hoveredSector === 'failed' ? '4.5' : '3.5'}
              strokeDasharray={`${failedStroke} ${100 - failedStroke}`}
              strokeDashoffset={failedOffset}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredSector('failed')}
              onMouseLeave={() => setHoveredSector('total')}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none transition-colors duration-200">
              {hoveredSector === 'saved' ? 'Đã cứu sống' : hoveredSector === 'ongoing' ? 'Đang cứu' : hoveredSector === 'failed' ? 'Chưa xử lý' : 'Tổng cộng'}
            </span>
            <span className={`text-xl font-black mt-1 transition-colors duration-200 ${
              hoveredSector === 'saved' ? 'text-emerald-500' : hoveredSector === 'ongoing' ? 'text-amber-500' : hoveredSector === 'failed' ? 'text-red-500' : 'text-gray-900 dark:text-white'
            }`}>
              {hoveredSector === 'saved' ? outcomes.saved : hoveredSector === 'ongoing' ? outcomes.ongoing : hoveredSector === 'failed' ? outcomes.failed : outcomes.total}
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <div
            className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${hoveredSector === 'saved' ? 'bg-emerald-50 dark:bg-emerald-950/20 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('saved')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-500 font-semibold dark:text-gray-400">Đã cứu sống</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.saved} <span className="text-[10px] text-gray-400">({savedPercent}%)</span></span>
          </div>
          <div
            className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${hoveredSector === 'ongoing' ? 'bg-amber-50 dark:bg-amber-950/20 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('ongoing')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-gray-500 font-semibold dark:text-gray-400">Đang cứu</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.ongoing} <span className="text-[10px] text-gray-400">({ongoingPercent}%)</span></span>
          </div>
          <div
            className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${hoveredSector === 'failed' ? 'bg-red-50 dark:bg-red-950/20 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('failed')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-gray-500 font-semibold dark:text-gray-400">Chưa xử lý</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.failed} <span className="text-[10px] text-gray-400">({failedPercent}%)</span></span>
          </div>
        </div>
      </div>

      {/* Yêu cầu cứu hộ khẩn cấp (3 cols) */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Yêu cầu cứu hộ khẩn cấp
          </h2>
          <Link to={ROUTES.SOS_REQUEST_LIST} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </Link>
        </div>

        <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[220px]">
          {alertsData.latestSos.length > 0 ? (
            alertsData.latestSos.map((sos: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="p-2 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl mt-0.5 animate-pulse shrink-0">
                  <AlertTriangle size={15} />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {sos.title}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold leading-none shrink-0 ${
                      sos.status === 'RESOLVED' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : sos.status === 'PENDING'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {sos.status === 'RESOLVED' ? 'Đã xong' : sos.status === 'PENDING' ? 'Chờ xử lý' : 'Đang cứu'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {sos.address}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>{sos.time}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-gray-400">
              Không có yêu cầu SOS nào
            </div>
          )}
        </div>

        <Link to={ROUTES.SOS_REQUEST_LIST} className="w-full mt-4 py-2 bg-slate-50 dark:bg-gray-700/40 hover:bg-slate-100/80 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors flex items-center justify-center gap-1">
          <span>Xem tất cả yêu cầu</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
