import { MapPin, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SosRequestItem } from './mockData';

interface RequestCardProps {
  request: SosRequestItem;
  isSelected: boolean;
  onClick: () => void;
}

const statusBadges: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'MỚI', style: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30' },
  DISPATCHED: { label: 'ĐANG XÁC MINH', style: 'bg-orange-50 text-orange-650 border-orange-200 dark:bg-orange-950/40 dark:text-orange-450 dark:border-orange-900/30' },
  ON_SITE: { label: 'ĐÃ XÁC NHẬN', style: 'bg-emerald-50 text-emerald-650 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' },
  RESOLVED: { label: 'HOÀN THÀNH', style: 'bg-blue-50 text-blue-650 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30' },
  CANCELLED: { label: 'ĐÃ TỪ CHỐI', style: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
};

export default function RequestCard({ request, isSelected, onClick }: RequestCardProps) {
  const badge = statusBadges[request.status] || statusBadges.PENDING;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border transition duration-200 cursor-pointer text-left relative flex flex-col gap-2.5",
        isSelected
          ? "border-blue-500 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/10 shadow-sm"
          : "border-slate-150 bg-white dark:border-gray-800 dark:bg-gray-900 hover:border-slate-300 dark:hover:border-gray-700 hover:shadow-xs"
      )}
    >
      {/* Indicator red dot if PENDING */}
      {request.status === 'PENDING' && (
        <div className="absolute left-2.5 top-4.5 w-1.5 h-1.5 bg-red-600 rounded-full" />
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between min-w-0 pl-1">
        <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 tracking-wide uppercase">
          {request.code}
        </span>
        <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border flex-shrink-0", badge.style)}>
          {badge.label}
        </span>
      </div>

      {/* Title Description */}
      <h4 className="text-xs font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
        {request.title}
      </h4>

      {/* Location & Time details */}
      <div className="flex items-center justify-between text-[10px] text-gray-450 dark:text-gray-500 font-semibold border-t border-slate-50 dark:border-gray-800/60 pt-2">
        <span className="flex items-center gap-1 min-w-0 truncate">
          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{request.locationName}</span>
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          <Clock size={11} className="text-gray-400" />
          <span>
            {request.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
            {request.createdAt.toLocaleDateString('vi-VN')}
          </span>
        </span>
      </div>
    </div>
  );
}
