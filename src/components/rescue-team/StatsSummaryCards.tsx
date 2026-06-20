interface StatsSummaryCardsProps {
  stats: {
    total: number;
    active: number;
    onDuty: number;
    ready: number;
  };
}

export default function StatsSummaryCards({ stats }: StatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng số đội */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
          <i className="fa-solid fa-users text-[22px]"></i>
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
            Tổng số đội
          </p>
          <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
            {stats.total}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 truncate">
            <span>+5 đội mới</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">so với tuần trước</span>
          </p>
        </div>
      </div>

      {/* Card 2: Đang hoạt động */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl flex-shrink-0">
          <i className="fa-solid fa-heart-pulse text-[22px]"></i>
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
            Đang hoạt động
          </p>
          <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
            {stats.active}
          </p>
          <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 truncate">
            <span>{stats.total > 0 ? `${Math.round((stats.active / stats.total) * 1000) / 10}%` : '0%'}</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
          </p>
        </div>
      </div>

      {/* Card 3: Đang làm nhiệm vụ */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
          <i className="fa-solid fa-briefcase text-[22px]"></i>
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
            Đang làm nhiệm vụ
          </p>
          <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
            {stats.onDuty}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 truncate">
            <span>{stats.total > 0 ? `${Math.round((stats.onDuty / stats.total) * 1000) / 10}%` : '0%'}</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
          </p>
        </div>
      </div>

      {/* Card 4: Sẵn sàng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex-shrink-0">
          <i className="fa-solid fa-user-check text-[22px]"></i>
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
            Sẵn sàng
          </p>
          <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
            {stats.ready}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 truncate">
            <span>{stats.total > 0 ? `${Math.round((stats.ready / stats.total) * 1000) / 10}%` : '0%'}</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
          </p>
        </div>
      </div>
    </div>
  );
}
