import { useState } from 'react';
import { Save, ChevronDown, Database, Upload } from 'lucide-react';
import { toast } from '../../../stores';

export default function BackupTab() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('daily');
  const [storageProvider, setStorageProvider] = useState('Local');
  const [s3Bucket, setS3Bucket] = useState('cuuhovn-db-backups');
  const [s3Region, setS3Region] = useState('ap-southeast-1');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật chính sách sao lưu dữ liệu thành công!');
  };

  const handleRunBackup = () => {
    toast.success('Đang khởi chạy tiến trình sao lưu cơ sở dữ liệu dự phòng...');
    setTimeout(() => {
      toast.success('Đã lưu file sao lưu mới nhất: cuuhovn_backup_20260620.sql.gz');
    }, 1500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Sao lưu & Khôi phục (Backup)
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Lập lịch sao lưu dữ liệu tự động định kỳ, lưu trữ dự phòng lên mây và khôi phục sự cố hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunBackup}
            className="flex items-center gap-1 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Database size={13} />
            Sao lưu ngay
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer"
          >
            <Save size={14} />
            Lưu cấu hình
          </button>
        </div>
      </div>

      <div className="space-y-5 text-xs text-black dark:text-white">
        {/* Nhóm Backup Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none">
              Thiết lập Tự động sao lưu dữ liệu (Automated Backup)
            </h3>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          {autoBackup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-black dark:text-white">
                  Tần suất tự động sao lưu <span className="text-red-500 ml-1">(*)</span>
                </label>
                <div className="relative">
                  <select
                    value={backupSchedule}
                    onChange={(e) => setBackupSchedule(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                  >
                    <option value="daily">Hàng ngày (Vào 02:00 AM)</option>
                    <option value="weekly">Hàng tuần (Vào Chủ nhật 02:00 AM)</option>
                    <option value="monthly">Hàng tháng (Vào ngày 1 đầu tháng)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-black dark:text-white">
                  Kho lưu trữ sao lưu <span className="text-red-500 ml-1">(*)</span>
                </label>
                <div className="relative">
                  <select
                    value={storageProvider}
                    onChange={(e) => setStorageProvider(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                  >
                    <option value="Local">Lưu cục bộ tại Server (Local Storage)</option>
                    <option value="AWS_S3">Amazon Web Services (AWS S3)</option>
                    <option value="Cloudflare_R2">Cloudflare R2 Storage</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nhóm Storage Credential (nếu dùng Cloud) */}
        {autoBackup && storageProvider !== 'Local' && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
              Thông tin cấu hình Cloud Storage bucket
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-black dark:text-white">
                  Bucket Name <span className="text-red-500 ml-1">(*)</span>
                </label>
                <input
                  type="text"
                  required
                  value={s3Bucket}
                  onChange={(e) => setS3Bucket(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-black dark:text-white">
                  Region <span className="text-red-500 ml-1">(*)</span>
                </label>
                <input
                  type="text"
                  required
                  value={s3Region}
                  onChange={(e) => setS3Region(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Nhóm khôi phục thủ công */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Khôi phục dữ liệu từ file sao lưu (Restore)
          </h3>

          <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-extrabold text-xs text-black dark:text-white block">Chọn file sao lưu phục hồi hệ thống</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Chấp nhận tệp định dạng .sql hoặc .sql.gz. Dung lượng tối đa 200MB.</span>
            </div>
            <label className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-black dark:text-white font-bold text-xs rounded-xl cursor-pointer select-none transition-all w-fit">
              <Upload size={14} />
              Tải file lên
              <input type="file" accept=".sql,.gz" className="hidden" onChange={() => toast.success('Đã tải lên tệp sao lưu thành công!')} />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
