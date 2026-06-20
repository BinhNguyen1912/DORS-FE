import { useState } from 'react';
import { Save, CheckSquare, Square } from 'lucide-react';
import { toast } from '../../../stores';

interface NotificationConfigRow {
  eventCode: string;
  eventName: string;
  web: boolean;
  mobile: boolean;
  sms: boolean;
  email: boolean;
}

export default function NotificationTab() {
  const [configs, setConfigs] = useState<NotificationConfigRow[]>([
    { eventCode: 'NEW_SOS', eventName: 'Có yêu cầu cứu hộ SOS mới', web: true, mobile: true, sms: true, email: false },
    { eventCode: 'ASSIGNED_TEAM', eventName: 'Đội cứu hộ được phân công nhiệm vụ', web: true, mobile: true, sms: false, email: true },
    { eventCode: 'COMPLETE_SOS', eventName: 'Sự cố SOS được cứu nạn hoàn thành', web: true, mobile: false, sms: false, email: true },
    { eventCode: 'LOCKED_USER', eventName: 'Tài khoản người dùng bị khóa tạm thời', web: false, mobile: false, sms: true, email: true },
    { eventCode: 'NEW_REGISTER', eventName: 'Người dùng mới đăng ký tài khoản', web: true, mobile: false, sms: false, email: false },
  ]);

  const toggleChannel = (eventCode: string, channel: 'web' | 'mobile' | 'sms' | 'email') => {
    setConfigs((prev) =>
      prev.map((row) => {
        if (row.eventCode === eventCode) {
          return { ...row, [channel]: !row[channel] };
        }
        return row;
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật cấu hình kênh thông báo thành công!');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title Header */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Cấu hình Thông báo
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Bật/tắt các kênh gửi thông báo tự động khi phát sinh các sự kiện khẩn cấp trong hệ thống
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

      <div className="space-y-4">
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-gray-800 border-b border-slate-100 dark:border-slate-750">
                <th className="px-4 py-3 font-extrabold text-black dark:text-white select-none">
                  Sự kiện hệ thống
                </th>
                <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none w-[110px]">
                  Web App
                </th>
                <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none w-[110px]">
                  Mobile App
                </th>
                <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none w-[110px]">
                  Tin nhắn SMS
                </th>
                <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none w-[110px]">
                  Thư điện tử (Email)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {configs.map((row) => (
                <tr key={row.eventCode} className="hover:bg-slate-50/20 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-3.5 font-bold text-black dark:text-white">
                    {row.eventName}
                  </td>
                  {(['web', 'mobile', 'sms', 'email'] as const).map((channel) => {
                    const isChecked = row[channel];
                    return (
                      <td key={channel} className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleChannel(row.eventCode, channel)}
                          className="inline-flex items-center justify-center p-1 rounded-lg text-slate-550 hover:text-amber-550 dark:text-gray-400 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare size={16} className="text-amber-500" />
                          ) : (
                            <Square size={16} className="text-slate-200 dark:text-slate-700" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
