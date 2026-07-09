import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  ArrowUpDown,
  Upload,
} from 'lucide-react';
import ExportMenu from '../../components/common/ExportMenu';
import { userApi, locationApi, roleApi } from '../../apis';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import UserFormModal from './UserFormModal';
import type { User, Province, AdministrativeUnit } from '../../types';
import TableSettings from '../../components/common/TableSettings';
import type { TableColumnDef } from '../../components/common/TableSettings';

const USER_COLUMNS: TableColumnDef[] = [
  { key: 'user', label: 'Người Dùng' },
  { key: 'dob', label: 'Ngày Sinh' },
  { key: 'contact', label: 'Liên Hệ' },
  { key: 'adminUnit', label: 'Đơn vị hành chính' },
  { key: 'role', label: 'Vai Trò' },
  { key: 'status', label: 'Trạng Thái' },
  { key: 'nationalId', label: 'CCCD' },
];

export default function UserListPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Table column configuration
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('user_table_columns');
    return saved ? JSON.parse(saved) : {
      user: true,
      dob: true,
      contact: true,
      adminUnit: true,
      role: true,
      status: true,
      nationalId: true,
    };
  });

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt_desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  
  // Table Page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Checked User IDs for bulk operations or visual selection
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkRoleId, setBulkRoleId] = useState<number | ''>('');
  const [bulkStatus, setBulkStatus] = useState<boolean | ''>('');

  // Selected User for details pane (right column)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsTab, setDetailsTab] = useState<'general' | 'roles' | 'history'>('general');

  // Deletion Modal
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  // Provinces database lookup
  const [provinces, setProvinces] = useState<Province[]>([]);
  useEffect(() => {
    locationApi.getAllProvinces().then(setProvinces).catch(console.error);
  }, []);

  // Wards / Administrative units database lookup for current province
  const [adminUnits, setAdminUnits] = useState<AdministrativeUnit[]>([]);
  useEffect(() => {
    if (currentUser?.provinceId) {
      locationApi.getWardsByProvinceId(currentUser.provinceId)
        .then(setAdminUnits)
        .catch(console.error);
    }
  }, [currentUser?.provinceId]);

  // Fetch users (dynamically filtered by logged in user's provinceId)
  const { data: dbData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['system-users', currentUser?.provinceId],
    queryFn: () => userApi.getAll({ page: 1, limit: 300, provinceId: currentUser?.provinceId }),
  });

  const users = dbData?.data || [];

  // Fetch roles dynamically from database
  const { data: rolesData } = useQuery({
    queryKey: ['system-roles'],
    queryFn: () => roleApi.getAll({ limit: 100 }),
  });

  const roles = rolesData?.data || [];

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      return userApi.update(userId, { roleId } as any);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      setSelectedUser(updatedUser);
      toast.success('Cập nhật vai trò thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi cập nhật vai trò');
    },
  });

  const handleUpdateRole = (userId: number, roleId: number) => {
    updateRoleMutation.mutate({ userId, roleId });
  };

  const getUserActiveRoleName = (u: User) => {
    if (u.userRoles && u.userRoles.length > 0) {
      const activeRoleMap = u.userRoles.find(ur => ur.isActive) || u.userRoles[0];
      if (activeRoleMap && activeRoleMap.role) {
        return activeRoleMap.role.name;
      }
    }
    return u.role;
  };

  const getUserRoleId = (u: User) => {
    if (u.userRoles && u.userRoles.length > 0) {
      const activeRoleMap = u.userRoles.find(ur => ur.isActive) || u.userRoles[0];
      if (activeRoleMap) {
        return activeRoleMap.roleId;
      }
    }
    return 4; // Default to USER (4)
  };

  // Toggle user active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return userApi.updateStatus(id, isActive);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      if (selectedUser?.id === updatedUser.id) {
        setSelectedUser(updatedUser);
      }
      toast.success(updatedUser.isActive ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi cập nhật trạng thái');
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      if (selectedUser?.id === deleteUserId) {
        setSelectedUser(null);
      }
      setSelectedUserIds(prev => prev.filter(uid => uid !== deleteUserId));
      setDeleteUserId(null);
      toast.success('Xóa người dùng thành công!');
    },
    onError: (err: any) => {
      setDeleteUserId(null);
      toast.api(err, 'Lỗi khi xóa người dùng');
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { roleId?: number; isActive?: boolean }) => {
      return userApi.bulkUpdate(selectedUserIds, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      setSelectedUserIds([]);
      setBulkAction('');
      setBulkRoleId('');
      setBulkStatus('');
      toast.success(`Cập nhật thành công ${result?.updated || selectedUserIds.length} người dùng!`);
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi cập nhật hàng loạt người dùng');
    },
  });

  const handleToggleStatus = (targetUser: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleStatusMutation.mutate({ id: targetUser.id, isActive: !targetUser.isActive as any });
  };

  const handleConfirmDelete = () => {
    if (deleteUserId) {
      deleteMutation.mutate(deleteUserId);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setSortBy('createdAt_desc');
    setCurrentPage(1);
    setSelectedUserIds([]);
  };

  // Client side search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Search query match (FullName, Phone, Email, NationalId/CCCD)
      const name = u.fullName || '';
      const email = u.email || '';
      const phone = u.phone || '';
      const nationalId = u.nationalId || '';
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nationalId.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Role filter match
      const matchesRole = !roleFilter || getUserActiveRoleName(u) === roleFilter;

      // 3. Status filter dropdown match
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = !!u.isActive;
      else if (statusFilter === 'inactive') matchesStatus = !u.isActive;
      else if (statusFilter === 'pending') matchesStatus = !u.isVerified;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Client side sorting
  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    if (sortBy === 'createdAt_desc') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'createdAt_asc') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'fullName_asc') {
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'vi'));
    } else if (sortBy === 'fullName_desc') {
      list.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || '', 'vi'));
    } else if (sortBy === 'trustScore_desc') {
      list.sort((a, b) => (b.trustScore ?? 50) - (a.trustScore ?? 50));
    } else if (sortBy === 'trustScore_asc') {
      list.sort((a, b) => (a.trustScore ?? 50) - (b.trustScore ?? 50));
    }
    return list;
  }, [filteredUsers, sortBy]);

  // Paginated chunk
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));

  // Reset pagination on filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, sortBy]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedUserIds(prev => [...prev, id]);
    } else {
      setSelectedUserIds(prev => prev.filter(uid => uid !== id));
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Chưa rõ';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getUserRoleName = (u: User) => {
    if (u.userRoles && u.userRoles.length > 0) {
      const activeRoleMap = u.userRoles.find(ur => ur.isActive) || u.userRoles[0];
      if (activeRoleMap && activeRoleMap.role) {
        const dbRole = roles.find(r => r.id === activeRoleMap.roleId);
        return dbRole ? (dbRole.description || dbRole.name) : activeRoleMap.role.description || activeRoleMap.role.name;
      }
    }
    const dbRole = roles.find(r => r.name === u.role);
    return dbRole ? (dbRole.description || dbRole.name) : u.role || 'Người dùng thường';
  };

  const getRoleBadge = (roleName?: string) => {
    if (!roleName) return 'bg-gray-500/10 text-gray-500 border border-gray-500/20 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800';
    const nameLower = roleName.toLowerCase();
    
    if (
      nameLower === 'system_admin' || 
      nameLower.includes('admin hệ thống') || 
      nameLower.includes('system admin')
    ) {
      return 'bg-red-500/10 text-red-600 border border-red-500/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    }
    if (
      nameLower === 'province_admin' || 
      nameLower.includes('admin tỉnh') || 
      nameLower.includes('province admin')
    ) {
      return 'bg-purple-500/10 text-purple-550 border border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
    }
    if (
      nameLower === 'coordinator' || 
      nameLower.includes('điều phối') || 
      nameLower.includes('nhân viên')
    ) {
      return 'bg-indigo-500/10 text-indigo-550 border border-indigo-500/20 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
    }
    if (
      nameLower.includes('trưởng') || 
      nameLower.includes('leader')
    ) {
      return 'bg-amber-500/10 text-amber-600 border border-amber-550/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    }
    if (
      nameLower === 'volunteer' || 
      nameLower.includes('tình nguyện')
    ) {
      return 'bg-teal-500/10 text-teal-650 border border-teal-500/20 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30';
    }
    
    return 'bg-gray-500/10 text-gray-500 border border-gray-500/20 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800';
  };

  const provinceName = useMemo(() => {
    if (!currentUser?.provinceId) return 'Thành phố Đà Nẵng';
    const match = provinces.find(p => p.id === currentUser.provinceId);
    return match ? match.name : 'Vùng quản trị';
  }, [currentUser, provinces]);

  const getAdminUnitName = (adminUnitId?: number) => {
    if (!adminUnitId) return 'Chưa cập nhật';
    const match = adminUnits.find(u => u.id === adminUnitId);
    return match ? match.name : `Đơn vị #${adminUnitId}`;
  };

  const displayAdminUnit = (item: User) => {
    if (!item.adminUnitId) return 'Chưa cập nhật';
    const ward = getAdminUnitName(item.adminUnitId);
    const prov = provinces.find(p => p.id === item.provinceId);
    const provName = prov ? (prov.shortName || prov.name) : '';
    return provName ? `${ward}, ${provName}` : ward;
  };

  return (
    <div 
      className="space-y-4 text-left z-10 flex-1 flex flex-col relative font-sans" 
      style={{ fontFamily: 'Roboto, sans-serif' }}
    >
      {/* Top Actions row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4 select-none">
        {/* Action icons aligning with user-list.png header style */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {/* Import Button */}
          <button 
            type="button"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            onClick={() => toast.success('Tính năng Nhập Excel sẽ sớm được phát triển!')}
          >
            <Upload size={13} className="text-gray-400" />
            Nhập Excel
          </button>

          {/* Export Menu Dropdown */}
          <ExportMenu />

          <button 
            type="button"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <i className="fa-solid fa-filter text-[11px]"></i>
            Bộ lọc
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setEditUser(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500/90 hover:bg-amber-600/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Grid container with list on left, details pane on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
        
        {/* Left Side List View */}
        <div className={cn(
          "transition-all duration-300 space-y-4 flex flex-col",
          selectedUser ? "lg:col-span-8" : "lg:col-span-12"
        )}>
          
          {/* Row search parameters & filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            
            {/* Search Input bar */}
            <div className="relative flex items-center flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, SĐT, email, CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium placeholder-gray-400"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 text-gray-400 text-[12px]"></i>
            </div>

            {/* Role select */}
            <div className="w-full sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold cursor-pointer"
              >
                <option value="">Tất cả vai trò</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.description || r.name}</option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold cursor-pointer"
              >
                <option value="">Trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu hóa</option>
                <option value="pending">Chờ xác thực</option>
              </select>
            </div>

            {/* Sort Button and Custom Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                title="Sắp xếp"
              >
                <ArrowUpDown size={14} className="text-gray-400" />
                <span>Sắp xếp</span>
              </button>

              {isSortOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 py-1.5 select-none divide-y divide-slate-100 dark:divide-slate-700/60">
                    <button
                      type="button"
                      onClick={() => { setSortBy('createdAt_desc'); setIsSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-0 bg-transparent",
                        sortBy === 'createdAt_desc' ? "text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Mới tạo nhất
                      {sortBy === 'createdAt_desc' && <span className="text-[10px]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('createdAt_asc'); setIsSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-0 bg-transparent",
                        sortBy === 'createdAt_asc' ? "text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Cũ nhất
                      {sortBy === 'createdAt_asc' && <span className="text-[10px]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('fullName_asc'); setIsSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-0 bg-transparent",
                        sortBy === 'fullName_asc' ? "text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Tên A-Z
                      {sortBy === 'fullName_asc' && <span className="text-[10px]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('fullName_desc'); setIsSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-0 bg-transparent",
                        sortBy === 'fullName_desc' ? "text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Tên Z-A
                      {sortBy === 'fullName_desc' && <span className="text-[10px]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('trustScore_desc'); setIsSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-0 bg-transparent",
                        sortBy === 'trustScore_desc' ? "text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Điểm tin cậy (Cao - Thấp)
                      {sortBy === 'trustScore_desc' && <span className="text-[10px]">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('trustScore_asc'); setIsSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-0 bg-transparent",
                        sortBy === 'trustScore_asc' ? "text-amber-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Điểm tin cậy (Thấp - Cao)
                      {sortBy === 'trustScore_asc' && <span className="text-[10px]">✓</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Clear filters action */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
                className="flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl transition-all shadow-sm cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={14} className={cn(isFetching && "animate-spin")} />
              </button>
              <button 
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Xóa lọc
              </button>
              <TableSettings
                columns={USER_COLUMNS}
                visibleColumns={visibleColumns}
                onChange={setVisibleColumns}
                storageKey="user_table_columns"
              />
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedUserIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3.5 rounded-2xl shadow-sm transition-all duration-200 select-none">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                  Đã chọn {selectedUserIds.length} người dùng
                </span>
                <div className="hidden sm:block h-4 w-px bg-amber-200 dark:bg-amber-900" />
                
                {/* Action Type Select */}
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    setBulkAction(e.target.value);
                    setBulkRoleId('');
                    setBulkStatus('');
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Chọn hành động hàng loạt --</option>
                  <option value="role">Cập nhật Vai trò</option>
                  <option value="status">Cập nhật Trạng thái</option>
                </select>

                {/* Sub-action: Role Select */}
                {bulkAction === 'role' && (
                  <select
                    value={bulkRoleId}
                    onChange={(e) => setBulkRoleId(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">Chọn vai trò...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.description || r.name}</option>
                    ))}
                  </select>
                )}

                {/* Sub-action: Status Select */}
                {bulkAction === 'status' && (
                  <select
                    value={bulkStatus === '' ? '' : bulkStatus ? 'true' : 'false'}
                    onChange={(e) => setBulkStatus(e.target.value === 'true')}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">Chọn trạng thái...</option>
                    <option value="true">Hoạt động</option>
                    <option value="false">Khóa tài khoản</option>
                  </select>
                )}

                {/* Apply Button */}
                {((bulkAction === 'role' && bulkRoleId !== '') || (bulkAction === 'status' && bulkStatus !== '')) && (
                  <button
                    type="button"
                    disabled={bulkUpdateMutation.isPending}
                    onClick={() => {
                      if (bulkAction === 'role' && bulkRoleId !== '') {
                        bulkUpdateMutation.mutate({ roleId: Number(bulkRoleId) });
                      } else if (bulkAction === 'status' && bulkStatus !== '') {
                        bulkUpdateMutation.mutate({ isActive: !!bulkStatus });
                      }
                    }}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-0 disabled:opacity-50"
                  >
                    {bulkUpdateMutation.isPending ? 'Đang cập nhật...' : 'Áp dụng'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUserIds([]);
                  setBulkAction('');
                  setBulkRoleId('');
                  setBulkStatus('');
                }}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Hủy chọn
              </button>
            </div>
          )}

          {/* User Table card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    {visibleColumns.user !== false && <th className="py-3.5 px-4">Người Dùng</th>}
                    {visibleColumns.dob !== false && <th className="py-3.5 px-4">Ngày Sinh</th>}
                    {visibleColumns.contact !== false && <th className="py-3.5 px-4">Liên Hệ</th>}
                    {visibleColumns.adminUnit !== false && <th className="py-3.5 px-4">Đơn vị hành chính</th>}
                    {visibleColumns.role !== false && <th className="py-3.5 px-4">Vai Trò</th>}
                    {visibleColumns.status !== false && <th className="py-3.5 px-4">Trạng Thái</th>}
                    {visibleColumns.nationalId !== false && <th className="py-3.5 px-4">CCCD</th>}
                    <th className="py-3.5 px-4 text-center w-24">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          <p className="font-semibold text-xs">Đang tải danh sách người dùng...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3 + Object.values(visibleColumns).filter(v => v !== false).length} className="py-16 text-center text-gray-400 font-semibold">
                        Không tìm thấy người dùng nào
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((item, index) => {
                      const num = (currentPage - 1) * itemsPerPage + index + 1;
                      const isRowSelected = selectedUser?.id === item.id;
                      const isChecked = selectedUserIds.includes(item.id);
                      
                      const dotColor = item.isActive
                        ? 'bg-emerald-500'
                        : !item.isVerified
                          ? 'bg-amber-500'
                          : 'bg-red-500';

                      const statusText = item.isActive
                        ? 'Hoạt động'
                        : !item.isVerified
                          ? 'Chờ xác thực'
                          : 'Vô hiệu hóa';

                      const statusBadgeClass = item.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                        : !item.isVerified
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                          : 'bg-red-500/10 text-red-600 border border-red-500/20 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedUser(item)}
                          className={cn(
                            "group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer select-none",
                            isRowSelected && "bg-amber-500/5 dark:bg-amber-500/5 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border-l-2 border-amber-500"
                          )}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleSelectUser(item.id, e)}
                              className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                            />
                          </td>

                          {/* Index STT */}
                          <td className="py-4 px-4 text-center text-black dark:text-white font-normal">{num}</td>
                          
                          {/* Profile details stacked */}
                          {visibleColumns.user !== false && (
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-normal text-xs flex-shrink-0">
                                  {item.avatarUrl ? (
                                    <img src={item.avatarUrl} alt={item.fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    item.fullName.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="text-left leading-tight">
                                  <p className="font-normal text-black dark:text-white flex items-center gap-1.5">
                                    {item.fullName}
                                    {item.isVerified && (
                                      <span 
                                        className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px]" 
                                        title="Đã xác thực"
                                      >
                                        ✓
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-black dark:text-white font-normal mt-0.5">ID: {item.id}</p>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Ngày sinh */}
                          {visibleColumns.dob !== false && (
                            <td className="py-3 px-4 text-black dark:text-white font-normal">
                              {formatDate(item.dateOfBirth)}
                            </td>
                          )}

                          {/* Contact information stacked */}
                          {visibleColumns.contact !== false && (
                            <td className="py-3 px-4 text-left leading-normal font-normal">
                              <p className="text-black dark:text-white font-normal">{item.phone || 'Chưa có sđt'}</p>
                              <p className="text-[10px] text-black dark:text-white font-normal">{item.email || 'Chưa có email'}</p>
                            </td>
                          )}

                          {/* Đơn vị hành chính */}
                          {visibleColumns.adminUnit !== false && (
                            <td className="py-3 px-4 text-black dark:text-white font-normal">
                              {displayAdminUnit(item)}
                            </td>
                          )}

                          {/* Dynamic Roles badges */}
                          {visibleColumns.role !== false && (
                            <td className="py-3 px-4">
                              <span className={cn('px-2.5 py-0.5 text-[9px] font-normal rounded-lg uppercase tracking-wider whitespace-nowrap', getRoleBadge(getUserRoleName(item)))}>
                                {getUserRoleName(item)}
                              </span>
                            </td>
                          )}

                          {/* Status code badges */}
                          {visibleColumns.status !== false && (
                            <td className="py-3 px-4">
                              {item.isActive ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                                  <i className="fa-solid fa-check text-[11px] text-emerald-500"></i>
                                </span>
                              ) : (
                                <span className={cn('px-2.5 py-0.5 text-[9px] font-normal rounded-full inline-flex items-center gap-1.5 uppercase', statusBadgeClass)}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
                                  {statusText}
                                </span>
                              )}
                            </td>
                          )}

                          {/* CCCD (National ID) Column */}
                          {visibleColumns.nationalId !== false && (
                            <td className="py-3 px-4 text-black dark:text-white font-mono font-normal">
                              {item.nationalId || 'Chưa cập nhật'}
                            </td>
                          )}

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(item);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                title="Xem chi tiết"
                              >
                                <i className="fa-solid fa-eye text-[13px] text-blue-500 hover:text-blue-600"></i>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditUser(item);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                title="Chỉnh sửa"
                              >
                                <i className="fa-solid fa-pen text-[13px] text-amber-500 hover:text-amber-600"></i>
                              </button>
                              
                              <button
                                onClick={(e) => handleToggleStatus(item, e)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                title={item.isActive ? 'Khóa hoạt động' : 'Kích hoạt'}
                              >
                                {item.isActive ? (
                                  <i className="fa-solid fa-user-xmark text-[13px] text-amber-500 hover:text-amber-600"></i>
                                ) : (
                                  <i className="fa-solid fa-user-check text-[13px] text-emerald-500 hover:text-emerald-600"></i>
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteUserId(item.id);
                                }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-all"
                                title="Xóa tài khoản"
                              >
                                <i className="fa-solid fa-trash text-[13px] text-red-500 hover:text-red-600"></i>
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

            {/* Pagination block */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-700/60 select-none bg-slate-50/50 dark:bg-gray-900/20 text-slate-500">
              <div className="text-xs font-semibold">
                Hiển thị <span className="text-gray-900 dark:text-white">{paginatedUsers.length}</span> trên <span className="text-gray-900 dark:text-white">{filteredUsers.length}</span> kết quả
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
                >
                  <ChevronsLeft size={13} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
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
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 border-slate-200 dark:border-slate-700 dark:text-gray-400'
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
                >
                  <ChevronsRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Details pane */}
        {selectedUser && (
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5 space-y-4 flex flex-col h-full sticky top-3">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Chi tiết người dùng
              </h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                title="Đóng bảng"
              >
                <i className="fa-solid fa-xmark text-[13px]"></i>
              </button>
            </div>

            <div className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-gray-400 flex-shrink-0">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  <i className="fa-solid fa-user text-[24px]"></i>
                )}
              </div>
              <div className="space-y-1 text-left min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate flex items-center gap-2 flex-wrap">
                  {selectedUser.fullName}
                  <span className={cn(
                    'px-2 py-0.5 text-[8px] font-extrabold rounded-full uppercase',
                    selectedUser.isActive
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                  )}>
                    {selectedUser.isActive ? '● Hoạt động' : '● Vô hiệu hóa'}
                  </span>
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold leading-none">ID: {selectedUser.id}</p>
                <span className={cn('px-2 py-0.5 text-[8px] font-bold rounded uppercase inline-block mt-1', getRoleBadge(getUserRoleName(selectedUser)))}>
                  {getUserRoleName(selectedUser)}
                </span>
              </div>
            </div>

            {/* details sub-tabs navigation */}
            <div className="flex border-b border-slate-100 dark:border-slate-700 gap-3 text-xs leading-none">
              <button
                onClick={() => setDetailsTab('general')}
                className={cn(
                  'pb-2 px-1 font-bold border-b-2 transition-all cursor-pointer',
                  detailsTab === 'general' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-700'
                )}
              >
                Thông tin chung
              </button>
              <button
                onClick={() => setDetailsTab('roles')}
                className={cn(
                  'pb-2 px-1 font-bold border-b-2 transition-all cursor-pointer',
                  detailsTab === 'roles' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-700'
                )}
              >
                Vai trò & quyền
              </button>
              <button
                onClick={() => setDetailsTab('history')}
                className={cn(
                  'pb-2 px-1 font-bold border-b-2 transition-all cursor-pointer',
                  detailsTab === 'history' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-700'
                )}
              >
                Lịch sử hoạt động
              </button>
            </div>

            {/* detail pane scrollable content */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-4 text-xs">
              
              {/* general tab view */}
              {detailsTab === 'general' && (
                <div className="space-y-4 text-left">
                  
                  {/* personal info section with bold black headers */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-black dark:text-white text-[11px] uppercase tracking-wider">
                      Thông tin cá nhân
                    </h5>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Họ và tên</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right">{selectedUser.fullName}</span>
                      </div>
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Ngày sinh</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right">{formatDate(selectedUser.dateOfBirth)}</span>
                      </div>
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Giới tính</span>
                        <span className="font-normal text-gray-900 dark:text-white text-right">
                          {selectedUser.gender === 'MALE' ? 'Nam' : selectedUser.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                        </span>
                      </div>
                      
                      {/* CCCD with inline verified badge */}
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">CCCD</span>
                        <div className="flex items-center text-right font-mono font-bold text-gray-950 dark:text-white">
                          <span>{selectedUser.nationalId || 'Chưa cập nhật'}</span>
                          {selectedUser.nationalIdVerified && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-emerald-500/10 text-emerald-500 rounded-full font-bold" title="Đã xác thực">
                              <i className="fa-solid fa-check text-[9px] text-emerald-500"></i>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Phone with inline verified badge */}
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Số điện thoại</span>
                        <div className="flex items-center text-right font-bold text-gray-900 dark:text-white">
                          <span>{selectedUser.phone || 'Chưa cập nhật'}</span>
                          {selectedUser.phoneVerified && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-emerald-500/10 text-emerald-500 rounded-full font-bold" title="Đã xác thực">
                              <i className="fa-solid fa-check text-[9px] text-emerald-500"></i>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Email with inline verified badge */}
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Email</span>
                        <div className="flex items-center text-right font-bold text-gray-900 dark:text-white min-w-0">
                          <span className="truncate max-w-[120px]" title={selectedUser.email}>{selectedUser.email || 'Chưa cập nhật'}</span>
                          {selectedUser.emailVerified && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-emerald-500/10 text-emerald-500 rounded-full font-bold flex-shrink-0" title="Đã xác thực">
                              <i className="fa-solid fa-check text-[9px] text-emerald-500"></i>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Địa chỉ chi tiết</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right truncate max-w-[150px]" title={selectedUser.addressDetail}>{selectedUser.addressDetail || 'Chưa cập nhật'}</span>
                      </div>
                      
                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Địa bàn đăng ký</span>
                        <span className="font-bold text-amber-500 text-right">{provinceName}</span>
                      </div>

                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Đơn vị hành chính</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right">{getAdminUnitName(selectedUser.adminUnitId)}</span>
                      </div>

                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Điểm tin cậy</span>
                        <span className="font-bold text-indigo-650 dark:text-indigo-400 text-right">{selectedUser.trustScore ?? 50}/100</span>
                      </div>

                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Tình nguyện viên</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right">{selectedUser.isVolunteer ? 'Có' : 'Không'}</span>
                      </div>

                      <div className="py-2 flex justify-between gap-2 items-center">
                        <span className="text-gray-500 font-semibold">Yêu cầu hỗ trợ khẩn cấp</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right">{selectedUser.needsHelp ? 'Đang cần hỗ trợ' : 'Không'}</span>
                      </div>
                    </div>
                  </div>

                  {/* verification state with bold black header */}
                  <div className="space-y-2.5 pt-1">
                    <h5 className="font-bold text-black dark:text-white text-[11px] uppercase tracking-wider">
                      Thông tin xác thực
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl text-center flex flex-col items-center gap-1.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase leading-none">CCCD</span>
                        {selectedUser.nationalIdVerified ? (
                          <i className="fa-solid fa-check text-[14px] text-emerald-500"></i>
                        ) : (
                          <i className="fa-solid fa-xmark text-[14px] text-red-500"></i>
                        )}
                        <span className="text-[9px] font-bold">{selectedUser.nationalIdVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
                      </div>

                      <div className="p-2 border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl text-center flex flex-col items-center gap-1.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase leading-none">SĐT</span>
                        {selectedUser.phoneVerified ? (
                          <i className="fa-solid fa-check text-[14px] text-emerald-500"></i>
                        ) : (
                          <i className="fa-solid fa-xmark text-[14px] text-red-500"></i>
                        )}
                        <span className="text-[9px] font-bold">{selectedUser.phoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
                      </div>

                      <div className="p-2 border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl text-center flex flex-col items-center gap-1.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase leading-none">Email</span>
                        {selectedUser.emailVerified ? (
                          <i className="fa-solid fa-check text-[14px] text-emerald-500"></i>
                        ) : (
                          <i className="fa-solid fa-xmark text-[14px] text-red-500"></i>
                        )}
                        <span className="text-[9px] font-bold">{selectedUser.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
                      </div>
                    </div>
                  </div>

                  {/* location GPS layout with bold black header */}
                  <div className="space-y-2.5 pt-1">
                    <h5 className="font-bold text-black dark:text-white text-[11px] uppercase tracking-wider">
                      Vị trí địa lý
                    </h5>
                    <div className="space-y-2 bg-slate-50/50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-700 rounded-xl p-3 text-left">
                      <div className="flex items-start gap-2.5">
                        <i className="fa-solid fa-map-pin text-[13px] text-amber-500 flex-shrink-0 mt-0.5"></i>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-slate-200 text-[10px] leading-none mb-1">Tọa độ nơi ở</p>
                          <p className="text-[10px] text-gray-400 font-semibold font-mono">
                            {selectedUser.homeLocation?.coordinates 
                              ? `Kinh độ: ${selectedUser.homeLocation.coordinates[0]}, Vĩ độ: ${selectedUser.homeLocation.coordinates[1]}`
                              : 'Chưa cập nhật tọa độ GPS'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Roles tab view */}
              {detailsTab === 'roles' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-gray-500 font-bold dark:text-gray-400 text-[11px] uppercase tracking-wider block">
                      Thay đổi vai trò thành viên
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={getUserRoleId(selectedUser)}
                        onChange={(e) => handleUpdateRole(selectedUser.id, Number(e.target.value))}
                        disabled={updateRoleMutation.isPending}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer disabled:opacity-60 font-semibold"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.description || r.name}
                          </option>
                        ))}
                      </select>
                      {updateRoleMutation.isPending && (
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="p-4 border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl leading-relaxed text-gray-550">
                    Vai trò hiện tại <span className="font-bold text-amber-500">"{getUserRoleName(selectedUser)}"</span> sở hữu quyền đọc, ghi, cập nhật danh mục thuộc phạm vi quản trị cấp tỉnh.
                  </div>
                </div>
              )}

              {/* mock history logs */}
              {detailsTab === 'history' && (
                <div className="space-y-3 text-left">
                  <div className="p-3 border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl">
                    <p className="font-bold text-gray-900 dark:text-white text-[10px]">Đăng nhập hệ thống thành công</p>
                    <p className="text-[9px] text-gray-400 mt-1 font-semibold">Thiết bị: Chrome trên Windows • Lúc: 1 giờ trước</p>
                  </div>
                  <div className="p-3 border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl">
                    <p className="font-bold text-gray-900 dark:text-white text-[10px]">Cập nhật tọa độ nhà riêng</p>
                    <p className="text-[9px] text-gray-400 mt-1 font-semibold">Tọa độ: Point [108.22, 16.06] • Lúc: Hôm qua</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick action buttons in Details Pane */}
            <div className="pt-3 border-t border-slate-100 dark:border-gray-700 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditUser(selectedUser);
                  setIsFormOpen(true);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-pen text-[13px]"></i>
                Chỉnh sửa thông tin
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={cn(
                    'flex-1 py-2 rounded-xl font-bold text-xs shadow-sm transition-all border flex items-center justify-center gap-1.5 cursor-pointer',
                    selectedUser.isActive
                      ? 'border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-amber-600 hover:bg-amber-500/5'
                      : 'border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 text-emerald-500 hover:bg-emerald-500/5'
                  )}
                >
                  {selectedUser.isActive ? (
                    <i className="fa-solid fa-user-xmark text-[13px]"></i>
                  ) : (
                    <i className="fa-solid fa-user-check text-[13px]"></i>
                  )}
                  {selectedUser.isActive ? 'Khóa tài khoản' : 'Kích hoạt'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setDeleteUserId(selectedUser.id)}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-trash text-[13px]"></i>
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Xóa tài khoản thành viên"
        message="Bạn có chắc chắn muốn xóa tài khoản này? Người dùng này sẽ bị thu hồi toàn bộ quyền truy cập và dữ liệu liên quan sẽ bị xóa mềm."
      />

      {/* Edit/Create Form Modal */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditUser(null);
        }}
        user={editUser}
        provinces={provinces}
        onSaveSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['system-users'] });
        }}
      />
    </div>
  );
}
