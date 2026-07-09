import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  Truck,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { rescueTeamApi, locationApi, sosApi, routingApi } from '../../apis';
import { cn } from '../../lib/utils';
import { toast, useAuthStore } from '../../stores';
import { useSocket } from '../../providers/SocketProvider';
import { DISPATCH_EVENTS } from '../../constants/websocket.constant';
import { getProvinceCenterByCode, ROUTES } from '../../constants';
import SosDetailModal from './components/SosDetailModal';

// Inject custom CSS to override Leaflet default white styles to fit the clean light theme
const injectStyles = `
  .custom-theme-popup .leaflet-popup-content-wrapper {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    color: #1e293b !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
    padding: 6px !important;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  }
  .custom-theme-popup .leaflet-popup-content {
    margin: 6px 8px 6px 8px !important;
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
  
  /* Fullscreen map helper styles */
  .has-fullscreen-map aside,
  .has-fullscreen-map header,
  .has-fullscreen-map .layout-global-header,
  .has-fullscreen-map .layout-mobile-topbar {
    display: none !important;
  }
  .has-fullscreen-map main {
    padding-top: 0 !important;
    margin-top: 0 !important;
  }
`;



export default function DisasterListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { dispatchSocket } = useSocket();

  const [selectedSosType, setSelectedSosType] = useState('Tất cả');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStatsOverlay, setShowStatsOverlay] = useState(true);
  const [showBottomDashboard, setShowBottomDashboard] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('Tất cả');
  const [selectedTeamStatus, setSelectedTeamStatus] = useState('Tất cả');

  // Form states for creating SOS
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRequesterName, setNewRequesterName] = useState('');
  const [newRequesterPhone, setNewRequesterPhone] = useState('');
  const [newRequestType, setNewRequestType] = useState('FLOOD');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newDescription, setNewDescription] = useState('');
  const [newTrappedPeopleCount, setNewTrappedPeopleCount] = useState(1);
  const [newRequiresEquipment, setNewRequiresEquipment] = useState(false);
  const [newSpecialNeedsTags, setNewSpecialNeedsTags] = useState<string[]>([]);
  const [newLatitude, setNewLatitude] = useState(10.823);
  const [newLongitude, setNewLongitude] = useState(106.6296);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [routesCache, setRoutesCache] = useState<Record<string, { primary: [number, number][]; dijkstra: [number, number][] | null }>>({});

  const resetCreateForm = () => {
    setNewRequesterName('');
    setNewRequesterPhone('');
    setNewRequestType('FLOOD');
    setNewSeverity('HIGH');
    setNewDescription('');
    setNewTrappedPeopleCount(1);
    setNewRequiresEquipment(false);
    setNewSpecialNeedsTags([]);
    setNewLatitude(defaultCenter[0]);
    setNewLongitude(defaultCenter[1]);
    setIsPickingLocation(false);
  };

  const statusBadgeColors = useMemo(() => ({
    PENDING: 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-450 dark:border-yellow-900',
    PENDING_SPECIALIST: 'bg-purple-50 text-purple-650 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900 animate-pulse',
    DISPATCHED: 'bg-blue-50 text-blue-650 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
    ON_SITE: 'bg-teal-50 text-teal-650 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900',
    RESOLVED: 'bg-green-50 text-green-650 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900',
    CANCELLED: 'bg-gray-50 text-gray-500 border-gray-250 dark:bg-gray-800 dark:text-gray-400',
  } as Record<string, string>), []);

  const statusLabels = useMemo(() => ({
    PENDING: 'Chờ duyệt',
    PENDING_SPECIALIST: 'Chờ Đội chuyên môn',
    DISPATCHED: 'Đang di chuyển',
    ON_SITE: 'Đã tiếp cận',
    RESOLVED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  } as Record<string, string>), []);

  // Layer toggles
  const [showSos, setShowSos] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showResolvedSos, setShowResolvedSos] = useState(false);
  const [showCommandStations, setShowCommandStations] = useState(true);

  // States for Map details
  const [selectedSosId, setSelectedSosId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (isMapFullscreen) {
      document.documentElement.classList.add('has-fullscreen-map');
      document.body.classList.add('overflow-hidden');
    } else {
      document.documentElement.classList.remove('has-fullscreen-map');
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.documentElement.classList.remove('has-fullscreen-map');
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMapFullscreen]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [activeTileType, setActiveTileType] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [performanceMode, setPerformanceMode] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // 1. Fetch Provinces to map the user's provinceId to a readable name
  const { data: provinces, error: provincesError } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => locationApi.getAllProvinces(),
  });

  const currentProvince = useMemo(() => {
    if (!provinces || !user?.provinceId) return null;
    return provinces.find(p => p.id === user.provinceId);
  }, [provinces, user?.provinceId]);

  const provinceName = currentProvince?.name;
  const defaultCenter = useMemo(() => {
    return getProvinceCenterByCode(currentProvince?.code, currentProvince?.name);
  }, [currentProvince]);

  // Cảnh báo người dùng nếu lỗi tải dữ liệu hành chính hoặc cấu hình tỉnh thành không khớp
  useEffect(() => {
    if (provincesError) {
      toast.error('Lỗi: Không thể kết nối với dịch vụ bản đồ hành chính của hệ thống.');
    }
  }, [provincesError]);

  useEffect(() => {
    if (provinces && provinces.length > 0 && user?.provinceId) {
      const found = provinces.some(p => p.id === user.provinceId);
      if (!found) {
        toast.error(`Cảnh báo: Tài khoản thuộc mã tỉnh không hợp lệ (ID: ${user.provinceId}). Bản đồ tự động chuyển hướng về TP. Hồ Chí Minh.`);
      }
    }
  }, [provinces, user?.provinceId]);

  // 2. Fetch SOS Requests and Teams exclusively from database
  const { data: dbSosList } = useQuery({
    queryKey: ['db-sos-requests', user?.provinceId],
    queryFn: () => rescueTeamApi.getRecentSosRequests({ provinceId: user?.provinceId, limit: 100 }),
  });

  const { data: dbTeamsList } = useQuery({
    queryKey: ['db-teams-all', user?.provinceId],
    queryFn: () => rescueTeamApi.getAll({ provinceId: user?.provinceId, limit: 100 }),
  });

  // 📡 Real-time WebSockets integration for SOS dispatch updates

  // 📡 Real-time WebSockets integration for SOS dispatch updates
  useEffect(() => {
    if (!dispatchSocket) return;

    const handleNewSos = (sos: any) => {
      console.log('📡 [WS] New SOS received:', sos);

      // Update the React Query cache: ['db-sos-requests', user?.provinceId]
      queryClient.setQueryData<any[]>(['db-sos-requests', user?.provinceId], (oldData) => {
        const list = oldData || [];
        if (list.some((item) => item.id === sos.id)) return list;
        return [sos, ...list];
      });

      // Show notification to user
      toast.warning(`SOS MỚI: Yêu cầu từ ${sos.requesterName || 'Người dân'} (SĐT: ${sos.requesterPhone || 'Chưa cập nhật'}) tại ${sos.addressDetail || sos.adminUnit?.name || 'Vị trí hiện trường'}`);
    };

    const handleSosStatusUpdated = (payload: { sosId: number; status: string; assignedTeamId?: number; distanceMeters?: number }) => {
      console.log('📡 [WS] SOS status updated:', payload);

      // Update the React Query cache: ['db-sos-requests', user?.provinceId]
      queryClient.setQueryData<any[]>(['db-sos-requests', user?.provinceId], (oldData) => {
        if (!oldData) return [];
        return oldData.map((item) => {
          if (item.id === payload.sosId) {
            return {
              ...item,
              status: payload.status,
              assignedTeamId: payload.assignedTeamId ?? item.assignedTeamId,
            };
          }
          return item;
        });
      });

      // Invalidate teams query to refresh team availability status
      queryClient.invalidateQueries({ queryKey: ['db-teams-all', user?.provinceId] });

      // Notify status change
      const statusLabels: Record<string, string> = {
        PENDING: 'Đang chờ xử lý',
        DISPATCHED: 'Đang di chuyển đội cứu hộ',
        ON_SITE: 'Đã tiếp cận hiện trường',
        RESOLVED: 'Đã hoàn thành',
        CANCELLED: 'Đã hủy',
      };
      const label = statusLabels[payload.status] || payload.status;

      if (payload.status === 'RESOLVED') {
        toast.success(`SOS-2026-${payload.sosId} đã được xử lý thành công!`);
      } else if (payload.status === 'CANCELLED') {
        toast.info(`SOS-2026-${payload.sosId} đã bị hủy.`);
      } else {
        toast.info(`Trạng thái SOS-2026-${payload.sosId} cập nhật thành: ${label}`);
      }
    };

    const handleNoTeam = (payload: { sosId: number; message: string }) => {
      console.log('📡 [WS] No team available:', payload);
      toast.error(`BÁO ĐỘNG: SOS-2026-${payload.sosId} không có đội cứu hộ phù hợp khả dụng!`);
    };

    dispatchSocket.on(DISPATCH_EVENTS.SOS_CREATED, handleNewSos);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleSosStatusUpdated);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_NO_TEAM, handleNoTeam);

    return () => {
      dispatchSocket.off(DISPATCH_EVENTS.SOS_CREATED, handleNewSos);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleSosStatusUpdated);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_NO_TEAM, handleNoTeam);
    };
  }, [dispatchSocket, user?.provinceId, queryClient]);

  // Geolocation trigger
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setShowUserLocation(true);
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
    if (showUserLocation && !userLocation) {
      requestUserLocation();
    }
  }, [showUserLocation, userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      setShowBottomDashboard(false);
      if (isPickingLocation) {
        setNewLatitude(e.latlng.lat);
        setNewLongitude(e.latlng.lng);
        setIsPickingLocation(false);
        setIsCreateModalOpen(true);
        toast.success(`Đã chọn vị trí hiện trường: ${e.latlng.lng.toFixed(5)}, ${e.latlng.lat.toFixed(5)}`);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPickingLocation]);

  // Parse SOS requests from API
  const parsedSosRequests = useMemo(() => {
    if (!dbSosList || !Array.isArray(dbSosList)) return [];
    return dbSosList
      .filter((sos: any) => {
        if (sos.status === 'CANCELLED') return false;
        if (sos.status === 'RESOLVED' && !showResolvedSos) return false;
        return true;
      })
      .map((sos: any) => {
        let lat = defaultCenter[0];
        let lng = defaultCenter[1];
        if (sos.location?.coordinates && Array.isArray(sos.location.coordinates)) {
          lng = sos.location.coordinates[0];
          lat = sos.location.coordinates[1];
        } else if (sos.lat && sos.lng) {
          lat = sos.lat;
          lng = sos.lng;
        }

        // Find assigned team name
        const assignedTeam = sos.assignedTeamId && dbTeamsList?.data
          ? (dbTeamsList.data as any[]).find((t: any) => t.id === sos.assignedTeamId)
          : null;

        return {
          id: sos.id,
          code: `SOS-2026-${sos.id}`,
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
          status: (sos.status || 'PENDING') as 'PENDING' | 'PENDING_SPECIALIST' | 'DISPATCHED' | 'ON_SITE' | 'RESOLVED' | 'CANCELLED',
          trappedCount: sos.trappedPeopleCount || 1,
          requiresEquipment: !!sos.requiresEquipment,
          specialistPending: !!sos.specialistPending,
          specialistType: sos.specialistType || '',
          assignedTeamId: sos.assignedTeamId,
          assignedTeamName: assignedTeam?.name || null,
          requestType: sos.requestType || 'OTHER',
        };
      });
  }, [dbSosList, defaultCenter, provinceName, showResolvedSos, dbTeamsList]);

  // Parse Teams from API
  const parsedTeams = useMemo(() => {
    if (!dbTeamsList?.data || !Array.isArray(dbTeamsList.data)) return [];

    const selectedSos = selectedSosId
      ? parsedSosRequests.find((s) => s.id === selectedSosId)
      : null;

    const sosLoc = selectedSos?.location?.coordinates;
    const sosLng = sosLoc?.[0];
    const sosLat = sosLoc?.[1];

    const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return dbTeamsList.data.map((team: any) => {
      let lat = defaultCenter[0];
      let lng = defaultCenter[1];
      const loc = team.currentLocation || team.baseLocation || team.location;
      if (loc?.coordinates && Array.isArray(loc.coordinates)) {
        lng = loc.coordinates[0];
        lat = loc.coordinates[1];
      }

      let distanceText = '—';
      if (sosLat && sosLng && lat && lng) {
        const dist = calculateHaversineDistance(sosLat, sosLng, lat, lng);
        distanceText = `Cách ${dist.toFixed(1)} km`;
      } else {
        const dist = calculateHaversineDistance(defaultCenter[0], defaultCenter[1], lat, lng);
        distanceText = `Cách ${dist.toFixed(1)} km (từ trung tâm)`;
      }

      return {
        id: team.id,
        name: team.name,
        lat,
        lng,
        teamType: team.teamType || 'TONG_HOP',
        status: team.status || 'AVAILABLE',
        activeMissions: team.missionsCount || 0,
        phone: team.leader?.phone || team.leaderPhone || team.phone || 'Chưa có SĐT',
        leaderName: team.leader?.fullName || team.leaderCitizenName || 'Chưa cập nhật',
        address: team.adminUnit?.name ? `${team.adminUnit.name}, ${provinceName}` : (team.address || provinceName),
        distanceText,
      };
    });
  }, [dbTeamsList, defaultCenter, provinceName, selectedSosId, parsedSosRequests]);

  // Lists for bottom monitoring dashboard
  const availableTeams = useMemo(() => {
    return parsedTeams.filter(t => t.status === 'AVAILABLE' || t.status === 'STANDBY');
  }, [parsedTeams]);

  const activeTeams = useMemo(() => {
    return parsedTeams.filter(t => t.status === 'BUSY' || t.status === 'ON_DUTY' || t.status === 'DISPATCHED');
  }, [parsedTeams]);

  const teamActiveSos = useMemo(() => {
    const map = new Map<number, any>();
    parsedSosRequests.forEach(sos => {
      if (sos.assignedTeamId && sos.status !== 'RESOLVED' && sos.status !== 'CANCELLED') {
        map.set(sos.assignedTeamId, sos);
      }
    });
    return map;
  }, [parsedSosRequests]);

  const newSosRequests = useMemo(() => {
    return parsedSosRequests.filter(s => s.status === 'PENDING' || s.status === 'PENDING_SPECIALIST');
  }, [parsedSosRequests]);

  const activeSosRequests = useMemo(() => {
    return parsedSosRequests.filter(s => s.status === 'DISPATCHED' || s.status === 'ON_SITE');
  }, [parsedSosRequests]);

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

  // Auto-dispatch v6 mutation
  const assignTeamMutation = useMutation({
    mutationFn: async ({ id, teamId }: { id: number; teamId?: number | null }) => {
      return sosApi.assignTeam(id, { teamId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['db-sos-requests'] });
      queryClient.invalidateQueries({ queryKey: ['db-teams-all'] });
      if (data?.bestTeamId) {
        toast.success(`Đã tự động điều phối Đội ID ${data.bestTeamId} với điểm số tối ưu!`);
      } else {
        toast.success('Đã chạy tự động điều phối v6 thành công!');
      }
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi điều phối cứu hộ');
    }
  });

  // Create SOS request mutation
  const createSosMutation = useMutation({
    mutationFn: async (data: any) => {
      return sosApi.create(data);
    },
    onSuccess: (newSos) => {
      queryClient.invalidateQueries({ queryKey: ['db-sos-requests'] });
      toast.success(`Đã tạo yêu cầu SOS khẩn cấp thành công! Mã: SOS-2026-${newSos.id}`);
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi gửi yêu cầu SOS');
    }
  });

  const handleVerifySos = (id: number) => {
    // In v6, verification triggers the auto-dispatch scoring pipeline
    assignTeamMutation.mutate({ id });
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

    const [lat, lng] = defaultCenter;
    const offset = 0.35; // Bán kính giới hạn bản đồ xung quanh tâm tỉnh khoảng ~40km
    const bounds = L.latLngBounds(
      [lat - offset, lng - offset], // Tây Nam
      [lat + offset, lng + offset]  // Đông Bắc
    );

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      minZoom: 10,
      maxZoom: 18,
    }).setView(defaultCenter, 12);

    // Load map tiles (Standard OSM for light, Dark Matter for dark)
    const isDarkInitial = document.documentElement.classList.contains('dark');
    const defaultTileUrl = isDarkInitial
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const layer = L.tileLayer(defaultTileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = layer;

    mapRef.current = map;
    layersGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    setIsMapReady(true);

    const mapEl = mapContainerRef.current;
    if (!mapEl) return;

    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('verify-sos-btn-popup')) {
        const idAttr = target.getAttribute('data-id');
        if (idAttr) {
          const id = parseInt(idAttr, 10);
          handleVerifySos(id);
          map.closePopup();
        }
      } else if (target.classList.contains('view-sos-detail-btn-popup')) {
        const idAttr = target.getAttribute('data-id');
        if (idAttr) {
          const id = parseInt(idAttr, 10);
          setSelectedSosId(id);
          setIsDetailModalOpen(true);
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
      setIsMapReady(false);
    };
  }, [defaultCenter]);

  // Handle dynamic map tile switches (Streets vs Satellite vs Terrain)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    let subdomains = 'abc';

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
  }, [activeTileType, isDark]);

  // Handle invalidateSize on fullscreen toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const timer = setTimeout(() => {
      if (mapRef.current && (map as any)._container) {
        map.invalidateSize({ animate: true });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isMapFullscreen, showSidebar]);

  // Re-center map when default province center changes
  useEffect(() => {
    if (mapRef.current && !userLocation) {
      mapRef.current.setView(defaultCenter, 12);
    }
  }, [defaultCenter, userLocation]);

  // Redraw layers on map state updates (Optimized with Canvas, Marker Reconciliation & Performance Mode)
  useEffect(() => {
    if (!mapRef.current || !layersGroupRef.current || !markersGroupRef.current) return;

    const group = layersGroupRef.current;
    const markersGroup = markersGroupRef.current;
    const currentMarkers = markersMapRef.current;
    const activeKeys = new Set<string>();

    // Clear vector lines and polygons on layersGroup (very fast with preferCanvas)
    group.clearLayers();

    // 1. User Location Marker
    if (userLocation && showUserLocation) {
      const key = 'user-location';
      activeKeys.add(key);

      const selfIcon = L.divIcon({
        html: performanceMode
          ? `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-20"></div>
              <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          `
          : `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
              <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          `,
        className: 'custom-div-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const popupContent = '<p class="text-xs font-bold text-gray-800 p-1">Vị trí hiện tại của bạn</p>';

      if (currentMarkers.has(key)) {
        const marker = currentMarkers.get(key)!;
        marker.setLatLng(userLocation);
        marker.setIcon(selfIcon);
        marker.setPopupContent(popupContent);
      } else {
        const marker = L.marker(userLocation, { icon: selfIcon })
          .bindPopup(popupContent, { className: 'custom-theme-popup' });
        markersGroup.addLayer(marker);
        currentMarkers.set(key, marker);
      }
    }

    // Custom pins definitions
    const getSosIcon = (severity: string, status?: string) => {
      const pingBg = severity === 'CRITICAL' ? 'bg-red-500' : severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500';
      let iconBg = severity === 'CRITICAL' ? 'bg-red-600' : severity === 'HIGH' ? 'bg-amber-600' : 'bg-blue-600';
      let outerBorder = 'border border-white';

      // Determine animation
      let animateClass = '';
      if (!performanceMode) {
        if (status === 'PENDING_SPECIALIST') {
          iconBg = 'bg-purple-650';
          outerBorder = 'border-2 border-purple-400 animate-pulse';
        } else if (severity === 'CRITICAL' && status === 'PENDING') {
          animateClass = 'animate-ping';
        }
      } else {
        if (status === 'PENDING_SPECIALIST') {
          iconBg = 'bg-purple-650';
          outerBorder = 'border-2 border-purple-400';
        }
      }

      if (status === 'RESOLVED') {
        iconBg = 'bg-slate-400 dark:bg-slate-600';
      }

      const glowColor = severity === 'CRITICAL'
        ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.75)]'
        : severity === 'HIGH'
          ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.75)]'
          : 'drop-shadow-[0_0_8px_rgba(59,130,246,0.75)]';

      const pingDiv = animateClass
        ? `<div class="absolute w-8 h-8 ${pingBg} rounded-full opacity-40 ${animateClass}"></div>`
        : `<div class="absolute w-8 h-8 ${pingBg} rounded-full opacity-15"></div>`;

      return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center ${glowColor}">
              ${pingDiv}
              <div class="w-6.5 h-6.5 ${iconBg} text-white rounded-full flex items-center justify-center shadow-lg ${outerBorder} text-[9px] font-black tracking-tight select-none">
                SOS
              </div>
            </div>
          `,
        className: 'custom-div-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    };

    const getTeamIcon = (type: string, status: string) => {
      const isBusy = status === 'BUSY' || status === 'ON_DUTY';
      const isMoving = status === 'DISPATCHED';

      let gradientClass = 'from-blue-500 to-indigo-650';
      let glowClass = 'drop-shadow-[0_0_6px_rgba(59,130,246,0.55)]';
      let emoji = '🛡';

      if (type === 'PCCC') {
        gradientClass = 'from-orange-500 to-red-650';
        glowClass = 'drop-shadow-[0_0_6px_rgba(249,115,22,0.65)]';
        emoji = '🚒';
      } else if (type === 'Y_TE') {
        gradientClass = 'from-emerald-400 to-teal-650';
        glowClass = 'drop-shadow-[0_0_6px_rgba(16,185,129,0.65)]';
        emoji = '⚕';
      }

      let outerRing = 'border border-white shadow';
      if (isBusy) {
        outerRing = 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-gray-900 border border-white';
      } else if (isMoving) {
        outerRing = 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900 border border-white';
      }

      const pulseDiv = (!performanceMode && (isBusy || isMoving))
        ? `<div class="absolute w-7 h-7 bg-white dark:bg-gray-900 rounded-full opacity-15 animate-pulse"></div>`
        : '';

      return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center ${glowClass}">
              ${pulseDiv}
              <div class="w-6.5 h-6.5 bg-gradient-to-br ${gradientClass} text-white rounded-full flex items-center justify-center shadow-md ${outerRing} text-xs font-bold select-none">
                ${emoji}
              </div>
            </div>
          `,
        className: 'custom-div-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    };

    // Draw Flood Zones (polygons drawn on Canvas)
    if (false && showFloodZones) {
      const geojsonLayer = L.geoJSON(floodZonesGeoJSON as any, {
        interactive: false,
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
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.18,
            lineJoin: 'round',
          };
        }
      });
      group.addLayer(geojsonLayer);
    }

    // Draw SOS Points (reconciled)
    if (showSos) {
      filteredSosRequests.forEach((sos) => {
        const key = `sos-${sos.id}`;
        activeKeys.add(key);

        const icon = getSosIcon(sos.severity, sos.status);

        const statusText = sos.status === 'PENDING' ? 'Chờ xử lý' :
          sos.status === 'PENDING_SPECIALIST' ? 'Đợi đội chuyên môn (Queue)' :
            sos.status === 'DISPATCHED' ? 'Đang di chuyển' :
              sos.status === 'ON_SITE' ? 'Đã tiếp cận' : 'Hoàn thành';

        const equipmentText = sos.requiresEquipment ? '<span class="text-purple-650 font-bold ml-1">(Yêu cầu thiết bị)</span>' : '';

        // Build status badge colors for popup
        const popupStatusColors: Record<string, string> = {
          PENDING: 'background:#fef3c7;color:#92400e;border:1px solid #fde68a',
          PENDING_SPECIALIST: 'background:#f3e8ff;color:#7c3aed;border:1px solid #ddd6fe',
          DISPATCHED: 'background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe',
          ON_SITE: 'background:#ccfbf1;color:#0f766e;border:1px solid #99f6e4',
          RESOLVED: 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0',
        };
        const popupSeverityColors: Record<string, string> = {
          CRITICAL: 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca',
          HIGH: 'background:#fff7ed;color:#ea580c;border:1px solid #fed7aa',
          MEDIUM: 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe',
          LOW: 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0',
        };
        const assignedTeamHtml = sos.assignedTeamName
          ? `<div style="margin-top:4px;padding:4px 6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;font-size:10px;color:#1e40af;font-weight:700;">Đội: ${sos.assignedTeamName}</div>`
          : '';

        const requestTypeLabels: Record<string, string> = {
          FLOOD: 'Ngập lụt',
          FIRE_FIGHTING: 'Hỏa hoạn',
          TRAFFIC_ACCIDENT: 'Tai nạn giao thông',
          MEDICAL_EMERGENCY: 'Y tế khẩn cấp',
          NATURAL_DISASTER: 'Thiên tai khẩn cấp',
          OTHER: 'Khác',
        };
        const requestTypeLabel = requestTypeLabels[sos.requestType] || sos.requestType || 'N/A';

        const popupContent = `
            <div style="padding:8px;width:240px;text-align:left;font-family:inherit;font-size:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
                <span style="font-weight:900;color:#ef4444;font-size:13px;">${sos.code}</span>
                <span style="padding:1px 6px;border-radius:4px;font-size:9px;font-weight:900;text-transform:uppercase;${popupSeverityColors[sos.severity] || ''}">
                  ${sos.severity === 'CRITICAL' ? 'Nguy kịch' : sos.severity === 'HIGH' ? 'Cao' : sos.severity === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="padding:2px 8px;border-radius:6px;font-size:9px;font-weight:800;text-transform:uppercase;${popupStatusColors[sos.status] || ''}">
                  ${statusText}
                </span>
                <span style="font-size:10px;color:#94a3b8;font-weight:600;">${sos.time}</span>
              </div>
              <div style="font-size:11px;color:#475569;line-height:1.5;">
                <div><strong>Người gửi:</strong> ${sos.sender}</div>
                <div><strong>Liên hệ:</strong> ${sos.phone}</div>
                <div><strong>Loại:</strong> ${requestTypeLabel}${equipmentText}</div>
                <div><strong>Người gặp nạn:</strong> ${sos.trappedCount} người</div>
              </div>
              <div style="margin-top:4px;font-size:10px;color:#64748b;font-style:italic;background:#f8fafc;padding:4px 6px;border-radius:6px;border:1px solid #f1f5f9;">
                ${sos.description}
              </div>
              ${assignedTeamHtml}
              <div style="display:flex;flex-direction:column;gap:5px;margin-top:8px;">
                ${(sos.status === 'PENDING' && !sos.assignedTeamId) ? `
                  <button class="verify-sos-btn-popup" data-id="${sos.id}" style="width:100%;padding:5px 8px;background:#dc2626;color:white;border:none;border-radius:6px;font-size:10px;font-weight:800;cursor:pointer;text-align:center;">
                    Kích hoạt Điều phối v6
                  </button>
                ` : sos.status === 'RESOLVED' ? `
                  <div style="text-align:center;width:100%;font-weight:800;color:#16a34a;font-size:10px;text-transform:uppercase;padding:5px 0;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:6px;">
                    ĐÃ HOÀN THÀNH
                  </div>
                ` : `
                  <div style="text-align:center;width:100%;font-weight:800;color:#2563eb;font-size:10px;text-transform:uppercase;padding:5px 0;border:1px solid #bfdbfe;background:#eff6ff;border-radius:6px;">
                    ĐÃ DUYỆT ĐIỀU PHỐI
                  </div>
                `}
                <button class="view-sos-detail-btn-popup" data-id="${sos.id}" style="width:100%;padding:5px 8px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:6px;font-size:10px;font-weight:800;cursor:pointer;text-align:center;">
                  Xem chi tiết đầy đủ
                </button>
              </div>
            </div>
          `;

        if (currentMarkers.has(key)) {
          const marker = currentMarkers.get(key)!;
          marker.setLatLng([sos.lat, sos.lng]);
          marker.setIcon(icon);
          marker.setPopupContent(popupContent);
          marker.setZIndexOffset(500);
        } else {
          const marker = L.marker([sos.lat, sos.lng], {
            icon,
            zIndexOffset: 500,
          });
          marker.bindPopup(popupContent, {
            className: 'custom-theme-popup',
            maxWidth: 300,
          });

          marker.on('click', () => {
            setSelectedSosId(sos.id);
          });

          markersGroup.addLayer(marker);
          currentMarkers.set(key, marker);
        }
      });
    }

    // Draw Rescue Teams (reconciled)
    if (showTeams) {
      filteredTeams.forEach((team) => {
        const key = `team-${team.id}`;
        activeKeys.add(key);

        const icon = getTeamIcon(team.teamType, team.status);

        const statusLabels: Record<string, string> = {
          AVAILABLE: 'Sẵn sàng',
          BUSY: 'Đang làm nhiệm vụ',
          DISPATCHED: 'Đang di chuyển',
          OFF_DUTY: 'Ngoại tuyến'
        };

        const statusBannerColors: Record<string, string> = {
          AVAILABLE: 'background-color:#ecfdf5; color:#059669; border:1px solid #a7f3d0;',
          BUSY: 'background-color:#fef2f2; color:#dc2626; border:1px solid #fecaca;',
          DISPATCHED: 'background-color:#eff6ff; color:#2563eb; border:1px solid #bfdbfe;',
          OFF_DUTY: 'background-color:#f8fafc; color:#64748b; border:1px solid #e2e8f0;'
        };

        const statusLabel = statusLabels[team.status] || team.status;
        const statusBannerStyle = statusBannerColors[team.status] || statusBannerColors.AVAILABLE;

        const popupContent = `
            <div style="font-family:inherit; font-size:12px; width:220px; line-height:1.4; color:#1e293b; text-align:left; padding:4px 2px 2px 2px;">
              <h4 style="font-size:12.5px; font-weight:800; color:#0f172a; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:0.3px; line-height:1.3;">
                ${team.name}
              </h4>
              <div style="font-size:11px; margin-bottom:8px; color:#475569;">
                <div style="margin-bottom:3px;">
                  <span style="font-weight:700; color:#64748b; margin-right:4px;">Kiểu đội:</span>
                  <span style="font-weight:600; color:#334155;">
                    ${team.teamType === 'PCCC' ? 'Đội PCCC & CNCH' : team.teamType === 'Y_TE' ? 'Đội Y Tế Cấp Cứu' : team.teamType === 'DAN_PHONG' ? 'Đội Dân Phòng Tự Quản' : 'Đội Hỗ Trợ Tổng Hợp'}
                  </span>
                </div>
                <div style="margin-bottom:3px;">
                  <span style="font-weight:700; color:#64748b; margin-right:4px;">ĐT:</span>
                  <span style="font-weight:600; color:#334155;">${(team as any).leaderName || 'Chưa cập nhật'}</span>
                </div>
                <div style="margin-bottom:4px;">
                  <span style="font-weight:700; color:#64748b; margin-right:4px;">SĐT:</span>
                  <span style="font-weight:700; color:#2563eb;">${team.phone}</span>
                </div>
              </div>
              <div style="display:flex; align-items:center; justify-content:center; padding:5px; border-radius:6px; font-size:9.5px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; ${statusBannerStyle}">
                ${statusLabel}
              </div>
            </div>
          `;

        if (currentMarkers.has(key)) {
          const marker = currentMarkers.get(key)!;
          marker.setLatLng([team.lat, team.lng]);
          marker.setIcon(icon);
          marker.setPopupContent(popupContent);
          marker.setZIndexOffset(1000);
        } else {
          const marker = L.marker([team.lat, team.lng], {
            icon,
            zIndexOffset: 1000,
          });
          marker.bindPopup(popupContent, { className: 'custom-theme-popup' });
          markersGroup.addLayer(marker);
          currentMarkers.set(key, marker);
        }
      });
    }

    // Clean up markers that are no longer active
    for (const [key, marker] of currentMarkers.entries()) {
      if (!activeKeys.has(key)) {
        markersGroup.removeLayer(marker);
        currentMarkers.delete(key);
      }
    }

    // Vẽ tuyến đường đi thực tế né tránh các vùng ngập lụt (polylines drawn on Canvas)
    if (showSos && showTeams) {
      parsedSosRequests.forEach((sos) => {
        if (sos.status === 'DISPATCHED' || sos.status === 'ON_SITE') {
          const matchedTeamId = (dbSosList || []).find((s: any) => s.id === sos.id)?.assignedTeamId;
          if (matchedTeamId) {
            const team = parsedTeams.find((t) => t.id === matchedTeamId);
            if (team) {
              const floodZonesCount = floodZonesGeoJSON?.features?.length || 0;
              const cacheKey = `${team.id}-${sos.id}-${floodZonesCount}`;
              const route = routesCache[cacheKey];

              if (route) {
                // 1. Vẽ đường chính thức (OpenRouteService) - nét liền màu xanh dương, dầy hơn
                const primaryLine = L.polyline(route.primary, {
                  color: '#3b82f6',
                  weight: 3.5,
                  opacity: 0.9,
                  lineJoin: 'round',
                  interactive: false,
                });
                group.addLayer(primaryLine);

                // 2. Vẽ đường đối chứng học thuật (Dijkstra) - nét đứt màu cam nếu có (Đã tắt theo yêu cầu)
                // if (route.dijkstra) {
                //   const dijkstraLine = L.polyline(route.dijkstra, {
                //     color: '#f59e0b',
                //     weight: 2.5,
                //     dashArray: '5, 8',
                //     opacity: 0.85,
                //     lineJoin: 'round',
                //     interactive: false,
                //   });
                //   group.addLayer(dijkstraLine);
                // }
              } else {
                // Fallback vẽ đường chim bay trong lúc đang tải tuyến đường thực tế
                const fallbackLine = L.polyline([[team.lat, team.lng], [sos.lat, sos.lng]], {
                  color: '#3b82f6',
                  weight: 1.5,
                  dashArray: '4, 6',
                  opacity: 0.5,
                  interactive: false,
                });
                group.addLayer(fallbackLine);
              }
            }
          }
        }
      });
    }
  }, [showFloodZones, showSos, showTeams, filteredSosRequests, filteredTeams, userLocation, showUserLocation, floodZonesGeoJSON, dbSosList, routesCache, performanceMode, isMapReady]);

  // Center/Zoom map on a specific SOS click from side panel
  const handleSelectSos = (sos: any) => {
    setSelectedSosId(sos.id);
    if (mapRef.current) {
      mapRef.current.setView([sos.lat, sos.lng], 14, { animate: true });
      if (markersGroupRef.current) {
        markersGroupRef.current.eachLayer((layer: any) => {
          if (layer instanceof L.Marker && layer.getLatLng().lat === sos.lat && layer.getLatLng().lng === sos.lng) {
            layer.openPopup();
          }
        });
      }
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
      id: `NV-${team.id}`,
      status: 'Đang thực hiện',
      teamName: team.name,
      sosCode: `SOS-2026-${idx + 100}`,
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

  // Tự động gọi API lấy tọa độ đường đi thực tế né tránh các vùng ngập lụt
  useEffect(() => {
    if (!showSos || !showTeams || !dbSosList || !parsedTeams) return;

    const activeMissions = parsedSosRequests.filter(
      (s) => s.status === 'DISPATCHED' || s.status === 'ON_SITE',
    );

    activeMissions.forEach(async (sos) => {
      const matchedTeamId = (dbSosList || []).find((s: any) => s.id === sos.id)?.assignedTeamId;
      if (!matchedTeamId) return;
      const team = parsedTeams.find((t) => t.id === matchedTeamId);
      if (!team) return;

      const floodZonesCount = floodZonesGeoJSON?.features?.length || 0;
      const cacheKey = `${team.id}-${sos.id}-${floodZonesCount}`;
      if (routesCache[cacheKey]) return; // Đã lưu trong cache

      try {
        const result = await routingApi.calculateRoute(
          { latitude: team.lat, longitude: team.lng },
          { latitude: sos.lat, longitude: sos.lng },
          floodZonesGeoJSON?.features || [],
          'car',
        );

        if (result.isIsolated) {
          toast.warning(`Cảnh báo: Hiện trường ${sos.code} bị cô lập đường bộ! Đề xuất điều phối xuồng/ca-nô.`);
        }

        const primaryLatLngs = result.primary.coordinates.map(
          (c) => [c.latitude, c.longitude] as [number, number],
        );
        const dijkstraLatLngs = result.dijkstra
          ? result.dijkstra.coordinates.map((c) => [c.latitude, c.longitude] as [number, number])
          : null;

        setRoutesCache((prev) => ({
          ...prev,
          [cacheKey]: {
            primary: primaryLatLngs,
            dijkstra: dijkstraLatLngs,
          },
        }));
      } catch (err) {
        console.error(`Lỗi định tuyến giữa đội ${team.id} và SOS ${sos.id}:`, err);
      }
    });
  }, [showSos, showTeams, parsedSosRequests, parsedTeams, dbSosList, floodZonesGeoJSON, routesCache]);

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
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Tổng SOS</p>
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
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-none">Đội cứu hộ</p>
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
              ? "fixed inset-0 z-[9999] bg-white dark:bg-gray-950 p-4 h-screen w-screen rounded-none"
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
            <button
              className={cn(
                "p-2.5 border rounded-xl shadow transition duration-200 cursor-pointer",
                performanceMode
                  ? "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-850 text-yellow-600 dark:text-yellow-400"
                  : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800"
              )}
              onClick={() => {
                setPerformanceMode(!performanceMode);
                toast.info(!performanceMode ? "Đã bật Chế độ hiệu năng (Tắt hiệu ứng nhấp nháy)" : "Đã tắt Chế độ hiệu năng (Bật lại hiệu ứng nhấp nháy)");
              }}
              title={performanceMode ? "Tắt Chế độ hiệu năng (Bật hoạt ảnh)" : "Bật Chế độ hiệu năng (Tắt hoạt ảnh, tối ưu FPS)"}
            >
              <Zap size={16} className={performanceMode ? "fill-yellow-400 text-yellow-500" : ""} />
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
            {isMapFullscreen && (
              <button
                className={cn(
                  "p-2.5 border rounded-xl shadow transition duration-200 cursor-pointer",
                  showBottomDashboard
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-850 text-blue-600 dark:text-blue-400"
                    : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800"
                )}
                onClick={() => setShowBottomDashboard(!showBottomDashboard)}
                title="Bảng giám sát trực tuyến"
              >
                <LayoutGrid size={16} />
              </button>
            )}
            <button
              className={cn(
                "p-2.5 border rounded-xl shadow transition duration-200 cursor-pointer",
                showUserLocation
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-850 text-blue-600 dark:text-blue-400"
                  : "bg-white dark:bg-gray-900 border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800"
              )}
              onClick={() => setShowUserLocation(!showUserLocation)}
              title={showUserLocation ? "Ẩn vị trí hiện tại" : "Hiện vị trí hiện tại"}
            >
              <Compass size={16} />
            </button>
            <button
              className="p-2.5 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow transition cursor-pointer"
              onClick={requestUserLocation}
              title="Định vị lại vị trí của tôi"
            >
              <Compass className="rotate-45 text-blue-500" size={16} />
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

                <button
                  onClick={() => {
                    resetCreateForm();
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full mb-3 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={12} /> Gửi SOS Khẩn Cấp
                </button>

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
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={showUserLocation} onChange={(e) => setShowUserLocation(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3 h-3" />
                          <span>Vị trí của tôi</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer col-span-2">
                          <input type="checkbox" checked={showResolvedSos} onChange={(e) => setShowResolvedSos(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-emerald-500 focus:ring-0 w-3 h-3" />
                          <span>SOS đã hoàn thành</span>
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
                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700 w-full">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={cn("px-1 py-0.2 text-[7px] font-black uppercase rounded border", badgeColors[sos.severity])}>
                                {sos.severity === 'CRITICAL' ? 'Nguy hiểm' : 'Cảnh báo'}
                              </span>
                              <span className={cn("px-1 py-0.2 text-[7px] font-black uppercase rounded border", statusBadgeColors[sos.status] || 'bg-slate-50 text-slate-650 border-slate-200')}>
                                {statusLabels[sos.status] || sos.status}
                              </span>
                              {sos.requiresEquipment && (
                                <span className="px-1 py-0.2 text-[7px] font-black uppercase bg-violet-50 text-violet-600 border border-violet-200 rounded animate-pulse" title="Cần thiết bị chuyên dụng">
                                  Thiết bị
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1.5 ml-auto">
                              <button onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSosId(sos.id);
                                setIsDetailModalOpen(true);
                              }} className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 rounded text-[8px] font-extrabold uppercase transition">
                                Chi tiết
                              </button>
                              {sos.status === 'PENDING' && (
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifySos(sos.id);
                                }} className="px-1.5 py-0.5 bg-red-650 hover:bg-red-700 text-white rounded text-[8px] font-extrabold uppercase transition">
                                  Điều phối
                                </button>
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
          )}

          {/* BOTTOM DASHBOARD OVERLAY IN FULLSCREEN */}
          {isMapFullscreen && showBottomDashboard && (
            <div
              className={cn(
                "absolute bottom-6 left-6 bg-white/95 dark:bg-gray-900/95 border border-slate-200 dark:border-slate-750 shadow-2xl rounded-2xl p-4 z-[1002] flex flex-col h-[320px] backdrop-blur transition-all duration-300 text-left text-gray-800 dark:text-white",
                showSidebar ? "right-[360px]" : "right-24"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                <div className="flex items-center gap-2 select-none font-sans">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Bảng giám sát cứu hộ trực tuyến</h4>
                </div>
                <button
                  onClick={() => setShowBottomDashboard(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-750 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded transition cursor-pointer"
                  title="Đóng bảng giám sát"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Grid 4 columns separated by vertical divider lines */}
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-x-3 flex-1 min-h-0 overflow-hidden">
                {/* Column 1: ĐỘI ĐANG RẢNH */}
                <div className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2 flex-shrink-0 select-none">
                    <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">ĐỘI ĐANG RẢNH</span>
                    <span className="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase">{availableTeams.length} đội</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2 pb-2">
                    {availableTeams.length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-semibold text-gray-400">Không có đội khả dụng</div>
                    ) : (
                      availableTeams.map((team) => (
                        <div key={team.id} className="flex flex-col gap-1.5 p-2 bg-slate-50/60 dark:bg-gray-800/40 rounded-xl hover:bg-slate-100/50 dark:hover:bg-gray-800/70 transition duration-155">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-extrabold text-[10.5px] text-gray-800 dark:text-slate-200 truncate">{team.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30 flex-shrink-0">Sẵn sàng</span>
                          </div>
                          
                          {/* Bottom Row */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100/30 dark:border-slate-800/30">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{team.distanceText.replace('Cách ', '')}</span>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-400 dark:text-gray-500">
                                <span className="flex items-center gap-0.5"><Users size={9} /> {(team as any).members ? (team as any).members.filter((m: any) => m.isActive).length : 0}</span>
                                <span className="flex items-center gap-0.5"><Truck size={9} /> {(team.id % 3) + 1}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))}
                              className="text-[9px] font-bold text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Divider 1 */}
                <div className="w-px bg-slate-200 dark:bg-slate-800/80 self-stretch my-2" />

                {/* Column 2: ĐỘI ĐÃ TIẾP NHẬN */}
                <div className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2 flex-shrink-0 select-none">
                    <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">ĐỘI ĐÃ TIẾP NHẬN</span>
                    <span className="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase">{activeTeams.length} đội</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2 pb-2">
                    {activeTeams.length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-semibold text-gray-400">Không có đội đang bận</div>
                    ) : (
                      activeTeams.map((team) => {
                        const activeSos = teamActiveSos.get(team.id);
                        return (
                          <div key={team.id} className="flex flex-col gap-1.5 p-2 bg-slate-50/60 dark:bg-gray-800/40 rounded-xl hover:bg-slate-100/50 dark:hover:bg-gray-800/70 transition duration-155">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="font-extrabold text-[10.5px] text-gray-800 dark:text-slate-200 truncate">{team.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-250 dark:border-blue-900/30 flex-shrink-0">
                                {activeSos?.status === 'DISPATCHED' ? 'Di chuyển' : activeSos?.status === 'ON_SITE' ? 'Tiếp cận' : 'Đang xử lý'}
                              </span>
                            </div>
                            
                            {/* Bottom Row */}
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100/30 dark:border-slate-800/30">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{team.distanceText.replace('Cách ', '')}</span>
                                <span className="text-[9px] font-extrabold text-red-500 truncate max-w-[80px]">{activeSos?.code || 'SOS-2026'}</span>
                              </div>
                              <button
                                onClick={() => navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))}
                                className="text-[9px] font-bold text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Divider 2 */}
                <div className="w-px bg-slate-200 dark:bg-slate-800/80 self-stretch my-2" />

                {/* Column 3: SOS MỚI */}
                <div className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2 flex-shrink-0 select-none">
                    <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">SOS MỚI</span>
                    <span className="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase">{newSosRequests.length} sự cố</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2 pb-2">
                    {newSosRequests.length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-semibold text-gray-400">Không có SOS mới</div>
                    ) : (
                      newSosRequests.map((sos) => (
                        <div key={sos.id} onClick={() => handleSelectSos(sos)} className="flex flex-col gap-1 p-2 bg-slate-50/60 dark:bg-gray-800/40 rounded-xl hover:bg-slate-100/50 dark:hover:bg-gray-800/70 cursor-pointer transition duration-155">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-extrabold text-[10.5px] text-red-500 flex-shrink-0">{sos.code}</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border flex-shrink-0",
                              sos.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30' :
                              sos.severity === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/30' :
                              'bg-yellow-50 text-yellow-600 border-yellow-250 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/30'
                            )}>
                              {sos.severity === 'CRITICAL' ? 'Nguy kịch' : sos.severity === 'HIGH' ? 'Khẩn cấp' : 'Trung bình'}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-gray-650 dark:text-slate-350 truncate text-left">{sos.location}</p>

                          {/* Bottom Row */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100/30 dark:border-slate-800/30">
                            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                              {Math.min(15, Math.max(1, (sos.id % 7) * 1.8 + 0.9)).toFixed(1)} km
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(ROUTES.DISASTER_DETAIL.replace(':id', String(sos.id)));
                              }}
                              className="text-[9px] font-bold text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Divider 3 */}
                <div className="w-px bg-slate-200 dark:bg-slate-800/80 self-stretch my-2" />

                {/* Column 4: SOS ĐANG TIẾP NHẬN */}
                <div className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2 flex-shrink-0 select-none">
                    <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">SOS ĐANG TIẾP NHẬN</span>
                    <span className="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase">{activeSosRequests.length} sự cố</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2 pb-2">
                    {activeSosRequests.length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-semibold text-gray-400">Không có SOS đang xử lý</div>
                    ) : (
                      activeSosRequests.map((sos) => (
                        <div key={sos.id} onClick={() => handleSelectSos(sos)} className="flex flex-col gap-1 p-2 bg-slate-50/60 dark:bg-gray-800/40 rounded-xl hover:bg-slate-100/50 dark:hover:bg-gray-800/70 cursor-pointer transition duration-155">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-extrabold text-[10.5px] text-red-500 flex-shrink-0">{sos.code}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-250 dark:border-blue-900/30 flex-shrink-0">
                              {sos.status === 'DISPATCHED' ? 'Di chuyển' : 'Tiếp cận'}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-gray-650 dark:text-slate-350 truncate text-left flex justify-between gap-2">
                            <span className="font-extrabold text-slate-700 dark:text-slate-350 truncate">{sos.assignedTeamName || 'Chưa gán'}</span>
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100/30 dark:border-slate-800/30">
                            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                              {Math.min(10, Math.max(1, (sos.id % 5) * 1.5 + 0.8)).toFixed(1)} km
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(ROUTES.DISASTER_DETAIL.replace(':id', String(sos.id)));
                              }}
                              className="text-[9px] font-bold text-indigo-650 hover:underline dark:text-indigo-400 cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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

              <button
                onClick={() => {
                  resetCreateForm();
                  setIsCreateModalOpen(true);
                }}
                className="w-full mb-3.5 py-2.5 px-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Gửi SOS Khẩn Cấp
              </button>

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
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition">
                        <input type="checkbox" checked={showCommandStations} onChange={(e) => setShowCommandStations(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>Trạm chỉ huy</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition">
                        <input type="checkbox" checked={showUserLocation} onChange={(e) => setShowUserLocation(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-3.5 h-3.5" />
                        <span>Vị trí của tôi</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition col-span-2">
                        <input type="checkbox" checked={showResolvedSos} onChange={(e) => setShowResolvedSos(e.target.checked)} className="rounded border-gray-300 dark:border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5" />
                        <span className="text-emerald-600 dark:text-emerald-400">SOS đã hoàn thành</span>
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
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-700 w-full">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={cn("px-1 py-0.2 text-[7px] font-black uppercase rounded border", badgeColors[sos.severity])}>
                              {sos.severity === 'CRITICAL' ? 'Nguy hiểm' : 'Cảnh báo'}
                            </span>
                            <span className={cn("px-1 py-0.2 text-[7px] font-black uppercase rounded border", statusBadgeColors[sos.status] || 'bg-slate-50 text-slate-650 border-slate-200')}>
                              {statusLabels[sos.status] || sos.status}
                            </span>
                            {sos.requiresEquipment && (
                              <span className="px-1 py-0.2 text-[7px] font-black uppercase bg-violet-50 text-violet-600 border border-violet-200 rounded animate-pulse" title="Cần thiết bị chuyên dụng">
                                Thiết bị
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 ml-auto">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSosId(sos.id);
                              setIsDetailModalOpen(true);
                            }} className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 rounded text-[8px] font-extrabold uppercase transition">
                              Chi tiết
                            </button>
                            {sos.status === 'PENDING' && (
                              <button onClick={(e) => {
                                e.stopPropagation();
                                handleVerifySos(sos.id);
                              }} className="px-2 py-0.5 bg-red-650 hover:bg-red-700 text-white rounded text-[8px] font-extrabold uppercase transition">
                                Điều phối
                              </button>
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
          <div className="flex flex-col gap-2 flex-1 justify-center">
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
          </div>
        </div>
      </div>

      {/* Floating alert banner when picking location on map */}
      {isPickingLocation && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[10000] bg-blue-600 border border-blue-500 text-white font-extrabold text-xs uppercase px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Compass className="animate-spin text-white" size={16} />
          <span>Click vào bất cứ điểm nào trên bản đồ để chọn tọa độ sự cố!</span>
        </div>
      )}

      {/* Create SOS Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-[#0d1527]">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Tạo Yêu Cầu SOS Khẩn Cấp Mới</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Hệ thống sẽ chạy thuật toán tự động điều phối v6 sau khi lưu.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-750 dark:hover:text-white rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Requester Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Tên người gửi SOS</label>
                  <input
                    type="text"
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-750 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newRequesterPhone}
                    onChange={(e) => setNewRequesterPhone(e.target.value)}
                    placeholder="0917234567"
                    className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-750 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Request Type and Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Loại sự cố</label>
                  <select
                    value={newRequestType}
                    onChange={(e) => setNewRequestType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-750 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="FLOOD">Ngập lụt (FLOOD)</option>
                    <option value="FIRE_FIGHTING">Hỏa hoạn (FIRE_FIGHTING)</option>
                    <option value="TRAFFIC_ACCIDENT">Tai nạn giao thông</option>
                    <option value="MEDICAL_EMERGENCY">Y tế khẩn cấp</option>
                    <option value="NATURAL_DISASTER">Thiên tai khẩn cấp</option>
                    <option value="OTHER">Khác (OTHER)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Mức độ nghiêm trọng</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-750 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="CRITICAL">Nguy hiểm cực cao (CRITICAL)</option>
                    <option value="HIGH">Cảnh báo cao (HIGH)</option>
                    <option value="MEDIUM">Ngập nhẹ / Vừa (MEDIUM)</option>
                    <option value="LOW">An toàn / Thấp (LOW)</option>
                  </select>
                </div>
              </div>

              {/* Coordinates Picker */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Tọa độ hiện trường</label>
                <div className="flex gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-gray-750 dark:text-gray-300">
                      Lng: {newLongitude.toFixed(5)}
                    </div>
                    <div className="bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-gray-750 dark:text-gray-300">
                      Lat: {newLatitude.toFixed(5)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsPickingLocation(true);
                      toast.info("Vui lòng click 1 điểm trên bản đồ để chọn tọa độ!");
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
                  >
                    <Compass size={14} /> Chọn trên bản đồ
                  </button>
                </div>
              </div>

              {/* Trapped People and Special equipment */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Số người bị nạn</label>
                  <input
                    type="number"
                    min={1}
                    value={newTrappedPeopleCount}
                    onChange={(e) => setNewTrappedPeopleCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-705 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Requires Special Equipment Checkbox */}
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="requiresEquipment"
                    checked={newRequiresEquipment}
                    onChange={(e) => setNewRequiresEquipment(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-350 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="requiresEquipment" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    Cần thiết bị chuyên dụng
                  </label>
                </div>
              </div>

              {/* Special Needs Tags */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Đối tượng cần lưu ý</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    { code: 'ELDERLY', label: 'Elderly (Người già)' },
                    { code: 'CHILD', label: 'Child (Trẻ em)' },
                    { code: 'PREGNANT', label: 'Pregnant (Bà bầu)' },
                    { code: 'DISABLED', label: 'Disabled (Khuyết tật)' },
                  ].map((tag) => {
                    const isSelected = newSpecialNeedsTags.includes(tag.code);
                    return (
                      <button
                        key={tag.code}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewSpecialNeedsTags(newSpecialNeedsTags.filter(t => t !== tag.code));
                          } else {
                            setNewSpecialNeedsTags([...newSpecialNeedsTags, tag.code]);
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition",
                          isSelected
                            ? "bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400"
                            : "bg-white border-slate-200 text-gray-500 dark:bg-transparent dark:border-slate-800 dark:text-gray-450 hover:bg-slate-50"
                        )}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Mô tả chi tiết</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả cụ thể tình hình và yêu cầu hỗ trợ..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-gray-755 dark:text-gray-300 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#0d1527] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-350 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newRequesterName || !newRequesterPhone) {
                    toast.error("Vui lòng điền tên và số điện thoại người gửi!");
                    return;
                  }
                  createSosMutation.mutate({
                    requesterName: newRequesterName,
                    requesterPhone: newRequesterPhone,
                    requestType: newRequestType,
                    severity: newSeverity as any,
                    description: newDescription,
                    trappedPeopleCount: newTrappedPeopleCount,
                    requiresEquipment: newRequiresEquipment,
                    specialNeedsTags: newSpecialNeedsTags,
                    latitude: newLatitude,
                    longitude: newLongitude,
                    provinceId: user?.provinceId || 1,
                    imageUrls: ['https://storage.rescue.gov.vn/sos/img.jpg'], // fallback
                  });
                }}
                disabled={createSosMutation.isPending}
                className="px-5 py-2 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                {createSosMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu SOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedSosId && (
        <SosDetailModal
          id={selectedSosId}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
}
