import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rescueTeamApi, locationApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';
import StatsSummaryCards from '../../components/rescue-team/StatsSummaryCards';
import RescueTeamDashboardMap from '../../components/rescue-team/RescueTeamDashboardMap';
import RescueTeamListPanel from '../../components/rescue-team/RescueTeamListPanel';

const injectStyles = `
  .custom-theme-popup .leaflet-popup-content-wrapper {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    color: #1e293b !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
    padding: 6px !important;
    font-family: 'Roboto', sans-serif !important;
  }
  .custom-theme-popup .leaflet-popup-tip {
    background-color: #ffffff !important;
    border-left: 1px solid #e2e8f0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .custom-div-icon {
    background: none !important;
    border: none !important;
  }
`;

interface UnifiedRescueTeam {
  id: number;
  name: string;
  leaderName: string;
  leaderPhone: string;
  teamType: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'STANDBY';
  address: string;
  memberCount: string;
  activeMissions: number;
  logoUrl?: string | null;
  isDb?: boolean;
  lat: number;
  lng: number;
}

export default function RescueTeamDashboardPage() {
  const [searchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Provinces to map the user's provinceId to a center
  const { data: provinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => locationApi.getAllProvinces(),
  });

  const currentProvince = useMemo(() => {
    if (!provinces || !user?.provinceId) return null;
    return provinces.find((p) => p.id === user.provinceId);
  }, [provinces, user?.provinceId]);

  const provinceName = currentProvince?.name || 'Đà Nẵng';

  const defaultCenter = useMemo((): [number, number] => {
    const n = provinceName.toLowerCase();
    if (n.includes('đà nẵng')) return [16.0544, 108.2022];
    if (n.includes('quảng nam')) return [15.567, 108.15];
    if (n.includes('huế') || n.includes('thừa thiên')) return [16.46, 107.59];
    if (n.includes('hà nội')) return [21.0285, 105.8542];
    if (n.includes('hồ chí minh') || n.includes('sài gòn')) return [10.823, 106.6296];
    return [16.0544, 108.2022]; // Default Da Nang
  }, [provinceName]);

  // Load database rescue teams filtered by user's provinceId
  const { data: dbData, isLoading } = useQuery({
    queryKey: ['rescue-teams', user?.provinceId],
    queryFn: () => rescueTeamApi.getAll({ page: 1, limit: 100, provinceId: user?.provinceId }),
  });

  // Load recent SOS requests
  const { data: recentSosData, isLoading: isLoadingSos } = useQuery({
    queryKey: ['recent-sos-requests', user?.provinceId],
    queryFn: () => rescueTeamApi.getRecentSosRequests({ provinceId: user?.provinceId, limit: 5 }),
  });

  // Delete DB team mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => rescueTeamApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-teams'] });
      setActiveMenuId(null);
      toast.success('Xóa đội cứu hộ thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi xóa đội cứu hộ');
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa đội cứu hộ này?')) {
      deleteMutation.mutate(id);
    }
  };

  // Merge database teams
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

      let lat = defaultCenter[0];
      let lng = defaultCenter[1];
      if (team.baseLocation?.coordinates && Array.isArray(team.baseLocation.coordinates)) {
        lng = team.baseLocation.coordinates[0];
        lat = team.baseLocation.coordinates[1];
      }

      return {
        id: team.id,
        name: team.name,
        leaderName,
        leaderPhone,
        teamType: typeMap[team.teamType] || 'TONG_HOP',
        status: (statusMap[team.status] || 'AVAILABLE') as any,
        address,
        memberCount: team.maxCapacity ? `0/${team.maxCapacity}` : '15/20',
        activeMissions: team.missionsCount || 0,
        logoUrl: team.logoUrl,
        isDb: true,
        lat,
        lng,
      };
    });

    return dbTeamsMapped;
  }, [dbData, defaultCenter]);

  // Filtered teams list based on search and selected options
  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || team.status === statusFilter;
      const matchesType = !teamTypeFilter || team.teamType === teamTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allTeams, searchQuery, statusFilter, teamTypeFilter]);

  // Summary counts
  const stats = useMemo(() => {
    const total = allTeams.length;
    const active = allTeams.filter((t) => t.status === 'AVAILABLE' || t.status === 'BUSY').length;
    const onDuty = allTeams.filter((t) => t.status === 'BUSY').length;
    const ready = allTeams.filter((t) => t.status === 'AVAILABLE').length;

    return { total, active, onDuty, ready };
  }, [allTeams]);

  // Donut chart calculations
  const donutData = useMemo(() => {
    const total = allTeams.length || 1;
    const counts: Record<string, number> = {
      PCCC: 0,
      Y_TE: 0,
      DAN_PHONG: 0,
      QUAN_SU: 0,
      TINH_NGUYEN: 0,
      TONG_HOP: 0,
    };

    allTeams.forEach((t) => {
      const type = t.teamType;
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts.TONG_HOP++;
      }
    });

    return {
      total: allTeams.length,
      pccc: { count: counts.PCCC, pct: (counts.PCCC / total) * 100 },
      yte: { count: counts.Y_TE, pct: (counts.Y_TE / total) * 100 },
      danphong: { count: counts.DAN_PHONG, pct: (counts.DAN_PHONG / total) * 100 },
      quansu: { count: counts.QUAN_SU, pct: (counts.QUAN_SU / total) * 100 },
      tinhnguyen: { count: counts.TINH_NGUYEN, pct: (counts.TINH_NGUYEN / total) * 100 },
      tonghop: { count: counts.TONG_HOP, pct: (counts.TONG_HOP / total) * 100 },
    };
  }, [allTeams]);

  // Sum activeMissions and rescuedCount
  const activityMetrics = useMemo(() => {
    let completedMissions = 0;
    let rescuedCount = 0;

    (dbData?.data || []).forEach((team: any) => {
      completedMissions += team.missionsCount || 0;
      rescuedCount += team.rescuedCount || 0;
    });

    return {
      completedMissions,
      rescuedCount,
    };
  }, [dbData]);

  const handleLocateTeam = (team: UnifiedRescueTeam) => {
    setSelectedTeamId(null);
    setTimeout(() => {
      setSelectedTeamId(team.id);
    }, 50);
  };

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: injectStyles }} />

      {/* Top 4 Stats Cards */}
      <StatsSummaryCards stats={stats} />

      {/* Middle Grid: Map (Left) & Team List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Map */}
        <RescueTeamDashboardMap
          filteredTeams={filteredTeams}
          defaultCenter={defaultCenter}
          teamTypeFilter={teamTypeFilter}
          setTeamTypeFilter={setTeamTypeFilter}
          onNavigateToDisaster={() => navigate(ROUTES.DISASTER_LIST)}
          selectedTeamId={selectedTeamId}
        />

        {/* Right Column: Rescue Teams List */}
        <RescueTeamListPanel
          filteredTeams={filteredTeams}
          isLoading={isLoading}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          teamTypeFilter={teamTypeFilter}
          setTeamTypeFilter={setTeamTypeFilter}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
          onLocateTeam={handleLocateTeam}
          onDeleteTeam={handleDelete}
        />
      </div>

      {/* Bottom Row: Charts & Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-6 space-y-4">
          {/* Performance Summary Box */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Hiệu suất hoạt động (Tỉnh thành)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Box 1: Hoàn thành */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
                  <i className="fa-solid fa-circle-check text-[20px]"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Nhiệm vụ xong</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">{activityMetrics.completedMissions}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">Thực tế</p>
                </div>
              </div>

              {/* Box 2: Đã cứu */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <i className="fa-solid fa-person-circle-check text-[20px]"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Đã ứng cứu</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">{activityMetrics.rescuedCount}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-none mt-0.5">Người dân</p>
                </div>
              </div>

              {/* Box 3: Giờ hoạt động */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <i className="fa-solid fa-clock text-[20px]"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Giờ hoạt động</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">1,420</p>
                  <p className="text-[10px] text-amber-650 dark:text-amber-400 font-bold leading-none mt-0.5">Dữ liệu mẫu</p>
                </div>
              </div>

              {/* Box 4: Thiết bị */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <i className="fa-solid fa-wrench text-[20px]"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Thiết bị hỗ trợ</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">342</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold leading-none mt-0.5">Dữ liệu mẫu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classification Donut Chart */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Phân loại đội cứu hộ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              {/* Donut SVG Rendering */}
              <div className="relative flex justify-center">
                <svg width="180" height="180" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="11" className="dark:stroke-gray-700" />

                  {/* PCCC: Red */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * donutData.pccc.pct) / 100}
                    transform="rotate(-90 50 50)"
                  />
                  {/* Y tế: Green */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * donutData.yte.pct) / 100}
                    transform={`rotate(${-90 + (360 * donutData.pccc.pct) / 100} 50 50)`}
                  />
                  {/* Dân phòng: Blue */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * donutData.danphong.pct) / 100}
                    transform={`rotate(${-90 + (360 * (donutData.pccc.pct + donutData.yte.pct)) / 100} 50 50)`}
                  />
                  {/* Quân sự: Slate */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * donutData.quansu.pct) / 100}
                    transform={`rotate(${-90 + (360 * (donutData.pccc.pct + donutData.yte.pct + donutData.danphong.pct)) / 100} 50 50)`}
                  />
                  {/* Tình nguyện: Purple */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * donutData.tinhnguyen.pct) / 100}
                    transform={`rotate(${-90 + (360 * (donutData.pccc.pct + donutData.yte.pct + donutData.danphong.pct + donutData.quansu.pct)) / 100} 50 50)`}
                  />
                  {/* Tổng hợp: Orange/Indigo/Gray */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#cbd5e1"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset={251.3 - (251.3 * donutData.tonghop.pct) / 100}
                    transform={`rotate(${-90 + (360 * (donutData.pccc.pct + donutData.yte.pct + donutData.danphong.pct + donutData.quansu.pct + donutData.tinhnguyen.pct)) / 100} 50 50)`}
                    className="dark:stroke-gray-600"
                  />
                </svg>

                {/* Donut Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">{donutData.total}</span>
                  <span className="text-[10px] text-gray-500 font-bold dark:text-gray-400 mt-1 uppercase leading-none">Tổng số đội</span>
                </div>
              </div>

              {/* Legends detail list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">PCCC</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{donutData.pccc.count} đội ({Math.round(donutData.pccc.pct)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Y tế</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{donutData.yte.count} đội ({Math.round(donutData.yte.pct)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Dân phòng</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{donutData.danphong.count} đội ({Math.round(donutData.danphong.pct)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Quân sự</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{donutData.quansu.count} đội ({Math.round(donutData.quansu.pct)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tình nguyện</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{donutData.tinhnguyen.count} đội ({Math.round(donutData.tinhnguyen.pct)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recent Emergency Tasks */}
        <div className="xl:col-span-6 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Nhiệm vụ gần đây (SOS)
            </h2>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Xem tất cả
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-4 flex-1">
            {isLoadingSos ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Đang tải nhiệm vụ khẩn cấp...</p>
              </div>
            ) : !recentSosData || recentSosData.length === 0 ? (
              <div className="py-16 text-center text-xs font-semibold text-gray-450 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                Chưa có yêu cầu cứu hộ khẩn cấp nào gần đây
              </div>
            ) : (
              recentSosData.map((sos: any) => {
                const isResolved = sos.status === 'RESOLVED' || sos.status === 'COMPLETED';
                return (
                  <div key={sos.id} className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3.5 last:border-b-0 last:pb-0">
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        isResolved ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950/40 text-red-655 dark:text-red-400"
                      )}>
                        {sos.status === 'PENDING' ? <i className="fa-solid fa-location-crosshairs text-[18px]"></i> : <i className="fa-solid fa-heart-pulse text-[18px]"></i>}
                      </div>
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none block">SOS-#{sos.id}</span>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                          {sos.description || `Yêu cầu cứu hộ khẩn cấp`}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5 flex-wrap">
                          <span>{sos.addressDetail || 'Đà Nẵng'}</span>
                          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                          <span>SĐT: {sos.phoneNumber || 'Không có'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-semibold text-gray-400">
                        {new Date(sos.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-extrabold rounded-full border uppercase",
                        sos.status === 'PENDING' ? "bg-red-50 text-red-700 border-red-200" :
                          sos.status === 'ASSIGNED' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            sos.status === 'RESOLVED' ? "bg-green-50 text-green-700 border-green-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {sos.status === 'PENDING' ? 'Chờ xử lý' :
                          sos.status === 'ASSIGNED' ? 'Đã điều phối' :
                            sos.status === 'RESOLVED' ? 'Hoàn thành' : sos.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
