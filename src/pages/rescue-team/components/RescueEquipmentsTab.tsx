import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { rescueEquipmentApi, type RescueEquipment } from '../../../apis';
import Loader from '../../../components/common/Loader';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';
import { cn } from '../../../lib/utils';
import { toast } from '../../../stores';

interface RescueEquipmentsTabProps {
  teamId: number;
}

const statusLabels = {
  GOOD: 'Hoạt động tốt',
  MAINTENANCE: 'Đang bảo trì',
  BROKEN: 'Hỏng hóc',
};

const statusBadgeColors = {
  GOOD: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  MAINTENANCE: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  BROKEN: 'bg-red-500/10 text-red-500 border border-red-500/20',
};

export default function RescueEquipmentsTab({ teamId }: RescueEquipmentsTabProps) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<RescueEquipment | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'GOOD' | 'MAINTENANCE' | 'BROKEN'>('GOOD');
  const [description, setDescription] = useState('');

  // 1. Fetch equipments list
  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['rescue-team-equipments', teamId],
    queryFn: () => rescueEquipmentApi.getByTeamId(teamId),
    enabled: !!teamId,
  });

  // Reset form inputs
  const resetForm = () => {
    setName('');
    setQuantity(1);
    setStatus('GOOD');
    setDescription('');
  };

  // Populate form for editing
  const handleStartEdit = (eq: RescueEquipment) => {
    setEditingEquipment(eq);
    setName(eq.name);
    setQuantity(eq.quantity);
    setStatus(eq.status);
    setDescription(eq.description || '');
  };

  // 2. Add Equipment mutation
  const addMutation = useMutation({
    mutationFn: async (data: Partial<RescueEquipment>) => {
      return rescueEquipmentApi.create(teamId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-team-equipments', teamId] });
      toast.success('Thêm thiết bị mới thành công!');
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi thêm thiết bị');
    },
  });

  // 3. Update Equipment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RescueEquipment>) => {
      if (!editingEquipment) throw new Error('No equipment to edit');
      return rescueEquipmentApi.update(teamId, editingEquipment.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-team-equipments', teamId] });
      toast.success('Cập nhật thiết bị thành công!');
      setEditingEquipment(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi cập nhật thiết bị');
    },
  });

  // 4. Delete Equipment mutation
  const deleteMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      return rescueEquipmentApi.delete(teamId, equipmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-team-equipments', teamId] });
      toast.success('Xóa thiết bị thành công!');
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi xóa thiết bị');
    },
  });

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên thiết bị!');
      return;
    }
    addMutation.mutate({
      name: name.trim(),
      quantity,
      status,
      description: description.trim() || undefined,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên thiết bị!');
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      quantity,
      status,
      description: description.trim() || undefined,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader size="md" colorClass="text-amber-500" text="Đang tải danh sách thiết bị..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Trang thiết bị & Phương tiện cơ bản
        </h3>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={12} />
          <span>Thêm thiết bị</span>
        </button>
      </div>

      {equipments.length === 0 ? (
        <div className="py-12 text-center text-gray-400 dark:text-gray-500 border border-dashed border-slate-200 dark:border-gray-700 rounded-xl p-8">
          <Wrench className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
          <p className="text-xs font-bold">Chưa có thiết bị nào</p>
          <p className="text-[10px] text-gray-400 mt-1">Đội cứu hộ chưa được phân bổ phương tiện và trang thiết bị chuyên dụng.</p>
        </div>
      ) : (
        <div className="border border-slate-100 dark:border-gray-700/60 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left border-collapse bg-white dark:bg-gray-800">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900 border-b border-slate-100 dark:border-gray-700 text-black dark:text-white font-bold">
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Tên thiết bị</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-black dark:text-white font-normal">
              {equipments.map((eq: RescueEquipment, index: number) => (
                <tr key={eq.id} className="hover:bg-slate-50/40 dark:hover:bg-gray-750/30 transition-colors">
                  <td className="px-4 py-3 font-normal text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{eq.name}</td>
                  <td className="px-4 py-3 font-semibold">{eq.quantity} chiếc</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider', statusBadgeColors[eq.status])}>
                      {statusLabels[eq.status] || eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[200px]" title={eq.description}>
                    {eq.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleStartEdit(eq)}
                      className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-all cursor-pointer"
                      title="Sửa thông tin"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteId(eq.id)}
                      className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                      title="Xóa thiết bị"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Equipment Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-700/60 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left text-slate-700 dark:text-slate-300">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-0 uppercase tracking-wider">
                Thêm thiết bị mới
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-450 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd}>
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-black dark:text-white">
                    Tên thiết bị / Phương tiện <span className="text-red-500 ml-1">(*)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Xuồng máy cứu hộ"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-black dark:text-white">
                      Số lượng <span className="text-red-500 ml-1">(*)</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-black dark:text-white">
                      Trạng thái hoạt động <span className="text-red-500 ml-1">(*)</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="GOOD">Hoạt động tốt</option>
                      <option value="MAINTENANCE">Đang bảo trì</option>
                      <option value="BROKEN">Hỏng hóc</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-black dark:text-white">Mô tả chi tiết</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ghi chú thêm thông tin thông số kỹ thuật hoặc mã thiết bị..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none font-medium custom-scroll"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-gray-900/30 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {addMutation.isPending && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <Save size={14} />
                  <span>Lưu lại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-700/60 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left text-slate-700 dark:text-slate-300">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-0 uppercase tracking-wider">
                Chỉnh sửa thiết bị
              </h3>
              <button onClick={() => setEditingEquipment(null)} className="text-gray-450 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-black dark:text-white">
                    Tên thiết bị / Phương tiện <span className="text-red-500 ml-1">(*)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Xuồng máy cứu hộ"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-black dark:text-white">
                      Số lượng <span className="text-red-500 ml-1">(*)</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-black dark:text-white">
                      Trạng thái hoạt động <span className="text-red-500 ml-1">(*)</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="GOOD">Hoạt động tốt</option>
                      <option value="MAINTENANCE">Đang bảo trì</option>
                      <option value="BROKEN">Hỏng hóc</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-black dark:text-white">Mô tả chi tiết</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ghi chú thêm thông tin thông số kỹ thuật hoặc mã thiết bị..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-850 text-black dark:text-white focus:outline-none font-medium custom-scroll"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-gray-900/30 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {updateMutation.isPending && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <Save size={14} />
                  <span>Cập nhật</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
        title="Xóa thiết bị khỏi danh sách"
        message="Bạn có chắc chắn muốn xóa trang thiết bị/phương tiện này? Hành động này sẽ loại bỏ nó khỏi cơ sở dữ liệu của đội."
      />
    </div>
  );
}
