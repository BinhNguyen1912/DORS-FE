import { useState, useEffect } from 'react';
import { Info, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SosRequest } from '../../../types';
import { ROUTES } from '../../../constants';
import { statusLabels } from './SosDetailModal.types';
import { cn } from '../../../lib/utils';

interface SosDispatchPanelProps {
  sos: SosRequest;
  handleCallPhone: (phone?: string) => void;
}

function StatCol({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal whitespace-nowrap">{label}</span>
      <span className={cn('text-sm font-normal text-gray-900 dark:text-white', valueClass)}>{value}</span>
    </div>
  );
}

export default function SosDispatchPanel({ sos, handleCallPhone }: SosDispatchPanelProps) {
  const hasTeam = !!sos.assignedTeamId;
  const distanceKm = (sos as any).distance_km;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (sos.status !== 'PENDING' && sos.status !== 'PENDING_SPECIALIST') {
      setSecondsLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const createdTime = new Date(sos.createdAt).getTime();
      const elapsed = Math.floor((Date.now() - createdTime) / 1000);
      const remaining = 30 - elapsed;
      return remaining > 0 ? remaining : 0;
    };

    setSecondsLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sos.status, sos.createdAt]);

  let dispatchStatusLabel = sos.status === 'DISPATCHED' || sos.status === 'ON_SITE'
    ? statusLabels[sos.status as keyof typeof statusLabels]
    : hasTeam
      ? 'Đã phân công'
      : 'Đang tìm đội phù hợp';

  if (secondsLeft !== null) {
    if (secondsLeft > 0) {
      dispatchStatusLabel = `Chờ nhận ca (${secondsLeft}s)`;
    } else {
      dispatchStatusLabel = 'Đang gán cưỡng bức...';
    }
  }

  const dispatchStatusColor = hasTeam
    ? 'text-blue-600 dark:text-blue-400'
    : secondsLeft !== null
      ? secondsLeft > 0
        ? 'text-amber-600 dark:text-amber-400 animate-pulse font-semibold'
        : 'text-rose-600 dark:text-rose-400 font-semibold'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-0.5 h-4 bg-blue-500 rounded-full flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
          Thông tin điều phối
        </span>
      </div>

      {/* 5-col stats row */}
      <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3 border-b border-gray-100 dark:border-gray-800">
        <StatCol
          label="Đã tìm được đội"
          value={
            hasTeam
              ? <Link to={`${ROUTES.RESCUE_TEAM_LIST}/${sos.assignedTeamId}`} className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                  {sos.assignedTeam?.name || `Đội #${sos.assignedTeamId}`}
                  <ExternalLink size={10} />
                </Link>
              : <span className="text-gray-500 font-normal">Chưa phân công</span>
          }
        />
        <StatCol
          label="Khoảng cách"
          value={distanceKm ? `${distanceKm.toFixed(1)} km` : '—'}
        />
        <StatCol
          label="Thời gian dự kiến"
          value={distanceKm ? `~ ${Math.round(distanceKm * 3)} phút` : '—'}
        />
        <StatCol
          label="Trạng thái điều phối"
          value={dispatchStatusLabel}
          valueClass={dispatchStatusColor}
        />
        <StatCol
          label="Ghi chú"
          value={sos.resolutionNotes || '—'}
        />
      </div>

      {/* Info banner */}
      <div className="px-5 py-3">
        {!hasTeam ? (
          secondsLeft !== null && secondsLeft > 0 ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-lg px-3 py-2.5">
              <Clock size={13} className="flex-shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="font-normal">
                Đang mời Top 3 đội trưởng cứu trợ nhận ca. Lời mời sẽ hết hiệu lực sau <b>{secondsLeft} giây</b>.
              </span>
            </div>
          ) : secondsLeft !== null && secondsLeft === 0 ? (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-lg px-3 py-2.5">
              <Info size={13} className="flex-shrink-0" />
              <span className="font-normal">
                Hết thời hạn tự nguyện tiếp nhận ca. Hệ thống đang tự động kích hoạt gán cưỡng bức cho đội tối ưu nhất.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg px-3 py-2.5">
              <Info size={13} className="flex-shrink-0" />
              <span className="font-normal">Hệ thống đang tìm kiếm đội cứu hộ gần nhất.</span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-normal">
              Chỉ huy: <span className="text-gray-900 dark:text-white font-normal">
                {sos.assignedTeam?.leaderCitizenName || sos.assignedTeam?.leaderName || 'Chưa cập nhật'}
              </span>
            </span>
            {sos.assignedTeam?.leaderPhone && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleCallPhone(sos.assignedTeam?.leaderPhone || undefined)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-normal"
                >
                  {sos.assignedTeam.leaderPhone}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
