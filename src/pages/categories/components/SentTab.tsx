import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface SentTabProps {
  sentNotifications: any[];
}

const stripHtml = (htmlString: string) => {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
};

export default function SentTab({ sentNotifications }: SentTabProps) {
  const [selectedSentId, setSelectedSentId] = useState<number>(201);
  const selectedSent = sentNotifications.find(s => s.id === selectedSentId) || sentNotifications[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start select-none font-sans">
      {/* Sent Notifications List (Left - col span 7) */}
      <div className="xl:col-span-7 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Thông báo đã phát đi
        </h3>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-900 dark:text-white" size={13} />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo đã phát..."
              className="w-full pl-8.5 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-955 text-gray-900 dark:text-white text-[10px] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-gray-900/50 text-[9px] text-slate-900 dark:text-white uppercase font-extrabold">
                <th className="py-2.5 px-3">Tiêu Đề / Nội Dung</th>
                <th className="py-2.5 px-3">Mức Độ</th>
                <th className="py-2.5 px-3">Kênh</th>
                <th className="py-2.5 px-3">Số lượng gửi</th>
                <th className="py-2.5 px-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {sentNotifications.map(s => (
                <tr 
                  key={s.id}
                  onClick={() => setSelectedSentId(s.id)}
                  className={cn(
                    "hover:bg-slate-50/40 dark:hover:bg-gray-800/30 transition-colors cursor-pointer",
                    selectedSentId === s.id && "bg-amber-500/5 dark:bg-amber-500/5 border-l-2 border-amber-500"
                  )}
                >
                  <td className="py-3 px-3 max-w-[280px]">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{s.title}</p>
                      <p className="text-slate-500 text-[9px] line-clamp-1 mt-0.5">{stripHtml(s.content)}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={cn(
                      "px-1.5 py-0.2 rounded text-[7.5px] font-extrabold uppercase",
                      s.priority === 'CRITICAL' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {s.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex justify-start gap-0.5">
                      {s.channels.map((c: string) => (
                        <span key={c} className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[7px] uppercase font-bold">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-950 dark:text-slate-150">
                      {s.successCount}/{s.sentCount}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{s.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sent Notification Detail (Right - col span 5) */}
      <div className="xl:col-span-5 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800 pb-3 text-center w-full">
          Chi tiết thông báo đã gửi
        </h3>

        {selectedSent ? (
          <div className="space-y-4 text-[10px] text-left">
            <div className="text-left">
              <p className="text-slate-900 dark:text-white font-bold text-left">Tiêu Đề Đã Biên Dịch</p>
              <p className="text-slate-850 dark:text-white font-bold text-xs mt-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-left">{selectedSent.title}</p>
            </div>

            <div className="text-left">
              <p className="text-slate-900 dark:text-white font-bold text-left">Nội Dung Đã Biên Dịch</p>
              <div 
                className="text-slate-700 dark:text-slate-355 mt-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-left"
                dangerouslySetInnerHTML={{ __html: selectedSent.content }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-left">
                <p className="text-slate-900 dark:text-white font-bold text-left">Thời gian phát sự kiện</p>
                <p className="text-slate-800 dark:text-white font-bold mt-1 text-left">{selectedSent.time}</p>
              </div>
              <div className="text-left">
                <p className="text-slate-900 dark:text-white font-bold text-left">Độ khẩn cấp</p>
                <span className="mt-1 inline-block px-2 py-0.5 bg-red-100 text-red-500 rounded text-[8px] font-black uppercase text-left">{selectedSent.priority}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-10">Vui lòng chọn thông báo để xem chi tiết.</p>
        )}
      </div>
    </div>
  );
}
