import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { toast } from '../../stores';
import type { Province, AdministrativeUnit } from '../../types';

interface LocationPickerMapProps {
  latitude?: string;
  longitude?: string;
  onChange: (lat: string, lng: string) => void;
  isResolvingLocation?: boolean;
  provinceId?: number;
  adminUnitId?: string;
  provinces: Province[];
  wards: AdministrativeUnit[];
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  isResolvingLocation = false,
  provinceId,
  adminUnitId,
  provinces,
  wards,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [mapSearch, setMapSearch] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = latitude ? Number(latitude) : 16.0544;
    const initialLng = longitude ? Number(longitude) : 108.2022;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    const getIcon = () => {
      return L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-7 h-7 bg-indigo-500 rounded-full opacity-25 animate-pulse"></div>
            <div class="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md border border-white text-[10px]">
              <i class="fa-solid fa-location-dot"></i>
            </div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    const marker = L.marker([initialLat, initialLng], {
      icon: getIcon(),
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(position.lat.toFixed(6), position.lng.toFixed(6));
    });

    map.on('click', (e) => {
      const position = e.latlng;
      marker.setLatLng(position);
      onChange(position.lat.toFixed(6), position.lng.toFixed(6));
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position if latitude/longitude change from outside (e.g. geocoder)
  useEffect(() => {
    if (mapRef.current && markerRef.current && latitude && longitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const currentLatLng = markerRef.current.getLatLng();
        if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 14);
        }
      }
    }
  }, [latitude, longitude]);

  // Geocode when Province / Ward changes
  useEffect(() => {
    if (!provinceId) return;

    const selectedProvince = provinces.find((p) => p.id === provinceId)?.name || '';
    const selectedWard = wards.find((w) => String(w.id) === String(adminUnitId))?.name || '';

    if (!selectedProvince) return;

    const searchQuery = `${selectedWard ? selectedWard + ', ' : ''}${selectedProvince}, Việt Nam`;

    const autoGeocode = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          onChange(lat.toFixed(6), lon.toFixed(6));
        }
      } catch (err) {
        console.error('Lỗi khi tự động định vị địa chỉ:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      autoGeocode();
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [provinceId, adminUnitId, provinces, wards]);

  const handleSearchLocation = async () => {
    if (!mapSearch.trim()) return;
    setIsSearchingMap(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearch
        )}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        onChange(lat.toFixed(6), lon.toFixed(6));
        toast.success(`Đã tìm thấy vị trí: ${data[0].display_name}`);
      } else {
        toast.error('Không tìm thấy địa điểm này trên bản đồ.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tìm kiếm vị trí.');
    } finally {
      setIsSearchingMap(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-gray-700 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin size={16} className="text-indigo-600" />
            Vị trí đội cứu hộ
          </h3>
          <p className="text-[11px] text-gray-500">
            Tìm kiếm địa chỉ hoặc click/kéo ghim trên bản đồ để chọn tọa độ
          </p>
        </div>
      </div>

      {/* Map Search Box */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nhập địa điểm để tìm kiếm trên bản đồ (Ví dụ: Phường Hòa Khánh Nam, Liên Chiểu)..."
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchLocation();
            }
          }}
          className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="button"
          onClick={handleSearchLocation}
          disabled={isSearchingMap}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-gray-400 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border border-indigo-100"
        >
          {isSearchingMap ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          <span>Tìm</span>
        </button>
      </div>

      {/* Interactive Map */}
      <div className="relative h-[300px] w-full rounded-xl overflow-hidden border border-slate-150 dark:border-gray-700 z-10">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
        {/* Resolving overlay */}
        {isResolvingLocation && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20 rounded-xl">
            <Loader2 className="animate-spin text-indigo-600" size={26} />
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Đang xác định đơn vị hành chính...
            </p>
          </div>
        )}
      </div>

      {/* Coordinates readouts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Vĩ độ (Latitude)</label>
          <input
            type="text"
            readOnly
            value={latitude || ''}
            className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700 bg-slate-100/60 dark:bg-gray-950 text-gray-500 cursor-not-allowed font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Kinh độ (Longitude)</label>
          <input
            type="text"
            readOnly
            value={longitude || ''}
            className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-gray-700 bg-slate-100/60 dark:bg-gray-950 text-gray-500 cursor-not-allowed font-mono"
          />
        </div>
      </div>

      {/* Auto-resolve status */}
      {latitude && longitude && !isResolvingLocation && (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle size={13} />
          <p className="text-[10px] font-bold">
            Tọa độ đã được xác định — Tỉnh/Xã sẽ tự động điền
          </p>
        </div>
      )}
    </div>
  );
}
