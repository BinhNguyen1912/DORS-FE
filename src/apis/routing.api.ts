import api from '../lib/axios';

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: RouteCoordinates[]; // Danh sách tọa độ lat-lng đường đi thực tế
  distanceKm: number;              // Khoảng cách thực tế (km)
  durationMin: number;             // Thời gian di chuyển (phút)
}

export interface CalculateRouteResponse {
  success: boolean;
  data: {
    primary: RouteResult;
    dijkstra: RouteResult | null;
    isIsolated?: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gọi OSRM Public Demo API trực tiếp từ browser
// Không cần API key, không cần backend, đường đi theo đường bộ thực tế
// Docs: http://project-osrm.org/docs/v5.22.0/api/
// ─────────────────────────────────────────────────────────────────────────────
async function fetchOsrmRoute(
  start: RouteCoordinates,
  end: RouteCoordinates,
): Promise<RouteResult> {
  // OSRM nhận tọa độ theo thứ tự: lng,lat (GeoJSON convention)
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.longitude},${start.latitude};${end.longitude},${end.latitude}` +
    `?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('OSRM: Không tìm thấy tuyến đường');
  }

  const route = data.routes[0];

  // GeoJSON coordinates: [lng, lat] → chuyển về { latitude, longitude }
  const coordinates: RouteCoordinates[] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
  );

  return {
    coordinates,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

export const routingApi = {
  /**
   * Tính toán đường đi thực tế theo đường bộ.
   *
   * Chiến lược:
   * 1. Gọi OSRM Public API trực tiếp từ browser (không cần API key)
   * 2. Nếu OSRM fail (timeout, mạng yếu...) → gọi backend NestJS fallback
   */
  calculateRoute: async (
    start: RouteCoordinates,
    end: RouteCoordinates,
    avoidPolygons?: any[],
    profile?: 'car' | 'foot' | 'boat',
  ): Promise<{ primary: RouteResult; dijkstra: RouteResult | null; isIsolated?: boolean }> => {

    // ── Thử OSRM trước ─────────────────────────────────────────────────────
    try {
      const osrmRoute = await fetchOsrmRoute(start, end);
      return {
        primary: osrmRoute,
        dijkstra: null,   // OSRM đã là đường bộ thực tế, không cần đường phụ
        isIsolated: false,
      };
    } catch (osrmErr) {
      console.warn('[Routing] OSRM failed, falling back to backend:', osrmErr);
    }

    // ── Fallback: gọi backend NestJS ────────────────────────────────────────
    const response = await api.post<CalculateRouteResponse>('/routing/calculate', {
      start,
      end,
      avoidPolygons,
      profile,
    });
    return response.data.data;
  },
};
