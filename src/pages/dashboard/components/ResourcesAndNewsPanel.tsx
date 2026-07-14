import { Package, BookOpen, Calendar } from 'lucide-react';

const inventoryResources = [
  { name: 'Nước uống (chai)', current: '12.500', target: '20.000', percent: 62.5, color: 'bg-blue-500' },
  { name: 'Lương thực (kg)', current: '8.200', target: '15.000', percent: 54.7, color: 'bg-amber-500' },
  { name: 'Áo phao (cái)', current: '1.150', target: '3.000', percent: 38.3, color: 'bg-orange-500' },
  { name: 'Thuốc men (bộ)', current: '680', target: '1.500', percent: 45.3, color: 'bg-emerald-500' },
  { name: 'Chăn mền (cái)', current: '2.300', target: '5.000', percent: 46.0, color: 'bg-red-500' },
  { name: 'Đèn pin (cái)', current: '450', target: '1.000', percent: 45.0, color: 'bg-blue-500' }
];

const newsFeed = [
  { date: '01/06/2026', title: 'Cập nhật tình hình mưa lũ tại Hòa Bình', desc: 'Mực nước sông Đà tiếp tục dâng cao, người dân...' },
  { date: '01/06/2026', title: 'Hướng dẫn an toàn khi có lũ quét', desc: 'Các biện pháp bảo vệ bản thân và gia đình...' },
  { date: '31/05/2026', title: 'Cảm ơn các nhà hảo tâm', desc: 'Tổng hợp danh sách các tổ chức, cá nhân đóng góp...' }
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

export default function ResourcesAndNewsPanel() {
  const donationTrend: number[] = [10, 18, 17, 27, 30, 47, 34, 27, 28, 18, 13, 18, 26, 23, 25, 33];
  
  // Map points for the area chart
  const maxVal = 50;
  const chartHeight = 50;
  const chartWidth = 200;
  const points = donationTrend.map((val, i) => {
    const x = (i / (donationTrend.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * 40; // Keep padding
    return [x, y] as [number, number];
  });

  const linePath = getBezierPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1][0]} ${chartHeight} L ${points[0][0]} ${chartHeight} Z`
    : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Tình hình vật tư cứu trợ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Package size={16} className="text-blue-500" />
            <span>Tình hình vật tư cứu trợ</span>
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3">
          {inventoryResources.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-500 truncate max-w-[60%]">{item.name}</span>
                <span className="text-gray-900 dark:text-white">
                  {item.current} <span className="text-gray-400 font-medium">/ {item.target}</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tổng đóng góp (Area chart) */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Tổng đóng góp
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem chi tiết
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số tiền</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">1.245.000.000 đ</p>
          <p className="text-[11px] text-emerald-500 font-bold mt-1">
            ↑ 18% <span className="text-gray-400 font-medium">so với 7 ngày trước</span>
          </p>
        </div>

        {/* Area chart representation using SVG */}
        <div className="h-20 w-full mt-4">
          <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00" />
              </linearGradient>
            </defs>
            <path
              d={areaPath}
              fill="url(#purpleGrad)"
            />
            <path
              d={linePath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {points.length > 0 && (
              <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />
            )}
          </svg>
        </div>
      </div>

      {/* Tin tức & thông báo */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <BookOpen size={16} className="text-purple-500" />
            <span>Tin tức & thông báo</span>
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3.5 flex-1">
          {newsFeed.map((news, idx) => (
            <div key={idx} className="flex gap-3 items-start text-xs">
              <div className="p-2 bg-slate-50 dark:bg-gray-700/40 text-gray-400 dark:text-gray-300 rounded-xl">
                <Calendar size={14} />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold">{news.date}</p>
                <p className="font-bold text-gray-900 dark:text-white truncate">
                  {news.title}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {news.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
