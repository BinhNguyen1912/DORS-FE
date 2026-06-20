import { useState, useEffect } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { toast } from '../../../stores';
import { settingsApi } from '../../../apis';

export default function GeneralTab() {
  const [systemName, setSystemName] = useState('Cứu hộ Việt Nam');
  const [systemCode, setSystemCode] = useState('RESCUE-VN');
  const [systemVersion, setSystemVersion] = useState('1.0.0');
  const [systemDescription, setSystemDescription] = useState('Hệ thống quản lý cứu hộ và ứng phó thiên tai');
  const [defaultLanguage, setDefaultLanguage] = useState('vi');
  const [timezone, setTimezone] = useState('GMT+7');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [defaultPageSize, setDefaultPageSize] = useState(20);
  const [copyright, setCopyright] = useState('© 2026 Cứu Hộ Việt Nam. All rights reserved.');
  const [website, setWebsite] = useState('https://cuuhovietnam.gov.vn');
  const [supportEmail, setSupportEmail] = useState('support@cuuhovietnam.gov.vn');
  const [supportHotline, setSupportHotline] = useState('1900 1234');
  const [logoName, setLogoName] = useState('logo.png');
  const [faviconName, setFaviconName] = useState('favicon.ico');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        if (data['system.name']) setSystemName(data['system.name']);
        if (data['system.code']) setSystemCode(data['system.code']);
        if (data['system.description']) setSystemDescription(data['system.description']);
        if (data['system.language']) setDefaultLanguage(data['system.language']);
        if (data['system.timezone']) setTimezone(data['system.timezone']);
        if (data['system.date_format']) setDateFormat(data['system.date_format']);
        if (data['system.time_format']) setTimeFormat(data['system.time_format']);
        if (data['system.page_size']) setDefaultPageSize(parseInt(data['system.page_size'], 10) || 20);
        if (data['system.logo']) setLogoName(data['system.logo']);
        if (data['system.favicon']) setFaviconName(data['system.favicon']);
        if (data['system.copyright']) setCopyright(data['system.copyright']);
        if (data['system.website']) setWebsite(data['system.website']);
        if (data['system.support_email']) setSupportEmail(data['system.support_email']);
        if (data['system.support_hotline']) setSupportHotline(data['system.support_hotline']);
      } catch (err) {
        console.error('Error loading general settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsApi.updateSettings({
        'system.name': systemName,
        'system.code': systemCode,
        'system.description': systemDescription,
        'system.language': defaultLanguage,
        'system.timezone': timezone,
        'system.date_format': dateFormat,
        'system.time_format': timeFormat,
        'system.page_size': String(defaultPageSize),
        'system.logo': logoName,
        'system.favicon': faviconName,
        'system.copyright': copyright,
        'system.website': website,
        'system.support_email': supportEmail,
        'system.support_hotline': supportHotline,
      });
      toast.success('Cập nhật cấu hình thông tin chung thành công!');
    } catch (err) {
      toast.error('Không thể cập nhật cấu hình!');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoName(file.name);
      toast.success(`Đã chọn file logo: ${file.name}`);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconName(file.name);
      toast.success(`Đã chọn file favicon: ${file.name}`);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Thông tin chung
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Thiết lập các thông tin cơ bản và thông tin liên hệ của hệ thống
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
        {/* Nhóm Thông tin hệ thống */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Thông tin hệ thống
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Tên hệ thống <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="text"
                required
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Mã hệ thống <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="text"
                required
                value={systemCode}
                onChange={(e) => setSystemCode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Phiên bản <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="text"
                required
                value={systemVersion}
                onChange={(e) => setSystemVersion(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-black dark:text-white">
              Mô tả hệ thống
            </label>
            <textarea
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold resize-none"
            />
          </div>
        </div>

        {/* Nhóm Định dạng & Ngôn ngữ */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Cài đặt khu vực & định dạng
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Ngôn ngữ mặc định
              </label>
              <div className="relative">
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Múi giờ
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="GMT+7">(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                  <option value="GMT+8">(UTC+08:00) Singapore, Kuala Lumpur, Beijing</option>
                  <option value="GMT+9">(UTC+09:00) Tokyo, Seoul</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Định dạng ngày
              </label>
              <div className="relative">
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Định dạng giờ
              </label>
              <div className="relative">
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="24h">24 giờ</option>
                  <option value="12h">12 giờ (AM/PM)</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Số lượng bản ghi hiển thị mặc định
              </label>
              <input
                type="number"
                value={defaultPageSize}
                onChange={(e) => setDefaultPageSize(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Nhóm Hỗ trợ & Thông tin liên hệ */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Thông tin liên hệ & Hỗ trợ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Trang web (Website)
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Email hỗ trợ
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Hotline hỗ trợ kỹ thuật
              </label>
              <input
                type="text"
                value={supportHotline}
                onChange={(e) => setSupportHotline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Bản quyền hệ thống (Copyright)
              </label>
              <input
                type="text"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Nhóm Logo & Favicon */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Hình ảnh thương hiệu (Logo & Favicon)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Logo hệ thống
              </label>
              <div className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white">
                <label className="px-3 py-1 bg-white hover:bg-gray-50 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 dark:border-gray-700 dark:text-gray-300 flex-shrink-0 transition-colors">
                  Chọn file
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold truncate">
                  {logoName}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Favicon
              </label>
              <div className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white">
                <label className="px-3 py-1 bg-white hover:bg-gray-50 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 dark:border-gray-700 dark:text-gray-300 flex-shrink-0 transition-colors">
                  Chọn file
                  <input
                    type="file"
                    accept=".ico,image/png"
                    onChange={handleFaviconChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold truncate">
                  {faviconName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
