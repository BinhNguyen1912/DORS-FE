import { AlertTriangle, ArrowRight } from 'lucide-react';

const sosOverTime = [
  { date: '26/05', total: 32, resolved: 12, pending: 20 },
  { date: '27/05', total: 60, resolved: 28, pending: 32 },
  { date: '28/05', total: 86, resolved: 35, pending: 51 },
  { date: '29/05', total: 70, resolved: 30, pending: 40 },
  { date: '30/05', total: 56, resolved: 26, pending: 30 },
  { date: '31/05', total: 71, resolved: 41, pending: 30 },
  { date: '01/06', total: 88, resolved: 58, pending: 30 }
];

const emergencyAlerts = [
  {
    title: 'Lũ quét tại Hòa Bình',
    badge: 'NGUY HIỂM',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    desc: 'Mưa lớn gây lũ quét trên diện rộng',
    time: '10 phút trước',
    statusDot: 'bg-red-500'
  },
  {
    title: 'Ngập lụt tại Quảng Trị',
    badge: 'CẢNH BÁO',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    desc: 'Mực nước dâng cao, nguy cơ ngập sâu',
    time: '30 phút trước',
    statusDot: 'bg-amber-500'
  },
  {
    title: 'Sạt lở tại Lào Cai',
    badge: 'CẢNH BÁO',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    desc: 'Nguy cơ sạt lở đất tại khu vực đồi núi',
    time: '1 giờ trước',
    statusDot: 'bg-amber-500'
  }
];

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

export default function MainChartsPanel() {
  // Map points dynamically
  const maxVal = 100;
  const chartHeight = 180;
  const chartWidth = 450;
  const startX = 30;
  const startY = 20;

  const totalPoints = sosOverTime.map((d, i) => {
    const x = startX + (i / (sosOverTime.length - 1)) * chartWidth;
    const y = chartHeight - (d.total / maxVal) * (chartHeight - startY);
    return [x, y] as [number, number];
  });

  const resolvedPoints = sosOverTime.map((d, i) => {
    const x = startX + (i / (sosOverTime.length - 1)) * chartWidth;
    const y = chartHeight - (d.resolved / maxVal) * (chartHeight - startY);
    return [x, y] as [number, number];
  });

  const pendingPoints = sosOverTime.map((d, i) => {
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

          {/* X Axis Labels */}
          <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-6">
            {sosOverTime.map((d, i) => (
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
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="73.7 26.3" strokeDashoffset="0" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="18.4 81.6" strokeDashoffset="-73.7" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="7.9 92.1" strokeDashoffset="-92.1" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Tổng</span>
            <span className="text-xl font-black text-gray-900 dark:text-white mt-1">152</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-500 font-semibold">Đã cứu sống</span>
            </div>
            <span className="font-extrabold">112 <span className="text-[10px] text-gray-400">(73.7%)</span></span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-gray-500 font-semibold">Đang cứu</span>
            </div>
            <span className="font-extrabold">28 <span className="text-[10px] text-gray-400">(18.4%)</span></span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-gray-500 font-semibold">Không qua khỏi</span>
            </div>
            <span className="font-extrabold">12 <span className="text-[10px] text-gray-400">(7.9%)</span></span>
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

        <div className="space-y-3.5 flex-1">
          {emergencyAlerts.map((alert, idx) => (
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
