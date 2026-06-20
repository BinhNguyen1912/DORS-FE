import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../lib/utils';
import { statusLabels } from '../../constants/rescueTeam.constants';

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

interface RescueTeamDashboardMapProps {
  filteredTeams: UnifiedRescueTeam[];
  defaultCenter: [number, number];
  teamTypeFilter: string;
  setTeamTypeFilter: (type: string) => void;
  onNavigateToDisaster: () => void;
  selectedTeamId?: number | null;
}

export default function RescueTeamDashboardMap({
  filteredTeams,
  defaultCenter,
  teamTypeFilter,
  setTeamTypeFilter,
  onNavigateToDisaster,
  selectedTeamId,
}: RescueTeamDashboardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<number, L.Marker>>(new Map());

  // Leaflet map initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [defaultCenter]);

  // Center/Zoom map when defaultCenter changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, 12);
    }
  }, [defaultCenter]);

  // Redraw markers on the map when filteredTeams changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const group = markersLayerRef.current;
    group.clearLayers();
    markersMapRef.current.clear();

    const getTeamIcon = (type: string, status: string) => {
      const isBusy = status === 'BUSY' || status === 'ON_DUTY';

      let baseColor = 'bg-sky-500';
      let iconClass = 'fa-solid fa-users';

      if (type === 'PCCC') {
        baseColor = 'bg-red-500';
        iconClass = 'fa-solid fa-fire-extinguisher';
      } else if (type === 'Y_TE') {
        baseColor = 'bg-green-500';
        iconClass = 'fa-solid fa-kit-medical';
      } else if (type === 'DAN_PHONG') {
        baseColor = 'bg-blue-600';
        iconClass = 'fa-solid fa-shield-halved';
      } else if (type === 'QUAN_SU') {
        baseColor = 'bg-slate-600';
        iconClass = 'fa-solid fa-person-military-rifle';
      } else if (type === 'TINH_NGUYEN') {
        baseColor = 'bg-purple-500';
        iconClass = 'fa-solid fa-handshake';
      } else if (type === 'TONG_HOP') {
        baseColor = 'bg-indigo-500';
        iconClass = 'fa-solid fa-circle-nodes';
      }

      const outerRing = isBusy ? 'border-2 border-red-500' : 'border border-white';
      return L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-7 h-7 ${baseColor} rounded-full opacity-25 animate-pulse"></div>
            <div class="w-6 h-6 ${baseColor} text-white rounded-full flex items-center justify-center shadow-md ${outerRing} text-[10px]">
              <i class="${iconClass}"></i>
            </div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    filteredTeams.forEach((team) => {
      const marker = L.marker([team.lat, team.lng], {
        icon: getTeamIcon(team.teamType, team.status),
      });

      const typeLabels: Record<string, string> = {
        PCCC: 'Đội PCCC & CNCH',
        Y_TE: 'Đội Y Tế Cấp Cứu',
        DAN_PHONG: 'Đội Dân Phòng Tự Quản',
        TONG_HOP: 'Đội Hỗ Trợ Tổng Hợp',
      };

      marker.bindPopup(
        `
        <div class="p-2 w-48 text-left font-sans text-xs">
          <h4 class="font-extrabold text-gray-800 mb-1">${team.name}</h4>
          <p class="text-gray-500 mb-0.5">${typeLabels[team.teamType] || team.teamType}</p>
          <p class="text-[11px] text-gray-500 mb-1.5">Liên hệ: ${team.leaderPhone}</p>
          <span class="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-gray-700 border border-slate-200">
            Trạng thái: ${statusLabels[team.status] || team.status}
          </span>
        </div>
      `,
        { className: 'custom-theme-popup' }
      );

      group.addLayer(marker);
      markersMapRef.current.set(team.id, marker);
    });
  }, [filteredTeams]);

  // Handle outside selection & positioning
  useEffect(() => {
    if (selectedTeamId && mapRef.current && markersMapRef.current.has(selectedTeamId)) {
      const marker = markersMapRef.current.get(selectedTeamId);
      if (marker) {
        const latLng = marker.getLatLng();
        mapRef.current.setView(latLng, 15);
        marker.openPopup();
      }
    }
  }, [selectedTeamId]);

  return (
    <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
          Vị trí đội cứu hộ (Real-time)
        </h2>
        <button
          onClick={onNavigateToDisaster}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Xem toàn bản đồ &gt;
        </button>
      </div>

      {/* Quick Filter buttons below title */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(['', 'PCCC', 'Y_TE', 'DAN_PHONG', 'TINH_NGUYEN'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setTeamTypeFilter(type)}
            className={cn(
              'px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer bg-transparent',
              teamTypeFilter === type
                ? 'text-slate-900 border-slate-900 dark:text-white dark:border-white font-extrabold'
                : 'text-gray-400 border-slate-200 dark:border-gray-750 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-gray-300'
            )}
          >
            {type === '' ? 'Tất cả' : type === 'Y_TE' ? 'Y Tế' : type === 'TINH_NGUYEN' ? 'Tình nguyện' : type}
          </button>
        ))}
      </div>

      {/* Real Leaflet Map Container */}
      <div className="relative flex-1 min-h-[360px] rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700 z-10 mb-2">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '360px' }} />

        {/* Map Controls overlaid on Leaflet */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
          <button
            type="button"
            className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all cursor-pointer"
            title="Phóng to"
            onClick={() => mapRef.current?.zoomIn()}
          >
            <i className="fa-solid fa-plus text-[16px]"></i>
          </button>
          <button
            type="button"
            className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all cursor-pointer"
            title="Thu nhỏ"
            onClick={() => mapRef.current?.zoomOut()}
          >
            <i className="fa-solid fa-minus text-[16px]"></i>
          </button>
          <button
            type="button"
            className="p-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm border border-slate-100 dark:border-gray-700 transition-all cursor-pointer"
            title="Định vị"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView(defaultCenter, 12);
              }
            }}
          >
            <i className="fa-solid fa-location-crosshairs text-[16px]"></i>
          </button>
        </div>
      </div>

      {/* Map bottom legend row */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <span className="text-[10px] font-bold text-gray-650 dark:text-gray-400">PCCC & CNCH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <span className="text-[10px] font-bold text-gray-650 dark:text-gray-400">Y Tế Cấp Cứu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
          <span className="text-[10px] font-bold text-gray-650 dark:text-gray-400">Dân Phòng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
          <span className="text-[10px] font-bold text-gray-650 dark:text-gray-400">Tình Nguyện</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
          <span className="text-[10px] font-bold text-gray-650 dark:text-gray-400">Khác</span>
        </div>
        <div className="h-3 w-px bg-slate-200 dark:bg-gray-700 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-white dark:bg-gray-800" />
          <span className="text-[10px] font-bold text-gray-650 dark:text-gray-400">Đang làm nhiệm vụ</span>
        </div>
      </div>
    </div>
  );
}
