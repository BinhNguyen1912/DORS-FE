import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Users,
  Clock,
  Shield,
  Heart,
  TrendingUp,
  Sliders,
  Calendar,
  AlertCircle,
  Mail,
  UserCheck,
  Save,
} from 'lucide-react';
import { rescueTeamApi, locationApi } from '../../apis';
import { ROUTES } from '../../constants';
import { RESCUE_TEXTS } from '../../constants/rescueTexts';
import { cn } from '../../lib/utils';
import type { Province, AdministrativeUnit } from '../../types';
import { toast } from '../../stores';

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
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-8 max-w-md mx-auto mt-12">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-gray-100 dark:border-gray-800">
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
            className="px-4 py-2 border border-gray-250 dark:border-gray-650 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
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
            <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-150 dark:border-gray-750 shadow-sm space-y-4 text-left">
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Phân Loại */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Phân loại *</label>
                  <select
                    value={editTeamType}
                    onChange={(e) => setEditTeamType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Tỉnh / Thành */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Tỉnh / Thành phố *</label>
                  <select
                    value={editProvinceId}
                    onChange={(e) => setEditProvinceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Chuyên môn */}
              <div className="space-y-1.5 text-left relative pt-2 border-t border-gray-150 dark:border-gray-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Chuyên môn sở hữu (Chọn nhiều)
                </label>
                
                {/* Combo box trigger */}
                <div
                  onClick={() => setIsSpecDropdownOpen(!isSpecDropdownOpen)}
                  className="w-full min-h-[38px] px-3.5 py-2 rounded-xl text-xs border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-955 dark:text-white focus:outline-none cursor-pointer flex flex-wrap gap-1.5 items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all"
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
                    
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 rounded-xl shadow-lg p-2.5 z-20 space-y-2 max-h-60 overflow-y-auto">
                      {/* Search input */}
                      <input
                        type="text"
                        placeholder="Tìm nhanh chuyên môn..."
                        value={specSearch}
                        onChange={(e) => setSpecSearch(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-250 dark:border-gray-650 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
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
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-150 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-gray-650 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-150 dark:border-gray-750 shadow-sm text-gray-750 dark:text-gray-300">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-150 dark:border-gray-700">
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
              <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm min-h-[320px]">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic info box */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{RESCUE_TEXTS.DETAIL_BASIC_INFO}</h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
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
                          <span className="font-bold text-gray-900 dark:text-white">{team.leaderName}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500 font-semibold">{RESCUE_TEXTS.DETAIL_PHONE}</span>
                          <span className="font-bold text-gray-950 dark:text-white">{team.leaderPhone}</span>
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
                      <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
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
                        onClick={() => alert('Chức năng thêm thành viên đang kết nối...')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-bold shadow-sm"
                      >
                        + Thêm thành viên
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                      <div className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 font-bold flex items-center justify-center text-gray-700 dark:text-white">B</div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{team.leaderName}</p>
                            <p className="text-[10px] text-gray-400">Trưởng đội</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-500 rounded-full font-bold">Hoạt động</span>
                      </div>
                      
                      <div className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 font-bold flex items-center justify-center text-gray-700 dark:text-white">H</div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">Trần Văn Hoàng</p>
                            <p className="text-[10px] text-gray-400">Phó đội trưởng</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-500 rounded-full font-bold">Hoạt động</span>
                      </div>

                      <div className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 font-bold flex items-center justify-center text-gray-700 dark:text-white">K</div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">Nguyễn Minh Khánh</p>
                            <p className="text-[10px] text-gray-400">Cứu hộ viên chuyên nghiệp</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-gray-500/10 text-gray-400 rounded-full font-bold">Ngoại tuyến</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'missions' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Lịch sử nhiệm vụ cứu hộ</h3>
                    <div className="space-y-3">
                      <div className="p-3 border border-gray-150 dark:border-gray-750 rounded-xl text-xs flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-blue-500 uppercase">SOS-#1023</span>
                          <p className="font-bold text-gray-950 dark:text-white">Sơ tán dân vùng ngập úng</p>
                          <p className="text-[10px] text-gray-400">Địa điểm: Hòa Cường Bắc</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-amber-500/10 text-amber-500 rounded-full font-bold">Đang làm nhiệm vụ</span>
                      </div>

                      <div className="p-3 border border-gray-150 dark:border-gray-750 rounded-xl text-xs flex justify-between items-start">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-150 dark:border-gray-750 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider">Vị trí hiện tại</h3>
              <span className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer">Xem trên bản đồ</span>
            </div>

            {/* SVG Interactive Map representation of Da Nang location */}
            <div className="aspect-video bg-sky-50/50 dark:bg-gray-950 rounded-xl border border-gray-150 dark:border-gray-700 relative overflow-hidden flex items-center justify-center">
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
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-gray-900/95 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-left">
                <p className="text-[8px] font-bold text-gray-500 uppercase leading-none mb-1">Cập nhật lúc</p>
                <p className="text-[10px] font-bold text-gray-900 dark:text-white leading-none">2 phút trước</p>
              </div>
            </div>
          </div>

          {/* Performance statistics circular charts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-150 dark:border-gray-750 shadow-sm text-left">
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
              <div className="w-full space-y-2.5 divide-y divide-gray-100 dark:divide-gray-700/50">
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
