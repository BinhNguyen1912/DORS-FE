import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from '../../../stores';

export default function ThemeTab() {
  const [primaryColor, setPrimaryColor] = useState('#f06400');
  const [loginBgUrl, setLoginBgUrl] = useState('/auth-bg.png');
  const [registerBgUrl, setRegisterBgUrl] = useState('/auth-bg.png');
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [footerText, setFooterText] = useState('© 2026 Cứu Hộ Việt Nam. Bảo lưu mọi quyền.');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật cấu hình giao diện & thương hiệu thành công!');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Cấu hình Giao diện & Thương hiệu
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Tùy biến màu sắc nhận diện thương hiệu, hình nền xác thực và cài đặt bản quyền chân trang
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
        {/* Nhóm Màu sắc */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Màu sắc chủ đạo (Brand Colors)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Màu sắc nhận diện chính
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono font-semibold w-32"
                />
                <span className="text-[11px] text-gray-400 font-medium">Chọn màu chính hiển thị trên nút ấn và thanh menu</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-gray-900/40 border border-slate-100/60 dark:border-slate-800 rounded-xl mt-4">
              <span className="font-bold text-black dark:text-white">
                Bật Watermark chìm bảo mật trên bản đồ
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>
        </div>

        {/* Nhóm Ảnh trang đăng nhập/đăng ký */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Hình ảnh trang xác thực (Auth Backgrounds)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Đường dẫn ảnh nền trang Đăng Nhập
              </label>
              <input
                type="text"
                value={loginBgUrl}
                onChange={(e) => setLoginBgUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Đường dẫn ảnh nền trang Đăng Ký
              </label>
              <input
                type="text"
                value={registerBgUrl}
                onChange={(e) => setRegisterBgUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Chân trang */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Bản quyền trang hệ thống (Footer Copyright)
          </h3>

          <div className="space-y-1.5">
            <label className="block font-bold text-black dark:text-white">
              Văn bản hiển thị dưới chân trang
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
