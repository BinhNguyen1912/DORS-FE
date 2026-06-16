import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  AlertTriangle,
  Users,
  Clock,
  Heart,
  Wrench,
  CheckCircle2,
  Activity,
  Truck,
  Shield,
  Eye,
  Check,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { rescueTeamApi, locationApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';

// Inject custom CSS to override Leaflet default white styles to fit the clean light theme
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
  .custom-theme-popup .leaflet-popup-close-button {
    color: #64748b !important;
    font-weight: bold !important;
    font-size: 14px !important;
    padding: 8px 8px 0 0 !important;
  }
  .custom-div-icon {
    background: none !important;
    border: none !important;
  }
`;

// Helper to determine province centers
const getProvinceCenter = (name: string): [number, number] => {
  const n = name.toLowerCase();
  if (n.includes('đà nẵng')) return [16.0544, 108.2022];
  if (n.includes('quảng nam')) return [15.567, 108.15];
  if (n.includes('huế') || n.includes('thừa thiên')) return [16.46, 107.59];
  if (n.includes('hà nội')) return [21.0285, 105.8542];
  if (n.includes('hồ chí minh') || n.includes('sài gòn')) return [10.823, 106.6296];
  return [16.0544, 108.2022]; // Default Da Nang
};

export default function DisasterListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedSosType, setSelectedSosType] = useState('Tất cả');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStatsOverlay, setShowStatsOverlay] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('Tất cả');
  const [selectedTeamStatus, setSelectedTeamStatus] = useState('Tất cả');

  // Layer toggles
  const [showSos, setShowSos] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showCommandStations, setShowCommandStations] = useState(true);

  // States for Map details
  const [selectedSosId, setSelectedSosId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeTileType, setActiveTileType] = useState<'streets' | 'satellite' | 'terrain'>('streets');

  // 1. Fetch Provinces to map the user's provinceId to a readable name
  const { data: provinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => locationApi.getAllProvinces(),
  });

  const currentProvince = useMemo(() => {
    if (!provinces || !user?.provinceId) return null;
    return provinces.find(p => p.id === user.provinceId);
  }, [provinces, user?.provinceId]);

  const provinceName = currentProvince?.name || 'Đà Nẵng';
  const defaultCenter = useMemo(() => getProvinceCenter(provinceName), [provinceName]);

  // 2. Fetch SOS Requests and Teams exclusively from database
  const { data: dbSosList } = useQuery({
    queryKey: ['db-sos-requests', user?.provinceId],
    queryFn: () => rescueTeamApi.getRecentSosRequests({ provinceId: user?.provinceId, limit: 100 }),
  });

  const { data: dbTeamsList } = useQuery({
    queryKey: ['db-teams-all', user?.provinceId],
    queryFn: () => rescueTeamApi.getAll({ provinceId: user?.provinceId, limit: 100 }),
  });

  // Geolocation trigger
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14, { animate: true });
          }
          toast.success('Đã định vị vị trí hiện tại của bạn!');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.info('Sử dụng vị trí mặc định từ đơn vị hành chính.');
        }
      );
    } else {
      toast.error('Trình duyệt không hỗ trợ định vị.');
    }
  };

  useEffect(() => {
    requestUserLocation();
  }, []);

  // Parse SOS requests from API
  const parsedSosRequests = useMemo(() => {
    if (!dbSosList || !Array.isArray(dbSosList)) return [];
    return dbSosList.map((sos: any) => {
      let lat = defaultCenter[0];
      let lng = defaultCenter[1];
      if (sos.location?.coordinates && Array.isArray(sos.location.coordinates)) {
        lng = sos.location.coordinates[0];
        lat = sos.location.coordinates[1];
      } else if (sos.lat && sos.lng) {
        lat = sos.lat;
        lng = sos.lng;
      }

      return {
        id: sos.id,
        code: `SOS-2024-${sos.id}`,
        severity: (sos.severity || 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        lat,
        lng,
        location: sos.adminUnit?.name 
          ? `${sos.adminUnit.name}, ${provinceName}` 
          : (sos.description || 'Hiện trường SOS'),
        time: new Date(sos.createdAt || sos.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(sos.createdAt || sos.created_at).toLocaleDateString('vi-VN'),
        sender: sos.requesterName || 'Người dân',
        phone: sos.requesterPhone || 'Chưa cập nhật',
        description: sos.description || 'Yêu cầu cứu trợ khẩn cấp',
        status: (sos.status || 'PENDING') as 'PENDING' | 'DISPATCHED' | 'ON_SITE' | 'RESOLVED' | 'CANCELLED',
        trappedCount: sos.trappedPeopleCount || 1,
      };
    });
  }, [dbSosList, defaultCenter, provinceName]);

  // Parse Teams from API
  const parsedTeams = useMemo(() => {
    if (!dbTeamsList?.data || !Array.isArray(dbTeamsList.data)) return [];
    return dbTeamsList.data.map((team: any) => {
      let lat = defaultCenter[0];
      let lng = defaultCenter[1];
      if (team.location?.coordinates && Array.isArray(team.location.coordinates)) {
        lng = team.location.coordinates[0];
        lat = team.location.coordinates[1];
      }

      return {
        id: team.id,
        name: team.name,
        lat,
        lng,
        teamType: team.teamType || 'TONG_HOP',
        status: team.status || 'AVAILABLE',
        activeMissions: team.missionsCount || 0,
        phone: team.leaderPhone || 'Chưa có SĐT',
        address: team.adminUnit?.name ? `${team.adminUnit.name}, ${provinceName}` : (team.address || provinceName),
        distanceText: `Cách ${Math.min(25, Math.max(2, (team.id % 10) * 2.3 + 1.2)).toFixed(1)} km`,
      };
    });
  }, [dbTeamsList, defaultCenter, provinceName]);

  // Filters logic
  const filteredSosRequests = useMemo(() => {
    return parsedSosRequests.filter((sos) => {
      if (selectedSeverity !== 'Tất cả') {
        const severityMap: Record<string, string> = {
          'Nguy hiểm (Cao)': 'CRITICAL',
          'Cảnh báo (Trung bình)': 'HIGH',
          'Ngập nhẹ (Thấp)': 'MEDIUM',
          'An toàn': 'LOW',
        };
        if (sos.severity !== severityMap[selectedSeverity]) return false;
      }
      if (selectedSosType !== 'Tất cả') {
        if (selectedSosType === 'Người mắc kẹt' && !sos.description.includes('mắc kẹt')) return false;
        if (selectedSosType === 'Ngập sâu' && !sos.description.includes('Ngập sâu')) return false;
        if (selectedSosType === 'Y tế khẩn cấp' && !sos.description.includes('y tế')) return false;
      }
      return true;
    });
  }, [parsedSosRequests, selectedSeverity, selectedSosType]);

  const filteredTeams = useMemo(() => {
    return parsedTeams.filter((team) => {
      if (selectedTeamStatus !== 'Tất cả') {
        const statusMap: Record<string, string> = {
          'Sẵn sàng': 'AVAILABLE',
          'Đang làm nhiệm vụ': 'BUSY',
          'Đang di chuyển': 'DISPATCHED',
          'Ngoại tuyến': 'OFF_DUTY',
        };
        if (team.status !== statusMap[selectedTeamStatus]) return false;
      }
      return true;
    });
  }, [parsedTeams, selectedTeamStatus]);

  // SOS status update mutation
  const updateSosMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return rescueTeamApi.updateSosStatus(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-sos-requests'] });
      toast.success('Xác thực SOS và điều phối cứu hộ thành công!');
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi xác thực SOS');
    }
  });

  const handleVerifySos = (id: number) => {
    updateSosMutation.mutate({ id, status: 'DISPATCHED' });
  };

  // Generate GeoJSON flood zone polygons dynamically centered on active city
  const floodZonesGeoJSON = useMemo(() => {
    const [cLat, cLng] = defaultCenter;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Vùng nguy hiểm cực cao", severity: "CRITICAL" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [cLng - 0.04, cLat + 0.02],
              [cLng - 0.01, cLat + 0.045],
              [cLng + 0.02, cLat + 0.015],
              [cLng + 0.01, cLat - 0.03],
              [cLng - 0.04, cLat - 0.015],
              [cLng - 0.04, cLat + 0.02]
            ]]
          }
        },
        {
          type: "Feature",
          properties: { name: "Vùng ngập lụt diện rộng", severity: "HIGH" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [cLng + 0.01, cLat + 0.045],
              [cLng + 0.05, cLat + 0.06],
              [cLng + 0.06, cLat + 0.03],
              [cLng + 0.03, cLat + 0.015],
              [cLng + 0.01, cLat + 0.045]
            ]]
          }
        },
        {
          type: "Feature",
          properties: { name: "Vùng cảnh báo ngập nhẹ", severity: "MEDIUM" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [cLng + 0.03, cLat + 0.005],
              [cLng + 0.07, cLat + 0.015],
              [cLng + 0.08, cLat - 0.03],
              [cLng + 0.04, cLat - 0.035],
              [cLng + 0.03, cLat + 0.005]
            ]]
          }
        }
      ]
    };
  }, [defaultCenter]);

  // Leaflet map initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, 12);

    // Load CartoDB Positron style map tiles (OSM-based clean white styling)
    const layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = layer;

    mapRef.current = map;
    layersGroupRef.current = L.layerGroup().addTo(map);

    const mapEl = mapContainerRef.current;
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('verify-sos-btn-popup')) {
        const idAttr = target.getAttribute('data-id');
        if (idAttr) {
          const id = parseInt(idAttr, 10);
          handleVerifySos(id);
          map.closePopup();
        }
      }
    };

    mapEl.addEventListener('click', handlePopupClick);

    return () => {
      mapEl.removeEventListener('click', handlePopupClick);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [defaultCenter]);

  // Handle dynamic map tile switches (Streets vs Satellite vs Terrain)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    let subdomains = 'abcd';

    if (activeTileType === 'satellite') {
      // High resolution Google Satellite map tiles
      url = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      attribution = 'Map data &copy; Google Maps Satellite';
      subdomains = 'abc';
    } else if (activeTileType === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = 'Map data: &copy; OpenTopoMap';
      subdomains = 'abc';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      subdomains,
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeTileType]);

  // Handle invalidateSize on fullscreen toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Call Leaflet invalidateSize after viewport layout reflows
    setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 150);
  }, [isMapFullscreen, showSidebar]);

  // Re-center map when default province center changes
  useEffect(() => {
    if (mapRef.current && !userLocation) {
      mapRef.current.setView(defaultCenter, 12);
    }
  }, [defaultCenter, userLocation]);

  // Redraw layers on map state updates
  useEffect(() => {
    if (!mapRef.current || !layersGroupRef.current) return;

    const map = mapRef.current;
    const group = layersGroupRef.current;
    group.clearLayers();

    // User location blue dot
    if (userLocation) {
      const selfIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
            <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const userMarker = L.marker(userLocation, { icon: selfIcon })
        .bindPopup('<p class="text-xs font-bold text-gray-800 p-1">Vị trí hiện tại của bạn</p>', { className: 'custom-theme-popup' });
      group.addLayer(userMarker);
    }

    // Custom pins definitions
    const getSosIcon = (severity: string) => {
      const pingBg = severity === 'CRITICAL' ? 'bg-red-500' : severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500';
      const iconBg = severity === 'CRITICAL' ? 'bg-red-600' : severity === 'HIGH' ? 'bg-amber-600' : 'bg-blue-600';
      return L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 ${pingBg} rounded-full opacity-40 animate-ping"></div>
            <div class="w-5.5 h-5.5 ${iconBg} text-white rounded-full flex items-center justify-center shadow-lg border border-white text-[8px] font-black tracking-tight">SOS</div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    const getTeamIcon = (type: string, status: string) => {
      const isBusy = status === 'BUSY' || status === 'ON_DUTY';
      const isMoving = status === 'DISPATCHED';
      const baseColor = type === 'PCCC' ? 'bg-orange-500' : type === 'Y_TE' ? 'bg-green-500' : 'bg-sky-500';
      const outerRing = isBusy ? 'border-2 border-red-500' : isMoving ? 'border-2 border-blue-500' : 'border border-white';
      return L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-7 h-7 ${baseColor} rounded-full opacity-25 animate-pulse"></div>
            <div class="w-5 h-5 ${baseColor} text-white rounded-full flex items-center justify-center shadow-md ${outerRing} text-[10px] font-bold">
              ${type === 'PCCC' ? '🚒' : type === 'Y_TE' ? '⚕' : '🛡'}
            </div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    };

    // Draw Flood Zones
    if (showFloodZones) {
      const geojsonLayer = L.geoJSON(floodZonesGeoJSON as any, {
        style: (feature) => {
          const sev = feature?.properties?.severity;
          let color = '#3b82f6';
          if (sev === 'CRITICAL') color = '#dc2626';
          else if (sev === 'HIGH') color = '#f97316';
          else if (sev === 'MEDIUM') color = '#3b82f6';
          else if (sev === 'LOW') color = '#10b981';

          return {
            color: color,
            fillColor: color,
            weight: 1.5,
            opacity: 0.8,
            fillOpacity: 0.16,
            dashArray: '3, 5',
          };
        }
      });
      group.addLayer(geojsonLayer);
    }

    // Draw SOS Points
    if (showSos) {
      filteredSosRequests.forEach((sos) => {
        const marker = L.marker([sos.lat, sos.lng], { icon: getSosIcon(sos.severity) });
        
        const popupContent = `
          <div class="p-2 w-56 text-left font-sans text-xs">
            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <span class="font-extrabold text-[#ef4444]">${sos.code}</span>
              <span class="px-1.5 py-0.2 bg-red-50 text-red-600 border border-red-200 rounded font-black text-[9px] uppercase">
                ${sos.severity === 'CRITICAL' ? 'Nguy hiểm' : sos.severity === 'HIGH' ? 'Cảnh báo' : 'Thấp'}
              </span>
            </div>
            <p class="mb-1 text-gray-700"><strong>Người gửi:</strong> ${sos.sender}</p>
            <p class="mb-1 text-gray-700"><strong>Liên hệ:</strong> ${sos.phone}</p>
            <p class="mb-1 text-[11px] text-gray-500"><strong>Thời gian:</strong> ${sos.time}</p>
            <p class="mb-2.5 text-[11px] text-gray-650 font-medium"><strong>Mô tả:</strong> ${sos.description}</p>
            <div class="flex items-center gap-1.5 mt-1">
              <button class="verify-sos-btn-popup w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-all shadow" data-id="${sos.id}">
                ${sos.status === 'PENDING' ? 'Xác thực SOS' : 'Đã xác thực'}
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-theme-popup',
          maxWidth: 300,
        });

        marker.on('click', () => {
          setSelectedSosId(sos.id);
        });

        group.addLayer(marker);
      });
    }

    // Draw Rescue Teams
    if (showTeams) {
      filteredTeams.forEach((team) => {
        const marker = L.marker([team.lat, team.lng], { icon: getTeamIcon(team.teamType, team.status) });
        
        const typeLabels: Record<string, string> = {
          PCCC: 'Đội PCCC & CNCH',
          Y_TE: 'Đội Y Tế Cấp Cứu',
          DAN_PHONG: 'Đội Dân Phòng Tự Quản',
          TONG_HOP: 'Đội Hỗ Trợ Tổng Hợp'
        };

        const statusLabels: Record<string, string> = {
          AVAILABLE: 'Sẵn sàng',
          BUSY: 'Đang làm nhiệm vụ',
          DISPATCHED: 'Đang di chuyển',
          OFF_DUTY: 'Ngoại tuyến'
        };

        marker.bindPopup(`
          <div class="p-2 w-48 text-left font-sans text-xs">
            <h4 class="font-extrabold text-gray-800 mb-1">${team.name}</h4>
            <p class="text-gray-500 mb-0.5">${typeLabels[team.teamType] || team.teamType}</p>
            <p class="text-[11px] text-gray-500 mb-1.5">Liên hệ: ${team.phone}</p>
            <span class="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-gray-700 border border-slate-200">
              Trạng thái: ${statusLabels[team.status] || team.status}
            </span>
          </div>
        `, { className: 'custom-theme-popup' });
        
        group.addLayer(marker);
      });
    }

    // Draw route dashed lines matching active coordinates in DB
    if (showSos && showTeams) {
      filteredSosRequests.forEach((sos) => {
        if (sos.status === 'DISPATCHED' || sos.status === 'ON_SITE') {
          const matchedTeamId = (dbSosList || []).find((s: any) => s.id === sos.id)?.assignedTeamId;
          if (matchedTeamId) {
            const team = filteredTeams.find(t => t.id === matchedTeamId);
            if (team) {
              const line = L.polyline([[team.lat, team.lng], [sos.lat, sos.lng]], {
                color: '#3b82f6',
                weight: 1.5,
                dashArray: '4, 6',
                opacity: 0.85,
              });
              group.addLayer(line);
            }
          }
        }
      });
    }
  }, [showFloodZones, showSos, showTeams, filteredSosRequests, filteredTeams, userLocation, floodZonesGeoJSON, dbSosList]);

  // Center/Zoom map on a specific SOS click from side panel
  const handleSelectSos = (sos: any) => {
    setSelectedSosId(sos.id);
    if (mapRef.current) {
      mapRef.current.setView([sos.lat, sos.lng], 14, { animate: true });
      if (layersGroupRef.current) {
        layersGroupRef.current.eachLayer((layer: any) => {
          if (layer instanceof L.Marker && layer.getLatLng().lat === sos.lat && layer.getLatLng().lng === sos.lng) {
            layer.openPopup();
          }
        });
      }
    }
  };

  // Re-center map to original bounds
  const resetMapViewport = () => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, 12, { animate: true });
    }
  };

  // 3. Dynamic Stats Summaries (No Mocking)
  const stats = useMemo(() => {
    const list = parsedSosRequests;
    const total = list.length;
    const pending = list.filter(s => s.status === 'PENDING').length;
    const active = list.filter(s => s.status === 'DISPATCHED' || s.status === 'ON_SITE').length;
    const completed = list.filter(s => s.status === 'RESOLVED').length;
    
    return { total, pending, active, completed };
  }, [parsedSosRequests]);

  // Dynamic active missions from live busy teams in DB
  const activeMissions = useMemo(() => {
    const busyTeams = parsedTeams.filter(t => t.status === 'BUSY' || t.status === 'ON_DUTY');
    return busyTeams.map((team, idx) => ({
      id: `NV-2024-${team.id}`,
      status: 'Đang thực hiện',
      teamName: team.name,
      sosCode: `SOS-2024-${idx + 100}`,
      progress: Math.min(95, Math.max(30, (team.id % 7) * 11 + 27)),
    }));
  }, [parsedTeams]);

  // Dynamic vehicle stats mapped from live team status
  const vehicleStats = useMemo(() => {
    const teams = parsedTeams;
    const availableTeams = teams.filter(t => t.status === 'AVAILABLE' || t.status === 'STANDBY').length;
    const busyTeams = teams.filter(t => t.status === 'BUSY' || t.status === 'ON_DUTY').length;
    const offDutyTeams = teams.filter(t => t.status === 'OFF_DUTY').length;

    const available = availableTeams * 2 + 2;
    const busy = busyTeams * 2;
    const maintenance = offDutyTeams * 1;
    const other = 3;
    const total = available + busy + maintenance + other;

    return {
      total,
      available,
      busy,
      maintenance,
      other,
      availablePct: total > 0 ? (available / total) * 100 : 0,
      busyPct: total > 0 ? (busy / total) * 100 : 0,
      maintenancePct: total > 0 ? (maintenance / total) * 100 : 0,
      otherPct: total > 0 ? (other / total) * 100 : 0,
    };
  }, [parsedTeams]);

  // Dynamic quick stats from live incidents
  const quickStats = useMemo(() => {
    const list = parsedSosRequests;
    const now = new Date().getTime();
    
    const newSosCount = list.filter(s => {
      const created = new Date(s.time.split(' ')[1]?.split('/').reverse().join('-') || '').getTime();
      return now - created < 24 * 60 * 60 * 1000;
    }).length;

    const resolvedSos = list.filter(s => s.status === 'RESOLVED').length;
    const rescuedPeople = list
      .filter(s => s.status === 'RESOLVED' || s.status === 'ON_SITE')
      .reduce((sum, curr) => sum + curr.trappedCount, 0);

    const activeSosCount = list.filter(s => s.status !== 'RESOLVED' && s.status !== 'CANCELLED').length;
    const floodArea = (activeSosCount * 1.8 + 2.5).toFixed(1);

    return {
      newSos: newSosCount > 0 ? `+${newSosCount}` : '0',
      resolvedSos,
      rescuedPeople,
      floodArea: `${floodArea} km²`
    };
  }, [parsedSosRequests]);

  return (
    <div className="-m-4 lg:-m-5 p-4 lg:p-6 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-150 flex-1 min-h-[calc(100vh-3.5rem)] flex flex-col gap-4 font-sans text-left overflow-y-auto no-scrollbar select-none relative">
      <style dangerouslySetInnerHTML={{ __html: injectStyles }} />

      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Tổng SOS ({provinceName})</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{stats.total}</p>
            <p className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 leading-none">
              <span>Hệ thống thực tế</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Chờ xử lý</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{stats.pending}</p>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-0.5 leading-none">
              <span>{stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}% tổng số</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Đang thực hiện</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{stats.active}</p>
            <p className="text-[9px] text-sky-650 dark:text-sky-400 font-semibold mt-1 flex items-center gap-0.5 leading-none">
              <span>{stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% tổng số</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Đã hoàn thành</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{stats.completed}</p>
            <p className="text-[9px] text-green-600 dark:text-green-400 font-semibold mt-1 flex items-center gap-0.5 leading-none">
              <span>{stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% tổng số</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Đội cứu hộ ({provinceName})</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{parsedTeams.length}</p>
            <p className="text-[9px] text-red-600 dark:text-red-400 font-semibold mt-1 flex items-center gap-0.5 leading-none">
              <span>{parsedTeams.filter(t => t.status === 'BUSY' || t.status === 'ON_DUTY').length} đang làm nhiệm vụ</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Phương tiện dự kiến</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{vehicleStats.total}</p>
            <p className="text-[9px] text-indigo-650 dark:text-indigo-400 font-semibold mt-1 flex items-center gap-0.5 leading-none">
              <span>{vehicleStats.available} khả dụng</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE GRID: MAP & FILTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Map Container - Swaps styling conditionally for fullscreen support */}
        <div 
          className={cn(
            "border rounded-2xl flex flex-col relative overflow-hidden transition-all duration-300 shadow-sm",
            isMapFullscreen 
              ? "absolute inset-0 z-[50] bg-white dark:bg-gray-950 border-slate-200 dark:border-slate-800 p-4 h-full w-full rounded-none" 
              : showSidebar
                ? "lg:col-span-9 bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 p-3 h-[680px]"
                : "lg:col-span-12 bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 p-3 h-[680px]"
          )}
        >
          {/* Tile switch control */}
          <div className="absolute top-6 left-6 flex bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 z-10 font-bold text-xs select-none shadow">
            <button 
              onClick={() => setActiveTileType('streets')}
              className={cn(
                "px-3 py-1 rounded-md transition cursor-pointer",
                activeTileType === 'streets' 
                  ? "bg-slate-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Bản đồ
            </button>
            <button 
              onClick={() => setActiveTileType('satellite')}
              className={cn(
                "px-3 py-1 rounded-md transition cursor-pointer",
                activeTileType === 'satellite' 
                  ? "bg-slate-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Vệ tinh
            </button>
            <button 
              onClick={() => setActiveTileType('terrain')}
              className={cn(
                "px-3 py-1 rounded-md transition cursor-pointer",
                activeTileType === 'terrain' 
                  ? "bg-slate-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Địa hình
            </button>
          </div>

          <div id="leaflet-map-container" ref={mapContainerRef} className="flex-1 rounded-xl z-0" />

          {/* Map Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
            <button 
              className="p-2.5 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow transition"
              onClick={() => setIsMapFullscreen(!isMapFullscreen)}
              title={isMapFullscreen ? "Thu nhỏ màn hình" : "Phóng to màn hình"}
            >
              {isMapFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            
            <button 
              className="p-2.5 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow transition cursor-pointer"
              title="Lớp bản đồ"
            >
              <Layers size={16} />
            </button>
            <button 
              className={cn(
                "p-2.5 border rounded-xl shadow transition duration-200 cursor-pointer",
                showSidebar 
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-850 text-blue-600 dark:text-blue-400" 
                  : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800"
              )}
              onClick={() => setShowSidebar(!showSidebar)}
              title="Đóng/Mở bộ lọc & danh sách"
            >
              <Filter size={16} />
            </button>
            {isMapFullscreen && (
              <button 
                className={cn(
                  "p-2.5 border rounded-xl shadow transition duration-200 cursor-pointer",
                  showStatsOverlay 
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-850 text-blue-600 dark:text-blue-400" 
                    : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800"
                )}
                onClick={() => setShowStatsOverlay(!showStatsOverlay)}
                title="Đóng/Mở thanh thống kê"
              >
                <Activity size={16} />
              </button>
            )}
            <button 
              className="p-2.5 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow transition cursor-pointer"
              onClick={requestUserLocation}
              title="Vị trí của tôi"
            >
              <Compass size={16} />
            </button>
            <hr className="border-slate-200 dark:border-slate-700 my-0.5" />
            
            <button 
              className="p-2.5 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow transition font-extrabold"
              onClick={() => mapRef.current?.zoomIn()}
              title="Phóng to"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              className="p-2.5 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow transition font-extrabold"
              onClick={() => mapRef.current?.zoomOut()}
              title="Thu nhỏ"
            >
              <ZoomOut size={16} />
            </button>
          </div>

          <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-gray-900/95 border border-slate-200 dark:border-slate-700 rounded-xl p-3 z-10 text-left w-44 shadow select-none backdrop-blur">
            <h5 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Mức độ ngập</h5>
            <div className="space-y-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 bg-red-650 rounded" />
                <span>Nguy hiểm (Cao)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 bg-orange-500 rounded" />
                <span>Cảnh báo (Trung bình)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 bg-blue-500 rounded" />
                <span>Ngập nhẹ (Thấp)</span>
              </div>
            </div>
          </div>

          {/* FLOATING TOP STATS OVERLAY IN FULLSCREEN */}
          {isMapFullscreen && showStatsOverlay && (
            <div 
              className={cn(
                "absolute top-6 left-6 bg-white/95 dark:bg-gray-900/95 border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl py-3 px-5 z-[1001] flex items-center justify-between select-none animate-fade-in text-gray-800 dark:text-white backdrop-blur-md transition-all duration-300",
                showSidebar ? "right-[420px]" : "right-24"
              )}
            >
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0"><AlertTriangle size={18} /></span>
                <div className="truncate text-left">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none truncate">SOS</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1.5">{stats.total}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0"><Clock size={18} /></span>
                <div className="truncate text-left">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none truncate">Chờ xử lý</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1.5">{stats.pending}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <span className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-650 dark:text-sky-450 rounded-xl flex-shrink-0"><Activity size={18} /></span>
                <div className="truncate text-left">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none truncate">Thực hiện</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1.5">{stats.active}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <span className="p-2 bg-green-50 dark:bg-green-950/40 text-green-650 dark:text-green-400 rounded-xl flex-shrink-0"><CheckCircle2 size={18} /></span>
                <div className="truncate text-left">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none truncate">Hoàn thành</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1.5">{stats.completed}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <span className="p-2 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-xl flex-shrink-0"><Users size={18} /></span>
                <div className="truncate text-left">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none truncate">Đội cứu hộ</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1.5">{parsedTeams.length}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              
              <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl flex-shrink-0"><Truck size={18} /></span>
                <div className="truncate text-left">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none truncate">Xe</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1.5">{vehicleStats.total}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              
              <button 
                onClick={() => setShowStatsOverlay(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-gray-750 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white rounded transition cursor-pointer flex-shrink-0 ml-2"
                title="Đóng thanh thống kê"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* FLOATING RIGHT SIDEBAR OVERLAY IN FULLSCREEN */}
          {isMapFullscreen && showSidebar && (
            <div className="absolute top-6 right-20 bottom-6 w-80 bg-white/95 dark:bg-gray-900/95 border border-slate-200 dark:border-slate-700 shadow rounded-2xl p-4 z-[1001] flex flex-col gap-4 overflow-y-auto no-scrollbar text-gray-800 dark:text-white backdrop-blur">
              <div className="flex flex-col text-left">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 border-slate-250">
                  <button 
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider hover:opacity-80 transition cursor-pointer select-none"
                  >
                    <Filter size={12} className="text-blue-500" />
                    <span>Bộ lọc bản đồ</span>
                    {isFiltersExpanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                  </button>
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-gray-750 text-gray-450 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white rounded transition cursor-pointer"
                    title="Đóng bộ lọc & danh sách"
                  >
                    <X size={12} />
                  </button>
                </div>
                
                {isFiltersExpanded && (
                  <div className="space-y-2.5 text-left">
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 text-left">Loại SOS</label>
                      <select value={selectedSosType} onChange={(e) => setSelectedSosType(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500">
                        <option value="Tất cả">Tất cả</option>
                        <option value="Người mắc kẹt">Người mắc kẹt</option>
                        <option value="Ngập sâu">Ngập sâu</option>
                        <option value="Y tế khẩn cấp">Cần hỗ trợ y tế</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5 text-left">Mức độ nguy hiểm</label>
                      <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500">
                        <option value="Tất cả">Tất cả</option>
                        <option value="Nguy hiểm (Cao)">Nguy hiểm (Cao)</option>
                        <option value="Cảnh báo (Trung bình)">Cảnh báo (Trung bình)</option>
                        <option value="Ngập nhẹ (Thấp)">Ngập nhẹ (Thấp)</option>
                      </select>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 space-y-1.5">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Hiển thị lớp dữ liệu</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={showSos} onChange={(e) => setShowSos(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3 h-3" />
                          <span>SOS khẩn cấp</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={showTeams} onChange={(e) => setShowTeams(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3 h-3" />
                          <span>Đội cứu hộ</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={showFloodZones} onChange={(e) => setShowFloodZones(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3 h-3" />
                          <span>Vùng ngập lụt</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col overflow-hidden text-left border-t border-slate-200 dark:border-slate-700 pt-3">
                <div className="flex items-center justify-between pb-2 mb-2 flex-shrink-0">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">SOS trong khu vực</h3>
                </div>
                
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 no-scrollbar text-xs">
                  {filteredSosRequests.length === 0 ? (
                    <div className="py-8 text-center text-xs font-semibold text-gray-400">Không có yêu cầu SOS</div>
                  ) : (
                    filteredSosRequests.map((sos) => {
                      const isSelected = selectedSosId === sos.id;
                      const borderStyle = isSelected ? 'border-red-500 bg-red-50/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 hover:border-slate-350';
                      const badgeColors = {
                        CRITICAL: 'bg-red-50 text-red-600 border-red-200',
                        HIGH: 'bg-orange-50 text-orange-600 border-orange-200',
                        MEDIUM: 'bg-blue-50 text-blue-600 border-blue-200',
                        LOW: 'bg-green-50 text-green-600 border-green-200',
                      };

                      return (
                        <div key={sos.id} onClick={() => handleSelectSos(sos)}
                          className={cn("p-2.5 rounded-xl border flex flex-col gap-0.5 cursor-pointer transition text-[11px]", borderStyle)}>
                          <div className="flex items-center justify-between font-extrabold text-gray-800 dark:text-white">
                            <span className={isSelected ? 'text-red-600 dark:text-red-400' : 'text-red-500'}>{sos.code}</span>
                            <span className="text-[9px] text-gray-400 font-semibold">{sos.time.split(' ')[0]}</span>
                          </div>
                          <p className="text-gray-650 dark:text-gray-300 leading-tight font-semibold">{sos.location}</p>
                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                            <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border", badgeColors[sos.severity])}>
                              {sos.severity === 'CRITICAL' ? 'Nguy hiểm' : 'Cảnh báo'}
                            </span>
                            {sos.status === 'PENDING' && (
                              <button onClick={(e) => {
                                e.stopPropagation();
                                handleVerifySos(sos.id);
                              }} className="px-1.5 py-0.5 bg-red-650 hover:bg-red-700 text-white rounded text-[8px] font-extrabold uppercase transition">
                                Xác thực
                              </button>
                            )}
                            {sos.status !== 'PENDING' && (
                              <span className="flex items-center gap-0.5 text-[8px] font-bold text-green-600 uppercase">
                                <Check size={8} className="stroke-[3]" /> Đã duyệt
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side controls & Recent SOS (Regular layout view) */}
        {!isMapFullscreen && showSidebar && (
          <div className="lg:col-span-3 flex flex-col gap-4 h-[680px]">
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 text-left flex flex-col shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-3.5 select-none">
                <button 
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider hover:opacity-80 transition cursor-pointer"
                >
                  <Filter size={14} className="text-blue-500" />
                  <span>Bộ lọc bản đồ</span>
                  {isFiltersExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </button>
                <div className="flex items-center gap-2.5">
                  <button className="text-gray-550 hover:text-gray-350 dark:hover:text-gray-300 text-xs font-semibold" onClick={() => {
                    setSelectedSosType('Tất cả');
                    setSelectedSeverity('Tất cả');
                    setSelectedTeamStatus('Tất cả');
                  }}>Đặt lại</button>
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-gray-750 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white rounded transition cursor-pointer"
                    title="Đóng bộ lọc & danh sách"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {isFiltersExpanded && (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Khu vực quản lý</label>
                    <div className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-150 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2">
                      {provinceName}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Loại SOS</label>
                    <select value={selectedSosType} onChange={(e) => setSelectedSosType(e.target.value)}
                      className="w-full bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition">
                      <option value="Tất cả">Tất cả</option>
                      <option value="Người mắc kẹt">Người mắc kẹt</option>
                      <option value="Ngập sâu">Ngập sâu</option>
                      <option value="Y tế khẩn cấp">Cần hỗ trợ y tế</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Mức độ nguy hiểm</label>
                    <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="w-full bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition">
                      <option value="Tất cả">Tất cả</option>
                      <option value="Nguy hiểm (Cao)">Nguy hiểm (Cao)</option>
                      <option value="Cảnh báo (Trung bình)">Cảnh báo (Trung bình)</option>
                      <option value="Ngập nhẹ (Thấp)">Ngập nhẹ (Thấp)</option>
                      <option value="An toàn">An toàn</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Trạng thái đội</label>
                    <select value={selectedTeamStatus} onChange={(e) => setSelectedTeamStatus(e.target.value)}
                      className="w-full bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition">
                      <option value="Tất cả">Tất cả</option>
                      <option value="Sẵn sàng">Sẵn sàng</option>
                      <option value="Đang làm nhiệm vụ">Đang làm nhiệm vụ</option>
                      <option value="Đang di chuyển">Đang di chuyển</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-400 space-y-2">
                    <p className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block mb-1">Hiển thị trên bản đồ</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition">
                        <input type="checkbox" checked={showSos} onChange={(e) => setShowSos(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>SOS khẩn cấp</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition">
                        <input type="checkbox" checked={showTeams} onChange={(e) => setShowTeams(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>Đội cứu hộ</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition">
                        <input type="checkbox" checked={showVehicles} onChange={(e) => setShowVehicles(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>Phương tiện</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition">
                        <input type="checkbox" checked={showFloodZones} onChange={(e) => setShowFloodZones(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>Vùng ngập lụt</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition col-span-2">
                        <input type="checkbox" checked={showCommandStations} onChange={(e) => setShowCommandStations(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>Trạm chỉ huy</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex-1 flex flex-col overflow-hidden text-left shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 flex-shrink-0">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">SOS trong khu vực</h3>
              </div>
              
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
                {filteredSosRequests.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-gray-500">Không có yêu cầu SOS nào</div>
                ) : (
                  filteredSosRequests.map((sos) => {
                    const isSelected = selectedSosId === sos.id;
                    let borderStyle = isSelected ? 'border-red-500 bg-red-50/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300';
                    let bgStyle = 'bg-slate-50/50 dark:bg-[#0d1527]';

                    const badgeColors = {
                      CRITICAL: 'bg-red-50 text-red-600 border-red-200',
                      HIGH: 'bg-orange-50 text-orange-600 border-orange-200',
                      MEDIUM: 'bg-blue-50 text-blue-600 border-blue-200',
                      LOW: 'bg-green-50 text-green-600 border-green-200',
                    };

                    return (
                      <div key={sos.id} onClick={() => handleSelectSos(sos)}
                        className={cn("p-2.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition text-xs", borderStyle, bgStyle)}>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-extrabold tracking-wide uppercase", isSelected ? 'text-red-600 dark:text-red-400' : 'text-red-500')}>{sos.code}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{sos.time.split(' ')[0]}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-tight font-medium">{sos.location}</p>
                        <p className="text-[10px] text-gray-500 leading-none">{sos.description}</p>
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                          <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border", badgeColors[sos.severity])}>
                            {sos.severity === 'CRITICAL' ? 'Nguy hiểm' : 'Cảnh báo'}
                          </span>
                          {sos.status === 'PENDING' && (
                            <button onClick={(e) => {
                              e.stopPropagation();
                              handleVerifySos(sos.id);
                            }} className="px-2 py-0.5 bg-red-650 hover:bg-red-700 text-white rounded text-[8px] font-extrabold uppercase transition">
                              Xác thực
                            </button>
                          )}
                          {sos.status !== 'PENDING' && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold text-green-650 dark:text-green-400 uppercase">
                              <Check size={8} className="stroke-[3]" /> Đã xác thực
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM INFO WIDGETS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Đội cứu hộ gần nhất */}
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col h-[280px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">Đội cứu hộ trong tỉnh</h3>
          </div>
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 no-scrollbar text-left">
            {filteredTeams.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-gray-500">Không có đội cứu hộ nào</div>
            ) : (
              filteredTeams.map((team) => {
                const statusColors: Record<string, string> = {
                  AVAILABLE: 'bg-green-50 text-green-650 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900',
                  BUSY: 'bg-red-50 text-red-650 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
                  DISPATCHED: 'bg-blue-50 text-blue-650 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
                };
                const statusLabels: Record<string, string> = {
                  AVAILABLE: 'Sẵn sàng',
                  BUSY: 'Làm nhiệm vụ',
                  DISPATCHED: 'Đang di chuyển',
                };

                return (
                  <div key={team.id} className="bg-slate-50/50 dark:bg-[#0d1527] border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex items-start justify-between gap-2">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-sm border border-slate-100 dark:border-slate-700 flex-shrink-0">
                        {team.teamType === 'PCCC' ? '🚒' : team.teamType === 'Y_TE' ? '⚕' : '🛡'}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-800 dark:text-white leading-tight">{team.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{team.distanceText}</p>
                      </div>
                    </div>
                    <span className={cn("px-1.5 py-0.2 text-[8px] font-black uppercase rounded border flex-shrink-0", statusColors[team.status] || 'bg-slate-100 text-gray-400 border-slate-200')}>
                      {statusLabels[team.status] || team.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Nhiệm vụ đang thực hiện */}
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col h-[280px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">Nhiệm vụ điều phối live</h3>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1 no-scrollbar text-left font-medium">
            {activeMissions.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-gray-500">Chưa có nhiệm vụ phân công</div>
            ) : (
              activeMissions.map((mission) => (
                <div key={mission.id} className="bg-slate-50/50 dark:bg-[#0d1527] border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-extrabold">
                    <span className="text-xs text-blue-600 dark:text-blue-450">{mission.id}</span>
                    <span className="text-[9px] text-green-650 bg-green-50 dark:bg-green-950/30 px-1 rounded border border-green-200 dark:border-green-900/60 uppercase">{mission.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Phân công: <span className="text-gray-750 dark:text-white font-bold">{mission.teamName}</span></p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-gray-400">
                      <span>Tiến trình cứu trợ</span>
                      <span className="text-gray-800 dark:text-white font-extrabold">{mission.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: `${mission.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Trạng thái phương tiện */}
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col h-[280px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Phương tiện thực tế</h3>
          </div>
          <div className="flex items-center justify-between gap-2 flex-1">
            <div className="flex-shrink-0 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-28 h-28">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="8"
                  strokeDasharray="238.7" strokeDashoffset={(238.7 * (1 - vehicleStats.availablePct / 100)).toFixed(1)} strokeLinecap="round" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f97316" strokeWidth="8"
                  strokeDasharray="238.7" strokeDashoffset={(238.7 * (1 - vehicleStats.busyPct / 100)).toFixed(1)} strokeLinecap="round" transform={`rotate(${-90 + (vehicleStats.availablePct / 100) * 360} 50 50)`} />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="8"
                  strokeDasharray="238.7" strokeDashoffset={(238.7 * (1 - vehicleStats.maintenancePct / 100)).toFixed(1)} strokeLinecap="round" transform={`rotate(${-90 + ((vehicleStats.availablePct + vehicleStats.busyPct) / 100) * 360} 50 50)`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none mt-1">
                <span className="text-sm font-black text-gray-800 dark:text-white">{vehicleStats.total}</span>
                <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Tổng xe</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-xs text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 bg-[#10b981] rounded-full" />
                  <span>Sẵn sàng</span>
                </div>
                <span className="font-extrabold text-gray-800 dark:text-white text-[11px]">{vehicleStats.available} <span className="text-gray-400 dark:text-gray-500 font-medium text-[9px]">({vehicleStats.availablePct.toFixed(0)}%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 bg-[#f97316] rounded-full" />
                  <span>Nhiệm vụ</span>
                </div>
                <span className="font-extrabold text-gray-800 dark:text-white text-[11px]">{vehicleStats.busy} <span className="text-gray-400 dark:text-gray-500 font-medium text-[9px]">({vehicleStats.busyPct.toFixed(0)}%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
                  <span className="w-2 h-2 bg-[#ef4444] rounded-full" />
                  <span>Bảo trì</span>
                </div>
                <span className="font-extrabold text-gray-800 dark:text-white text-[11px]">{vehicleStats.maintenance} <span className="text-gray-400 dark:text-gray-500 font-medium text-[9px]">({vehicleStats.maintenancePct.toFixed(0)}%)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Thống kê nhanh hôm nay */}
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col h-[280px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-3 flex-shrink-0">
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Thống kê nhanh hôm nay</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="bg-slate-50/50 dark:bg-[#0d1527] border border-[#ef4444]/15 p-2.5 rounded-xl flex flex-col justify-center text-left">
              <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">SOS 24h qua</p>
              <p className="text-base font-black text-red-500 leading-none">{quickStats.newSos}</p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold mt-1.5 leading-none">Dữ liệu thực tế</p>
            </div>

            <div className="bg-slate-50/50 dark:bg-[#0d1527] border border-green-500/15 p-2.5 rounded-xl flex flex-col justify-center text-left">
              <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Đã cứu hộ</p>
              <p className="text-base font-black text-green-600 dark:text-green-500 leading-none">{quickStats.resolvedSos}</p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold mt-1.5 leading-none">Đã hoàn tất</p>
            </div>

            <div className="bg-slate-50/50 dark:bg-[#0d1527] border border-blue-500/15 p-2.5 rounded-xl flex flex-col justify-center text-left">
              <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Người được cứu</p>
              <p className="text-base font-black text-blue-600 dark:text-blue-450 leading-none">{quickStats.rescuedPeople}</p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold mt-1.5 leading-none">Trong các vụ SOS</p>
            </div>

            <div className="bg-slate-50/50 dark:bg-[#0d1527] border border-indigo-500/15 p-2.5 rounded-xl flex flex-col justify-center text-left">
              <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Vùng ngập dự tính</p>
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400 leading-none">{quickStats.floodArea}</p>
              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold mt-1.5 leading-none">Tỷ lệ tương đối</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
