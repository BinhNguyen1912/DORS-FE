import React from 'react';
import { Volume2, FileText, Send, CheckCircle } from 'lucide-react';

interface MetricsHeaderProps {
  totalEvents: number;
  totalTemplates: number;
  sentToday: number;
  successRate: number;
}

export default function MetricsHeader({
  totalEvents,
  totalTemplates,
  sentToday,
  successRate,
}: MetricsHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="bg-white dark:bg-gray-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng sự kiện</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalEvents}</p>
          <span className="text-[9px] text-emerald-500 font-bold mt-1 block">Đang hoạt động trên hệ thống</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <Volume2 size={18} />
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-white dark:bg-gray-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng template</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalTemplates}</p>
          <span className="text-[9px] text-purple-500 font-bold mt-1 block">Mẫu thông báo đã cấu hình</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
          <FileText size={18} />
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white dark:bg-gray-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã gửi hôm nay</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{sentToday}</p>
          <span className="text-[9px] text-emerald-500 font-bold mt-1 block">Lượt gửi tin trong ngày</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <Send size={16} />
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-white dark:bg-gray-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tỷ lệ thành công</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{successRate}%</p>
          <span className="text-[9px] text-emerald-500 font-bold mt-1 block">Độ tin cậy của các kênh</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <CheckCircle size={18} />
        </div>
      </div>
    </div>
  );
}
