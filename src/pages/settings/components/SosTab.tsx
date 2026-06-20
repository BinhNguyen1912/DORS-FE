import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from '../../../stores';
import { settingsApi } from '../../../apis';

export default function SosTab() {
  // SOS States
  const [expiryTime, setExpiryTime] = useState(120); // minutes
  const [searchRadius, setSearchRadius] = useState(15); // km
  const [retryCount, setRetryCount] = useState(3);
  const [autoClose, setAutoClose] = useState(true);
  const [allowHardwareSos, setAllowHardwareSos] = useState(true);
  const [allowAppSos, setAllowAppSos] = useState(true);

  // Dispatch States
  const [maxTeamsPerSos, setMaxTeamsPerSos] = useState(3);
  const [prioritizeNearest, setPrioritizeNearest] = useState(true);
  const [prioritizeSpecialty, setPrioritizeSpecialty] = useState(true);
  const [allowInterProvince, setAllowInterProvince] = useState(false);

  // Severity Threshold States
  const [criticalTime, setCriticalTime] = useState(15); // mins
  const [highTime, setHighTime] = useState(30);
  const [mediumTime, setMediumTime] = useState(60);
  const [lowTime, setLowTime] = useState(120);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        if (data['sos.expiry_time']) setExpiryTime(parseInt(data['sos.expiry_time'], 10) || 120);
        if (data['sos.search_radius']) setSearchRadius(parseInt(data['sos.search_radius'], 10) || 15);
        if (data['sos.retry_count']) setRetryCount(parseInt(data['sos.retry_count'], 10) || 3);
        if (data['sos.auto_close']) setAutoClose(data['sos.auto_close'] === 'true');
        if (data['sos.allow_hardware']) setAllowHardwareSos(data['sos.allow_hardware'] === 'true');
        if (data['sos.allow_app']) setAllowAppSos(data['sos.allow_app'] === 'true');
        if (data['dispatch.max_teams']) setMaxTeamsPerSos(parseInt(data['dispatch.max_teams'], 10) || 3);
        if (data['dispatch.prioritize_nearest']) setPrioritizeNearest(data['dispatch.prioritize_nearest'] === 'true');
        if (data['dispatch.prioritize_specialty']) setPrioritizeSpecialty(data['dispatch.prioritize_specialty'] === 'true');
        if (data['dispatch.allow_inter_province']) setAllowInterProvince(data['dispatch.allow_inter_province'] === 'true');
        if (data['severity.critical']) setCriticalTime(parseInt(data['severity.critical'], 10) || 15);
        if (data['severity.high']) setHighTime(parseInt(data['severity.high'], 10) || 30);
        if (data['severity.medium']) setMediumTime(parseInt(data['severity.medium'], 10) || 60);
        if (data['severity.low']) setLowTime(parseInt(data['severity.low'], 10) || 120);
      } catch (err) {
        console.error('Error loading SOS settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsApi.updateSettings({
        'sos.expiry_time': String(expiryTime),
        'sos.search_radius': String(searchRadius),
        'sos.retry_count': String(retryCount),
        'sos.auto_close': String(autoClose),
        'sos.allow_hardware': String(allowHardwareSos),
        'sos.allow_app': String(allowAppSos),
        'dispatch.max_teams': String(maxTeamsPerSos),
        'dispatch.prioritize_nearest': String(prioritizeNearest),
        'dispatch.prioritize_specialty': String(prioritizeSpecialty),
        'dispatch.allow_inter_province': String(allowInterProvince),
        'severity.critical': String(criticalTime),
        'severity.high': String(highTime),
        'severity.medium': String(mediumTime),
        'severity.low': String(lowTime),
      });
      toast.success('Cập nhật cấu hình SOS & Điều phối khẩn cấp thành công!');
    } catch (err) {
      toast.error('Không thể cập nhật cấu hình!');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button Header */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            SOS & Điều phối cứu nạn
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Cấu hình thời gian phản hồi sự cố SOS, thuật toán tìm kiếm và điều phối đội cứu hộ tối ưu địa bàn
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
        {/* Nhóm SOS khẩn cấp */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Thiết lập tín hiệu SOS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Thời gian SOS hết hạn (phút) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={expiryTime}
                onChange={(e) => setExpiryTime(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Bán kính quét tìm đội (km) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Số lần phát lại tín hiệu (Retry) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={retryCount}
                onChange={(e) => setRetryCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Tự động đóng */}
            <div className="flex items-center justify-between p-3 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">Tự động lưu trữ SOS đã xử lý</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Hardware SOS */}
            <div className="flex items-center justify-between p-3 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">SOS từ thiết bị IoT (nút ấn cứng)</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowHardwareSos}
                  onChange={(e) => setAllowHardwareSos(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Mobile App SOS */}
            <div className="flex items-center justify-between p-3 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">SOS từ ứng dụng di động</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowAppSos}
                  onChange={(e) => setAllowAppSos(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Nhóm Điều phối Cứu hộ */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Quy tắc Điều phối nhân lực
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Số lượng đội cứu hộ tối đa tham gia xử lý 1 sự cố
              </label>
              <input
                type="number"
                value={maxTeamsPerSos}
                onChange={(e) => setMaxTeamsPerSos(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            {/* Inter-province dispatch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl mt-4">
              <span className="font-bold text-black dark:text-white">
                Cho phép điều phối liên tỉnh (liên vùng chi viện)
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowInterProvince}
                  onChange={(e) => setAllowInterProvince(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Prioritize nearest */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">
                Ưu tiên đề xuất Đội cứu hộ gần hiện trường nhất
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prioritizeNearest}
                  onChange={(e) => setPrioritizeNearest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Prioritize specialty */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">
                Ưu tiên lọc Đội theo tính chất chuyên môn (y tế, cứu sập, bơi lặn)
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prioritizeSpecialty}
                  onChange={(e) => setPrioritizeSpecialty(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Nhóm Cảnh báo Độ nghiêm trọng (Severity Thresholds) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Thời gian phản hồi quy chuẩn theo Mức độ nghiêm trọng (SLA)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-red-500">
                CRITICAL (Khẩn cấp cao) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={criticalTime}
                onChange={(e) => setCriticalTime(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-amber-500">
                HIGH (Cao) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={highTime}
                onChange={(e) => setHighTime(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-blue-500">
                MEDIUM (Trung bình) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={mediumTime}
                onChange={(e) => setMediumTime(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-teal-500">
                LOW (Thấp) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={lowTime}
                onChange={(e) => setLowTime(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
