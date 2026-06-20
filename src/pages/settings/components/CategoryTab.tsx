import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from '../../../stores';
import { settingsApi } from '../../../apis';

interface CategoryItem {
  code: string;
  name: string;
}

export default function CategoryTab() {
  const [selectedType, setSelectedType] = useState('RESCUE_TEAM_TYPE');
  
  const [categories, setCategories] = useState<Record<string, CategoryItem[]>>({
    RESCUE_TEAM_TYPE: [],
    MISSION_TYPE: [],
    VEHICLE_TYPE: [],
    EQUIPMENT_TYPE: [],
  });

  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');

  // Fetch from BE when selectedType changes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await settingsApi.getCategories(selectedType);
        setCategories((prev) => ({
          ...prev,
          [selectedType]: data,
        }));
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, [selectedType]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode || !newItemName) {
      toast.error('Vui lòng điền đầy đủ Mã và Tên danh mục!');
      return;
    }
    
    // Check duplicate code local
    const list = categories[selectedType] || [];
    if (list.some(item => item.code === newItemCode.toUpperCase())) {
      toast.error('Mã danh mục này đã tồn tại!');
      return;
    }

    try {
      const added = await settingsApi.addCategory(selectedType, newItemCode.toUpperCase().trim(), newItemName.trim());
      setCategories((prev) => ({
        ...prev,
        [selectedType]: [
          ...list,
          { code: added.code, name: added.name }
        ]
      }));

      setNewItemCode('');
      setNewItemName('');
      toast.success('Đã thêm danh mục mới thành công!');
    } catch (err) {
      toast.error('Không thể thêm danh mục mới!');
    }
  };

  const handleRemoveItem = async (code: string) => {
    try {
      await settingsApi.deleteCategory(code);
      setCategories((prev) => ({
        ...prev,
        [selectedType]: (prev[selectedType] || []).filter(item => item.code !== code)
      }));
      toast.success('Đã xóa danh mục thành công!');
    } catch (err) {
      toast.error('Không thể xóa danh mục!');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật bảng danh mục hệ thống thành công!');
  };

  const currentList = categories[selectedType] || [];

  return (
    <div className="space-y-6">
      {/* Title & Save Button Header */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Danh mục hệ thống
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Quản trị bảng từ điển dùng chung cho toàn bộ phân hệ (phương tiện, thiết bị cứu trợ, tính chất đội)
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer"
        >
          <Save size={14} />
          Lưu thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-xs text-black dark:text-white">
        {/* Left Side: Select Category Dictionary Type */}
        <div className="md:col-span-4 space-y-1.5">
          <span className="block font-bold text-black dark:text-white select-none">
            Chọn nhóm từ điển danh mục
          </span>
          <nav className="space-y-1 bg-slate-50/50 dark:bg-gray-900/40 p-2 rounded-2xl border border-slate-100/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedType('RESCUE_TEAM_TYPE')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all ${
                selectedType === 'RESCUE_TEAM_TYPE'
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              Loại đội cứu hộ
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('MISSION_TYPE')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all ${
                selectedType === 'MISSION_TYPE'
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              Loại nhiệm vụ
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('VEHICLE_TYPE')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all ${
                selectedType === 'VEHICLE_TYPE'
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              Loại phương tiện
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('EQUIPMENT_TYPE')}
              className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all ${
                selectedType === 'EQUIPMENT_TYPE'
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              Loại thiết bị cứu hộ
            </button>
          </nav>
        </div>

        {/* Right Side: List Editor */}
        <div className="md:col-span-8 space-y-4">
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-gray-800 border-b border-slate-100 dark:border-slate-750">
                  <th className="px-4 py-2.5 font-extrabold text-black dark:text-white select-none w-[120px]">
                    Mã danh mục
                  </th>
                  <th className="px-4 py-2.5 font-extrabold text-black dark:text-white select-none">
                    Tên hiển thị tiếng Việt
                  </th>
                  <th className="px-4 py-2.5 font-extrabold text-black dark:text-white text-center select-none w-[80px]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {currentList.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50/20 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-2.5 font-mono font-bold text-gray-900 dark:text-white">
                      {item.code}
                    </td>
                    <td className="px-4 py-2.5 text-black dark:text-white font-medium">
                      {item.name}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.code)}
                        className="p-1 text-red-500 hover:text-red-650 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form to add new item */}
          <form onSubmit={handleAddItem} className="p-4 bg-slate-50/50 dark:bg-gray-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
            <span className="block font-bold text-black dark:text-white select-none">
              Thêm mới phần tử danh mục
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Mã danh mục (Ví dụ: BOAT_FAST)"
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>
              <div className="space-y-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Tên danh mục tiếng Việt"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow transition-colors cursor-pointer flex-shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
