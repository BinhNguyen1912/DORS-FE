const sosByRegion = [
  { region: 'TP. Hồ Chí Minh', count: 12, percent: 85 },
  { region: 'Quảng Trị', count: 6, percent: 50 },
  { region: 'Hòa Bình', count: 4, percent: 35 },
  { region: 'Lào Cai', count: 3, percent: 25 },
  { region: 'Thừa Thiên Huế', count: 2, percent: 15 }
];

const missionProgress = [
  { name: 'Cứu hộ tại xã Hòa Bình', team: 'Đội 1', percent: 75, color: 'bg-emerald-500' },
  { name: 'Tiếp tế tại Quảng Trị', team: 'Đội 2', percent: 50, color: 'bg-amber-500' },
  { name: 'Hỗ trợ y tế tại Lào Cai', team: 'Đội 3', percent: 25, color: 'bg-red-500' }
];

const latestSos = [
  { title: 'Cần cứu hộ khẩn cấp', address: 'Quận 7, TP. Hồ Chí Minh', time: '10:25' },
  { title: 'Người bị thương cần hỗ trợ', address: 'Quảng Trị', time: '10:20' },
  { title: 'Thiếu thực phẩm, nước uống', address: 'Hòa Bình', time: '10:15' },
  { title: 'Nhà bị ngập sâu', address: 'Lào Cai', time: '10:10' }
];

export default function RegionalStatsPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* SOS Theo Khu Vực */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            SOS theo khu vực
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem trên bản đồ
          </button>
        </div>

        <div className="space-y-3">
          {sosByRegion.map((region, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500">{region.region}</span>
                <span className="font-bold">{region.count}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${region.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tình Trạng Nhiệm Vụ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <h2 className="text-sm font-bold text-black dark:text-white">
          Tình trạng nhiệm vụ cứu hộ
        </h2>

        <div className="relative flex justify-center items-center my-4">
          <svg width="120" height="120" viewBox="0 0 36 36" className="transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.5" className="dark:stroke-gray-700" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="57.1 42.9" strokeDashoffset="0" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="28.6 71.4" strokeDashoffset="-57.1" />
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="4" strokeDasharray="14.3 85.7" strokeDashoffset="-85.7" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">Tổng</span>
            <span className="text-lg font-black text-gray-900 dark:text-white mt-0.5">84</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500 font-semibold">Hoàn thành</span>
            </div>
            <span className="font-extrabold">48 <span className="text-[10px] text-gray-400">(57.1%)</span></span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500 font-semibold">Đang thực hiện</span>
            </div>
            <span className="font-extrabold">24 <span className="text-[10px] text-gray-400">(28.6%)</span></span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-gray-500 font-semibold">Chờ xử lý</span>
            </div>
            <span className="font-extrabold">12 <span className="text-[10px] text-gray-400">(14.3%)</span></span>
          </div>
        </div>
      </div>

      {/* Tiến Độ Nhiệm Vụ */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Tiến độ nhiệm vụ
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4">
          {missionProgress.map((mission, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-900 dark:text-white truncate max-w-[70%]">{mission.name}</span>
                <span className="text-gray-400">{mission.team}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${mission.color} rounded-full`}
                    style={{ width: `${mission.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-black w-8 text-right">{mission.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SOS Mới Nhất */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            SOS mới nhất
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-3 flex-1">
          {latestSos.map((sos, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold rounded text-[8px] mt-0.5">
                  SOS
                </span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white leading-tight">
                    {sos.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]">
                    {sos.address}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-medium shrink-0">
                {sos.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
