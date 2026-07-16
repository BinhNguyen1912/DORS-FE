import { Package, RefreshCw } from 'lucide-react';
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

interface ResourcesAndNewsPanelProps {
  provinceId: number | null;
  startDate?: string;
  endDate?: string;
  adminUnitId?: number | null;
}

export default function ResourcesAndNewsPanel({ provinceId, startDate, endDate, adminUnitId }: ResourcesAndNewsPanelProps) {
  // Query dữ liệu vật tư và tài chính từ Backend
  const { data: resourcesResponse, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['dashboardResources', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getResources(provinceId, startDate, endDate, adminUnitId),
  });

  // Query dữ liệu tin tức (sử dụng alerts thiên tai để tạo feed tin tức)
  const { data: alertsResponse, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboardAlerts', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getAlerts(provinceId, startDate, endDate, adminUnitId),
  });

  if (isResourcesLoading || isAlertsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-60" />
        ))}
      </div>
    );
  }

  const resourcesData = resourcesResponse?.data || {
    inventory: [],
    donations: { totalAmount: 1245000000, trendPercent: 18, sparkline: [10, 20, 15, 30] },
  };

  const alertsData = alertsResponse?.data || { disasters: [] };

  const inventory = resourcesData.inventory;
  const donations = resourcesData.donations;

  // Lập sơ đồ biểu đồ đóng góp tài chính
  const donationTrend = donations.sparkline;
  const maxVal = Math.max(...donationTrend, 10);
  const chartHeight = 50;
  const chartWidth = 200;
  const points = donationTrend.map((val: number, i: number) => {
    const x = (i / (donationTrend.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * 40;
    return [x, y] as [number, number];
  });

  const linePath = getBezierPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1][0]} ${chartHeight} L ${points[0][0]} ${chartHeight} Z`
    : '';

  // Tin tức từ bản ghi thiên tai
  const latestNews = alertsData.disasters.length > 0 
    ? alertsData.disasters.map((d: any) => ({
        date: d.time,
        title: d.title,
        desc: d.desc,
      }))
    : [
        { date: '01/06/2026', title: 'Phát động quyên góp đợt 2', desc: 'Ủy ban MTTQ Việt Nam phát động đợt quyên góp hỗ trợ...' },
        { date: '31/05/2026', title: 'Cảm ơn các nhà hảo tâm', desc: 'Tổng hợp danh sách các tổ chức, cá nhân đóng góp...' },
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Tình hình vật tư cứu trợ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white flex items-center gap-1.5">
            <Package size={16} className="text-blue-500" />
            <span>Tình hình vật tư cứu trợ</span>
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3">
          {inventory.slice(0, 4).map((item: any, idx: number) => (
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
          <h2 className="text-sm font-bold text-black dark:text-white">
            Tổng đóng góp
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem chi tiết
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số tiền</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {donations.totalAmount.toLocaleString('vi-VN')} đ
          </p>
          <p className="text-[11px] text-emerald-500 font-bold mt-1">
            ↑ {donations.trendPercent}% <span className="text-gray-400 font-medium">so với 7 ngày trước</span>
          </p>
        </div>

        {/* Area chart representation using SVG */}
        <div className="h-20 w-full mt-4">
          {points.length > 0 ? (
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
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">Không có dữ liệu đóng góp</div>
          )}
        </div>
      </div>

      {/* Tin tức & thông báo */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white flex items-center gap-1.5">
            <RefreshCw size={16} className="text-emerald-500" />
            <span>Tin tức & thông báo</span>
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[180px] pr-1">
          {latestNews.slice(0, 3).map((news: any, idx: number) => (
            <div key={idx} className="space-y-1">
              <span className="text-[9px] font-extrabold text-gray-400">{news.date}</span>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug hover:text-indigo-600 cursor-pointer truncate">
                {news.title}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed truncate">
                {news.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
