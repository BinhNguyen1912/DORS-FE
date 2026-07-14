import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Upload,
  UserCheck,
  Eye,
  Edit2,
  MoreVertical,
  Key,
  Bell,
  Trash2,
  Heart,
  Users,
  UserMinus,
  Search,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { userApi, locationApi, roleApi } from '../../apis';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';
import type { User, AdministrativeUnit } from '../../types';
import CitizenFormDrawer from './components/CitizenFormDrawer';
import CitizenDetailModal from './components/CitizenDetailModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import SendNotificationModal from './components/SendNotificationModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import FilterModal from './components/FilterModal';




export default function CitizenListPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Load roles from database dynamically
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.getAll(),
  });

  const getRoleIdByName = (name: 'RESIDENT' | 'VOLUNTEER'): number => {
    if (!rolesData?.data) {
      return name === 'RESIDENT' ? 9 : 10;
    }
    const match = rolesData.data.find(
      (r) => r.name === name || (name === 'RESIDENT' && r.name === 'USER')
    );
    return match ? match.id : (name === 'RESIDENT' ? 9 : 10);
  };

  const residentRoleId = getRoleIdByName('RESIDENT');
  const volunteerRoleId = getRoleIdByName('VOLUNTEER');

  // Filters & Page State
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [verifFilter, setVerifFilter] = useState<string>('');
  const [supportFilter, setSupportFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);


  // Selected details / operations state
  const [selectedCitizen, setSelectedCitizen] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'general' | 'history' | 'trust' | 'support'>('general');

  // Form Drawer (Add/Edit) state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editCitizen, setEditCitizen] = useState<User | null>(null);

  // Operation Modals
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [notifyUser, setNotifyUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Selection states
  const [selectedCitizenIds, setSelectedCitizenIds] = useState<number[]>([]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCitizenIds(citizens.map((c) => c.id));
    } else {
      setSelectedCitizenIds([]);
    }
  };

  const handleSelectCitizen = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedCitizenIds((prev) => [...prev, id]);
    } else {
      setSelectedCitizenIds((prev) => prev.filter((uid) => uid !== id));
    }
  };

  // Reset selection on page or filter change
  useEffect(() => {
    setSelectedCitizenIds([]);
  }, [currentPage, searchQuery, areaFilter, verifFilter, supportFilter]);

  // References
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside three-dots dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Wards (Khu vực) of the current admin's province
  const [adminUnits, setAdminUnits] = useState<AdministrativeUnit[]>([]);
  useEffect(() => {
    if (currentUser?.provinceId) {
      locationApi.getWardsByProvinceId(currentUser.provinceId)
        .then(setAdminUnits)
        .catch(console.error);
    }
  }, [currentUser?.provinceId]);


  // Fetch Citizen list (only roleId = residentRoleId)
  const { data: dbData, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      'citizens',
      currentUser?.provinceId,
      searchQuery,
      areaFilter,
      verifFilter,
      supportFilter,
      currentPage,
      residentRoleId,
    ],
    queryFn: () => {
      // Map filters
      let isVerified: boolean | undefined = undefined;
      if (verifFilter === 'verified') isVerified = true;
      if (verifFilter === 'unverified') isVerified = false;

      let needsHelp: boolean | undefined = undefined;
      if (supportFilter === 'needs_help') needsHelp = true;
      if (supportFilter === 'normal') needsHelp = false;

      return userApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        provinceId: currentUser?.provinceId,
        roleId: residentRoleId, // strictly residents
        search: searchQuery || undefined,
        adminUnitId: areaFilter ? Number(areaFilter) : undefined,
        isVerified,
        needsHelp,
      });
    },
  });

  const citizens = dbData?.data || [];
  const totalItems = dbData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Fetch citizen statistics
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['citizen-stats', currentUser?.provinceId],
    queryFn: () => userApi.getStats({ provinceId: currentUser?.provinceId }),
  });




  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPass }: { id: number; newPass: string }) => {
      return userApi.resetPassword(id, newPass);
    },
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công!');
      setResetPasswordUser(null);
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi đặt lại mật khẩu');
    },
  });

  // Send Notification mutation
  const notifyMutation = useMutation({
    mutationFn: async ({ id, title, body, type }: { id: number; title: string; body: string; type: string }) => {
      return userApi.notify(id, { title, body, type });
    },
    onSuccess: () => {
      toast.success('Gửi thông báo thành công!');
      setNotifyUser(null);
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi gửi thông báo');
    },
  });

  // Delete citizen mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizens'] });
      queryClient.invalidateQueries({ queryKey: ['citizen-stats'] });
      toast.success('Xóa người dân thành công!');
      setDeleteUser(null);
      if (selectedCitizen?.id === deleteUser?.id) {
        setIsDetailOpen(false);
        setSelectedCitizen(null);
      }
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi xóa người dân');
    },
  });

  // Refresh page data
  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setAreaFilter('');
    setVerifFilter('');
    setSupportFilter('');
    setCurrentPage(1);
  };

  const getAdminUnitName = (id?: number) => {
    if (!id) return 'Chưa cập nhật';
    const match = adminUnits.find(u => u.id === id);
    return match ? match.name : `Khu vực #${id}`;
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Chưa rõ';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return 'Chưa rõ';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeFilterCount = (areaFilter ? 1 : 0) + (verifFilter ? 1 : 0) + (supportFilter ? 1 : 0);

  return (
    <div className="space-y-6 text-left flex-1 flex flex-col relative font-sans">
      
      {/* 1. Header and Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-wide">
            Quản lý người dân
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Quản lý thông tin người dân và tình nguyện viên trong hệ thống
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => {
              setEditCitizen(null);
              setIsDrawerOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <UserCheck size={14} />
            + Thêm người dân
          </button>

          <button
            onClick={() => toast.success('Tính năng xuất dữ liệu Excel sẽ được phát triển sớm!')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Upload size={14} className="rotate-180 text-gray-400" />
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng số người dân */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tổng số người dân</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {stats?.total?.toLocaleString('vi-VN') || 0}
            </h3>
            <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5">
              <span>↑ +248</span>
              <span className="text-gray-400 font-medium">so với tháng trước</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Đã xác minh */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Đã xác minh</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {stats?.verified?.toLocaleString('vi-VN') || 0}
            </h3>
            <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5">
              <span>↑ {stats?.total ? ((stats.verified / stats.total) * 100).toFixed(1) : 0}%</span>
              <span className="text-gray-400 font-medium">tổng số</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* Card 3: Chưa xác minh */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Chưa xác minh</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {stats?.unverified?.toLocaleString('vi-VN') || 0}
            </h3>
            <p className="text-[9px] text-amber-500 font-semibold flex items-center gap-0.5">
              <span>↑ {stats?.total ? ((stats.unverified / stats.total) * 100).toFixed(1) : 0}%</span>
              <span className="text-gray-400 font-medium">tổng số</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <UserMinus size={20} />
          </div>
        </div>

        {/* Card 4: Tình nguyện viên */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tình nguyện viên</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              {stats?.volunteers?.toLocaleString('vi-VN') || 0}
            </h3>
            <p className="text-[9px] text-indigo-500 font-semibold flex items-center gap-0.5">
              <span>↑ +128</span>
              <span className="text-gray-400 font-medium">so với tháng trước</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Card 5: Cần hỗ trợ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cần hỗ trợ</p>
            <h3 className="text-2xl font-extrabold text-red-500 leading-tight">
              {stats?.needsHelp?.toLocaleString('vi-VN') || 0}
            </h3>
            <p className="text-[9px] text-red-500 font-semibold flex items-center gap-0.5">
              <span>↑ +32</span>
              <span className="text-gray-400 font-medium">so với tuần trước</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
            <Heart size={20} />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        {/* Left Side: Search input & Filter Button */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex items-center flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, SĐT, CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder-gray-400"
            />
            <Search size={14} className="absolute left-3 text-gray-400" />
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal size={13} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 bg-blue-650 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex items-center justify-end gap-2.5 select-none">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
            className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl transition-all shadow-sm cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2 border border-red-200 hover:border-red-300 bg-red-50/30 hover:bg-red-50 text-red-500 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedCitizenIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3.5 rounded-2xl shadow-sm transition-all duration-200 select-none mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
              Đã chọn {selectedCitizenIds.length} người dân
            </span>
            <div className="hidden sm:block h-4 w-px bg-blue-200 dark:bg-blue-900" />
            <button
              onClick={() => setSelectedCitizenIds([])}
              className="text-xs font-bold text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* 4. Citizens Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={citizens.length > 0 && selectedCitizenIds.length === citizens.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">CCCD/CMND</th>
                <th className="py-3.5 px-4">Ngày sinh</th>
                <th className="py-3.5 px-4">Giới tính</th>
                <th className="py-3.5 px-4">Khu vực</th>
                <th className="py-3.5 px-4">Trạng thái xác minh</th>
                <th className="py-3.5 px-4">Tình trạng hỗ trợ</th>
                <th className="py-3.5 px-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="font-semibold text-xs">Đang tải danh sách người dân...</p>
                    </div>
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-gray-400 font-semibold">
                    Không tìm thấy người dân nào
                  </td>
                </tr>
              ) : (
                citizens.map((item, index) => {
                  const stt = (currentPage - 1) * itemsPerPage + index + 1;
                  
                  const isVerified = item.isVerified || item.nationalIdVerified;
                  const isVolunteer = item.isVolunteer;
                  const needsHelp = item.needsHelp;
                  const isRowSelected = selectedCitizenIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors select-none",
                        isRowSelected && "bg-blue-50/20 dark:bg-blue-900/10"
                      )}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => handleSelectCitizen(item.id, e)}
                          className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 text-center text-gray-500 font-medium">{stt}</td>
                      
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-300 flex-shrink-0">
                            {item.avatarUrl ? (
                              <img src={item.avatarUrl} alt={item.fullName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              item.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {item.fullName}
                              {isVolunteer && (
                                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 text-[8px] font-bold rounded-full uppercase" title="Tình nguyện viên">
                                  TNV
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-semibold text-gray-700 dark:text-slate-200">
                        {item.phone || 'Chưa cập nhật'}
                      </td>

                      {/* National ID */}
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-slate-400">
                        {item.nationalId || 'Chưa cập nhật'}
                      </td>

                      {/* Date of Birth */}
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                        {formatDate(item.dateOfBirth)}
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                        {item.gender === 'MALE' ? 'Nam' : item.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </td>

                      {/* District / Ward */}
                      <td className="py-3 px-4 font-semibold text-gray-750 dark:text-slate-300">
                        {getAdminUnitName(item.adminUnitId)}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4">
                        <span className={cn(
                          'px-2.5 py-0.5 text-[9px] font-bold rounded-full inline-flex items-center gap-1 uppercase',
                          isVerified
                            ? 'bg-emerald-500/10 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                        )}>
                          {isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                      </td>

                      {/* Support Status */}
                      <td className="py-3 px-4">
                        <span className={cn(
                          'px-2.5 py-0.5 text-[9px] font-bold rounded-full inline-flex items-center gap-1 uppercase',
                          needsHelp
                            ? 'bg-red-500/10 text-red-650 dark:bg-red-950/20 dark:text-red-450'
                            : 'bg-blue-500/10 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400'
                        )}>
                          {needsHelp ? 'Cần hỗ trợ' : 'Bình thường'}
                        </span>
                      </td>



                      {/* Operations */}
                      <td className="py-3 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCitizen(item);
                              setDetailTab('general');
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-blue-500 hover:text-blue-600 transition-all cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => {
                              setEditCitizen(item);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-amber-500 hover:text-amber-600 transition-all cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={14} />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
                              title="Menu khác"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Options */}
                            {activeDropdownId === item.id && (
                              <div 
                                ref={dropdownRef}
                                className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-lg z-30 py-1"
                              >
                                <button
                                  onClick={() => {
                                    setResetPasswordUser(item);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-0 bg-transparent"
                                >
                                  <Key size={13} className="text-gray-400" />
                                  Đặt lại mật khẩu
                                </button>

                                <button
                                  onClick={() => {
                                    setNotifyUser(item);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-0 bg-transparent"
                                >
                                  <Bell size={13} className="text-gray-400" />
                                  Gửi thông báo
                                </button>

                                <div className="h-px bg-slate-100 dark:bg-gray-700 my-1" />

                                <button
                                  onClick={() => {
                                    setDeleteUser(item);
                                    setActiveDropdownId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold flex items-center gap-2 transition-colors cursor-pointer border-0 bg-transparent"
                                >
                                  <Trash2 size={13} className="text-red-500" />
                                  Xác nhận xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination block */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-700/60 select-none bg-slate-50/50 dark:bg-gray-900/20 text-slate-500 text-xs">
          <div className="font-semibold">
            Hiển thị <span className="text-gray-900 dark:text-white">{citizens.length}</span> trên <span className="text-gray-900 dark:text-white">{totalItems}</span> người dân
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
            >
              <ChevronsLeft size={13} />
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-950 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-bold transition-all border cursor-pointer',
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800/40 text-gray-550 hover:text-gray-950 border-slate-200 dark:border-slate-700 dark:text-gray-400'
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-955 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-955 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
            >
              <ChevronsRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. ADD / EDIT DRAWER */}
      <CitizenFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditCitizen(null);
        }}
        citizen={editCitizen}
        adminUnits={adminUnits}
        onSaveSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['citizens'] });
          queryClient.invalidateQueries({ queryKey: ['citizen-stats'] });
        }}
        userRoleId={residentRoleId}
        volunteerRoleId={volunteerRoleId}
      />

      {/* 6. DETAIL MODAL */}
      <CitizenDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCitizen(null);
        }}
        citizen={selectedCitizen}
        getAdminUnitName={getAdminUnitName}
        tab={detailTab}
        setTab={setDetailTab}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        onEdit={(user) => {
          setIsDetailOpen(false);
          setEditCitizen(user);
          setIsDrawerOpen(true);
        }}
        onNotify={(user) => {
          setIsDetailOpen(false);
          setNotifyUser(user);
        }}
        onDelete={(user) => {
          setIsDetailOpen(false);
          setDeleteUser(user);
        }}
      />

      {/* 7. RESET PASSWORD MODAL */}
      <ResetPasswordModal
        isOpen={resetPasswordUser !== null}
        onClose={() => setResetPasswordUser(null)}
        citizen={resetPasswordUser}
        onSubmit={(newPass) => {
          if (resetPasswordUser) {
            resetPasswordMutation.mutate({ id: resetPasswordUser.id, newPass });
          }
        }}
        isLoading={resetPasswordMutation.isPending}
      />

      {/* 8. SEND NOTIFICATION MODAL */}
      <SendNotificationModal
        isOpen={notifyUser !== null}
        onClose={() => setNotifyUser(null)}
        citizen={notifyUser}
        onSubmit={(title, body, type) => {
          if (notifyUser) {
            notifyMutation.mutate({ id: notifyUser.id, title, body, type });
          }
        }}
        isLoading={notifyMutation.isPending}
      />

      {/* 9. SECURE DELETE MODAL */}
      <DeleteConfirmModal
        isOpen={deleteUser !== null}
        onClose={() => setDeleteUser(null)}
        citizen={deleteUser}
        onConfirm={() => {
          if (deleteUser) {
            deleteMutation.mutate(deleteUser.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />

      {/* 10. FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        areaFilter={areaFilter}
        setAreaFilter={setAreaFilter}
        verifFilter={verifFilter}
        setVerifFilter={setVerifFilter}
        supportFilter={supportFilter}
        setSupportFilter={setSupportFilter}
        adminUnits={adminUnits}
        onClear={handleClearFilters}
      />
    </div>
  );
}

