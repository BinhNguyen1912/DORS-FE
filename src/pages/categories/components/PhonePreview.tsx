import React from 'react';
import { renderFormattedText } from '../utils/notification.helpers';

interface PhonePreviewProps {
  title: string;
  content: string;
  channel: 'app' | 'sms' | 'email' | 'push';
}

export default function PhonePreview({ title, content, channel }: PhonePreviewProps) {
  return (
    <div className="relative w-[240px] h-[380px] border-8 border-slate-800 rounded-[35px] shadow-lg bg-cover bg-center overflow-hidden flex flex-col justify-start pt-10 p-3 bg-slate-50">
      {/* Status bar mock */}
      <div className="flex justify-between items-center w-full px-2 text-[7px] font-bold text-black absolute top-6 left-0 right-0">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Phone notification card */}
      {channel === 'app' && (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow space-y-1 relative mt-1 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="text-[8px] bg-red-100 text-red-700 rounded px-1 py-0.2 font-normal uppercase">
              Khấn cấp
            </span>
            <span className="text-[7px] text-black">bây giờ</span>
          </div>
          <h4 className="text-black text-[9px] font-semibold text-left">
            {renderFormattedText(title)}
          </h4>
          <p className="text-black text-[8px] leading-snug text-left font-normal">
            {renderFormattedText(content)}
          </p>
          <button className="w-full py-1 mt-1 bg-slate-100 text-black rounded text-[8px] border border-slate-250 cursor-pointer font-normal">
            Xem chi tiết
          </button>
        </div>
      )}

      {channel === 'push' && (
        <div className="w-full bg-slate-900 text-white rounded-xl p-2.5 shadow space-y-0.5 text-left font-sans font-normal">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-200 font-normal uppercase">🚒 CỨU HỘ VIỆT NAM</span>
            <span className="text-[8px] text-slate-350">bây giờ</span>
          </div>
          <h4 className="text-[8.5px] text-white text-left font-normal">{renderFormattedText(title)}</h4>
          <p className="text-slate-200 text-[8px] line-clamp-2 leading-tight text-left font-normal">{renderFormattedText(content)}</p>
        </div>
      )}

      {channel === 'sms' && (
        <div className="w-full bg-[#E5E5EA] rounded-xl p-2.5 shadow space-y-1 text-black text-left font-normal">
          <div className="inline-block bg-[#007AFF] text-white rounded-xl px-2.5 py-1.5 text-[8.5px] max-w-[95%] leading-tight text-left font-normal">
            <p className="border-b border-white/20 pb-0.5 mb-1 text-left font-normal text-[7.5px]">{renderFormattedText(title)}</p>
            {renderFormattedText(content)}
          </div>
        </div>
      )}

      {channel === 'email' && (
        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm text-black text-left font-normal">
          <div className="bg-slate-100 p-1.5 border-b border-slate-200 text-[8px] text-black font-normal text-center">
            Email Client Preview
          </div>
          <div className="p-2 space-y-1 text-[8px] text-left">
            <p className="text-black text-left font-normal">Tiêu đề: {renderFormattedText(title)}</p>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded text-left text-[7.5px] leading-relaxed max-h-[140px] overflow-y-auto font-normal">
              {renderFormattedText(content)}
            </div>
          </div>
        </div>
      )}

      {/* Bottom indicator mock */}
      <div className="flex-1 flex flex-col justify-end pb-1 text-center">
        <div className="w-16 h-0.5 bg-slate-400 mx-auto rounded"></div>
      </div>
    </div>
  );
}
