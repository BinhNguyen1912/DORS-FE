import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Shield,
  Briefcase,
  Compass,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  Activity,
  Heart,
  MoreVertical,
  Wrench,
  UserCheck,
} from 'lucide-react';
import { rescueTeamApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';

// Types mapping and colors matching the screenshot
const teamTypeLabels: Record<string, string> = {
  PCCC: 'PCCC',
  Y_TE: 'Y Tế',
  DAN_PHONG: 'Dân phòng',
  QUAN_SU: 'Quân sự',
  TINH_NGUYEN: 'Tình nguyện',
  TONG_HOP: 'Tổng hợp',
  PROFESSIONAL: 'PCCC', // Fallback
  VOLUNTEER_SPONTANEOUS: 'Tình nguyện', // Fallback
};

const teamTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
  PCCC: { bg: 'bg-red-50 text-red-700 border-red-150', text: 'text-red-700', dot: 'bg-red-500' },
  Y_TE: { bg: 'bg-green-50 text-green-700 border-green-150', text: 'text-green-700', dot: 'bg-green-500' },
  DAN_PHONG: { bg: 'bg-blue-50 text-blue-700 border-blue-150', text: 'text-blue-700', dot: 'bg-blue-500' },
  QUAN_SU: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
  TINH_NGUYEN: { bg: 'bg-purple-50 text-purple-700 border-purple-150', text: 'text-purple-700', dot: 'bg-purple-500' },
  TONG_HOP: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-150', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  PROFESSIONAL: { bg: 'bg-red-50 text-red-700 border-red-150', text: 'text-red-700', dot: 'bg-red-500' },
  VOLUNTEER_SPONTANEOUS: { bg: 'bg-purple-50 text-purple-700 border-purple-150', text: 'text-purple-700', dot: 'bg-purple-500' },
};

// Map display statuses
const statusLabels: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang làm nhiệm vụ',
  OFF_DUTY: 'Ngoại tuyến',
  STANDBY: 'Dự phòng',
  ACTIVE: 'Sẵn sàng',
  ON_DUTY: 'Đang làm nhiệm vụ',
  INACTIVE: 'Ngoại tuyến',
};

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  BUSY: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  OFF_DUTY: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
  STANDBY: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  ON_DUTY: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
};

// Interface for unified view
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
}

// Visual mock teams removed, querying from DB only

// Interactive map markers coordinates around Da Nang
interface MapMarker {
  id: string;
  name: string;
  teamsCount: number;
  status: 'AVAILABLE' | 'BUSY' | 'MOVING' | 'OFF_DUTY';
  x: number;
  y: number;
  label: string;
}

const mapMarkers: MapMarker[] = [
  { id: 'm1', name: 'Đà Nẵng Trung tâm', teamsCount: 12, status: 'AVAILABLE', x: 280, y: 160, label: '12' },
  { id: 'm2', name: 'Sơn Trà', teamsCount: 12, status: 'MOVING', x: 380, y: 120, label: '12' },
  { id: 'm3', name: 'Hòa Vang Bắc', teamsCount: 5, status: 'BUSY', x: 195, y: 195, label: '5' },
  { id: 'm4', name: 'Đại Lộc', teamsCount: 8, status: 'MOVING', x: 260, y: 240, label: '8' },
  { id: 'm5', name: 'Điện Bàn', teamsCount: 3, status: 'AVAILABLE', x: 340, y: 255, label: '3' },
  { id: 'm6', name: 'Hòa Vang Nam', teamsCount: 3, status: 'AVAILABLE', x: 190, y: 275, label: '3' },
];

export default function RescueTeamDashboardPage() {
  const [searchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Merge database teams with mock teams
  const allTeams = useMemo(() => {
    const dbTeamsMapped: UnifiedRescueTeam[] = (dbData?.data || []).map((team) => {
      // Map backend status/type to dashboard format
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
        team.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || team.status === statusFilter;
      const matchesType = !teamTypeFilter || team.teamType === teamTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allTeams, searchQuery, statusFilter, teamTypeFilter]);

  // Summary counts (calculated completely from database)
  const stats = useMemo(() => {
    const total = allTeams.length;
    const active = allTeams.filter(t => t.status === 'AVAILABLE' || t.status === 'BUSY').length;
    const onDuty = allTeams.filter(t => t.status === 'BUSY').length;
    const ready = allTeams.filter(t => t.status === 'AVAILABLE').length;

    return { total, active, onDuty, ready };
  }, [allTeams]);

  // Donut chart calculations from real teams data
  const donutData = useMemo(() => {
    const total = allTeams.length || 1; // avoid divide by zero
    const counts: Record<string, number> = {
      PCCC: 0,
      Y_TE: 0,
      DAN_PHONG: 0,
      QUAN_SU: 0,
      TINH_NGUYEN: 0,
      TONG_HOP: 0,
    };

    allTeams.forEach(t => {
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

  // Sum activeMissions and rescuedCount from real database
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

  return (
    <div className="space-y-4">
      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số đội */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
            <Users size={22} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Tổng số đội
            </p>
            <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
              {stats.total}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 truncate">
              <span>+5 đội mới</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">so với tuần trước</span>
            </p>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
          <div className="p-2.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl flex-shrink-0">
            <Activity size={22} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Đang hoạt động
            </p>
            <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
              {stats.active}
            </p>
            <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 truncate">
              <span>{Math.round((stats.active / stats.total) * 1000) / 10}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
            </p>
          </div>
        </div>

        {/* Card 3: Đang làm nhiệm vụ */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
            <Briefcase size={22} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Đang làm nhiệm vụ
            </p>
            <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
              {stats.onDuty}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 truncate">
              <span>{Math.round((stats.onDuty / stats.total) * 1000) / 10}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
            </p>
          </div>
        </div>

        {/* Card 4: Sẵn sàng */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3.5 text-left">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex-shrink-0">
            <UserCheck size={22} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Sẵn sàng
            </p>
            <p className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">
              {stats.ready}
            </p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 truncate">
              <span>{Math.round((stats.ready / stats.total) * 1000) / 10}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Map (Left) & Team List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
              Vị trí đội cứu hộ (Real-time)
            </h2>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
              Xem toàn bản đồ &gt;
            </button>
          </div>

          {/* SVG Map Container */}
          <div className="relative flex-1 min-h-[360px] bg-sky-50/50 dark:bg-gray-950 rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700">
            {/* Map Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all" title="Lọc">
                <Filter size={16} />
              </button>
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all" title="Lớp bản đồ">
                <Layers size={16} />
              </button>
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all" title="Phóng to">
                <ZoomIn size={16} />
              </button>
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all" title="Thu nhỏ">
                <ZoomOut size={16} />
              </button>
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all" title="Định vị">
                <Compass size={16} />
              </button>
            </div>

            {/* Custom SVG Coastline & Land Map of Da Nang */}
            <svg viewBox="0 0 500 350" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              {/* Landmass of Da Nang & Quang Nam */}
              <path
                d="M 0,350 L 0,140 Q 60,130 90,160 Q 120,190 160,150 Q 210,100 250,120 Q 280,140 290,100 Q 305,65 330,80 Q 360,105 320,140 Q 300,165 330,220 T 400,350 Z"
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                className="dark:fill-gray-900 dark:stroke-gray-800"
              />

              {/* Vịnh Đà Nẵng (Bay Water Highlight) */}
              <path
                d="M 160,150 Q 210,100 250,120 Q 280,140 290,100 Q 305,65 330,80 L 250,30 Q 150,50 160,150 Z"
                fill="#f0f9ff"
                opacity="0.6"
                className="dark:fill-sky-950/20"
              />

              {/* Major Roads / Highways lines */}
              <path d="M 0,220 Q 150,230 250,225 T 400,240" fill="none" stroke="#fed7aa" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M 180,150 Q 220,280 260,350" fill="none" stroke="#fed7aa" strokeWidth="1.5" strokeDasharray="4 2" />

              {/* Region Labels */}
              <text x="320" y="85" className="fill-blue-500/80 font-bold text-[10px] tracking-wide dark:fill-blue-400/80">Vịnh Đà Nẵng</text>
              <text x="325" y="155" className="fill-gray-700 font-extrabold text-[12px] dark:fill-gray-300">Đà Nẵng</text>
              <text x="260" y="275" className="fill-gray-400 font-semibold text-[9px] dark:fill-gray-500">Đại Lộc</text>
              <text x="345" y="295" className="fill-gray-400 font-semibold text-[9px] dark:fill-gray-500">Điện Bàn</text>
              <text x="130" y="220" className="fill-gray-400 font-semibold text-[9px] dark:fill-gray-500">Hòa Vang</text>

              <text x="410" y="60" className="fill-blue-400/60 font-semibold text-[10px] italic dark:fill-blue-500/40">Biển Đông</text>

              {/* Interactive SVG Markers representing team clusters */}
              {mapMarkers.map((marker) => {
                const isSelected = selectedMarkerId === marker.id;

                // Color mapping for marker categories
                const markerColors: Record<string, { fill: string; stroke: string; bg: string }> = {
                  AVAILABLE: { fill: 'fill-green-500', stroke: 'stroke-green-500', bg: 'bg-green-500' },
                  BUSY: { fill: 'fill-red-500', stroke: 'stroke-red-500', bg: 'bg-red-500' },
                  ACTIVE: { fill: 'fill-green-500', stroke: 'stroke-green-500', bg: 'bg-green-500' },
                  ON_DUTY: { fill: 'fill-red-500', stroke: 'stroke-red-500', bg: 'bg-red-500' },
                  MOVING: { fill: 'fill-blue-500', stroke: 'stroke-blue-500', bg: 'bg-blue-500' },
                  OFF_DUTY: { fill: 'fill-slate-500', stroke: 'stroke-slate-500', bg: 'bg-slate-500' },
                };

                const colors = markerColors[marker.status] || markerColors.AVAILABLE;

                return (
                  <g
                    key={marker.id}
                    className="cursor-pointer transition-all"
                    onClick={() => {
                      setSelectedMarkerId(isSelected ? null : marker.id);
                      // Set search/filter based on selected area or trigger view
                    }}
                  >
                    {/* Pulsing visual outer ring */}
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={isSelected ? 18 : 12}
                      className={cn(colors.fill, 'opacity-20 animate-pulse transition-all')}
                    />

                    {/* Marker solid center */}
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={isSelected ? 12 : 9}
                      className={cn(colors.fill, 'stroke-white transition-all')}
                      strokeWidth="1.5"
                    />

                    {/* Quantity Label inside circle */}
                    <text
                      x={marker.x}
                      y={marker.y + 3}
                      textAnchor="middle"
                      className="fill-white font-extrabold text-[9px] select-none"
                    >
                      {marker.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Tooltip on selecting marker */}
            {selectedMarkerId && (() => {
              const marker = mapMarkers.find((m) => m.id === selectedMarkerId);
              if (!marker) return null;
              return (
                <div
                  className="absolute bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-gray-700 max-w-[200px] z-20 pointer-events-auto"
                  style={{
                    left: `${(marker.x / 500) * 100}%`,
                    top: `${(marker.y / 350) * 100 - 15}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white dark:border-t-gray-800" />
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                    {marker.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mb-1">
                    Tổng số đội: {marker.teamsCount}
                  </p>
                  <span className={cn(
                    'px-2 py-0.5 text-[9px] font-bold rounded-full border inline-block',
                    ((marker.status as string) === 'AVAILABLE' || (marker.status as string) === 'ACTIVE') ? 'bg-green-50 text-green-700 border-green-200' :
                      ((marker.status as string) === 'BUSY' || (marker.status as string) === 'ON_DUTY') ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                  )}>
                    {((marker.status as string) === 'AVAILABLE' || (marker.status as string) === 'ACTIVE') ? 'Sẵn sàng' :
                      ((marker.status as string) === 'BUSY' || (marker.status as string) === 'ON_DUTY') ? 'Cứu hộ khẩn cấp' : 'Đang di chuyển'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Map bottom legend row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Sẵn sàng</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Đang làm nhiệm vụ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Đang di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Ngoại tuyến</span>
            </div>
          </div>
        </div>

        {/* Right Column: Rescue Teams List */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Danh sách đội cứu hộ
            </h2>
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.RESCUE_TEAM_CREATE}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all"
              >
                <Plus size={14} />
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
                const statusColor = statusColors[team.status] || statusColors.ACTIVE;

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
                    className="group relative bg-white dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 hover:border-gray-300 dark:hover:border-gray-600 p-3 rounded-xl transition-all shadow-sm hover:shadow flex items-start justify-between gap-3 text-left cursor-pointer"
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
                              // Fallback on load error
                              (e.target as HTMLImageElement).src = 'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-team.png';
                            }}
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center flex-wrap gap-1.5 justify-start text-left">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                            {team.name}
                          </h4>
                          <span className={cn(
                            'px-1.5 py-0.2 text-[8px] font-bold rounded-full uppercase border',
                            typeStyle.bg
                          )}>
                            {teamTypeLabels[team.teamType] || team.teamType}
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold text-left">
                          {team.address}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 text-[10px] font-semibold text-gray-600 dark:text-gray-400 justify-start text-left">
                          <span className="flex items-center gap-1">
                            <Users size={11} className="text-gray-400" />
                            {team.memberCount} thành viên
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase size={11} className="text-gray-400" />
                            {team.activeMissions} nhiệm vụ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge & Actions */}
                    <div className="flex flex-col items-end gap-2.5 justify-between h-full min-h-[44px] flex-shrink-0">
                      <span className={cn(
                        'px-2 py-0.5 text-[9px] font-extrabold rounded-lg border',
                        statusColor
                      )}>
                        {statusLabels[team.status] || team.status}
                      </span>

                      {/* Dropdown Menu actions */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === team.id ? null : team.id);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === team.id && (
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
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              Xem chi tiết
                            </button>

                            <button
                              onClick={() => {
                                if (team.isDb) {
                                  // Navigating to detail page edit could also work
                                  alert('Chức năng sửa thông tin được kích hoạt trên trang chi tiết.');
                                } else {
                                  alert('Đây là đội cứu hộ mẫu trực quan.');
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5"
                            >
                              <Edit size={14} />
                              Chỉnh sửa
                            </button>

                            {team.isDb && (
                              <button
                                onClick={() => handleDelete(team.id)}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700/60"
                              >
                                <Trash2 size={14} />
                                Xóa đội
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Stats Dashboard & Donut (Left) & Recent Tasks (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Side: Performance Metrics & Donut Chart */}
        <div className="xl:col-span-6 space-y-6">
          {/* Activity Metrics (30 days) */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Thống kê hoạt động (30 ngày qua)
              </h2>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Xem chi tiết
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Box 1: Nhiệm vụ */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Nhiệm vụ đã thực hiện</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">{activityMetrics.completedMissions}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">Thời gian thực</p>
                </div>
              </div>

              {/* Box 2: Người được cứu */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Người đã cứu</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">{activityMetrics.rescuedCount}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">Thời gian thực</p>
                </div>
              </div>

              {/* Box 3: Giờ hoạt động */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Giờ hoạt động</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">2,856</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold leading-none mt-0.5">Dữ liệu mẫu</p>
                </div>
              </div>

              {/* Box 4: Thiết bị */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Wrench size={20} />
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
                  {/* Concentric slices using strokeDasharray/strokeDashoffset */}
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
                        isResolved ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                      )}>
                        {sos.status === 'PENDING' ? <Compass size={18} /> : <Activity size={18} />}
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
