import { useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { toast } from '../../../stores';

export default function EmailTab() {
  // SMTP Configs
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('alert@cuuhovietnam.gov.vn');
  const [smtpPassword, setSmtpPassword] = useState('••••••••••••••••');
  const [senderName, setSenderName] = useState('Cứu Hộ Việt Nam - Hệ thống khẩn cấp');

  // SMS Brandname Configs
  const [brandname, setBrandname] = useState('CUUHO_VN');
  const [smsApiKey, setSmsApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [smsProvider, setSmsProvider] = useState('eSMS');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật cấu hình cổng gửi Email & SMS thành công!');
  };

  const handleTestMail = () => {
    toast.success('Đã gửi email thử nghiệm thành công tới tài khoản quản trị!');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Email & Tin nhắn SMS
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Cấu hình tài khoản SMTP gửi email thông báo và cổng tích hợp SMS Brandname gửi tin nhắn khẩn cấp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestMail}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-black dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Gửi Test Email
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer"
          >
            <Save size={14} />
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="space-y-5 text-xs text-black dark:text-white">
        {/* Nhóm SMTP Email */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Cấu hình SMTP Email Server
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block font-bold text-black dark:text-white">
                SMTP Host <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="text"
                required
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                SMTP Port <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="number"
                required
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Tài khoản đăng nhập (Username) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="text"
                required
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Mật khẩu SMTP (Password) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="password"
                required
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-black dark:text-white">
              Tên hiển thị người gửi (Sender Display Name) <span className="text-red-500 ml-1">(*)</span>
            </label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
            />
          </div>
        </div>

        {/* Nhóm SMS Brandname */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Cấu hình cổng gửi Tin nhắn SMS Brandname
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Tên thương hiệu (Brandname) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="text"
                required
                value={brandname}
                onChange={(e) => setBrandname(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Nhà cung cấp (SMS Provider) <span className="text-red-500 ml-1">(*)</span>
              </label>
              <div className="relative">
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value="eSMS">eSMS.vn Gateway</option>
                  <option value="Viettel">Viettel SMS Brandname</option>
                  <option value="VNPT">VNPT SMS Brandname</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                SMS API Access Key <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="password"
                required
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
