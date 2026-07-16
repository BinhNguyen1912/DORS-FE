import { useEffect, useRef } from 'react';
import { Users, AlertTriangle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { dashboardApi } from '../../../apis/dashboard.api';

interface MapAndMissionsPanelProps {
  provinceId: number | null;
  startDate?: string;
  endDate?: string;
  adminUnitId?: number | null;
}

export default function MapAndMissionsPanel({ provinceId, startDate, endDate, adminUnitId }: MapAndMissionsPanelProps) {
  // Query dữ liệu bản đồ
  const { data: mapResponse, isLoading: isMapLoading } = useQuery({
    queryKey: ['dashboardMapTasks', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getMapTasks(provinceId, startDate, endDate, adminUnitId),
  });

  // Query dữ liệu stats cho phần thông tin nhanh
  const { data: statsResponse, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', provinceId, startDate, endDate, adminUnitId],
    queryFn: () => dashboardApi.getStats(provinceId, startDate, endDate, adminUnitId),
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const mapData = mapResponse?.data || { markers: [], missions: [] };
  const statsData = statsResponse?.data || {
    activeRescueTeams: { value: 0 },
    activeSosRequests: { value: 0 },
    ongoingDisasters: { value: 0 },
  };

  const markers = mapData.markers;
  const missions = mapData.missions;

  // Initialize and update Leaflet Map (runs when map container is rendered)
  useEffect(() => {
    if (!mapContainerRef.current || isMapLoading || isStatsLoading) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([10.7989, 106.6804], 11);

      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(mapRef.current);
      markersGroupRef.current = L.layerGroup().addTo(mapRef.current);
      
      // Forces Leaflet to recalibrate size once container mounts
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    } else {
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          mapRef.current?.removeLayer(layer);
        }
      });
      L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(mapRef.current);
      mapRef.current.invalidateSize();
    }
  }, [isMapLoading, isStatsLoading]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Update map markers dynamically
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    mapRef.current.invalidateSize();

    if (markers.length === 0) return;

    const latLngs: L.LatLng[] = [];

    markers.forEach((marker: any) => {
      if (!marker.lat || !marker.lng) return;

      const isTeam = marker.type === 'team';
      let htmlString = '';

      if (isTeam) {
        const isAvailable = marker.status === 'AVAILABLE';
        htmlString = isAvailable
          ? `<div class="relative w-3.5 h-3.5"><div class="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60"></div><div class="relative rounded-full w-3.5 h-3.5 bg-emerald-500 border-2 border-white shadow-md"></div></div>`
          : `<div class="relative w-3.5 h-3.5"><div class="relative rounded-full w-3.5 h-3.5 bg-blue-500 border-2 border-white shadow-md"></div></div>`;
      } else {
        const isCritical = marker.severity === 'CRITICAL';
        htmlString = isCritical
          ? `<div class="relative w-3.5 h-3.5"><div class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div><div class="relative rounded-full w-3.5 h-3.5 bg-red-500 border-2 border-white shadow-md animate-pulse"></div></div>`
          : `<div class="relative w-3.5 h-3.5"><div class="relative rounded-full w-3.5 h-3.5 bg-amber-500 border-2 border-white shadow-md"></div></div>`;
      }

      const customIcon = L.divIcon({
        html: htmlString,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon })
        .bindTooltip(`${marker.title} (${isTeam ? 'Đội cứu hộ' : 'SOS'})`, {
          direction: 'top',
          offset: [0, -5],
          opacity: 0.9,
          className: 'bg-gray-900 text-white border-0 text-[10px] font-bold px-2 py-1 rounded shadow-lg'
        });

      markersGroupRef.current?.addLayer(leafletMarker);
      latLngs.push(L.latLng(marker.lat, marker.lng));
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
    }
  }, [markers]);

  if (isMapLoading || isStatsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm animate-pulse h-80" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Bản đồ tình hình thiên tai và SOS (8 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Bản đồ tình hình thiên tai và SOS
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem bản đồ chi tiết →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch flex-1 pt-2">
          {/* Real Leaflet Map Container */}
          <div className="md:col-span-2 rounded-2xl relative overflow-hidden border border-slate-200/40 dark:border-gray-700/40 h-64 z-0 bg-[#e2e8f0]/40 dark:bg-gray-900/60 min-h-[240px] w-full">
            <div ref={mapContainerRef} className="w-full h-full animate-fade-in" />
          </div>

          {/* Legends and fast stats */}
          <div className="flex flex-col justify-between py-1 space-y-4 text-left items-start">
            <div className="space-y-3 text-left w-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Chú thích</p>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>SOS Nguy kịch (Critical)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>SOS Thường / Cần cứu hộ</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Đội cứu hộ Sẵn sàng (Available)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Đội cứu hộ Đang hoạt động</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-left w-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Thông tin nhanh</p>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-2.5 text-left">
                  <div className="p-1 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none text-left">
                      {statsData.ongoingDisasters.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 text-left">Khu vực thiên tai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-left">
                  <div className="p-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg shrink-0">
                    <Activity size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none text-left">
                      {statsData.activeSosRequests.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 text-left">SOS đang hoạt động</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-left">
                  <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg shrink-0">
                    <Users size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white leading-none text-left">
                      {statsData.activeRescueTeams.value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 text-left">Đội đang hoạt động</p>
                  </div>
                </div>
              </div>
            </div>
          </div>        </div>
      </div>

      {/* Nhiệm vụ đang thực hiện (4 cols) */}
      <div className="lg:col-span-4 bg-white dark:bg-gray-800 border border-slate-200/60 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-black dark:text-white">
            Nhiệm vụ đang thực hiện
          </h2>
          <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xem tất cả
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[220px]">
          {missions.map((mission: any, idx: number) => (
            <div key={idx} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center border border-slate-100 dark:border-gray-600 shrink-0 text-slate-500">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {mission.name}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400`}>
                    {mission.percent === 75 ? 'Đang cứu hộ' : 'Đang tiếp cận'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  {mission.team}
                </p>
                
                {/* Progress bar inside card */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-1.5 flex-1 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${mission.color} rounded-full`} style={{ width: `${mission.percent}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-gray-500 w-6 text-right">{mission.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
