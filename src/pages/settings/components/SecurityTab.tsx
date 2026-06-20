import { useState, useEffect } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { toast } from '../../../stores';
import { settingsApi } from '../../../apis';

export default function SecurityTab() {
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [otpExpiration, setOtpExpiration] = useState(5); // minutes
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState('15m');
  const [allowConcurrent, setAllowConcurrent] = useState(true);
  const [enable2FA, setEnable2FA] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        if (data['auth.password.min_length']) setMinPasswordLength(parseInt(data['auth.password.min_length'], 10) || 8);
        if (data['auth.lockout_duration']) setLockoutDuration(data['auth.lockout_duration']);
        if (data['auth.max_attempts']) setMaxLoginAttempts(parseInt(data['auth.max_attempts'], 10) || 5);
        if (data['auth.allow_concurrent']) setAllowConcurrent(data['auth.allow_concurrent'] === 'true');
        if (data['auth.enable_2fa']) setEnable2FA(data['auth.enable_2fa'] === 'true');
      } catch (err) {
        console.error('Error loading security settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsApi.updateSettings({
        'auth.password.min_length': String(minPasswordLength),
        'auth.lockout_duration': lockoutDuration,
        'auth.max_attempts': String(maxLoginAttempts),
        'auth.allow_concurrent': String(allowConcurrent),
        'auth.enable_2fa': String(enable2FA),
      });
      toast.success('Cập nhật cấu hình bảo mật & xác thực thành công!');
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
            Bảo mật & xác thực
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Thiết lập độ mạnh mật khẩu, cơ chế khóa tài khoản và cài đặt xác thực 2 lớp (2FA)
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
        {/* Nhóm Độ mạnh mật khẩu */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Độ mạnh mật khẩu người dùng
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Độ dài mật khẩu tối thiểu <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={minPasswordLength}
                onChange={(e) => setMinPasswordLength(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Thời gian hết hạn OTP xác nhận (phút) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={otpExpiration}
                onChange={(e) => setOtpExpiration(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Require Special Char */}
            <div className="flex items-center justify-between p-3 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">Ký tự đặc biệt (@, #, $)</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireSpecialChar}
                  onChange={(e) => setRequireSpecialChar(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Require Numbers */}
            <div className="flex items-center justify-between p-3 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">Bắt buộc chứa chữ số (0-9)</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireNumber}
                  onChange={(e) => setRequireNumber(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Require Uppercase */}
            <div className="flex items-center justify-between p-3 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">Bắt buộc chứa chữ hoa (A-Z)</span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireUppercase}
                  onChange={(e) => setRequireUppercase(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Nhóm Khóa tài khoản */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Chính sách khóa tài khoản & Đăng nhập
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Số lần đăng nhập sai tối đa
              </label>
              <input
                type="number"
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Thời gian khóa tài khoản tạm thời
              </label>
              <div className="relative">
                <select
                  value={lockoutDuration}
                  onChange={(e) => setLockoutDuration(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="5m">5 phút</option>
                  <option value="15m">15 phút</option>
                  <option value="30m">30 phút</option>
                  <option value="1h">1 giờ</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Concurrent logins */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <span className="font-bold text-black dark:text-white">
                Cho phép đăng nhập đồng thời nhiều thiết bị
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowConcurrent}
                  onChange={(e) => setAllowConcurrent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Enable 2FA */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl">
              <div className="flex flex-col">
                <span className="font-bold text-black dark:text-white">
                  Bắt buộc xác thực 2 lớp (2FA)
                </span>
                <span className="text-[9px] text-gray-450 mt-0.5">Xác minh OTP qua Email/Google Authenticator</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
