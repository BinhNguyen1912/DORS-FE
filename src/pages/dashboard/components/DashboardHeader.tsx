import { RefreshCw, Calendar, ChevronDown, Filter, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { locationApi } from '../../../apis/location.api';
import { useAuthStore } from '../../../stores';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  selectedProvinceId: number | null;
  onChangeProvince: (provinceId: number | null) => void;
  selectedAdminUnitId: number | null;
  onChangeAdminUnit: (adminUnitId: number | null) => void;
  startDate: string;
  onChangeStartDate: (date: string) => void;
  endDate: string;
  onChangeEndDate: (date: string) => void;
}

export default function DashboardHeader({
  onRefresh,
  selectedProvinceId,
  onChangeProvince,
  selectedAdminUnitId,
  onChangeAdminUnit,
  startDate,
  onChangeStartDate,
  endDate,
  onChangeEndDate,
}: DashboardHeaderProps) {
  const { user } = useAuthStore();
  const userRole = user?.role || (user as any)?.userRoles?.[0]?.role?.name;
  const isProvinceAdmin = userRole === 'PROVINCE_ADMIN';

  // Query danh sách tỉnh thành từ DB
  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: locationApi.getAllProvinces,
  });

  // Query danh sách phường xã thuộc tỉnh thành đã chọn
  const { data: adminUnits = [] } = useQuery({
    queryKey: ['adminUnits', selectedProvinceId],
    queryFn: () => (selectedProvinceId ? locationApi.getWardsByProvinceId(selectedProvinceId) : Promise.resolve([])),
    enabled: !!selectedProvinceId,
  });

  // Tìm tỉnh thành hiện tại để hiển thị nếu là admin tỉnh
  const currentProvince = provinces.find((p) => p.id === selectedProvinceId);

  return (
    <div 
      className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url('https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/bg.png')` }}
    >
      {/* Semi-transparent overlay to ensure text contrast without blurring the background image */}
      <div className="absolute inset-0 bg-white/30 dark:bg-gray-950/40 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
        <div className="text-left">
          <span className="text-sm font-semibold text-gray-550 dark:text-gray-400 block leading-none">
            Xin chào,
          </span>
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-950 dark:text-white mt-0.5 leading-tight">
            {user?.fullName || 'Admin'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1.5">
            <span>Vai trò: <strong className="text-indigo-650 dark:text-indigo-400">{isProvinceAdmin ? 'Quản trị viên cấp Tỉnh' : 'Quản trị viên hệ thống'}</strong></span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span>Cập nhật mới nhất</span>
            <button
              onClick={onRefresh}
              title="Làm mới dữ liệu"
              className="text-indigo-600 dark:text-indigo-400 hover:rotate-180 transition-transform duration-300 focus:outline-none"
            >
              <RefreshCw size={12} />
            </button>
          </p>
        </div>

        {/* Filters & Date Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Dynamic Date Range Picker */}
          <div className="flex items-center gap-2 bg-white/85 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs shadow-xs text-gray-600 dark:text-gray-300 focus-within:border-indigo-500 transition-colors">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => onChangeStartDate(e.target.value)}
              className="bg-transparent border-0 outline-none focus:ring-0 w-28 text-center cursor-pointer font-bold text-gray-700 dark:text-gray-250"
              title="Từ ngày"
            />
            <span className="text-gray-400 font-bold px-0.5">—</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onChangeEndDate(e.target.value)}
              className="bg-transparent border-0 outline-none focus:ring-0 w-28 text-center cursor-pointer font-bold text-gray-700 dark:text-gray-250"
              title="Đến ngày"
            />
          </div>

          {/* Dropdown Tỉnh/Thành phố */}
          {!isProvinceAdmin && (
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Filter size={12} />
              </div>
              <select
                value={selectedProvinceId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeProvince(val ? Number(val) : null);
                }}
                className="appearance-none flex items-center gap-2 bg-white/85 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 pl-8 pr-8 py-2 rounded-xl text-xs font-bold shadow-xs text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 focus:outline-none cursor-pointer min-w-[160px]"
              >
                <option value="">Tất cả khu vực</option>
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          )}

          {/* Dropdown Quận/Huyện/Phường/Xã (Administrative Units) */}
          {selectedProvinceId && (
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Filter size={12} />
              </div>
              <select
                value={selectedAdminUnitId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeAdminUnit(val ? Number(val) : null);
                }}
                className="appearance-none flex items-center gap-2 bg-white/85 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-700 pl-8 pr-8 py-2 rounded-xl text-xs font-bold shadow-xs text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 focus:outline-none cursor-pointer min-w-[180px]"
              >
                <option value="">Tất cả đơn vị hành chính</option>
                {adminUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
