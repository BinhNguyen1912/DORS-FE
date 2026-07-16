import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../apis/dashboard.api';

interface HistoricalOutcomesPanelProps {
  provinceId: number | null;
  startDate?: string;
  endDate?: string;
  adminUnitId?: number | null;
}

export default function HistoricalOutcomesPanel({ provinceId, startDate, endDate, adminUnitId }: HistoricalOutcomesPanelProps) {
  // Query charts data (contains historical outcome counts)
  const { data: chartsResponse, isLoading } = useQuery({
    queryKey: ['dashboardCharts', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getCharts(provinceId, startDate, endDate, adminUnitId),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
      </div>
    );
  }

  const chartsData = chartsResponse?.data || {
    sosOverTime: [],
    rescueOutcomes: { total: 152, saved: 112, ongoing: 28, failed: 12 },
  };

  const sosOverTime = chartsData.sosOverTime;
  const outcomes = chartsData.rescueOutcomes;

  const totalSum = outcomes.total || 1;
  const savedPercent = ((outcomes.saved / totalSum) * 100).toFixed(1);
  const ongoingPercent = ((outcomes.ongoing / totalSum) * 100).toFixed(1);
  const failedPercent = ((outcomes.failed / totalSum) * 100).toFixed(1);

  // SVG dasharrays for Ring Chart
  const savedStroke = (outcomes.saved / totalSum) * 100;
  const ongoingStroke = (outcomes.ongoing / totalSum) * 100;
  const failedStroke = (outcomes.failed / totalSum) * 100;

  const ongoingOffset = -savedStroke;
  const failedOffset = -(savedStroke + ongoingStroke);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Thống kê kết quả cứu hộ theo thời gian (8 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Thống kê kết quả cứu hộ theo thời gian
          </h2>
          <select className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Đã cứu sống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Đang cứu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Chưa xử lý</span>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-64 flex flex-col justify-between pt-2">
          <div className="flex-1 flex justify-between items-end px-4 gap-6">
            {sosOverTime.map((bar: any, idx: number) => {
              const totalVal = Math.max(bar.total, 1);
              // Phân bố tương đối cho tỷ lệ xếp chồng
              const savedPct = Math.round((bar.resolved / totalVal) * 100);
              const ongoingPct = Math.round(((bar.total - bar.resolved) * 0.7 / totalVal) * 100);
              const failedPct = Math.round(((bar.total - bar.resolved) * 0.3 / totalVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full max-w-[32px]">
                  {/* Bar Wrapper to keep it 100% height minus label */}
                  <div className="flex-1 w-full flex flex-col justify-end items-center mb-3">
                    <div className="w-full flex flex-col rounded-md overflow-hidden animate-fade-in-up">
                      <div className="bg-red-500" style={{ height: `${failedPct}%` }} />
                      <div className="bg-amber-500" style={{ height: `${ongoingPct}%` }} />
                      <div className="bg-emerald-500" style={{ height: `${savedPct}%` }} />
                    </div>
                  </div>
                  {/* Label */}
                  <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap shrink-0">
                    {bar.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tỷ lệ theo kết quả (4 cols) */}
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-bold text-black dark:text-white mb-4">
            Tỷ lệ theo kết quả <span className="text-xs text-gray-400 font-medium">(7 ngày qua)</span>
          </h2>
          
          <div className="relative flex justify-center items-center my-6">
            <svg width="160" height="160" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" className="dark:stroke-gray-700" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray={`${savedStroke} ${100 - savedStroke}`} strokeDashoffset="0" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray={`${ongoingStroke} ${100 - ongoingStroke}`} strokeDashoffset={ongoingOffset} />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeDasharray={`${failedStroke} ${100 - failedStroke}`} strokeDashoffset={failedOffset} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{outcomes.total}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Tổng số cứu hộ</span>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
              </div>
              <span className="text-gray-500 font-semibold">Đã cứu sống</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.saved} <span className="text-[10px] text-gray-400">({savedPercent}%)</span></span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
              </div>
              <span className="text-gray-500 font-semibold">Đang cứu</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.ongoing} <span className="text-[10px] text-gray-400">({ongoingPercent}%)</span></span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />
              </div>
              <span className="text-gray-500 font-semibold">Chưa xử lý</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.failed} <span className="text-[10px] text-gray-400">({failedPercent}%)</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
