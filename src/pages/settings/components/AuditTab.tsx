import { useState } from 'react';
import { Save, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from '../../../stores';

interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

export default function AuditTab() {
  const [retentionDays, setRetentionDays] = useState(90);
  const [auditCreate, setAuditCreate] = useState(true);
  const [auditUpdate, setAuditUpdate] = useState(true);
  const [auditDispatch, setAuditDispatch] = useState(true);
  const [auditRole, setAuditRole] = useState(true);
  const [auditLockout, setAuditLockout] = useState(true);

  const logs: AuditLogEntry[] = [
    { timestamp: '2026-06-20 12:10:45', user: 'admin@system.com', action: 'Cấu hình hệ thống', details: 'Thay đổi tên hệ thống sang Cứu Hộ Việt Nam', ip: '192.168.1.5' },
    { timestamp: '2026-06-20 11:58:30', user: 'admin@system.com', action: 'Phân công cứu hộ', details: 'Điều phối Đội y tế khẩn cấp số 2 tới điểm ngập SOS-452', ip: '192.168.1.5' },
    { timestamp: '2026-06-20 11:42:15', user: 'p_admin.hcm@system.com', action: 'Duyệt thành viên', details: 'Gán tài khoản tran.van.a@gmail.com vào Đội xuồng hơi quận 4', ip: '172.16.12.110' },
    { timestamp: '2026-06-20 11:20:02', user: 'admin@system.com', action: 'Khóa tài khoản', details: 'Tự động khóa tài khoản user.test@gmail.com do đăng nhập sai 5 lần', ip: '127.0.0.1' },
    { timestamp: '2026-06-20 10:55:40', user: 'admin@system.com', action: 'Thay đổi quyền', details: 'Cập nhật phân quyền module SOS cho vai trò TEAM_LEADER', ip: '192.168.1.5' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật cấu hình lưu trữ nhật ký hệ thống thành công!');
  };

  const handleRefreshLogs = () => {
    toast.success('Đã tải lại nhật ký hoạt động mới nhất!');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button Header */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Nhật ký hệ thống (Audit Logs)
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Xem lịch sử tác động, kiểm tra bảo mật và cấu hình thời hạn tự động dọn dẹp log (Retention)
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
        {/* Nhóm Thiết lập lưu trữ logs */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none border-b border-slate-50 dark:border-slate-800 pb-1">
            Chính sách lưu trữ (Retention Policy)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-black dark:text-white">
                Thời gian lưu trữ nhật ký hệ thống
              </label>
              <div className="relative">
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold appearance-none cursor-pointer"
                >
                  <option value={30}>30 ngày</option>
                  <option value={90}>90 ngày</option>
                  <option value={180}>180 ngày (Khuyên dùng)</option>
                  <option value={365}>365 ngày (1 năm)</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>

            <div className="space-y-1.5 pt-1.5">
              <span className="block font-bold text-black dark:text-white mb-2">
                Các hoạt động ghi nhận vào Audit Log
              </span>
              <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={auditCreate} onChange={(e) => setAuditCreate(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500 border-slate-200" />
                  <span>Ai tạo mới thực thể</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={auditUpdate} onChange={(e) => setAuditUpdate(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500 border-slate-200" />
                  <span>Ai cập nhật thực thể</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={auditDispatch} onChange={(e) => setAuditDispatch(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500 border-slate-200" />
                  <span>Ai điều phối cứu hộ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={auditRole} onChange={(e) => setAuditRole(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500 border-slate-200" />
                  <span>Ai thay đổi vai trò/quyền</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={auditLockout} onChange={(e) => setAuditLockout(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500 border-slate-200" />
                  <span>Khóa/mở khóa tài khoản</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Nhóm Console Log Viewer */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-1">
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider select-none">
              Màn hình xem Log hệ thống trực tiếp (Live Audit Console)
            </h3>
            <button
              type="button"
              onClick={handleRefreshLogs}
              className="flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
            >
              <RefreshCw size={10} />
              Tải lại logs
            </button>
          </div>

          <div className="bg-slate-950 dark:bg-black rounded-2xl p-4 font-mono text-[10.5px] leading-relaxed text-slate-350 max-h-[220px] overflow-y-auto border border-slate-900 shadow-inner space-y-1.5 text-left">
            {logs.map((log, idx) => (
              <div key={idx} className="hover:bg-slate-900/30 py-0.5 rounded transition-colors flex flex-col md:flex-row md:items-start gap-1">
                <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
                <span className="text-blue-450 font-bold flex-shrink-0">{log.user}</span>
                <span className="text-amber-500 font-bold flex-shrink-0">{log.action}:</span>
                <span className="text-slate-200 flex-1">{log.details}</span>
                <span className="text-gray-600 dark:text-gray-500 text-[9px] flex-shrink-0">IP: {log.ip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
