import { cn } from '../../../lib/utils';

export interface TimelineItem {
  id?: number;
  time: string;
  title: string;
  desc: string;
  isCancelled?: boolean;
  eventType?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  teamId?: number | null;
  teamName?: string | null;
  changedById?: number | null;
  changedByName?: string | null;
  dispatchMethod?: string | null;
}

interface SosTimelinePanelProps {
  timeline: TimelineItem[];
}

function getDotStyle(eventType?: string, isCancelled?: boolean): string {
  if (isCancelled || eventType === 'CANCELLED') return 'bg-gray-300 dark:bg-gray-600';
  if (eventType === 'RESOLVED') return 'bg-green-500';
  if (eventType === 'CREATED') return 'bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900';
  if (eventType === 'TEAM_ASSIGNED' || eventType === 'TEAM_REASSIGNED') return 'bg-blue-500';
  if (eventType === 'SPECIALIST_PENDING' || eventType === 'QUEUED') return 'bg-amber-400';
  return 'bg-gray-400 dark:bg-gray-500';
}

export default function SosTimelinePanel({ timeline }: SosTimelinePanelProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden h-full">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-0.5 h-4 bg-blue-500 rounded-full flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
          Lịch sử xử lý
        </span>
      </div>

      <div className="px-5 py-3 space-y-0">
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;
          const dotColor = getDotStyle(item.eventType, item.isCancelled);
          return (
            <div key={item.id ?? index} className="flex gap-3 relative">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center flex-shrink-0 mt-1">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0 z-10', dotColor)} />
                {!isLast && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1 min-h-[20px]" />
                )}
              </div>

              {/* Right: content */}
              <div className={cn('pb-4 min-w-0 flex-1', isLast && 'pb-3')}>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal font-mono leading-none mb-0.5">
                  {item.time}
                </p>
                <p className="text-sm font-normal text-gray-900 dark:text-white leading-snug">
                  {item.title}
                </p>
                {item.desc && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {timeline.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-400 font-normal italic">
            Chưa có lịch sử xử lý.
          </div>
        )}
      </div>
    </div>
  );
}
