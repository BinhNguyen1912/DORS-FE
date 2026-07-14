import { Home, Users, AlertTriangle, Shield, Heart } from 'lucide-react';

const topStats = [
  {
    title: 'Hộ dân trong hệ thống',
    value: '2.458',
    subText: '12.5%',
    subTextDesc: 'so với 7 ngày trước',
    trend: 'up',
    color: '#3b82f6',
    sparkline: [20, 25, 15, 30, 22, 35, 28],
    icon: Home,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Đội cứu hộ',
    value: '11',
    subText: '8 đội',
    subTextDesc: 'đang hoạt động',
    trend: 'up',
    color: '#10b981',
    sparkline: [5, 6, 8, 7, 8, 9, 8],
    icon: Users,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
  },
  {
    title: 'SOS đang hoạt động',
    value: '27',
    subText: '5',
    subTextDesc: 'so với 7 ngày trước',
    trend: 'up',
    color: '#f59e0b',
    sparkline: [15, 20, 18, 25, 22, 27, 24],
    icon: AlertTriangle,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
  },
  {
    title: 'Thiên tai đang diễn ra',
    value: '3',
    subText: '2 khu vực',
    subTextDesc: 'ảnh hưởng',
    trend: 'down',
    color: '#ef4444',
    sparkline: [4, 5, 4, 3, 3, 2, 3],
    icon: Shield,
    iconBg: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
  },
  {
    title: 'Tổng đóng góp',
    value: '1.245.000.000 đ',
    subText: '18%',
    subTextDesc: 'so với 7 ngày trước',
    trend: 'up',
    color: '#8b5cf6',
    sparkline: [800, 950, 1100, 1050, 1150, 1200, 1245],
    icon: Heart,
    iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
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

export default function TopStatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {topStats.map((stat, idx) => {
        const Icon = stat.icon;
        
        // Calculate points coordinates
        const maxVal = Math.max(...stat.sparkline);
        const points = stat.sparkline.map((val, i) => {
          const x = (i / (stat.sparkline.length - 1)) * 100;
          const y = 30 - (val / (maxVal || 1)) * 22; // Keep padding from top/bottom
          return [x, y] as [number, number];
        });

        const linePath = getBezierPath(points);
        const areaPath = points.length > 0 
          ? `${linePath} L ${points[points.length - 1][0]} 30 L ${points[0][0]} 30 Z`
          : '';

        const gradId = `spark-grad-${idx}`;

        return (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-black dark:text-white uppercase tracking-wider leading-none">
                  {stat.title}
                </span>
                <p className="text-2xl font-black text-gray-900 dark:text-white pt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                <Icon size={18} />
              </div>
            </div>

            {/* Sparkline & Subtext */}
            <div className="mt-4 space-y-2">
              <div className="h-8 w-full flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stat.color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={stat.color} stopOpacity="0.00" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area fill */}
                  <path d={areaPath} fill={`url(#${gradId})`} />
                  
                  {/* Smooth line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={stat.color}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className={stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}>
                  {stat.trend === 'up' ? '↑' : '↓'} {stat.subText}
                </span>
                <span className="text-gray-400 font-medium">{stat.subTextDesc}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
