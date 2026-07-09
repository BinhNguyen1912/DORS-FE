import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rescueTeamApi } from '../../apis';
import { toast } from '../../stores';
import {
  teamTypeLabels,
  teamTypeColors,
} from '../../constants/rescueTeam.constants';

interface UnifiedRescueTeam {
  id: number;
  name: string;
  leaderName: string;
  leaderPhone: string;
  teamType: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'STANDBY' | 'DISPATCHED';
  address: string;
  memberCount: string;
  activeMissions: number;
  logoUrl?: string | null;
  isDb?: boolean;
  lat: number;
  lng: number;
}

interface RescueTeamListPanelProps {
  filteredTeams: UnifiedRescueTeam[];
  isLoading: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  teamTypeFilter: string;
  setTeamTypeFilter: (type: string) => void;
  activeMenuId: number | null;
  setActiveMenuId: (id: number | null) => void;
  onLocateTeam: (team: UnifiedRescueTeam) => void;
  onDeleteTeam: (id: number) => void;
}

export default function RescueTeamListPanel({
  filteredTeams,
  isLoading,
  statusFilter,
  setStatusFilter,
  teamTypeFilter,
  setTeamTypeFilter,
  activeMenuId,
  setActiveMenuId,
  onLocateTeam,
  onDeleteTeam,
}: RescueTeamListPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  return (
    <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Danh sách đội cứu hộ</h2>
        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.RESCUE_TEAM_CREATE}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all"
          >
            <i className="fa-solid fa-plus text-[14px]"></i>
            Tạo đội
          </Link>
          <Link
            to={ROUTES.RESCUE_TEAM_LIST}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Xem tất cả
          </Link>
        </div>
      </div>

      {/* Quick Filters Row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Sẵn sàng</option>
          <option value="BUSY">Đang làm nhiệm vụ</option>
          <option value="STANDBY">Dự phòng</option>
          <option value="OFF_DUTY">Ngoại tuyến</option>
        </select>

        <select
          value={teamTypeFilter}
          onChange={(e) => setTeamTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Tất cả phân loại</option>
          <option value="PCCC">PCCC</option>
          <option value="Y_TE">Y tế</option>
          <option value="DAN_PHONG">Dân phòng</option>
          <option value="QUAN_SU">Quân sự</option>
          <option value="TINH_NGUYEN">Tình nguyện</option>
        </select>
      </div>

      {/* Scrollable list of Teams */}
      <div className="space-y-3.5 overflow-y-auto max-h-[420px] pr-1 flex-1">
        {isLoading && filteredTeams.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Đang tải danh sách đội cứu hộ...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            Không tìm thấy đội cứu hộ nào phù hợp
          </div>
        ) : (
          filteredTeams.map((team) => {
            const typeStyle = teamTypeColors[team.teamType] || teamTypeColors.TONG_HOP;

            return (
              <div
                key={`${team.isDb ? 'db' : 'mock'}-${team.id}`}
                onClick={() => {
                  if (team.isDb) {
                    navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)));
                  } else {
                    alert('Đây là đội cứu hộ mẫu trực quan.');
                  }
                }}
                className="group relative bg-white dark:bg-gray-905 border border-slate-100 dark:border-slate-700/60 hover:border-gray-300 dark:hover:border-gray-600 p-3 rounded-xl transition-all shadow-sm hover:shadow flex items-start justify-between gap-3 text-left cursor-pointer"
              >
                {/* Left: Avatar Logo & details */}
                <div className="flex gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-team.png';
                        }}
                      />
                    ) : (
                      <i className="fa-solid fa-shield text-[20px] text-gray-400"></i>
                    )}
                  </div>

                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center flex-wrap gap-1.5 justify-start text-left">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {team.name}
                      </h4>
                      <span
                        className={cn(
                          'px-1.5 py-0.2 text-[8px] font-bold rounded-full uppercase border',
                          typeStyle.bg
                        )}
                      >
                        {teamTypeLabels[team.teamType] || team.teamType}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold text-left">
                      {team.address}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[10px] font-semibold text-gray-600 dark:text-gray-400 justify-start text-left">
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-users text-[11px] text-gray-400"></i>
                        {team.memberCount} thành viên
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-briefcase text-[11px] text-gray-400"></i>
                        {team.activeMissions} nhiệm vụ
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateTeam(team);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-bold hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/30"
                      >
                        <i className="fa-solid fa-location-crosshairs text-[9px]"></i>
                        Định vị
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & Actions */}
                <div className="flex flex-col items-end gap-2.5 justify-between h-full min-h-[44px] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={team.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      updateStatusMutation.mutate({ id: team.id, status: newStatus });
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                  >
                    <option value="AVAILABLE" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Sẵn sàng</option>
                    <option value="BUSY" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Đang làm nhiệm vụ</option>
                    <option value="DISPATCHED" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Đang tiếp cận</option>
                    <option value="STANDBY" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Dự phòng</option>
                    <option value="OFF_DUTY" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">Ngoại tuyến</option>
                  </select>

                  {/* Dropdown Menu actions */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === team.id ? null : team.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-[16px]"></i>
                    </button>

                    {activeMenuId === team.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-lg py-1.5 min-w-[120px] z-30">
                          <button
                            onClick={() => {
                              if (team.isDb) {
                                navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)));
                              } else {
                                alert('Đây là đội cứu hộ mẫu trực quan.');
                              }
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                          >
                            <i className="fa-solid fa-eye text-[14px]"></i>
                            Xem chi tiết
                          </button>

                          <button
                            onClick={() => {
                              if (team.isDb) {
                                alert('Chức năng sửa thông tin được kích hoạt trên trang chi tiết.');
                              } else {
                                alert('Đây là đội cứu hộ mẫu trực quan.');
                              }
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                          >
                            <i className="fa-solid fa-pen text-[14px]"></i>
                            Sửa đội
                          </button>

                          {team.isDb && (
                            <button
                              onClick={() => {
                                onDeleteTeam(team.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                            >
                              <i className="fa-solid fa-trash text-[14px]"></i>
                              Xóa đội
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
