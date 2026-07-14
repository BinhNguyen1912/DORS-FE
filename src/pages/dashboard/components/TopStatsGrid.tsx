import { Home, Users, AlertTriangle, Shield, Heart } from 'lucide-react';
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

interface TopStatsGridProps {
  provinceId: number | null;
}

export default function TopStatsGrid({ provinceId }: TopStatsGridProps) {
  // Query stats thực tế từ Backend
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['dashboardStats', provinceId],
    queryFn: () => dashboardApi.getStats(provinceId),
  });

  const statsData = statsResponse?.data || {
    totalHouseholds: { value: 0, trend: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    activeRescueTeams: { value: 0, trend: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    activeSosRequests: { value: 0, trend: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    ongoingDisasters: { value: 0, trend: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
    totalDonations: { value: 0, trend: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
  };

  const topStats = [
    {
      title: 'Hộ dân trong hệ thống',
      value: statsData.totalHouseholds.value.toLocaleString('vi-VN'),
      subText: `${statsData.totalHouseholds.trend}%`,
      subTextDesc: 'so với 7 ngày trước',
      trend: statsData.totalHouseholds.trend >= 0 ? 'up' : 'down',
      color: '#3b82f6',
      sparkline: statsData.totalHouseholds.sparkline,
      icon: Home,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Đội cứu hộ hoạt động',
      value: statsData.activeRescueTeams.value.toLocaleString('vi-VN'),
      subText: `+${statsData.activeRescueTeams.trend}`,
      subTextDesc: 'đội mới thành lập',
      trend: 'up',
      color: '#10b981',
      sparkline: statsData.activeRescueTeams.sparkline,
      icon: Users,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'SOS đang hoạt động',
      value: statsData.activeSosRequests.value.toLocaleString('vi-VN'),
      subText: `${Math.abs(statsData.activeSosRequests.trend)} ca`,
      subTextDesc: statsData.activeSosRequests.trend >= 0 ? 'tăng so với hôm qua' : 'giảm so với hôm qua',
      trend: statsData.activeSosRequests.trend >= 0 ? 'up' : 'down',
      color: '#f59e0b',
      sparkline: statsData.activeSosRequests.sparkline,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Thiên tai đang diễn ra',
      value: statsData.ongoingDisasters.value.toLocaleString('vi-VN'),
      subText: `${statsData.ongoingDisasters.trend} điểm nóng`,
      subTextDesc: 'cần lưu ý đặc biệt',
      trend: 'up',
      color: '#ef4444',
      sparkline: statsData.ongoingDisasters.sparkline,
      icon: Shield,
      iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
    },
    {
      title: 'Tổng đóng góp tài chính',
      value: `${(statsData.totalDonations.value / 1000000).toLocaleString('vi-VN')} tr đ`,
      subText: `${statsData.totalDonations.trend}%`,
      subTextDesc: 'tăng trưởng tài trợ',
      trend: 'up',
      color: '#8b5cf6',
      sparkline: statsData.totalDonations.sparkline,
      icon: Heart,
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {topStats.map((stat, idx) => {
        const Icon = stat.icon;
        
        // Calculate points coordinates
        const maxVal = Math.max(...stat.sparkline);
        const points = stat.sparkline.map((val: number, i: number) => {
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
