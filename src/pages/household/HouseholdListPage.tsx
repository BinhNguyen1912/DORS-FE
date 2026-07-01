import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { householdApi } from '../../apis';
import { ROUTES } from '../../constants';
import TableSettings from '../../components/common/TableSettings';
import type { TableColumnDef } from '../../components/common/TableSettings';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

const HOUSEHOLD_COLUMNS: TableColumnDef[] = [
  { key: 'totalMembers', label: 'Tổng số thành viên' },
  { key: 'elderly', label: 'Người già' },
  { key: 'children', label: 'Trẻ em' },
  { key: 'healthNotes', label: 'Ghi chú sức khỏe' },
];

export default function HouseholdListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('household_table_columns');
    return saved ? JSON.parse(saved) : {
      totalMembers: true,
      elderly: true,
      children: true,
      healthNotes: true,
    };
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['households', page, search],
    queryFn: () => householdApi.getAll({ page, limit: 10, search }),
  });

  return (
    <div className="space-y-4 text-left">
      {/* Filter Row & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div className="flex-1 relative max-w-md w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]"></i>
          <input
            type="text"
            placeholder="Tìm kiếm hộ gia đình..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl transition-all shadow-sm cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
          </button>
          <Link
            to={ROUTES.HOUSEHOLD_CREATE}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500/90 hover:bg-amber-600/90 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
            Thêm Hộ gia đình
          </Link>
          <TableSettings
            columns={HOUSEHOLD_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
            storageKey="household_table_columns"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                <th className="py-3.5 px-4 w-16 text-center">ID</th>
                {visibleColumns.totalMembers !== false && (
                  <th className="py-3.5 px-4">Tổng số thành viên</th>
                )}
                {visibleColumns.elderly !== false && (
                  <th className="py-3.5 px-4">Người già</th>
                )}
                {visibleColumns.children !== false && (
                  <th className="py-3.5 px-4">Trẻ em</th>
                )}
                {visibleColumns.healthNotes !== false && (
                  <th className="py-3.5 px-4">Ghi chú sức khỏe</th>
                )}
                <th className="py-3.5 px-4 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={2 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="font-semibold text-xs">Đang tải danh sách hộ gia đình...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + Object.values(visibleColumns).filter(v => v !== false).length}
                    className="py-16 text-center text-gray-400 font-semibold"
                  >
                    Không tìm thấy hộ gia đình nào
                  </td>
                </tr>
              ) : (
                data?.data?.map((household) => (
                  <tr
                    key={household.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="py-4 px-4 text-center text-black dark:text-white font-normal">
                      {household.id}
                    </td>
                    {visibleColumns.totalMembers !== false && (
                      <td className="py-4 px-4 text-black dark:text-white font-normal">
                        {household.totalMembers}
                      </td>
                    )}
                    {visibleColumns.elderly !== false && (
                      <td className="py-4 px-4 text-black dark:text-white font-normal">
                        {household.elderlyCount}
                      </td>
                    )}
                    {visibleColumns.children !== false && (
                      <td className="py-4 px-4 text-black dark:text-white font-normal">
                        {household.childrenCount}
                      </td>
                    )}
                    {visibleColumns.healthNotes !== false && (
                      <td className="py-4 px-4 text-black dark:text-white font-normal max-w-sm truncate" title={household.healthNotes}>
                        {household.healthNotes || '-'}
                      </td>
                    )}
                    <td className="py-4 px-4 text-center font-normal">
                      <div className="flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() =>
                            navigate(ROUTES.HOUSEHOLD_DETAIL.replace(':id', String(household.id)))
                          }
                          title="Xem chi tiết"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                          <i className="fa-solid fa-eye text-[13px] text-blue-500 hover:text-blue-600"></i>
                        </button>
                        <button 
                          onClick={() =>
                            navigate(ROUTES.HOUSEHOLD_DETAIL.replace(':id', String(household.id)))
                          }
                          title="Chỉnh sửa"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                          <i className="fa-solid fa-pen text-[13px] text-amber-500 hover:text-amber-600"></i>
                        </button>
                        <button 
                          title="Xóa"
                          className="p-1.5 hover:bg-red-55/10 rounded-lg transition-all"
                        >
                          <i className="fa-solid fa-trash text-[13px] text-red-500 hover:text-red-650"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 10 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-700/60 select-none bg-slate-50/50 dark:bg-gray-900/20 text-slate-500">
            <div className="text-xs font-semibold">
              Hiển thị <span className="text-gray-900 dark:text-white">{(page - 1) * 10 + 1}</span> đến{' '}
              <span className="text-gray-900 dark:text-white">{Math.min(page * 10, data.total)}</span> trên <span className="text-gray-900 dark:text-white">{data.total}</span> kết quả
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer flex items-center justify-center"
              >
                <i className="fa-solid fa-chevron-left text-[11px]"></i>
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer flex items-center justify-center"
              >
                <i className="fa-solid fa-chevron-right text-[11px]"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
