import { MapPin, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SosRequestItem } from './mockData';

interface RequestCardProps {
  request: SosRequestItem;
  isSelected: boolean;
  onClick: () => void;
}

const statusBadges: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'MỚI', style: 'text-red-650 dark:text-red-400 font-extrabold' },
  DISPATCHED: { label: 'ĐANG XÁC MINH', style: 'text-orange-600 dark:text-orange-450 font-extrabold' },
  ON_SITE: { label: 'ĐÃ XÁC NHẬN', style: 'text-emerald-600 dark:text-emerald-450 font-extrabold' },
  RESOLVED: { label: 'HOÀN THÀNH', style: 'text-blue-600 dark:text-blue-450 font-extrabold' },
  CANCELLED: { label: 'ĐÃ TỪ CHỐI', style: 'text-slate-500 dark:text-slate-400 font-semibold' },
};

export default function RequestCard({ request, isSelected, onClick }: RequestCardProps) {
  const badge = statusBadges[request.status] || statusBadges.PENDING;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-2xl transition duration-150 cursor-pointer text-left relative flex flex-col gap-2 border-0 select-none",
        isSelected
          ? "bg-slate-100/70 dark:bg-gray-800"
          : "hover:bg-slate-50/70 dark:hover:bg-gray-850/50"
      )}
    >
      {/* Indicator red dot if PENDING */}
      {request.status === 'PENDING' && (
        <div className="absolute left-2 top-4 w-1.5 h-1.5 bg-red-650 rounded-full" />
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between min-w-0 pl-1.5">
        <span className="text-[10px] font-black text-gray-900 dark:text-slate-100 tracking-wide uppercase">
          {request.code}
        </span>
        <span className={cn("text-[9px] uppercase tracking-wider flex-shrink-0", badge.style)}>
          {badge.label}
        </span>
      </div>

      {/* Title Description */}
      <h4 className="text-xs font-normal text-black dark:text-white leading-snug line-clamp-2 pl-1.5">
        {request.title}
      </h4>

      {/* Location & Time details */}
      <div className="flex items-center justify-between text-[10px] text-gray-550 dark:text-gray-400 font-normal border-t border-slate-100/60 dark:border-gray-800/60 pt-2 pl-1.5">
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
