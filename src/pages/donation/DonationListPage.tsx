import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { donationApi } from '../../apis';
import { cn } from '../../lib/utils';
import TableSettings from '../../components/common/TableSettings';
import type { TableColumnDef } from '../../components/common/TableSettings';

const DONATION_COLUMNS: TableColumnDef[] = [
  { key: 'donor', label: 'Nhà tài trợ' },
  { key: 'type', label: 'Loại hình tài trợ' },
  { key: 'amount', label: 'Số tiền / Hiện vật' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'date', label: 'Ngày tài trợ' },
];

const statusColors = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30',
  APPROVED: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  REJECTED: 'bg-red-500/10 text-red-600 border border-red-500/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  DELIVERED: 'Đã trao nhận',
};

const typeLabels: Record<string, string> = {
  CASH: 'Tiền mặt',
  GOODS: 'Hiện vật',
  SERVICES: 'Dịch vụ',
};

const typeIcons = {
  CASH: 'fa-solid fa-dollar-sign text-emerald-500',
  GOODS: 'fa-solid fa-box text-blue-500',
  SERVICES: 'fa-solid fa-heart text-red-500',
};

export default function DonationListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('donation_table_columns');
    return saved ? JSON.parse(saved) : {
      donor: true,
      type: true,
      amount: true,
      status: true,
      date: true,
    };
  });

  const { data, isLoading } = useQuery({
    queryKey: ['donations', page, status, type, searchQuery],
    queryFn: () =>
      donationApi.getAll({
        page,
        limit: 10,
        status: status || undefined,
        type: type || undefined,
        search: searchQuery || undefined,
      }),
  });

  const handleApprove = async (id: number) => {
    try {
      await donationApi.approve(id);
    } catch (err) {
      console.error('Failed to approve donation', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await donationApi.reject(id);
    } catch (err) {
      console.error('Failed to reject donation', err);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Filter Row & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div className="flex-1 relative max-w-md w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]"></i>
          <input
            type="text"
            placeholder="Tìm kiếm thông tin tài trợ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="DELIVERED">Đã trao nhận</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold cursor-pointer"
          >
            <option value="">Tất cả loại hình</option>
            <option value="CASH">Tiền mặt</option>
            <option value="GOODS">Hiện vật</option>
            <option value="SERVICES">Dịch vụ</option>
          </select>
          <TableSettings
            columns={DONATION_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
            storageKey="donation_table_columns"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                {visibleColumns.donor !== false && (
                  <th className="py-3.5 px-4">Nhà tài trợ</th>
                )}
                {visibleColumns.type !== false && (
                  <th className="py-3.5 px-4">Loại hình tài trợ</th>
                )}
                {visibleColumns.amount !== false && (
                  <th className="py-3.5 px-4">Số tiền / Hiện vật</th>
                )}
                {visibleColumns.status !== false && (
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                )}
                {visibleColumns.date !== false && (
                  <th className="py-3.5 px-4">Ngày tài trợ</th>
                )}
                <th className="py-3.5 px-4 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={1 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="font-semibold text-xs">Đang tải danh sách tài trợ...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={1 + Object.values(visibleColumns).filter(v => v !== false).length}
                    className="py-16 text-center text-gray-400 font-semibold"
                  >
                    Không tìm thấy tài trợ nào
                  </td>
                </tr>
              ) : (
                data?.data?.map((donation) => {
                  const typeIconClass = typeIcons[donation.type as keyof typeof typeIcons] || 'fa-solid fa-heart';
                  return (
                    <tr
                      key={donation.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      {visibleColumns.donor !== false && (
                        <td className="py-4 px-4 font-normal">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-500/10 flex items-center justify-center font-normal text-xs flex-shrink-0">
                              <i className="fa-solid fa-heart text-purple-500 text-[12px]"></i>
                            </div>
                            <div className="text-left leading-tight">
                              <p className="font-normal text-black dark:text-white">
                                {donation.donorName}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {donation.donorType}
                              </p>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.type !== false && (
                        <td className="py-4 px-4 font-normal">
                          <span className="flex items-center gap-2">
                            <i className={cn(typeIconClass, 'text-[13px]')}></i>
                            <span>{typeLabels[donation.type] || donation.type}</span>
                          </span>
                        </td>
                      )}
                      {visibleColumns.amount !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal">
                          {donation.amount
                            ? `${donation.amount.toLocaleString()} VNĐ`
                            : donation.goodsDescription || '-'}
                        </td>
                      )}
                      {visibleColumns.status !== false && (
                        <td className="py-4 px-4 text-center font-normal">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 text-[10px] font-normal rounded-full border whitespace-nowrap',
                              statusColors[donation.status as keyof typeof statusColors]
                            )}
                          >
                            {statusLabels[donation.status] || donation.status}
                          </span>
                        </td>
                      )}
                      {visibleColumns.date !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal">
                          {new Date(donation.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      )}
                      <td className="py-4 px-4 text-center font-normal">
                        <div className="flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button 
                            title="Xem chi tiết"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                          >
                            <i className="fa-solid fa-eye text-[13px] text-blue-500 hover:text-blue-600"></i>
                          </button>
                          {donation.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(donation.id)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                title="Phê duyệt"
                              >
                                <i className="fa-solid fa-check text-[13px] text-emerald-500 hover:text-emerald-600"></i>
                              </button>
                              <button
                                onClick={() => handleReject(donation.id)}
                                className="p-1.5 hover:bg-red-55/10 rounded-lg transition-all"
                                title="Từ chối"
                              >
                                <i className="fa-solid fa-xmark text-[13px] text-red-500 hover:text-red-650"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
