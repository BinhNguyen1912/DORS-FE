import { RefreshCw, Calendar, ChevronDown, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { locationApi } from '../../../apis/location.api';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  selectedProvinceId: number | null;
  onChangeProvince: (provinceId: number | null) => void;
}

export default function DashboardHeader({
  onRefresh,
  selectedProvinceId,
  onChangeProvince,
}: DashboardHeaderProps) {
  // Query danh sách tỉnh thành từ DB
  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: locationApi.getAllProvinces,
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">
          Xin chào, Admin!
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
          <span>Cập nhật lần cuối: 10:30 AM, 01/06/2026</span>
          <button
            onClick={onRefresh}
            className="text-indigo-600 dark:text-indigo-400 hover:rotate-180 transition-transform duration-300 focus:outline-none"
          >
            <RefreshCw size={12} />
          </button>
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs shadow-sm text-gray-600 dark:text-gray-300">
          <Calendar size={14} className="text-gray-400" />
          <span className="font-bold">01/06/2026 - 07/06/2026</span>
        </div>

        {/* Dropdown lấy danh sách từ locationApi */}
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
            className="appearance-none flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 pl-8 pr-8 py-1.5 rounded-xl text-xs font-bold shadow-sm text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 focus:outline-none cursor-pointer min-w-[150px]"
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
      </div>
    </div>
  );
}
