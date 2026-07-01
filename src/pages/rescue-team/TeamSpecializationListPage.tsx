import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { rescueTeamApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { toast } from '../../stores';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import TableSettings from '../../components/common/TableSettings';
import type { TableColumnDef } from '../../components/common/TableSettings';

const SPEC_COLUMNS: TableColumnDef[] = [
  { key: 'name', label: 'Tên Chuyên Môn' },
  { key: 'teamType', label: 'Loại Đội Áp Dụng' },
  { key: 'description', label: 'Mô Tả Chi Tiết' },
  { key: 'isActive', label: 'Trạng Thái' },
];

const teamTypeLabels: Record<string, string> = {
  PCCC: 'PCCC',
  Y_TE: 'Y Tế',
  DAN_PHONG: 'Dân phòng',
  QUAN_SU: 'Quân sự',
  TINH_NGUYEN: 'Tình nguyện',
  TONG_HOP: 'Tổng hợp',
};

const teamTypeColors: Record<string, { bg: string; text: string }> = {
  PCCC: { bg: 'bg-red-500/10 text-red-500 border border-red-500/20', text: 'text-red-500' },
  Y_TE: { bg: 'bg-green-500/10 text-green-500 border border-green-500/20', text: 'text-green-500' },
  DAN_PHONG: { bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', text: 'text-blue-500' },
  QUAN_SU: { bg: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', text: 'text-slate-400' },
  TINH_NGUYEN: { bg: 'bg-purple-500/10 text-purple-500 border border-purple-500/20', text: 'text-purple-500' },
  TONG_HOP: { bg: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20', text: 'text-indigo-500' },
};

interface TeamSpecialization {
  id: number;
  name: string;
  teamType: string;
  description?: string;
  isActive: boolean;
}

export default function TeamSpecializationListPage() {
  const [teamTypeFilter, setTeamTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<TeamSpecialization | null>(null);
  const [deleteSpecId, setDeleteSpecId] = useState<number | null>(null);

  // Table column configuration
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('spec_table_columns');
    return saved ? JSON.parse(saved) : {
      name: true,
      teamType: true,
      description: true,
      isActive: true,
    };
  });

  // Form states
  const [formName, setFormName] = useState('');
  const [formTeamType, setFormTeamType] = useState('TONG_HOP');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const queryClient = useQueryClient();

  // Load all specializations
  const { data: dbData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['team-specializations'],
    queryFn: () => rescueTeamApi.getSpecializations(),
  });

  const specializations: TeamSpecialization[] = dbData || [];

  // Create or Update Specialization Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formName,
        teamType: formTeamType,
        description: formDescription,
        isActive: formIsActive,
      };

      if (editingSpec) {
        return rescueTeamApi.updateSpecialization(editingSpec.id, payload);
      } else {
        return rescueTeamApi.createSpecialization(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-specializations'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(editingSpec ? 'Cập nhật chuyên môn thành công!' : 'Tạo chuyên môn mới thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi lưu chuyên môn');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => rescueTeamApi.deleteSpecialization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-specializations'] });
      setDeleteSpecId(null);
      toast.success('Xóa chuyên môn thành công!');
    },
    onError: (err: any) => {
      setDeleteSpecId(null);
      toast.api(err, 'Lỗi khi xóa chuyên môn');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormTeamType('TONG_HOP');
    setFormDescription('');
    setFormIsActive(true);
    setEditingSpec(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (spec: TeamSpecialization) => {
    setEditingSpec(spec);
    setFormName(spec.name);
    setFormTeamType(spec.teamType);
    setFormDescription(spec.description || '');
    setFormIsActive(spec.isActive);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteSpecId) {
      deleteMutation.mutate(deleteSpecId);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Vui lòng nhập tên chuyên môn');
      return;
    }
    saveMutation.mutate();
  };

  const filteredSpecs = useMemo(() => {
    return specializations.filter((spec) => {
      const matchesSearch = spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (spec.description && spec.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = !teamTypeFilter || spec.teamType === teamTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [specializations, searchQuery, teamTypeFilter]);

  return (
    <div className="space-y-4 text-left">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div className="flex flex-col sm:flex-row flex-1 gap-3 max-w-xl">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"></i>
            <input
              type="text"
              placeholder="Tìm kiếm chuyên môn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
            />
          </div>
          <div className="w-full sm:w-48 relative">
            <i className="fa-solid fa-filter absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"></i>
            <select
              value={teamTypeFilter}
              onChange={(e) => setTeamTypeFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold cursor-pointer"
            >
              <option value="">Tất cả phân loại đội</option>
              <option value="PCCC">PCCC</option>
              <option value="Y_TE">Y tế</option>
              <option value="DAN_PHONG">Dân phòng</option>
              <option value="QUAN_SU">Quân sự</option>
              <option value="TINH_NGUYEN">Tình nguyện</option>
              <option value="TONG_HOP">Tổng hợp</option>
            </select>
          </div>
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
            to={ROUTES.RESCUE_TEAM_LIST}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <i className="fa-solid fa-chevron-left text-[11px]"></i>
            Quay lại Đội Cứu Hộ
          </Link>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500/90 hover:bg-amber-600/90 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
            Thêm Chuyên môn
          </button>
          <TableSettings
            columns={SPEC_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns as any}
            storageKey="spec_table_columns"
          />
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                {visibleColumns.name !== false && <th className="py-3.5 px-4">Tên Chuyên Môn</th>}
                {visibleColumns.teamType !== false && <th className="py-3.5 px-4">Loại Đội Áp Dụng</th>}
                {visibleColumns.description !== false && <th className="py-3.5 px-4">Mô Tả Chi Tiết</th>}
                {visibleColumns.isActive !== false && <th className="py-3.5 px-4 text-center">Trạng Thái</th>}
                <th className="py-3.5 px-4 text-center w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={2 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="font-semibold text-xs">Đang tải danh sách chuyên môn...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSpecs.length === 0 ? (
                <tr>
                  <td colSpan={2 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400 font-semibold">
                    Không tìm thấy chuyên môn nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredSpecs.map((spec, index) => {
                  const typeStyle = teamTypeColors[spec.teamType] || teamTypeColors.TONG_HOP;
                  return (
                    <tr
                      key={spec.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-center text-black dark:text-white font-normal">{index + 1}</td>
                      {visibleColumns.name !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal">{spec.name}</td>
                      )}
                      {visibleColumns.teamType !== false && (
                        <td className="py-4 px-4 font-normal">
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] font-normal rounded-lg uppercase tracking-wide border whitespace-nowrap',
                            typeStyle.bg
                          )}>
                            {teamTypeLabels[spec.teamType] || spec.teamType}
                          </span>
                        </td>
                      )}
                      {visibleColumns.description !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal max-w-sm truncate" title={spec.description}>
                          {spec.description || 'Chưa cập nhật mô tả'}
                        </td>
                      )}
                      {visibleColumns.isActive !== false && (
                        <td className="py-4 px-4 text-center font-normal">
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] font-normal rounded-full',
                            spec.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                          )}>
                            {spec.isActive ? 'Kích hoạt' : 'Tạm ẩn'}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-4 text-center font-normal">
                        <div className="flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => handleOpenEdit(spec)}
                            title="Sửa chuyên môn"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                          >
                            <i className="fa-solid fa-pen text-[13px] text-amber-500 hover:text-amber-600"></i>
                          </button>
                          <button
                            onClick={() => setDeleteSpecId(spec.id)}
                            title="Xóa chuyên môn"
                            className="p-1.5 hover:bg-red-55/10 rounded-lg transition-all"
                          >
                            <i className="fa-solid fa-trash text-[13px] text-red-500 hover:text-red-650"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-700/60 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-0">
                {editingSpec ? 'Cập nhật Chuyên môn' : 'Thêm Chuyên môn mới'}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-5 space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Tên chuyên môn *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Cứu hộ cứu nạn đường thủy..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Team Type */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Áp dụng cho loại đội *</label>
                  <select
                    value={formTeamType}
                    onChange={(e) => setFormTeamType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="TONG_HOP">Tổng hợp</option>
                    <option value="PCCC">PCCC</option>
                    <option value="Y_TE">Y tế</option>
                    <option value="DAN_PHONG">Dân phòng</option>
                    <option value="QUAN_SU">Quân sự</option>
                    <option value="TINH_NGUYEN">Tình nguyện</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả cụ thể phạm vi hoạt động hoặc chuyên môn..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500"
                  />
                  <label htmlFor="isActive" className="font-bold text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                    Kích hoạt hoạt động (Cho phép các đội cứu hộ chọn lựa chuyên môn này)
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-gray-900/30 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  {saveMutation.isPending && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteSpecId !== null}
        onClose={() => setDeleteSpecId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Xóa chuyên môn đội cứu hộ"
        message="Bạn có chắc chắn muốn xóa chuyên môn này khỏi hệ thống? Các đội cứu hộ hiện đang sở hữu chuyên môn này sẽ mất liên kết tương ứng."
      />
    </div>
  );
}
