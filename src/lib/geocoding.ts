/**
 * Geocoding adapter — hỗ trợ Goong Maps và Nominatim (fallback).
 * Cấu hình qua .env:
 *   VITE_GEOCODING_PROVIDER=goong | nominatim
 *   VITE_GOONG_API_KEY=<key>
 */

export interface GeocodingResult {
  /** Địa chỉ đầy đủ hiển thị */
  displayName: string;
  /** Tên ngắn (tên đường / POI) */
  shortName: string;
  /** Phần phụ (quận, thành phố) */
  secondary: string;
  lat: number;
  lng: number;
}

// ── Goong Maps ────────────────────────────────────────────────────────────────

interface GoongPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoongDetailResult {
  result: {
    geometry: { location: { lat: number; lng: number } };
  };
}

async function searchGoong(query: string): Promise<GeocodingResult[]> {
  const apiKey = import.meta.env.VITE_GOONG_API_KEY;
  if (!apiKey || apiKey === 'your_goong_api_key_here') {
    console.warn('[Geocoding] Goong API key chưa được cấu hình trong .env');
    return [];
  }

  const autocompleteUrl = `https://rsapi.goong.io/Place/AutoComplete?api_key=${apiKey}&input=${encodeURIComponent(query)}`;
  const acRes = await fetch(autocompleteUrl);
  if (!acRes.ok) throw new Error('Goong AutoComplete API error');
  const acData = await acRes.json();

  const predictions: GoongPrediction[] = acData.predictions || [];

  // Lấy lat/lng cho từng kết quả bằng Place Detail
  const results = await Promise.all(
    predictions.slice(0, 6).map(async (p) => {
      try {
        const detailUrl = `https://rsapi.goong.io/Place/Detail?place_id=${p.place_id}&api_key=${apiKey}`;
        const dRes = await fetch(detailUrl);
        const dData: GoongDetailResult = await dRes.json();
        const { lat, lng } = dData.result.geometry.location;
        return {
          displayName: p.description,
          shortName: p.structured_formatting.main_text,
          secondary: p.structured_formatting.secondary_text,
          lat,
          lng,
        } satisfies GeocodingResult;
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean) as GeocodingResult[];
}

// ── Nominatim (OpenStreetMap) ─────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    city_district?: string;
    county?: string;
    state?: string;
  };
}

async function searchNominatim(query: string): Promise<GeocodingResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=6&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'vi', 'User-Agent': 'RescueSystemApp/1.0' },
  });
  if (!res.ok) throw new Error('Nominatim API error');
  const data: NominatimResult[] = await res.json();

  return data.map((item) => {
    const parts = item.display_name.split(', ');
    const shortName = item.address?.road || item.name || parts[0];
    const secondary = parts.slice(1, 4).join(', ');
    return {
      displayName: item.display_name,
      shortName,
      secondary,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Tìm kiếm địa chỉ theo query string.
 * Provider được xác định từ VITE_GEOCODING_PROVIDER.
 */
export async function searchAddress(query: string, provinceName?: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 3) return [];

  const provider = (import.meta.env.VITE_GEOCODING_PROVIDER || 'goong').toLowerCase();

  // Thêm tên tỉnh/thành phố vào cuối query để khoanh vùng kết quả tìm kiếm tốt hơn
  const finalQuery = provinceName ? `${query}, ${provinceName}` : query;

  try {
    if (provider === 'goong') {
      return await searchGoong(finalQuery);
    }
    // Fallback to Nominatim
    return await searchNominatim(finalQuery);
  } catch (err) {
    console.error('[Geocoding] Lỗi tìm kiếm địa chỉ:', err);
    return [];
  }
}
