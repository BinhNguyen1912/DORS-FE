import { Users, AlertTriangle, Activity } from 'lucide-react';

export default function MapAndMissionsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Bản đồ tình hình thiên tai và SOS (7 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Bản đồ tình hình thiên tai và SOS
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem bản đồ chi tiết →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch flex-1 pt-2">
          {/* Map preview */}
          <div className="md:col-span-2 bg-[#e2e8f0]/40 dark:bg-gray-900/60 rounded-2xl relative overflow-hidden border border-slate-200/40 dark:border-gray-700/40 h-64 md:h-auto flex items-center justify-center">
            <svg className="w-full h-full absolute inset-0 opacity-40 dark:opacity-20" viewBox="0 0 300 200">
              <path d="M10,20 Q40,60 80,40 T150,90 T240,60 T300,100" fill="none" stroke="#94a3b8" strokeWidth="1" />
              <path d="M50,150 Q100,130 180,170 T290,140" fill="none" stroke="#94a3b8" strokeWidth="1" />
            </svg>

            {/* Stable count (Green, 11) */}
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white animate-bounce">
                11
              </div>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white -mt-1 shadow-md" />
            </div>

            {/* Multiple SOS (Orange, 27) */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white animate-pulse">
                27
              </div>
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-white -mt-1 shadow-md" />
            </div>

            {/* Disaster (Red, 3) */}
            <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
                3
              </div>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-white -mt-1 shadow-md" />
            </div>
          </div>

          {/* Legends and fast stats */}
          <div className="flex flex-col justify-between py-1 space-y-4">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chú thích</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Thiên tai đang diễn ra</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Khu vực có nhiều SOS</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Khu vực ổn định</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thông tin nhanh</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg">
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none">3</p>
                    <p className="text-[10px] text-gray-400 mt-1">Khu vực thiên tai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg">
                    <Activity size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none">27</p>
                    <p className="text-[10px] text-gray-400 mt-1">SOS đang hoạt động</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg">
                    <Users size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none">5</p>
                    <p className="text-[10px] text-gray-400 mt-1">Đội đang làm nhiệm vụ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nhiệm vụ đang thực hiện (4 cols) */}
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Nhiệm vụ đang thực hiện
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4">
          {[
            {
              title: 'Cứu hộ tại xã Hòa Bình',
              detail: 'Đội 1 • 4 thành viên',
              progress: 75,
              status: 'Đang thực hiện',
              statusColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
              img: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=150'
            },
            {
              title: 'Tiếp tế tại Quảng Trị',
              detail: 'Đội 2 • 5 thành viên',
              progress: 50,
              status: 'Đang thực hiện',
              statusColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
              img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=150'
            },
            {
              title: 'Hỗ trợ y tế tại Lào Cai',
              detail: 'Đội 3 • 3 thành viên',
              progress: 25,
              status: 'Sắp bắt đầu',
              statusColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
              img: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=150'
            }
          ].map((mission, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <img
                src={mission.img}
                alt={mission.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-gray-700 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {mission.title}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 ${mission.statusColor}`}>
                    {mission.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  {mission.detail}
                </p>
                
                {/* Progress bar inside card */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-1.5 flex-1 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${mission.progress}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-gray-500 w-6 text-right">{mission.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
