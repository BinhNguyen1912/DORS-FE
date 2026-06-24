import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  MapPin,
  Phone,
  Shield,
  Sliders,
  AlertCircle,
  Save,
  Trash2,
} from 'lucide-react';
import { rescueTeamApi, locationApi, rescueTeamMemberApi, userApi } from '../../apis';
import { ROUTES } from '../../constants';
import { RESCUE_TEXTS } from '../../constants/rescueTexts';
import { cn } from '../../lib/utils';
import type { Province, AdministrativeUnit, RescueTeamMember, User } from '../../types';
import { toast } from '../../stores';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

const statusColors = {
  AVAILABLE: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  BUSY: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  OFF_DUTY: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  STANDBY: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  ON_DUTY: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang làm nhiệm vụ',
  OFF_DUTY: 'Ngoại tuyến',
  STANDBY: 'Dự phòng',
  ACTIVE: 'Sẵn sàng',
  ON_DUTY: 'Đang làm nhiệm vụ',
  INACTIVE: 'Ngoại tuyến',
};

const teamTypeLabels: Record<string, string> = {
  PCCC: 'PCCC',
  Y_TE: 'Y tế',
  DAN_PHONG: 'Dân phòng',
  QUAN_SU: 'Quân sự',
  TINH_NGUYEN: 'Tình nguyện',
  TONG_HOP: 'Tổng hợp',
};

export default function RescueTeamDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'missions' | 'equipment' | 'stats' | 'history' | 'shift'>('overview');
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [editName, setEditName] = useState('');
  const [editTeamType, setEditTeamType] = useState('TONG_HOP');
  const [editStatus, setEditStatus] = useState('AVAILABLE');
  const [editMaxCapacity, setEditMaxCapacity] = useState(10);
  const [editProvinceId, setEditProvinceId] = useState('');
  const [editAdminUnitId, setEditAdminUnitId] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editSpecializationIds, setEditSpecializationIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
  const [specSearch, setSpecSearch] = useState('');

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<AdministrativeUnit[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);

  const { data: team, isLoading } = useQuery({
    queryKey: ['rescue-team', id],
    queryFn: () => rescueTeamApi.getById(Number(id)),
    enabled: !!id,
  });

  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['rescue-team-members', id],
    queryFn: () => rescueTeamMemberApi.getMembers(Number(id)),
    enabled: !!id,
  });
  const members = membersResponse?.data || [];

  // Add Member form/modal states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberType, setMemberType] = useState<'user' | 'citizen'>('user');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [roleInTeam, setRoleInTeam] = useState<'LEADER' | 'DEPUTY_LEADER' | 'MEMBER'>('MEMBER');
  const [memberSpecIds, setMemberSpecIds] = useState<number[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userDropdownSearch, setUserDropdownSearch] = useState('');
  
  // Delete/Role change loading states
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);

  // Automatically fetch user list by province with debounced search support
  useEffect(() => {
    if (!isAddMemberOpen || memberType !== 'user') return;

    setIsUserSearchLoading(true);
    const delayDebounce = setTimeout(() => {
      userApi.getAll({
        page: 1,
        limit: 150,
        provinceId: team?.provinceId || undefined,
        search: userDropdownSearch.trim() || undefined
      }).then(res => {
        setSearchedUsers(res.data);
      }).catch(err => {
        console.error('Lỗi khi tải danh sách người dùng:', err);
      }).finally(() => {
        setIsUserSearchLoading(false);
      });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [userDropdownSearch, isAddMemberOpen, memberType, team?.provinceId]);

  const selectedUser = useMemo(() => {
    return searchedUsers.find(u => u.id === selectedUserId);
  }, [searchedUsers, selectedUserId]);

  // Load initial list of users
  useEffect(() => {
    if (isAddMemberOpen && memberType === 'user') {
      userApi.getAll({ page: 1, limit: 100 }).then(res => {
        setSearchedUsers(res.data);
      }).catch(console.error);
    }
  }, [isAddMemberOpen, memberType]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memberType === 'user' && !selectedUserId) {
      toast.error('Vui lòng chọn một người dùng hệ thống');
      return;
    }
    if (memberType === 'citizen' && !citizenName.trim()) {
      toast.error('Vui lòng nhập tên công dân');
      return;
    }

    setIsAddLoading(true);
    try {
      await rescueTeamMemberApi.addMember(Number(id), {
        userId: memberType === 'user' ? Number(selectedUserId) : undefined,
        citizenName: memberType === 'citizen' ? citizenName : undefined,
        citizenPhone: memberType === 'citizen' ? citizenPhone : undefined,
        roleInTeam,
        specializationIds: memberSpecIds,
      });
      queryClient.invalidateQueries({ queryKey: ['rescue-team', id] });
      queryClient.invalidateQueries({ queryKey: ['rescue-team-members', id] });
      toast.success('Thêm thành viên thành công!');
      setIsAddMemberOpen(false);
      // Reset form
      setSelectedUserId(null);
      setCitizenName('');
      setCitizenPhone('');
      setRoleInTeam('MEMBER');
      setMemberSpecIds([]);
      setUserDropdownSearch('');
      setIsUserDropdownOpen(false);
    } catch (err: any) {
      toast.api(err, 'Lỗi khi thêm thành viên');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRole: 'LEADER' | 'DEPUTY_LEADER' | 'MEMBER') => {
    setIsActionLoading(true);
    try {
      await rescueTeamMemberApi.updateMemberRole(Number(id), memberId, newRole);
      queryClient.invalidateQueries({ queryKey: ['rescue-team', id] });
      queryClient.invalidateQueries({ queryKey: ['rescue-team-members', id] });
      toast.success('Cập nhật vai trò thành viên thành công!');
    } catch (err: any) {
      toast.api(err, 'Lỗi khi cập nhật vai trò');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!deleteMemberId) return;
    setIsActionLoading(true);
    try {
      await rescueTeamMemberApi.removeMember(Number(id), deleteMemberId);
      queryClient.invalidateQueries({ queryKey: ['rescue-team', id] });
      queryClient.invalidateQueries({ queryKey: ['rescue-team-members', id] });
      toast.success('Xóa thành viên khỏi đội thành công!');
      setDeleteMemberId(null);
    } catch (err: any) {
      toast.api(err, 'Lỗi khi xóa thành viên');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Populate edit fields when team loads
  useEffect(() => {
    if (team) {
      setEditName(team.name);
      setEditTeamType(team.teamType || 'TONG_HOP');
      setEditStatus(team.status || 'AVAILABLE');
      setEditMaxCapacity(team.maxCapacity || 10);
      setEditProvinceId(team.provinceId ? String(team.provinceId) : '');
      setEditAdminUnitId(team.adminUnitId ? String(team.adminUnitId) : '');
      if (team.baseLocation?.coordinates) {
        setEditLongitude(String(team.baseLocation.coordinates[0]));
        setEditLatitude(String(team.baseLocation.coordinates[1]));
      }
      setEditSpecializationIds(team.specializations?.map((s: any) => s.id) || []);
    }
  }, [team]);

  // Load provinces for dropdown
  useEffect(() => {
    if (isEditing) {
      locationApi.getAllProvinces().then(setProvinces).catch(console.error);
    }
  }, [isEditing]);

  // Load administrative units when provinceId changes
  useEffect(() => {
    if (isEditing && editProvinceId) {
      locationApi.getWardsByProvinceId(Number(editProvinceId)).then(setWards).catch(console.error);
    } else {
      setWards([]);
    }
  }, [isEditing, editProvinceId]);

  // Load all active specializations on mount
  useEffect(() => {
    rescueTeamApi.getSpecializations({ isActive: true })
      .then(setSpecializations)
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData: any = {
        name: editName,
        provinceId: Number(editProvinceId),
        adminUnitId: Number(editAdminUnitId),
        teamType: editTeamType,
        status: editStatus,
        maxCapacity: Number(editMaxCapacity),
        specializationIds: editSpecializationIds,
      };

      if (editLatitude && editLongitude) {
        submitData.baseLocation = {
          type: 'Point',
          coordinates: [Number(editLongitude), Number(editLatitude)],
        };
      }

      await rescueTeamApi.update(Number(id), submitData);
      queryClient.invalidateQueries({ queryKey: ['rescue-team', id] });
      queryClient.invalidateQueries({ queryKey: ['rescue-teams'] });
      toast.success('Cập nhật thông tin đội cứu hộ thành công!');
      setIsEditing(false);
    } catch (err: any) {
      toast.api(err, 'Lỗi khi cập nhật thông tin đội cứu hộ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-8 max-w-md mx-auto mt-12">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={36} />
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Không tìm thấy thông tin đội cứu hộ</p>
        <Link
          to={ROUTES.RESCUE_TEAM_LIST}
          className="mt-4 inline-block px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Pre-calculate code and formats
  const typeLabel = teamTypeLabels[team.teamType] || 'Tổng hợp';
  const displayCode = `${team.teamType || 'TH'}-${String(team.id).padStart(4, '0')}`;

  const tabsConfig = [
    { id: 'overview', label: RESCUE_TEXTS.TAB_OVERVIEW },
    { id: 'members', label: RESCUE_TEXTS.TAB_MEMBERS },
    { id: 'missions', label: RESCUE_TEXTS.TAB_MISSIONS },
    { id: 'equipment', label: RESCUE_TEXTS.TAB_EQUIPMENT },
    { id: 'stats', label: RESCUE_TEXTS.TAB_STATS },
    { id: 'history', label: RESCUE_TEXTS.TAB_HISTORY },
    { id: 'shift', label: RESCUE_TEXTS.TAB_SHIFT },
  ] as const;

  return (
    <div className="space-y-4 text-left">
      {/* Top Header & Breadcrumbs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-100 dark:border-gray-800">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight mb-0.5">{RESCUE_TEXTS.TITLE_DETAIL}</h1>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <span>{RESCUE_TEXTS.BREADCRUMB_HOME}</span>
            <span>&gt;</span>
            <span>{RESCUE_TEXTS.BREADCRUMB_TEAM}</span>
            <span>&gt;</span>
            <span className="text-amber-500 font-semibold">{RESCUE_TEXTS.BREADCRUMB_DETAIL}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.RESCUE_TEAM_LIST}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            Quay lại
          </Link>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <Edit size={14} />
              {RESCUE_TEXTS.BTN_EDIT}
            </button>
          )}
        </div>
      </div>

      {/* Main Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Summary Card & Tab Contents */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          {isEditing ? (
            <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4 text-left">
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Chỉnh sửa thông tin đội</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên Đội */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Tên đội cứu hộ *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Phân Loại */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Phân loại *</label>
                  <select
                    value={editTeamType}
                    onChange={(e) => setEditTeamType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="PCCC">PCCC</option>
                    <option value="Y_TE">Y tế</option>
                    <option value="DAN_PHONG">Dân phòng</option>
                    <option value="QUAN_SU">Quân sự</option>
                    <option value="TINH_NGUYEN">Tình nguyện</option>
                    <option value="TONG_HOP">Tổng hợp</option>
                  </select>
                </div>

                {/* Trạng Thái */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Trạng thái *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="AVAILABLE">Sẵn sàng</option>
                    <option value="BUSY">Đang làm nhiệm vụ</option>
                    <option value="STANDBY">Dự phòng</option>
                    <option value="OFF_DUTY">Ngoại tuyến</option>
                  </select>
                </div>

                {/* Sức Chứa */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Sức chứa tối đa *</label>
                  <input
                    type="number"
                    required
                    value={editMaxCapacity}
                    onChange={(e) => setEditMaxCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Tỉnh / Thành */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Tỉnh / Thành phố *</label>
                  <select
                    value={editProvinceId}
                    onChange={(e) => setEditProvinceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quận / Huyện / Phường / Xã */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Quận / Huyện / Phường / Xã *</label>
                  <select
                    value={editAdminUnitId}
                    onChange={(e) => setEditAdminUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="">-- Chọn Quận / Huyện / Phường / Xã --</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {/* Vĩ Độ (Latitude) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editLatitude}
                    onChange={(e) => setEditLatitude(e.target.value)}
                    placeholder="Ví dụ: 16.0678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Kinh Độ (Longitude) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={editLongitude}
                    onChange={(e) => setEditLongitude(e.target.value)}
                    placeholder="Ví dụ: 108.2208"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Chuyên môn */}
              <div className="space-y-1.5 text-left relative pt-2 border-t border-slate-100 dark:border-gray-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Chuyên môn sở hữu (Chọn nhiều)
                </label>
                
                {/* Combo box trigger */}
                <div
                  onClick={() => setIsSpecDropdownOpen(!isSpecDropdownOpen)}
                  className="w-full min-h-[38px] px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-955 dark:text-white focus:outline-none cursor-pointer flex flex-wrap gap-1.5 items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                >
                  {editSpecializationIds.length === 0 ? (
                    <span className="text-gray-400 font-medium">-- Chọn chuyên môn của đội --</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {editSpecializationIds.map((id) => {
                        const spec = specializations.find(s => s.id === id);
                        return spec ? (
                          <span
                            key={id}
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-bold rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-1 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (editSpecializationIds.includes(id)) {
                                setEditSpecializationIds(editSpecializationIds.filter(x => x !== id));
                              } else {
                                setEditSpecializationIds([...editSpecializationIds, id]);
                              }
                            }}
                          >
                            {spec.name}
                            <span className="text-indigo-455 hover:text-indigo-650 font-extrabold cursor-pointer">×</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <span className="text-gray-400 text-[10px]">▼</span>
                </div>

                {/* Dropdown panel */}
                {isSpecDropdownOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-10" onClick={() => { setIsSpecDropdownOpen(false); setSpecSearch(''); }} />
                    
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700/60 rounded-xl shadow-lg p-2.5 z-20 space-y-2 max-h-60 overflow-y-auto">
                      {/* Search input */}
                      <input
                        type="text"
                        placeholder="Tìm nhanh chuyên môn..."
                        value={specSearch}
                        onChange={(e) => setSpecSearch(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {specializations.length === 0 ? (
                        <p className="text-[10px] text-center text-gray-400 py-2">Không có chuyên môn cho loại đội này</p>
                      ) : (
                        <div className="space-y-1">
                          {specializations
                            .filter(s => s.name.toLowerCase().includes(specSearch.toLowerCase()))
                            .map((spec) => {
                              const isSelected = editSpecializationIds.includes(spec.id);
                              return (
                                <div
                                  key={spec.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setEditSpecializationIds(editSpecializationIds.filter(id => id !== spec.id));
                                    } else {
                                      setEditSpecializationIds([...editSpecializationIds, spec.id]);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all",
                                    isSelected 
                                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-bold" 
                                      : "hover:bg-slate-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-medium"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="w-3.5 h-3.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                  />
                                  <span className="text-[11px] select-none">{spec.name}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <Save size={14} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Main Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm text-gray-750 dark:text-gray-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">{team.name}</h2>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                          {typeLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Mã đội: {displayCode}</p>
                    </div>
                  </div>

                  <span className={cn(
                    'px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase self-start sm:self-auto',
                    statusColors[team.status as keyof typeof statusColors] || statusColors.ACTIVE
                  )}>
                    {statusLabels[team.status] || team.status}
                  </span>
                </div>

                {/* Quick Metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-gray-700">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{RESCUE_TEXTS.DETAIL_COVERAGE_AREA}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">P. Hòa Cường, Q. Hải Châu</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{RESCUE_TEXTS.COL_MEMBERS}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">12/15 thành viên</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{RESCUE_TEXTS.STATS_MISSIONS_RUNNING}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{team.missionsCount || 2} nhiệm vụ</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{RESCUE_TEXTS.STATS_EFFICIENCY}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">75% hiệu suất</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto gap-4 scrollbar-none">
                {tabsConfig.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        'py-2 px-1 text-xs font-bold border-b-2 transition-all whitespace-nowrap',
                        isActive
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tabs Content Router */}
              <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm min-h-[320px]">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic info box */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{RESCUE_TEXTS.DETAIL_BASIC_INFO}</h3>
                      <div className="divide-y divide-slate-100 dark:divide-gray-700 text-xs">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.COL_TYPE}</span>
                          <span className="font-bold text-gray-900 dark:text-white">{typeLabel}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_FOUNDING_DATE}</span>
                          <span className="font-bold text-gray-900 dark:text-white">15/03/2020</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_LEADER}</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {team.leader?.fullName || team.leaderCitizenName || 'Chưa có đội trưởng'}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_PHONE}</span>
                          <span className="font-bold text-gray-950 dark:text-white">
                            {team.leader?.phone || team.leaderPhone || 'Chưa có'}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_EMAIL}</span>
                          <span className="font-bold text-gray-900 dark:text-white">pccc.dn01@cuuho.vn</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_MAX_CAPACITY}</span>
                          <span className="font-bold text-gray-900 dark:text-white">15 thành viên</span>
                        </div>
                      </div>
                    </div>

                    {/* Location / Area info box */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{RESCUE_TEXTS.DETAIL_LOCATION_INFO}</h3>
                      <div className="divide-y divide-slate-100 dark:divide-gray-700 text-xs">
                        <div className="py-2.5 flex flex-col gap-1">
                          <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                            <MapPin size={12} className="text-amber-500" />
                            {RESCUE_TEXTS.DETAIL_BASE_LOCATION}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white pl-4">15 Lê Duẩn, P. Hòa Cường, Q. Hải Châu</span>
                        </div>
                        <div className="py-2.5 flex flex-col gap-1">
                          <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                            <MapPin size={12} className="text-blue-500" />
                            {RESCUE_TEXTS.DETAIL_CURRENT_LOCATION}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white pl-4">16 Lê Duẩn, P. Hòa Cường, Q. Hải Châu</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_COVERAGE_AREA}</span>
                          <span className="font-bold text-gray-900 dark:text-white">12.5 km²</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_COVERAGE_RADIUS}</span>
                          <span className="font-bold text-indigo-500 hover:underline cursor-pointer">Xem trên bản đồ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Danh sách thành viên đội</h3>
                      <button 
                        onClick={() => setIsAddMemberOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors"
                      >
                        + Thêm thành viên
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-gray-700 text-xs">
                      {isLoadingMembers ? (
                        <div className="py-12 text-center text-gray-400">
                          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="font-semibold text-xs">Đang tải danh sách thành viên...</p>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 font-semibold">
                          Đội chưa có thành viên nào. Bấm "+ Thêm thành viên" để thêm.
                        </div>
                      ) : (
                        members.map((member: RescueTeamMember) => {
                          const name = member.user?.fullName || member.citizenName || 'Chưa rõ';
                          const phone = member.user?.phone || member.citizenPhone || 'Chưa rõ';
                          const roleLabel = member.roleInTeam === 'LEADER'
                            ? 'Trưởng đội'
                            : member.roleInTeam === 'DEPUTY_LEADER'
                              ? 'Phó đội trưởng'
                              : 'Thành viên';
                          
                          const roleBadgeColor = member.roleInTeam === 'LEADER'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : member.roleInTeam === 'DEPUTY_LEADER'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20';

                          return (
                            <div key={member.id} className="py-3.5 flex items-center justify-between group hover:bg-slate-50/30 dark:hover:bg-gray-750/30 px-3 rounded-xl transition-all text-left">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold flex items-center justify-center text-gray-700 dark:text-white uppercase select-none flex-shrink-0">
                                  {name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <p className="font-bold text-gray-900 dark:text-white">{name}</p>
                                    <span className={cn('px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider', roleBadgeColor)}>
                                      {roleLabel}
                                    </span>
                                    {member.userId && (
                                      <span className="px-1.5 py-0.5 text-[8px] bg-slate-100 dark:bg-slate-800 text-gray-500 rounded font-semibold border border-gray-200 dark:border-gray-700">
                                        Tài khoản hệ thống
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5 font-semibold">
                                    <Phone size={10} className="text-gray-400" />
                                    {phone}
                                  </p>
                                  {member.specializationIds?.length > 0 && (
                                    <div className="pt-1.5 flex flex-wrap gap-1">
                                      {member.specializationIds.map(specId => {
                                        const spec = specializations.find(s => s.id === specId);
                                        return spec ? (
                                          <span key={specId} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 font-bold rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-[9px] inline-block">
                                            {spec.name}
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <select
                                  disabled={isActionLoading}
                                  value={member.roleInTeam}
                                  onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as any)}
                                  className="px-2 py-1 text-[10px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                >
                                  <option value="MEMBER">Thành viên</option>
                                  <option value="DEPUTY_LEADER">Phó đội</option>
                                  <option value="LEADER">Trưởng đội</option>
                                </select>
                                
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => setDeleteMemberId(member.id)}
                                  className="p-1.5 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-all"
                                  title="Xóa khỏi đội"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Member Modal */}
                    {isAddMemberOpen && (
                      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg border border-slate-100 dark:border-slate-700/60 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left text-slate-700 dark:text-slate-300">
                          <div className="p-5 border-b border-slate-100 dark:border-slate-700/60">
                            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-0">Thêm thành viên mới</h3>
                          </div>
                          
                          <form onSubmit={handleAddMember}>
                            <div className="p-5 space-y-4 text-xs max-h-[65vh] overflow-y-auto">
                              {/* Member Type Selection */}
                              <div className="space-y-1.5">
                                <label className="block font-bold text-black dark:text-white">Hình thức đăng ký</label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setMemberType('user')}
                                    className={cn(
                                      'flex-1 py-2 text-xs font-bold rounded-xl border transition-all',
                                      memberType === 'user'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-slate-50/50 dark:bg-gray-900 text-gray-550 dark:text-gray-400 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750'
                                    )}
                                  >
                                    Tài khoản hệ thống
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMemberType('citizen')}
                                    className={cn(
                                      'flex-1 py-2 text-xs font-bold rounded-xl border transition-all',
                                      memberType === 'citizen'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-slate-50/50 dark:bg-gray-900 text-gray-550 dark:text-gray-400 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750'
                                    )}
                                  >
                                    Đăng ký công dân tự do
                                  </button>
                                </div>
                              </div>

                              {/* Search & Select System User */}
                              {memberType === 'user' && (
                                <div className="space-y-3 p-3 bg-slate-50/50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-700 rounded-xl text-left relative">
                                  <div className="space-y-1.5 relative">
                                    <label className="block font-bold text-black dark:text-white">
                                      Chọn người dùng <span className="text-red-500 ml-1">(*)</span>
                                    </label>
                                    
                                    {/* Combobox Trigger Button */}
                                    <button
                                      type="button"
                                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                      className="w-full min-h-[38px] px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none cursor-pointer flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all font-semibold"
                                    >
                                      {selectedUser ? (
                                        <div className="text-left">
                                          <p className="font-bold text-black dark:text-white">{selectedUser.fullName}</p>
                                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                                            SĐT: {selectedUser.phone || 'Chưa rõ'} | Email: {selectedUser.email || 'Chưa rõ'}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-gray-450 dark:text-gray-400">-- Chọn thành viên hệ thống --</span>
                                      )}
                                      <span className="text-gray-450 dark:text-gray-400 text-[10px]">▼</span>
                                    </button>

                                    {/* Dropdown Panel */}
                                    {isUserDropdownOpen && (
                                      <>
                                        {/* Backdrop overlay for closing */}
                                        <div 
                                          className="fixed inset-0 z-10" 
                                          onClick={() => setIsUserDropdownOpen(false)} 
                                        />
                                        
                                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-850 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-lg p-2.5 z-20 space-y-2 max-h-60 overflow-y-auto text-left">
                                          {/* Search Input inside the dropdown */}
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder="Tìm nhanh người dùng..."
                                              value={userDropdownSearch}
                                              onChange={(e) => setUserDropdownSearch(e.target.value)}
                                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 focus:outline-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          
                                          {isUserSearchLoading ? (
                                            <div className="py-6 text-center text-gray-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                                              <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                              Đang tìm kiếm...
                                            </div>
                                          ) : searchedUsers.length === 0 ? (
                                            <p className="text-[10px] text-center text-gray-400 py-4 font-semibold">Không tìm thấy kết quả</p>
                                          ) : (
                                            <div className="space-y-1">
                                              {searchedUsers.map((u) => {
                                                const isSelected = selectedUserId === u.id;
                                                return (
                                                  <div
                                                    key={u.id}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedUserId(u.id);
                                                      setIsUserDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                      "p-2 rounded-lg cursor-pointer transition-all border border-transparent",
                                                      isSelected 
                                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold" 
                                                        : "hover:bg-slate-50 dark:hover:bg-gray-750 text-black dark:text-white font-medium"
                                                    )}
                                                  >
                                                    <p className="font-bold text-xs">{u.fullName}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                      SĐT: {u.phone || 'Chưa rõ'} | Email: {u.email || 'Chưa rõ'}
                                                    </p>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Manual Citizen Registration Fields */}
                              {memberType === 'citizen' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-700 rounded-xl">
                                  <div className="space-y-1.5">
                                    <label className="block font-bold text-black dark:text-white">
                                      Tên công dân <span className="text-red-500 ml-1">(*)</span>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={citizenName}
                                      onChange={e => setCitizenName(e.target.value)}
                                      placeholder="Ví dụ: Nguyễn Văn A"
                                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="block font-bold text-black dark:text-white">Số điện thoại</label>
                                    <input
                                      type="tel"
                                      value={citizenPhone}
                                      onChange={e => setCitizenPhone(e.target.value)}
                                      placeholder="Ví dụ: 0905123456"
                                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Role selection */}
                              <div className="space-y-1.5">
                                <label className="block font-bold text-black dark:text-white">
                                  Vị trí trong đội <span className="text-red-500 ml-1">(*)</span>
                                </label>
                                <select
                                  value={roleInTeam}
                                  onChange={e => setRoleInTeam(e.target.value as any)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                                >
                                  <option value="MEMBER">Thành viên</option>
                                  <option value="DEPUTY_LEADER">Phó đội trưởng</option>
                                  <option value="LEADER">Trưởng đội (Captain)</option>
                                </select>
                                {roleInTeam === 'LEADER' && (
                                  <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-bold leading-normal">
                                    ⚠️ Lưu ý: Khi gán vai trò này, Trưởng đội hiện tại của đội cứu hộ (nếu có) sẽ tự động chuyển thành thành viên bình thường. Vị trí Đội trưởng trên trang tổng quan cũng sẽ thay đổi theo.
                                  </div>
                                )}
                              </div>

                              {/* Member Specialization checklist */}
                              <div className="space-y-1.5">
                                <label className="block font-bold text-black dark:text-white">Chuyên môn sở hữu</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 dark:border-gray-700 rounded-xl bg-slate-50/50 dark:bg-gray-900/30">
                                  {specializations.length === 0 ? (
                                    <p className="text-[10px] text-gray-400 py-2 col-span-2 text-center">Không có chuyên môn khả dụng</p>
                                  ) : (
                                    specializations.map(spec => {
                                      const isSelected = memberSpecIds.includes(spec.id);
                                      return (
                                        <label key={spec.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-gray-750 rounded-lg cursor-pointer transition-all select-none font-medium text-[11px]">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {
                                              if (isSelected) {
                                                setMemberSpecIds(memberSpecIds.filter(id => id !== spec.id));
                                              } else {
                                                setMemberSpecIds([...memberSpecIds, spec.id]);
                                              }
                                            }}
                                            className="w-3.5 h-3.5 rounded text-amber-500 border-gray-300 focus:ring-amber-550"
                                          />
                                          <span className="truncate text-[10px]">{spec.name}</span>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50/50 dark:bg-gray-900/30 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setIsAddMemberOpen(false)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all"
                              >
                                Hủy
                              </button>
                              <button
                                type="submit"
                                disabled={isAddLoading}
                                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-sm transition-all"
                              >
                                {isAddLoading && (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                Thêm thành viên
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Delete Member Confirmation */}
                    <ConfirmDeleteModal
                      isOpen={deleteMemberId !== null}
                      onClose={() => setDeleteMemberId(null)}
                      onConfirm={handleRemoveMember}
                      isLoading={isActionLoading}
                      title="Xóa thành viên khỏi đội"
                      message="Bạn có chắc chắn muốn xóa thành viên này ra khỏi đội cứu hộ? Thao tác này sẽ không thể khôi phục lại."
                    />
                  </div>
                )}

                {activeTab === 'missions' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Lịch sử nhiệm vụ cứu hộ</h3>
                    <div className="space-y-3">
                      <div className="p-3 border border-slate-100 dark:border-slate-700/60 rounded-xl text-xs flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-500 uppercase">SOS-#1023</span>
                          <p className="font-bold text-gray-950 dark:text-white">Sơ tán dân vùng ngập úng</p>
                          <p className="text-[10px] text-gray-400">Địa điểm: Hòa Cường Bắc</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-amber-500/10 text-amber-500 rounded-full font-bold">Đang làm nhiệm vụ</span>
                      </div>

                      <div className="p-3 border border-slate-100 dark:border-slate-700/60 rounded-xl text-xs flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-500 uppercase">SOS-#0912</span>
                          <p className="font-bold text-gray-950 dark:text-white">Cứu nạn người bị sập đổ công trình</p>
                          <p className="text-[10px] text-gray-400">Địa điểm: Hòa Cường Nam</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-500 rounded-full font-bold">Hoàn thành</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* General Mock Fallback tabs */}
                {['equipment', 'stats', 'history', 'shift'].includes(activeTab) && (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <Sliders className="mx-auto mb-2 text-gray-300" size={32} />
                    <p className="text-xs font-bold">Dữ liệu phân tích đang được cập nhật...</p>
                    <p className="text-[10px] text-gray-400 mt-1">Hệ thống đang đồng bộ dữ liệu với trạm chỉ huy trung tâm.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Side: Map & Performance Metrics */}
        <div className="lg:col-span-4 space-y-4">
          {/* Map Location Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider">Vị trí hiện tại</h3>
              <span className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer">Xem trên bản đồ</span>
            </div>

            {/* SVG Interactive Map representation of Da Nang location */}
            <div className="aspect-video bg-sky-50/50 dark:bg-gray-950 rounded-xl border border-slate-100 dark:border-gray-700 relative overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 200 120" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 10,100 Q 50,70 100,80 T 190,100 Z"
                  fill="#f8fafc"
                  stroke="#e2e8f0"
                  strokeWidth="2"
                  className="dark:fill-gray-900 dark:stroke-gray-800"
                />
                {/* Position Marker */}
                <circle cx="100" cy="80" r="10" className="fill-red-500 opacity-20 animate-ping" />
                <circle cx="100" cy="80" r="5" className="fill-red-650 stroke-white" strokeWidth="1" />
              </svg>
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-gray-900/95 p-2 rounded-lg border border-slate-100 dark:border-gray-700 text-left">
                <p className="text-[8px] font-bold text-gray-500 uppercase leading-none mb-1">Cập nhật lúc</p>
                <p className="text-[10px] font-bold text-gray-900 dark:text-white leading-none">2 phút trước</p>
              </div>
            </div>
          </div>

          {/* Performance statistics circular charts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm text-left">
            <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider mb-4">Hiệu suất hoạt động</h3>

            <div className="flex flex-col items-center gap-6">
              {/* Radial Progress */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg width="128" height="128" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" className="dark:stroke-gray-700" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * 85) / 100}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">85%</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase leading-none mt-1">Hiệu suất</span>
                </div>
              </div>

              {/* Legends statistics table detail */}
              <div className="w-full space-y-2.5 divide-y divide-slate-100 dark:divide-gray-700/50">
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-xs text-gray-500 font-semibold">{RESCUE_TEXTS.TAB_MISSIONS}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">156</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-xs text-gray-500 font-semibold">{RESCUE_TEXTS.STATS_COMPLETED}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">132</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-xs text-gray-500 font-semibold">{RESCUE_TEXTS.STATS_RESCUED}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">248</span>
                </div>
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-xs text-gray-500 font-semibold">{RESCUE_TEXTS.STATS_HOURS}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">1,248</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
