import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
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
  Bell,
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
  ACTIVE: 'Sẵn sàng',
  ON_DUTY: 'Đang làm nhiệm vụ',
  OFF_DUTY: 'Ngoại tuyến',
  INACTIVE: 'Ngoại tuyến',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  ON_DUTY: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  OFF_DUTY: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
  INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
};

// Interface for unified view
interface UnifiedRescueTeam {
  id: number;
  name: string;
  leaderName: string;
  leaderPhone: string;
  teamType: string;
  status: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'INACTIVE';
  address: string;
  memberCount: string;
  activeMissions: number;
  logoUrl?: string | null;
  isDb?: boolean;
}

// Visual mock teams matching the screenshot
const mockRescueTeams: UnifiedRescueTeam[] = [
  {
    id: -1,
    name: 'Đội PCCC Đà Nẵng 01',
    leaderName: 'Nguyễn Văn B',
    leaderPhone: '0905 123 456',
    teamType: 'PCCC',
    status: 'ON_DUTY',
    address: 'Phường Hòa Cường',
    memberCount: '12/15',
    activeMissions: 2,
    logoUrl: 'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-pccc.png',
  },
  {
    id: -2,
    name: 'Đội Y tế Đà Nẵng 02',
    leaderName: 'Trần Thị C',
    leaderPhone: '0905 234 567',
    teamType: 'Y_TE',
    status: 'ON_DUTY',
    address: 'Phường Hải Châu',
    memberCount: '10/12',
    activeMissions: 1,
    logoUrl: 'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-yte.png',
  },
  {
    id: -3,
    name: 'Đội Dân phòng Sơn Trà',
    leaderName: 'Lê Văn D',
    leaderPhone: '0905 345 678',
    teamType: 'DAN_PHONG',
    status: 'ACTIVE',
    address: 'Phường Thọ Quang',
    memberCount: '18/20',
    activeMissions: 0,
    logoUrl: 'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-team.png',
  },
  {
    id: -4,
    name: 'Đội Tình nguyện Hòa Vang',
    leaderName: 'Phạm Văn E',
    leaderPhone: '0905 456 789',
    teamType: 'TINH_NGUYEN',
    status: 'ACTIVE',
    address: 'Huyện Hòa Vang',
    memberCount: '25/30',
    activeMissions: 1,
    logoUrl: 'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-volunteer.png',
  },
  {
    id: -5,
    name: 'Đội Quân sự Liên Chiểu',
    leaderName: 'Hoàng Văn F',
    leaderPhone: '0905 567 890',
    teamType: 'QUAN_SU',
    status: 'INACTIVE',
    address: 'Quận Liên Chiểu',
    memberCount: '20/20',
    activeMissions: 0,
    logoUrl: 'https://pub-2c2241596f28433bb00bedb6391e5d78.r2.dev/assets/default-team.png',
  },
];

// Interactive map markers coordinates around Da Nang
interface MapMarker {
  id: string;
  name: string;
  teamsCount: number;
  status: 'ACTIVE' | 'ON_DUTY' | 'MOVING' | 'OFF_DUTY';
  x: number;
  y: number;
  label: string;
}

const mapMarkers: MapMarker[] = [
  { id: 'm1', name: 'Đà Nẵng Trung tâm', teamsCount: 12, status: 'ACTIVE', x: 280, y: 160, label: '12' },
  { id: 'm2', name: 'Sơn Trà', teamsCount: 12, status: 'MOVING', x: 380, y: 120, label: '12' },
  { id: 'm3', name: 'Hòa Vang Bắc', teamsCount: 5, status: 'ON_DUTY', x: 195, y: 195, label: '5' },
  { id: 'm4', name: 'Đại Lộc', teamsCount: 8, status: 'MOVING', x: 260, y: 240, label: '8' },
  { id: 'm5', name: 'Điện Bàn', teamsCount: 3, status: 'ACTIVE', x: 340, y: 255, label: '3' },
  { id: 'm6', name: 'Hòa Vang Nam', teamsCount: 3, status: 'ACTIVE', x: 190, y: 275, label: '3' },
];

export default function RescueTeamListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load database rescue teams
  const { data: dbData, isLoading } = useQuery({
    queryKey: ['rescue-teams'],
    queryFn: () => rescueTeamApi.getAll({ page: 1, limit: 100 }),
  });

  // Delete DB team mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => rescueTeamApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescue-teams'] });
      setActiveMenuId(null);
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
        ACTIVE: 'ACTIVE',
        ON_DUTY: 'ON_DUTY',
        OFF_DUTY: 'OFF_DUTY',
        INACTIVE: 'INACTIVE',
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

      return {
        id: team.id,
        name: team.name,
        leaderName: team.leaderName,
        leaderPhone: team.leaderPhone,
        teamType: typeMap[team.teamType] || 'TONG_HOP',
        status: (statusMap[team.status] || 'ACTIVE') as any,
        address: 'Thành phố Đà Nẵng', // Default city detail
        memberCount: '15/20', // Default mock member capacity
        activeMissions: team.missionsCount || 0,
        logoUrl: team.logoUrl,
        isDb: true,
      };
    });

    return [...dbTeamsMapped, ...mockRescueTeams];
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

  // Summary counts
  const stats = useMemo(() => {
    const total = 128 + (dbData?.total || 0);
    const active = 96 + (dbData?.data || []).filter(t => t.status === 'ACTIVE' || t.status === 'ON_DUTY').length;
    const onDuty = 24 + (dbData?.data || []).filter(t => t.status === 'ON_DUTY').length;
    const ready = 48 + (dbData?.data || []).filter(t => t.status === 'ACTIVE').length;

    return { total, active, onDuty, ready };
  }, [dbData]);

  return (
    <div className="space-y-6 bg-slate-50/50 p-1 rounded-2xl dark:bg-transparent">
      {/* Top Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Quản lý đội cứu hộ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Tổng quan
            </p>
          </div>
        </div>

        {/* Search & Profile Area */}
        <div className="flex flex-wrap items-center gap-4 xl:justify-end flex-1">
          <div className="relative flex-1 max-w-md min-w-[260px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm đội, thành viên, khu vực..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
            />
          </div>

          <button className="relative p-2.5 bg-gray-50 hover:bg-gray-150 dark:bg-gray-900 dark:hover:bg-gray-950 rounded-xl text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 transition-all">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
              12
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Admin avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Nguyễn Văn A
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Quản trị viên
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng số đội */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Tổng số đội
            </p>
            <p className="text-3xl font-extrabold text-gray-950 dark:text-white">
              {stats.total}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <span>+5 đội mới</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">so với tuần trước</span>
            </p>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <Activity size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Đang hoạt động
            </p>
            <p className="text-3xl font-extrabold text-gray-950 dark:text-white">
              {stats.active}
            </p>
            <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
              <span>{Math.round((stats.active / stats.total) * 1000) / 10}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
            </p>
          </div>
        </div>

        {/* Card 3: Đang làm nhiệm vụ */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Đang làm nhiệm vụ
            </p>
            <p className="text-3xl font-extrabold text-gray-950 dark:text-white">
              {stats.onDuty}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <span>{Math.round((stats.onDuty / stats.total) * 1000) / 10}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
            </p>
          </div>
        </div>

        {/* Card 4: Sẵn sàng */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
            <UserCheck size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Sẵn sàng
            </p>
            <p className="text-3xl font-extrabold text-gray-950 dark:text-white">
              {stats.ready}
            </p>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
              <span>{Math.round((stats.ready / stats.total) * 1000) / 10}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">tổng số đội</span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Map (Left) & Team List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
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
          <div className="relative flex-1 min-h-[360px] bg-sky-50/50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-150 dark:border-gray-700">
            {/* Map Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all" title="Lọc">
                <Filter size={16} />
              </button>
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all" title="Lớp bản đồ">
                <Layers size={16} />
              </button>
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all" title="Phóng to">
                <ZoomIn size={16} />
              </button>
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all" title="Thu nhỏ">
                <ZoomOut size={16} />
              </button>
              <button className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all" title="Định vị">
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
                const markerColors = {
                  ACTIVE: { fill: 'fill-green-500', stroke: 'stroke-green-500', bg: 'bg-green-500' },
                  ON_DUTY: { fill: 'fill-red-500', stroke: 'stroke-red-500', bg: 'bg-red-500' },
                  MOVING: { fill: 'fill-blue-500', stroke: 'stroke-blue-500', bg: 'bg-blue-500' },
                  OFF_DUTY: { fill: 'fill-slate-500', stroke: 'stroke-slate-500', bg: 'bg-slate-500' },
                };

                const colors = markerColors[marker.status];

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
                  className="absolute bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 max-w-[200px] z-20 pointer-events-auto"
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
                    marker.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                    marker.status === 'ON_DUTY' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  )}>
                    {marker.status === 'ACTIVE' ? 'Sẵn sàng' :
                     marker.status === 'ON_DUTY' ? 'Cứu hộ khẩn cấp' : 'Đang di chuyển'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Map bottom legend row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-150 dark:border-gray-700">
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
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
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
              <button 
                onClick={() => {
                  setStatusFilter('');
                  setTeamTypeFilter('');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Xem tất cả
              </button>
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Sẵn sàng</option>
              <option value="ON_DUTY">Đang làm nhiệm vụ</option>
              <option value="INACTIVE">Ngoại tuyến</option>
            </select>

            <select
              value={teamTypeFilter}
              onChange={(e) => setTeamTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className={cn(
                      'group relative bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 p-4 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-start justify-between gap-3',
                      team.isDb && 'border-l-4 border-l-blue-500'
                    )}
                  >
                    {/* Left: Avatar Logo & details */}
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all">
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
                          <Shield className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {team.name}
                          </h4>
                          <span className={cn(
                            'px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border',
                            typeStyle.bg
                          )}>
                            {teamTypeLabels[team.teamType] || team.teamType}
                          </span>
                          {team.isDb && (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                              Hệ thống
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                          {team.address}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users size={12} className="text-gray-400" />
                            {team.memberCount} thành viên
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase size={12} className="text-gray-400" />
                            {team.activeMissions} nhiệm vụ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge & Actions */}
                    <div className="flex flex-col items-end gap-3 justify-between h-full min-h-[56px] flex-shrink-0">
                      <span className={cn(
                        'px-2.5 py-1 text-[10px] font-extrabold rounded-xl border',
                        statusColor
                      )}>
                        {statusLabels[team.status] || team.status}
                      </span>

                      {/* Dropdown Menu actions */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === team.id ? null : team.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === team.id && (
                          <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl shadow-lg py-1.5 min-w-[120px] z-30">
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
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-750"
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Performance Metrics & Donut Chart */}
        <div className="xl:col-span-6 space-y-6">
          {/* Activity Metrics (30 days) */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
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
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-750 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Nhiệm vụ đã hoàn thành</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">156</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">+22% <span className="text-gray-400 font-normal">so với 30 ngày trước</span></p>
                </div>
              </div>

              {/* Box 2: Người được cứu */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-750 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Người đã cứu</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">1,248</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">+18% <span className="text-gray-400 font-normal">so với 30 ngày trước</span></p>
                </div>
              </div>

              {/* Box 3: Giờ hoạt động */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-750 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Giờ hoạt động</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">2,856</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">+15% <span className="text-gray-400 font-normal">so với 30 ngày trước</span></p>
                </div>
              </div>

              {/* Box 4: Thiết bị */}
              <div className="bg-slate-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-750 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Wrench size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">Thiết bị đã sử dụng</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">342</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold leading-none mt-0.5">+10% <span className="text-gray-400 font-normal">so với 30 ngày trước</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Classification Donut Chart */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Phân loại đội cứu hộ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              {/* Donut SVG Rendering */}
              <div className="relative flex justify-center">
                <svg width="180" height="180" viewBox="0 0 100 100">
                  {/* Concentric slices using strokeDasharray/strokeDashoffset */}
                  {/* Base Circle background */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="11" className="dark:stroke-gray-700" />
                  
                  {/* PCCC slice: 19.5% -> length = 49.0, offset = 0. color: Red */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Y tế slice: 14.1% -> length = 35.4, offset = -49.0. color: Green */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset="-49.0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Dân phòng slice: 25.0% -> length = 62.8, offset = -84.4. color: Blue */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset="-84.4"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Quân sự slice: 11.7% -> length = 29.4, offset = -147.2. color: Slate */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset="-147.2"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Tình nguyện slice: 21.9% -> length = 55.0, offset = -176.6. color: Purple */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset="-176.6"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Others/Misc slice: 7.8% -> length = 19.7, offset = -231.6. color: Gray */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#cbd5e1"
                    strokeWidth="11"
                    strokeDasharray="251.3"
                    strokeDashoffset="-231.6"
                    transform="rotate(-90 50 50)"
                    className="dark:stroke-gray-600"
                  />
                </svg>

                {/* Donut Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-extrabold text-gray-950 dark:text-white leading-none">128</span>
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
                  <span className="text-xs font-bold text-gray-900 dark:text-white">25 đội (19.5%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Y tế</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">18 đội (14.1%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Dân phòng</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">32 đội (25.0%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Quân sự</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">15 đội (11.7%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tình nguyện</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">28 đội (21.9%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recent Emergency Tasks */}
        <div className="xl:col-span-6 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Nhiệm vụ gần đây
            </h2>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Xem tất cả
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-4 flex-1">
            {/* Task item 1 */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-750 pb-3.5">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Compass size={18} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none block">CH-2024-0892</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    Sạt lở đất tại Hòa Bắc, Hòa Vang
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                    <span>Hòa Bắc, Hòa Vang</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Shield size={10} /> Đội Dân phòng Hòa Bắc
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">10 phút trước</span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  Đang thực hiện
                </span>
              </div>
            </div>

            {/* Task item 2 */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-750 pb-3.5">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                  <Activity size={18} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none block">CH-2024-0891</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    Cứu người mắc kẹt trong lũ
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                    <span>Phương Điện Dương, Điện Bàn</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Shield size={10} /> Đội PCCC Đà Nẵng 01
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">25 phút trước</span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  Đang thực hiện
                </span>
              </div>
            </div>

            {/* Task item 3 */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-750 pb-3.5">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                  <Heart size={18} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none block">CH-2024-0890</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    Hỗ trợ y tế cho người bị thương
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                    <span>Phường Hải Châu, Hải Châu</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Shield size={10} /> Đội Y tế Đà Nẵng 02
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">1 giờ trước</span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-green-50 text-green-700 border border-green-200 uppercase">
                  Hoàn thành
                </span>
              </div>
            </div>

            {/* Task item 4 */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-750 pb-3.5">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none block">CH-2024-0889</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    Cứu hộ thuyền bị lật
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                    <span>Cửa Đại, Hội An</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Shield size={10} /> Đội Tình nguyện Hội An
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">2 giờ trước</span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-green-50 text-green-700 border border-green-200 uppercase">
                  Hoàn thành
                </span>
              </div>
            </div>

            {/* Task item 5 */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                  <Shield size={18} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-none block">CH-2024-0888</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    Di dời dân khỏi vùng nguy hiểm
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                    <span>Phường Hòa Hiệp, Liên Chiểu</span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Shield size={10} /> Đội Quân sự Liên Chiểu
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">3 giờ trước</span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-green-50 text-green-700 border border-green-200 uppercase">
                  Hoàn thành
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
