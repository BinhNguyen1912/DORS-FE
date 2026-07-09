import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { rescueTeamApi } from '../../apis';
import { ROUTES } from '../../constants';
import { RESCUE_TEXTS } from '../../constants/rescueTexts';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import TableSettings from '../../components/common/TableSettings';
import type { TableColumnDef } from '../../components/common/TableSettings';

const RESCUE_TEAM_COLUMNS: TableColumnDef[] = [
  { key: 'code', label: 'Mã Đội' },
  { key: 'name', label: 'Tên Đội Cứu Hộ' },
  { key: 'teamType', label: 'Loại Đội' },
  { key: 'address', label: 'Địa Chỉ' },
  { key: 'memberCount', label: 'Thành viên' },
  { key: 'status', label: 'Trạng Thái' },
  { key: 'activeMissions', label: 'Nhiệm Vụ' },
  { key: 'actions', label: 'Thao Tác', alwaysVisible: true },
];

// Types mapping and colors matching the screenshot
const teamTypeLabels: Record<string, string> = {
  PCCC: 'PCCC',
  Y_TE: 'Y Tế',
  DAN_PHONG: 'Dân phòng',
  QUAN_SU: 'Quân sự',
  TINH_NGUYEN: 'Tình nguyện',
  TONG_HOP: 'Tổng hợp',
  PROFESSIONAL: 'PCCC',
  VOLUNTEER_SPONTANEOUS: 'Tình nguyện',
};

const teamTypeColors: Record<string, { bg: string; text: string }> = {
  PCCC: { bg: 'bg-red-500/10 text-red-500 border border-red-500/20', text: 'text-red-500' },
  Y_TE: { bg: 'bg-green-500/10 text-green-500 border border-green-500/20', text: 'text-green-500' },
  DAN_PHONG: { bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', text: 'text-blue-500' },
  QUAN_SU: { bg: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', text: 'text-slate-400' },
  TINH_NGUYEN: { bg: 'bg-purple-500/10 text-purple-500 border border-purple-500/20', text: 'text-purple-500' },
  TONG_HOP: { bg: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20', text: 'text-indigo-500' },
};

// Unused helper structures removed to prevent build warnings

interface UnifiedRescueTeam {
  id: number;
  code: string;
  name: string;
  leaderName: string;
  leaderPhone: string;
  teamType: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'STANDBY' | 'DISPATCHED';
  address: string;
  memberCount: string;
  activeMissions: number;
  logoUrl?: string | null;
}

export default function RescueTeamListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('');

  // Modal delete state
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Table column configuration
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('rescue_team_table_columns');
    return saved ? JSON.parse(saved) : {
      code: true,
      name: true,
      teamType: true,
      address: true,
      memberCount: true,
      status: true,
      activeMissions: true,
      actions: true,
    };
  });

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load database rescue teams filtered by user's provinceId
  const { data: dbData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['rescue-teams', user?.provinceId],
    queryFn: () => rescueTeamApi.getAll({ page: 1, limit: 100, provinceId: user?.provinceId }),
  });

  // Delete DB team mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => rescueTeamApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-teams'] });
      setDeleteTeamId(null);
      toast.success('Xóa đội cứu hộ thành công!');
    },
    onError: (err: any) => {
      setDeleteTeamId(null);
      toast.api(err, 'Lỗi khi xóa đội cứu hộ');
    },
  });

  // Update DB team status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      rescueTeamApi.update(id, { status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-teams'] });
      toast.success('Cập nhật trạng thái đội cứu hộ thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi cập nhật trạng thái');
    },
  });

  const handleConfirmDelete = () => {
    if (deleteTeamId) {
      deleteMutation.mutate(deleteTeamId);
    }
  };

  // Map database teams with specific properties
  const allTeams = useMemo(() => {
    const dbTeamsMapped: UnifiedRescueTeam[] = (dbData?.data || []).map((team) => {
      const statusMap: Record<string, string> = {
        AVAILABLE: 'AVAILABLE',
        BUSY: 'BUSY',
        OFF_DUTY: 'OFF_DUTY',
        STANDBY: 'STANDBY',
        DISPATCHED: 'DISPATCHED',
        // Legacy values from older BE versions
        ACTIVE: 'AVAILABLE',
        ON_DUTY: 'BUSY',
        INACTIVE: 'OFF_DUTY',
      };

      const typeMap: Record<string, string> = {
        PCCC: 'PCCC',
        Y_TE: 'Y_TE',
        DAN_PHONG: 'DAN_PHONG',
        QUAN_SU: 'QUAN_SU',
        TINH_NGUYEN: 'TINH_NGUYEN',
        TONG_HOP: 'TONG_HOP',
        PROFESSIONAL: 'PCCC',
        VOLUNTEER_SPONTANEOUS: 'TINH_NGUYEN',
      };

      const leaderName = (team as any).leader?.fullName || (team as any).leaderName || 'Chưa có';
      const leaderPhone = (team as any).leader?.phone || (team as any).leaderPhone || 'Chưa có';

      let address = 'Thành phố Đà Nẵng';
      if ((team as any).adminUnit?.name) {
        address = `${(team as any).adminUnit.name}, ${(team as any).province?.name || ''}`;
      } else if ((team as any).province?.name) {
        address = (team as any).province.name;
      }

      // Generate a code suffix based on type and ID
      const teamTypeCode = typeMap[team.teamType] || 'TH';
      const code = `${teamTypeCode}-${String(team.id).padStart(4, '0')}`;

      // Tính số thành viên thực tế
      const activeMembers = (team as any).members
        ? (team as any).members.filter((m: any) => m.isActive).length
        : (team as any).memberCount ?? (team as any).activeMemberCount ?? 0;
      const maxCap = team.maxCapacity || 20;

      return {
        id: team.id,
        code,
        name: team.name,
        leaderName,
        leaderPhone,
        teamType: typeMap[team.teamType] || 'TONG_HOP',
        status: (statusMap[team.status] || 'AVAILABLE') as any,
        address,
        memberCount: `${activeMembers}/${maxCap}`,
        activeMissions: team.missionsCount || 0,
        logoUrl: team.logoUrl,
      };
    });

    return dbTeamsMapped;
  }, [dbData]);

  // Filtered teams list based on search and selected options
  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || team.status === statusFilter;
      const matchesType = !teamTypeFilter || team.teamType === teamTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allTeams, searchQuery, statusFilter, teamTypeFilter]);

  // Calculate paginated slice
  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeams, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / itemsPerPage));

  // Reset page when filter changes
  // Selection state & helpers
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAllSelected = useMemo(() => {
    if (paginatedTeams.length === 0) return false;
    return paginatedTeams.every(t => selectedIds.includes(t.id));
  }, [paginatedTeams, selectedIds]);

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      const paginatedIds = paginatedTeams.map(t => t.id);
      setSelectedIds(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      const paginatedIds = paginatedTeams.map(t => t.id);
      setSelectedIds(prev => {
        const union = new Set([...prev, ...paginatedIds]);
        return Array.from(union);
      });
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
      rescueTeamApi.bulkUpdateStatus(ids, status),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['rescue-teams'] });
      setSelectedIds([]);
      if (result?.failed?.length > 0) {
        toast.warning(`Cập nhật ${result.updated} đội thành công. ${result.failed.length} đội thất bại.`);
      } else {
        toast.success(`Cập nhật trạng thái ${result?.updated ?? selectedIds.length} đội cứu hộ thành công!`);
      }
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi cập nhật trạng thái hàng loạt');
    },
  });

  return (
    <div className="space-y-4">
      {/* Filter Row & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder={RESCUE_TEXTS.SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
            />
          </div>

          <div>
            <select
              value={teamTypeFilter}
              onChange={(e) => setTeamTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold cursor-pointer"
            >
              <option value="">{RESCUE_TEXTS.SELECT_TYPE_ALL}</option>
              <option value="PCCC">PCCC</option>
              <option value="Y_TE">Y tế</option>
              <option value="DAN_PHONG">Dân phòng</option>
              <option value="QUAN_SU">Quân sự</option>
              <option value="TINH_NGUYEN">Tình nguyện</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold cursor-pointer"
            >
              <option value="">{RESCUE_TEXTS.SELECT_STATUS_ALL}</option>
              <option value="AVAILABLE">Sẵn sàng</option>
              <option value="BUSY">Đang làm nhiệm vụ</option>
              <option value="STANDBY">Dự phòng</option>
              <option value="OFF_DUTY">Ngoại tuyến</option>
            </select>
          </div>

          <div>
            <select
              disabled
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-100/50 dark:bg-gray-900/50 text-gray-450 focus:outline-none cursor-not-allowed font-semibold"
            >
              <option value="">{RESCUE_TEXTS.SELECT_AREA_ALL}</option>
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
            to={ROUTES.TEAM_SPECIALIZATION_LIST}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Quản lý Chuyên môn
          </Link>
          <Link
            to={ROUTES.RESCUE_TEAM_CREATE}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500/90 hover:bg-amber-600/90 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
            {RESCUE_TEXTS.BTN_ADD_TEAM}
          </Link>
          <TableSettings
            columns={RESCUE_TEAM_COLUMNS}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns as any}
            storageKey="rescue_team_table_columns"
          />
        </div>
      </div>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3.5 rounded-2xl shadow-sm transition-all duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
              Đã chọn {selectedIds.length} đội cứu hộ
            </span>
            <div className="h-4 w-px bg-amber-200 dark:bg-amber-900" />
            <select
              value=""
              onChange={(e) => {
                const status = e.target.value;
                if (status) {
                  bulkUpdateStatusMutation.mutate({ ids: selectedIds, status });
                }
              }}
              disabled={bulkUpdateStatusMutation.isPending}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-gray-900 text-gray-750 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>-- Cập nhật trạng thái hàng loạt --</option>
              <option value="AVAILABLE">Sẵn sàng</option>
              <option value="BUSY">Đang làm nhiệm vụ</option>
              <option value="DISPATCHED">Đang tiếp cận</option>
              <option value="STANDBY">Dự phòng</option>
              <option value="OFF_DUTY">Ngoại tuyến</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Hủy chọn
          </button>
        </div>
      )}

      {/* Main Table view */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/60 text-black dark:text-white font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllToggle}
                    className="w-3.5 h-3.5 rounded border-gray-350 dark:border-gray-700 bg-transparent text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                {visibleColumns.code !== false && <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_CODE}</th>}
                {visibleColumns.name !== false && <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_NAME}</th>}
                {visibleColumns.teamType !== false && <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_TYPE}</th>}
                {visibleColumns.address !== false && <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_AREA}</th>}
                {visibleColumns.memberCount !== false && <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_MEMBERS}</th>}
                {visibleColumns.status !== false && <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_STATUS}</th>}
                {visibleColumns.activeMissions !== false && <th className="py-3.5 px-4 text-center">{RESCUE_TEXTS.COL_MISSIONS}</th>}
                {visibleColumns.actions !== false && <th className="py-3.5 px-4 text-center w-28">{RESCUE_TEXTS.COL_ACTIONS}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-black dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(v => v !== false).length + 1} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="font-semibold text-xs">Đang tải danh sách đội cứu hộ...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedTeams.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(v => v !== false).length + 1} className="py-16 text-center text-gray-400 font-semibold">
                    Không tìm thấy đội cứu hộ nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedTeams.map((team) => {
                  const typeStyle = teamTypeColors[team.teamType] || teamTypeColors.TONG_HOP;

                  return (
                    <tr
                      key={team.id}
                      className={cn(
                        "group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors",
                        selectedIds.includes(team.id) && "bg-amber-50/20 dark:bg-amber-950/10"
                      )}
                    >
                      <td className="py-4 px-4 font-normal" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(team.id)}
                          onChange={() => handleSelectRow(team.id)}
                          className="w-3.5 h-3.5 rounded border-gray-350 dark:border-gray-700 bg-transparent text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      {/* Code */}
                      {visibleColumns.code !== false && (
                        <td className="py-4 px-4 font-mono text-black dark:text-white font-normal">
                          {team.code}
                        </td>
                      )}

                      {/* Name */}
                      {visibleColumns.name !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal max-w-[200px] truncate">
                          {team.name}
                        </td>
                      )}

                      {/* Team Type Badge */}
                      {visibleColumns.teamType !== false && (
                        <td className="py-4 px-4 font-normal">
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] font-normal rounded-lg uppercase tracking-wide border whitespace-nowrap',
                            typeStyle.bg
                          )}>
                            {teamTypeLabels[team.teamType] || team.teamType}
                          </span>
                        </td>
                      )}

                      {/* Area of Duty */}
                      {visibleColumns.address !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal">
                          {team.address}
                        </td>
                      )}

                      {/* Members */}
                      {visibleColumns.memberCount !== false && (
                        <td className="py-4 px-4 text-black dark:text-white font-normal">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <i className="fa-solid fa-users text-gray-400 text-[12px]"></i>
                            {team.memberCount}
                          </span>
                        </td>
                      )}

                      {/* Status Badge */}
                      {visibleColumns.status !== false && (
                        <td className="py-4 px-4 font-normal" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={team.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              updateStatusMutation.mutate({ id: team.id, status: newStatus });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-transparent text-gray-800 dark:text-gray-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="AVAILABLE" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Sẵn sàng</option>
                            <option value="BUSY" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Đang làm nhiệm vụ</option>
                            <option value="DISPATCHED" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Đang tiếp cận</option>
                            <option value="STANDBY" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Dự phòng</option>
                            <option value="OFF_DUTY" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Ngoại tuyến</option>
                          </select>
                        </td>
                      )}

                      {/* Active Missions */}
                      {visibleColumns.activeMissions !== false && (
                        <td className="py-4 px-4 text-center text-black dark:text-white font-normal">
                          {team.activeMissions}
                        </td>
                      )}

                      {/* Actions */}
                      {visibleColumns.actions !== false && (
                        <td className="py-4 px-4 text-center font-normal">
                          <div className="flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))}
                              title={RESCUE_TEXTS.BTN_VIEW_DETAIL}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                            >
                              <i className="fa-solid fa-eye text-[13px] text-blue-500 hover:text-blue-600"></i>
                            </button>

                            <button
                              onClick={() => navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))}
                              title={RESCUE_TEXTS.BTN_EDIT}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                            >
                              <i className="fa-solid fa-pen text-[13px] text-amber-500 hover:text-amber-600"></i>
                            </button>

                            <button
                              onClick={() => setDeleteTeamId(team.id)}
                              title={RESCUE_TEXTS.BTN_DELETE}
                              className="p-1.5 hover:bg-red-55/10 rounded-lg transition-all"
                            >
                              <i className="fa-solid fa-trash text-[13px] text-red-550 hover:text-red-650"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-700/60 select-none bg-slate-50/50 dark:bg-gray-900/20">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
            Hiển thị <span className="text-gray-900 dark:text-white">{paginatedTeams.length}</span> trên <span className="text-gray-900 dark:text-white">{filteredTeams.length}</span> kết quả
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer flex items-center justify-center"
            >
              <i className="fa-solid fa-angles-left text-[11px]"></i>
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer flex items-center justify-center"
            >
              <i className="fa-solid fa-chevron-left text-[11px]"></i>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center justify-center',
                  currentPage === page
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 border-slate-200 dark:border-slate-700 dark:text-gray-400'
                )}
              >
                {page}
              </button>
            ))}

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer flex items-center justify-center"
            >
              <i className="fa-solid fa-chevron-right text-[11px]"></i>
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all shadow-sm cursor-pointer flex items-center justify-center"
            >
              <i className="fa-solid fa-angles-right text-[11px]"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteTeamId !== null}
        onClose={() => setDeleteTeamId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title={RESCUE_TEXTS.CONFIRM_DELETE_TITLE}
        message={RESCUE_TEXTS.CONFIRM_DELETE_MSG}
      />
    </div>
  );
}
