import React, { useState } from 'react';
import { MessageSquare, Smartphone, MessageCircle, Mail } from 'lucide-react';

export default function ChannelTab() {
  const [channelsConfig, setChannelsConfig] = useState({
    app: true,
    push: true,
    sms: false,
    email: true,
    zalo: false
  });

  return (
    <div className="space-y-5 select-none text-xs font-semibold">
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800 pb-3">
          Cấu hình các kênh truyền tải
        </h3>
        <p className="text-slate-900 dark:text-white mt-2 text-[10px] font-semibold leading-relaxed">
          Bật/Tắt các kênh phân phối thông báo và cấu hình thông số kết nối API của nhà cung cấp dịch vụ (Firebase, Twilio, Amazon SES, Zalo OA).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Card 1: In-App */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">In-App Notification</h4>
                <span className="text-[8px] text-slate-900 dark:text-white mt-0.5 block">Hệ thống thông báo thời gian thực trong ứng dụng</span>
              </div>
            </div>
            <button 
              onClick={() => setChannelsConfig({...channelsConfig, app: !channelsConfig.app})}
              className="cursor-pointer"
            >
              {channelsConfig.app ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold text-[8.5px]">ĐANG HOẠT ĐỘNG</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-150 text-slate-400 rounded-md font-bold text-[8.5px]">ĐANG TẮT</span>
              )}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-bold cursor-pointer transition-all text-slate-900 dark:text-white">
              Cấu hình kết nối
            </button>
          </div>
        </div>

        {/* Card 2: Push Notifications */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Push Notification</h4>
                <span className="text-[8px] text-slate-900 dark:text-white mt-0.5 block">Firebase Cloud Messaging (FCM)</span>
              </div>
            </div>
            <button 
              onClick={() => setChannelsConfig({...channelsConfig, push: !channelsConfig.push})}
              className="cursor-pointer"
            >
              {channelsConfig.push ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold text-[8.5px]">ĐANG HOẠT ĐỘNG</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-150 text-slate-400 rounded-md font-bold text-[8.5px]">ĐANG TẮT</span>
              )}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-bold cursor-pointer transition-all text-slate-900 dark:text-white">
              Cấu hình kết nối
            </button>
          </div>
        </div>

        {/* Card 3: SMS */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">SMS Brandname</h4>
                <span className="text-[8px] text-slate-900 dark:text-white mt-0.5 block">Dịch vụ Twilio hoặc Brandname Viettel/Vina</span>
              </div>
            </div>
            <button 
              onClick={() => setChannelsConfig({...channelsConfig, sms: !channelsConfig.sms})}
              className="cursor-pointer"
            >
              {channelsConfig.sms ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold text-[8.5px]">ĐANG HOẠT ĐỘNG</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-150 text-slate-400 rounded-md font-bold text-[8.5px]">ĐANG TẮT</span>
              )}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-bold cursor-pointer transition-all text-slate-900 dark:text-white">
              Cấu hình kết nối
            </button>
          </div>
        </div>

        {/* Card 4: Email */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">SMTP/SES Email</h4>
                <span className="text-[8px] text-slate-900 dark:text-white mt-0.5 block">Amazon Simple Email Service (SES)</span>
              </div>
            </div>
            <button 
              onClick={() => setChannelsConfig({...channelsConfig, email: !channelsConfig.email})}
              className="cursor-pointer"
            >
              {channelsConfig.email ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold text-[8.5px]">ĐANG HOẠT ĐỘNG</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-150 text-slate-400 rounded-md font-bold text-[8.5px]">ĐANG TẮT</span>
              )}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-bold cursor-pointer transition-all text-slate-900 dark:text-white">
              Cấu hình kết nối
            </button>
          </div>
        </div>

        {/* Card 5: Zalo OA */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                Z
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Zalo Official Account</h4>
                <span className="text-[8px] text-slate-900 dark:text-white mt-0.5 block">Zalo OA Access Token & Templates API</span>
              </div>
            </div>
            <button 
              onClick={() => setChannelsConfig({...channelsConfig, zalo: !channelsConfig.zalo})}
              className="cursor-pointer"
            >
              {channelsConfig.zalo ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold text-[8.5px]">ĐANG HOẠT ĐỘNG</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-150 text-slate-400 rounded-md font-bold text-[8.5px]">CHƯA CẤU HÌNH</span>
              )}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-bold cursor-pointer transition-all text-red-500">
              Cấu hình Zalo OA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
