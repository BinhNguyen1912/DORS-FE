import { useState, useMemo } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { rescueTeamApi } from '../../apis';
import { ROUTES } from '../../constants';
import { RESCUE_TEXTS } from '../../constants/rescueTexts';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

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

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang làm nhiệm vụ',
  OFF_DUTY: 'Ngoại tuyến',
  STANDBY: 'Dự phòng',
};

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  BUSY: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  OFF_DUTY: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  STANDBY: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
};

interface UnifiedRescueTeam {
  id: number;
  code: string;
  name: string;
  leaderName: string;
  leaderPhone: string;
  teamType: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'STANDBY';
  address: string;
  memberCount: string;
  activeMissions: number;
  logoUrl?: string | null;
}

export default function RescueTeamListPage() {
  const { searchQuery, setSearchQuery } = useOutletContext<{ searchQuery: string; setSearchQuery: (val: string) => void }>();
  const [statusFilter, setStatusFilter] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('');
  
  // Modal delete state
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load database rescue teams filtered by user's provinceId
  const { data: dbData, isLoading } = useQuery({
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

      return {
        id: team.id,
        code,
        name: team.name,
        leaderName,
        leaderPhone,
        teamType: typeMap[team.teamType] || 'TONG_HOP',
        status: (statusMap[team.status] || 'AVAILABLE') as any,
        address,
        memberCount: team.maxCapacity ? `12/${team.maxCapacity}` : '15/20', // mockup current vs max
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
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, teamTypeFilter]);

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumbs & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-gray-100 dark:border-gray-800">
        <div className="text-left">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight mb-0.5">{RESCUE_TEXTS.TITLE_LIST}</h1>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            <span>{RESCUE_TEXTS.BREADCRUMB_HOME}</span>
            <span>&gt;</span>
            <span>{RESCUE_TEXTS.BREADCRUMB_TEAM}</span>
            <span>&gt;</span>
            <span className="text-amber-500 font-semibold">Danh sách</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to={ROUTES.TEAM_SPECIALIZATION_LIST}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Quản lý Chuyên môn
          </Link>
          <Link
            to={ROUTES.RESCUE_TEAM_CREATE}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus size={14} />
            {RESCUE_TEXTS.BTN_ADD_TEAM}
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder={RESCUE_TEXTS.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
          />
        </div>

        <div>
          <select
            value={teamTypeFilter}
            onChange={(e) => setTeamTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
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
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-650 bg-slate-50/50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
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
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-100/50 dark:bg-gray-900/50 text-gray-400 focus:outline-none cursor-not-allowed font-semibold"
          >
            <option value="">{RESCUE_TEXTS.SELECT_AREA_ALL}</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-750 text-gray-500 dark:text-gray-400 font-bold bg-slate-50/70 dark:bg-gray-900/40 select-none">
                <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_CODE}</th>
                <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_NAME}</th>
                <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_TYPE}</th>
                <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_AREA}</th>
                <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_MEMBERS}</th>
                <th className="py-3.5 px-4">{RESCUE_TEXTS.COL_STATUS}</th>
                <th className="py-3.5 px-4 text-center">{RESCUE_TEXTS.COL_MISSIONS}</th>
                <th className="py-3.5 px-4 text-center w-28">{RESCUE_TEXTS.COL_ACTIONS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-750/50 text-gray-700 dark:text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="font-semibold text-xs">Đang tải danh sách đội cứu hộ...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedTeams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 font-semibold">
                    Không tìm thấy đội cứu hộ nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedTeams.map((team) => {
                  const typeStyle = teamTypeColors[team.teamType] || teamTypeColors.TONG_HOP;
                  const statusColor = statusColors[team.status] || statusColors.ACTIVE;

                  return (
                    <tr
                      key={team.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      {/* Code */}
                      <td className="py-4 px-4 font-mono font-bold text-gray-500 dark:text-gray-400">
                        {team.code}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 font-bold text-gray-900 dark:text-white max-w-[200px] truncate">
                        {team.name}
                      </td>

                      {/* Team Type Badge */}
                      <td className="py-4 px-4">
                        <span className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wide',
                          typeStyle.bg
                        )}>
                          {teamTypeLabels[team.teamType] || team.teamType}
                        </span>
                      </td>

                      {/* Area of Duty */}
                      <td className="py-4 px-4 text-gray-500 dark:text-gray-400 font-semibold">
                        {team.address}
                      </td>

                      {/* Members */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5 mt-2">
                        <Users size={12} className="text-gray-400" />
                        {team.memberCount}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span className={cn(
                          'px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase',
                          statusColor
                        )}>
                          {statusLabels[team.status] || team.status}
                        </span>
                      </td>

                      {/* Active Missions */}
                      <td className="py-4 px-4 text-center font-bold text-gray-800 dark:text-slate-200">
                        {team.activeMissions}
                      </td>

                      {/* Actions - Hover triggers transition to show button icons directly */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {/* View detail & edit now go to detail page */}
                          <button
                            onClick={() => navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))}
                            title={RESCUE_TEXTS.BTN_VIEW_DETAIL}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-blue-500 hover:text-blue-600 rounded-lg transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          
                          <button
                            onClick={() => navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))}
                            title={RESCUE_TEXTS.BTN_EDIT}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-amber-500 hover:text-amber-600 rounded-lg transition-all"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => setDeleteTeamId(team.id)}
                            title={RESCUE_TEXTS.BTN_DELETE}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
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

        {/* Pagination & Count footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 dark:border-gray-750 select-none bg-slate-50/50 dark:bg-gray-900/20">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
            Hiển thị <span className="text-gray-900 dark:text-white">{paginatedTeams.length}</span> trên <span className="text-gray-900 dark:text-white">{filteredTeams.length}</span> kết quả
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 dark:text-gray-405 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-all shadow-sm"
            >
              <ChevronsLeft size={14} />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 dark:text-gray-405 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-all shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-bold transition-all border',
                  currentPage === page
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 border-gray-250 dark:border-gray-700 dark:text-gray-400'
                )}
              >
                {page}
              </button>
            ))}

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 dark:text-gray-405 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-all shadow-sm"
            >
              <ChevronRight size={14} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-800/40 text-gray-500 hover:text-gray-900 dark:text-gray-405 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-all shadow-sm"
            >
              <ChevronsRight size={14} />
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
