import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from '../../../stores';

export default function ApiTab() {
  // Web API Configs
  const [apiKey, setApiKey] = useState('cuuhovn_api_key_8f7d93ac2b8d41a');
  const [webhookUrl, setWebhookUrl] = useState('https://notify.cuuhovietnam.gov.vn/webhooks/sos');
  const [rateLimit, setRateLimit] = useState(100); // req/min
  const [ipWhitelist, setIpWhitelist] = useState('127.0.0.1, 10.0.0.0/8, 172.16.0.0/12');

  // GIS Configs
  const [geoserverUrl, setGeoserverUrl] = useState('https://gis.cuuhovietnam.gov.vn/geoserver');
  const [wmsUrl, setWmsUrl] = useState('https://gis.cuuhovietnam.gov.vn/geoserver/cuuhovn/wms');
  const [wfsUrl, setWfsUrl] = useState('https://gis.cuuhovietnam.gov.vn/geoserver/cuuhovn/wfs');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật cấu hình tích hợp API & GIS thành công!');
  };

  const handleRegenKey = () => {
    toast.success('Đang tạo mới API Access Key dự phòng...');
    setTimeout(() => {
      setApiKey('cuuhovn_api_key_' + Math.random().toString(36).substring(2, 17));
      toast.success('Đã làm mới API Access Key!');
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Tích hợp & API hệ thống
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Quản lý API Access Token cấp cho các hệ thống ngoại vi, Webhook đồng bộ và kết nối bản đồ số GeoServer
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
        {/* Nhóm Web API */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Cấu hình cổng giao tiếp Web API
          </h3>

          <div className="space-y-1.5">
            <label className="block font-bold text-black dark:text-white">
              API Access Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiKey}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-gray-900 text-gray-650 dark:text-gray-300 font-mono font-semibold"
              />
              <button
                type="button"
                onClick={handleRegenKey}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-black dark:text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Làm mới Key
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Đồng bộ Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Tần suất giới hạn cuộc gọi (Rate Limit - req/min) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={rateLimit}
                onChange={(e) => setRateLimit(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-black dark:text-white">
              Danh sách trắng IP (IP Whitelist - Phân cách bằng dấu phẩy)
            </label>
            <textarea
              value={ipWhitelist}
              onChange={(e) => setIpWhitelist(e.target.value)}
              rows={1.5}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold resize-none"
            />
          </div>
        </div>

        {/* Nhóm GIS Map Server */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Cấu hình cổng kết nối bản đồ số (GIS GeoServer)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                GeoServer Endpoint
              </label>
              <input
                type="url"
                value={geoserverUrl}
                onChange={(e) => setGeoserverUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                WMS Layer URL
              </label>
              <input
                type="url"
                value={wmsUrl}
                onChange={(e) => setWmsUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                WFS Layer URL
              </label>
              <input
                type="url"
                value={wfsUrl}
                onChange={(e) => setWfsUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
