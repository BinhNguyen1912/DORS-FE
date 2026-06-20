import { useState, useEffect } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { toast } from '../../../stores';
import { settingsApi } from '../../../apis';

export default function MapTab() {
  const [coordinateSystem, setCoordinateSystem] = useState('EPSG:4326');
  const [mapProvider, setMapProvider] = useState('OpenStreetMap');
  const [mapboxApiKey, setMapboxApiKey] = useState('');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [defaultZoom, setDefaultZoom] = useState(13);
  const [autoRefreshGps, setAutoRefreshGps] = useState(true);
  const [gpsUpdateInterval, setGpsUpdateInterval] = useState(15); // seconds
  
  // Geofence States
  const [enableGeofence, setEnableGeofence] = useState(true);
  const [warningRadius, setWarningRadius] = useState(500); // meters
  const [breachDistance, setBreachDistance] = useState(100); // meters

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        if (data['map.coordinate_system']) setCoordinateSystem(data['map.coordinate_system']);
        if (data['map.provider']) setMapProvider(data['map.provider']);
        if (data['map.update_frequency']) setGpsUpdateInterval(parseInt(data['map.update_frequency'], 10) || 15);
        if (data['map.auto_refresh']) setAutoRefreshGps(data['map.auto_refresh'] === 'true');
        if (data['geofence.enable']) setEnableGeofence(data['geofence.enable'] === 'true');
        if (data['geofence.warning_radius']) setWarningRadius(parseInt(data['geofence.warning_radius'], 10) || 500);
        if (data['geofence.breach_distance']) setBreachDistance(parseInt(data['geofence.breach_distance'], 10) || 100);
      } catch (err) {
        console.error('Error loading Map settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsApi.updateSettings({
        'map.coordinate_system': coordinateSystem,
        'map.provider': mapProvider,
        'map.update_frequency': String(gpsUpdateInterval),
        'map.auto_refresh': String(autoRefreshGps),
        'geofence.enable': String(enableGeofence),
        'geofence.warning_radius': String(warningRadius),
        'geofence.breach_distance': String(breachDistance),
      });
      toast.success('Cập nhật cấu hình Bản đồ & GIS thành công!');
    } catch (err) {
      toast.error('Không thể cập nhật cấu hình!');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Định vị & Bản đồ (GIS)
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Thiết lập nhà cung cấp bản đồ nền, tần suất đồng bộ vị trí GPS và cấu hình hàng rào địa lý cảnh báo (Geofence)
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer"
        >
          <Save size={14} />
          Lưu thay đổi
        </button>
      </div>

      <div className="space-y-5 text-xs text-black dark:text-white">
        {/* Nhóm Bản đồ nền & Hệ tọa độ */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Cấu hình Hệ bản đồ nền (Map Provider)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Hệ tọa độ quốc tế <span className="text-red-500 ml-1">(*)</span>
              </label>
              <div className="relative">
                <select
                  value={coordinateSystem}
                  onChange={(e) => setCoordinateSystem(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="EPSG:4326">WGS 84 (EPSG:4326)</option>
                  <option value="EPSG:3857">Web Mercator (EPSG:3857)</option>
                  <option value="EPSG:3405">VN-2000 (EPSG:3405)</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Nhà cung cấp bản đồ (Map Provider) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <div className="relative">
                <select
                  value={mapProvider}
                  onChange={(e) => setMapProvider(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="OpenStreetMap">OpenStreetMap (Miễn phí)</option>
                  <option value="Google">Google Maps API</option>
                  <option value="Mapbox">Mapbox Studio</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Mức zoom mặc định (Default Zoom)
              </label>
              <input
                type="number"
                value={defaultZoom}
                onChange={(e) => setDefaultZoom(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          {/* Conditional provider inputs */}
          {mapProvider === 'Mapbox' && (
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Mapbox Access Token <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="password"
                required
                value={mapboxApiKey}
                placeholder="pk.eyJ1..."
                onChange={(e) => setMapboxApiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          )}

          {mapProvider === 'Google' && (
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Google Maps Javascript API Key <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="password"
                required
                value={googleMapsApiKey}
                placeholder="AIzaSy..."
                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          )}
        </div>

        {/* Nhóm Đồng bộ GPS */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Đồng bộ vị trí GPS trực tuyến
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Tần suất cập nhật tọa độ (giây) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={gpsUpdateInterval}
                onChange={(e) => setGpsUpdateInterval(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl mt-4">
              <span className="font-bold text-black dark:text-white">
                Tự động làm mới bản đồ điều phối khi có tọa độ mới
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefreshGps}
                  onChange={(e) => setAutoRefreshGps(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Nhóm Hàng rào địa lý (Geofencing) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none">
              Hàng rào địa lý cứu trợ (Geofencing)
            </h3>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableGeofence}
                onChange={(e) => setEnableGeofence(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          {enableGeofence && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-black dark:text-white">
                  Bán kính cảnh báo nguy hiểm (mét) <span className="text-red-500 ml-1">(*)</span>
                </label>
                <input
                  type="number"
                  required
                  value={warningRadius}
                  onChange={(e) => setWarningRadius(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-black dark:text-white">
                  Khoảng cách phát hiện vượt vùng an toàn (mét) <span className="text-red-500 ml-1">(*)</span>
                </label>
                <input
                  type="number"
                  required
                  value={breachDistance}
                  onChange={(e) => setBreachDistance(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
