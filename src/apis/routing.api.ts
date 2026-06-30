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

export const routingApi = {
  /**
   * Gọi backend NestJS để tính toán đường đi cứu trợ tránh ngập lụt
   * @param start Tọa độ điểm đi
   * @param end Tọa độ điểm đến
   * @param avoidPolygons Các đa giác ngập lụt hiện tại
   * @param profile Phương tiện di chuyển (car | foot | boat)
   */
  calculateRoute: async (
    start: RouteCoordinates,
    end: RouteCoordinates,
    avoidPolygons?: any[],
    profile?: 'car' | 'foot' | 'boat'
  ): Promise<{ primary: RouteResult; dijkstra: RouteResult | null; isIsolated?: boolean }> => {
    const response = await api.post<CalculateRouteResponse>('/routing/calculate', {
      start,
      end,
      avoidPolygons,
      profile,
    });
    return response.data.data;
  },
};
