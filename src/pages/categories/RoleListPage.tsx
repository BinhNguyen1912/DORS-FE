import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { roleApi } from '../../apis';
import { cn } from '../../lib/utils';
import { toast } from '../../stores';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import type { Role } from '../../types';
import TableSettings from '../../components/common/TableSettings';
import type { TableColumnDef } from '../../components/common/TableSettings';

const ROLE_COLUMNS: TableColumnDef[] = [
  { key: 'name', label: 'Tên Chức Danh' },
  { key: 'description', label: 'Mô Tả' },
  { key: 'level', label: 'Cấp độ (Level)' },
  { key: 'isSystem', label: 'Loại vai trò' },
  { key: 'isActive', label: 'Trạng Thái' },
];

export default function RoleListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Table column configuration
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('role_table_columns');
    return saved ? JSON.parse(saved) : {
      name: true,
      description: true,
      level: true,
      isSystem: true,
      isActive: true,
    };
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);

  const queryClient = useQueryClient();

  // Load all roles
  const { data: dbData, isLoading } = useQuery({
    queryKey: ['system-roles'],
    queryFn: () => roleApi.getAll(),
  });

  const roles = dbData?.data || [];

  // Create/Update role mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formName,
        description: formDescription,
        level: Number(formLevel),
        isActive: formIsActive,
      };

      if (editingRole) {
        return roleApi.update(editingRole.id, payload);
      } else {
        return roleApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-roles'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(editingRole ? 'Cập nhật chức danh thành công!' : 'Tạo chức danh mới thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi lưu chức danh');
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-roles'] });
      setDeleteRoleId(null);
      toast.success('Xóa chức danh thành công!');
    },
    onError: (err: any) => {
      setDeleteRoleId(null);
      toast.api(err, 'Lỗi khi xóa chức danh');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormLevel(1);
    setFormIsActive(true);
    setEditingRole(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormLevel(role.level);
    setFormIsActive(role.isActive);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteRoleId) {
      deleteMutation.mutate(deleteRoleId);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Vui lòng nhập tên vai trò');
      return;
    }
    saveMutation.mutate();
  };

  // Filter roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const name = r.name || '';
      const description = r.description || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [roles, searchQuery]);

  // Paginate roles
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / itemsPerPage));

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-4 text-left">
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Tìm kiếm chức danh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500/90 hover:bg-amber-600/90 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
            Thêm Chức danh
          </button>
          <TableSettings
            columns={ROLE_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
            storageKey="role_table_columns"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                {visibleColumns.name !== false && <th className="py-3.5 px-4">Tên Chức Danh</th>}
                {visibleColumns.description !== false && <th className="py-3.5 px-4">Mô Tả</th>}
                {visibleColumns.level !== false && <th className="py-3.5 px-4 text-center">Cấp độ (Level)</th>}
                {visibleColumns.isSystem !== false && <th className="py-3.5 px-4 text-center">Loại vai trò</th>}
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
                      <p className="font-semibold text-xs">Đang tải danh sách chức danh...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={2 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400 font-semibold">
                    Không tìm thấy chức danh nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role, index) => {
                  const num = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr
                      key={role.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-center text-black dark:text-white font-normal">{num}</td>
                      {visibleColumns.name !== false && <td className="py-4 px-4 font-normal text-black dark:text-white">{role.name}</td>}
                      {visibleColumns.description !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal max-w-sm truncate" title={role.description}>
                          {role.description || 'Chưa cập nhật mô tả'}
                        </td>
                      )}
                      {visibleColumns.level !== false && (
                        <td className="py-4 px-4 text-center font-normal text-black dark:text-white">
                          {role.level}
                        </td>
                      )}
                      {visibleColumns.isSystem !== false && (
                        <td className="py-4 px-4 text-center font-normal">
                          <span className={cn(
                            'px-2 py-0.5 text-[9px] font-normal rounded-lg border',
                            role.isSystem
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          )}>
                            {role.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.isActive !== false && (
                        <td className="py-4 px-4 text-center font-normal">
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] font-normal rounded-full',
                            role.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                          )}>
                            {role.isActive ? 'Kích hoạt' : 'Tạm dừng'}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-4 text-center font-normal">
                        <div className="flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => handleOpenEdit(role)}
                            title="Sửa chức danh"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                          >
                            <i className="fa-solid fa-pen text-[13px] text-amber-500 hover:text-amber-600"></i>
                          </button>
                          {!role.isSystem && (
                            <button
                              onClick={() => setDeleteRoleId(role.id)}
                              title="Xóa chức danh"
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                            >
                              <i className="fa-solid fa-trash text-[13px] text-red-500 hover:text-red-600"></i>
                            </button>
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

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-700/60 select-none bg-slate-50/50 dark:bg-gray-900/20">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
            Hiển thị <span className="text-gray-900 dark:text-white">{paginatedRoles.length}</span> trên <span className="text-gray-900 dark:text-white">{filteredRoles.length}</span> kết quả
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-bold transition-all border',
                  currentPage === page
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 border-slate-200 dark:border-gray-700 dark:text-gray-400'
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-700/60 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-0">
                {editingRole ? 'Cập nhật Chức danh' : 'Thêm Chức danh mới'}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-350">
                {/* Name */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Tên chức danh *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Đội trưởng PCCC..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Level */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Cấp bậc (Level) *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formLevel}
                    onChange={(e) => setFormLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                  <p className="text-[9px] text-gray-400">Giá trị số đại diện cho mức phân quyền (Cấp cao hơn có số lớn hơn).</p>
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả cụ thể nhiệm vụ hoặc quyền hạn..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
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
                    Cho phép gán và sử dụng chức danh này
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-gray-900/30 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all"
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
        isOpen={deleteRoleId !== null}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Xóa chức danh phân quyền"
        message="Bạn có chắc chắn muốn xóa chức danh này khỏi hệ thống? Người dùng thuộc chức danh này sẽ không còn quyền hạn tương ứng."
      />
    </div>
  );
}
