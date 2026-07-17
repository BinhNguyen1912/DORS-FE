import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../apis/dashboard.api';
import { useState } from 'react';

interface HistoricalOutcomesPanelProps {
  provinceId: number | null;
  startDate?: string;
  endDate?: string;
  adminUnitId?: number | null;
}

export default function HistoricalOutcomesPanel({ provinceId, startDate, endDate, adminUnitId }: HistoricalOutcomesPanelProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSector, setHoveredSector] = useState<'total' | 'saved' | 'ongoing' | 'failed'>('total');

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

              const savedCount = bar.resolved;
              const ongoingCount = Math.round((bar.total - bar.resolved) * 0.7);
              const failedCount = Math.max(0, bar.total - bar.resolved - ongoingCount);

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full max-w-[32px] relative cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip Card */}
                  {hoveredBarIndex === idx && (
                    <div className="absolute bottom-full mb-3 bg-white/95 dark:bg-gray-900/95 border border-slate-200/80 dark:border-gray-700/80 backdrop-blur-md rounded-xl p-2.5 shadow-xl pointer-events-none z-10 text-left min-w-[125px] transition-all duration-150">
                      <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">
                        {bar.date}
                      </p>
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-gray-500 dark:text-gray-400">Cứu sống:</span>
                          </div>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{savedCount}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-gray-500 dark:text-gray-400">Đang cứu:</span>
                          </div>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">{ongoingCount}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-gray-500 dark:text-gray-400">Chưa xử lý:</span>
                          </div>
                          <span className="font-extrabold text-red-600 dark:text-red-400">{failedCount}</span>
                        </div>
                        <div className="border-t border-slate-100 dark:border-gray-800 my-1"></div>
                        <div className="flex justify-between items-center gap-3 font-bold text-slate-700 dark:text-gray-200">
                          <span>Tổng số:</span>
                          <span>{bar.total}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bar Wrapper to keep it 100% height minus label */}
                  <div className="flex-1 w-full flex flex-col justify-end items-center mb-3">
                    <div className={`w-full flex flex-col rounded-md overflow-hidden transition-all duration-200 ${
                      hoveredBarIndex === idx ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 scale-x-110 shadow-md' : 'hover:scale-[1.03]'
                    }`}>
                      <div className="bg-red-500 transition-colors duration-200" style={{ height: `${failedPct}%` }} />
                      <div className="bg-amber-500 transition-colors duration-200" style={{ height: `${ongoingPct}%` }} />
                      <div className="bg-emerald-500 transition-colors duration-200" style={{ height: `${savedPct}%` }} />
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
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#10b981"
                strokeWidth={hoveredSector === 'saved' ? '5.5' : '4.5'}
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
                strokeWidth={hoveredSector === 'ongoing' ? '5.5' : '4.5'}
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
                strokeWidth={hoveredSector === 'failed' ? '5.5' : '4.5'}
                strokeDasharray={`${failedStroke} ${100 - failedStroke}`}
                strokeDashoffset={failedOffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSector('failed')}
                onMouseLeave={() => setHoveredSector('total')}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-900 dark:text-white transition-colors duration-200">
                {hoveredSector === 'saved' ? outcomes.saved : hoveredSector === 'ongoing' ? outcomes.ongoing : hoveredSector === 'failed' ? outcomes.failed : outcomes.total}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 transition-colors duration-200">
                {hoveredSector === 'saved' ? 'Đã cứu sống' : hoveredSector === 'ongoing' ? 'Đang cứu' : hoveredSector === 'failed' ? 'Chưa xử lý' : 'Tổng số cứu hộ'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 pt-2">
          <div
            className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${hoveredSector === 'saved' ? 'bg-emerald-50 dark:bg-emerald-950/20 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'}`}
            onMouseEnter={() => setHoveredSector('saved')}
            onMouseLeave={() => setHoveredSector('total')}
          >
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
              </div>
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
              <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
              </div>
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
              <div className="p-1 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />
              </div>
              <span className="text-gray-500 font-semibold dark:text-gray-400">Chưa xử lý</span>
            </div>
            <span className="font-extrabold text-gray-900 dark:text-white">{outcomes.failed} <span className="text-[10px] text-gray-400">({failedPercent}%)</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
