import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { notificationApi } from '../../../apis';
import type { NotificationEvent } from '../../../types/notification';
import { toast } from '../../../stores';

interface TestSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: NotificationEvent[];
}

export default function TestSendModal({
  isOpen,
  onClose,
  events,
}: TestSendModalProps) {
  const queryClient = useQueryClient();
  const [eventCode, setEventCode] = useState('SOS_CREATED');
  const [payload, setPayload] = useState('{\n  "citizenName": "Nguyễn Văn A",\n  "address": "Phường Minh An, Hội An, Quảng Nam",\n  "priority": "CRITICAL"\n}');

  const sendMutation = useMutation({
    mutationFn: async () => {
      let parsedData = {};
      try {
        parsedData = JSON.parse(payload);
      } catch {
        throw new Error('Payload JSON gửi thử không hợp lệ');
      }
      return notificationApi.sendNotification({
        event: eventCode,
        data: parsedData,
      });
    },
    onSuccess: () => {
      toast.success('Đã phát sự kiện và lập lịch gửi thông báo thành công!');
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      onClose();
    },
    onError: (err: any) => {
      toast.api(err, 'Gửi thử nghiệm thất bại');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-left text-xs font-semibold">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Send size={16} className="text-blue-500" />
          Bắn Sự Kiện Khẩn Cấp Thử Nghiệm
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-gray-550 dark:text-gray-400">Chọn mã sự kiện (Event Code)</label>
            <select
              value={eventCode}
              onChange={(e) => {
                const code = e.target.value;
                setEventCode(code);
                if (code === 'SOS_CREATED') {
                  setPayload('{\n  "citizenName": "Nguyễn Văn A",\n  "address": "Phường Minh An, Hội An, Quảng Nam",\n  "priority": "CRITICAL"\n}');
                } else if (code === 'FLOOD_CREATED') {
                  setPayload('{\n  "address": "Phường Cẩm Châu, Hội An, Quảng Nam",\n  "depth": 150\n}');
                } else if (code === 'TEAM_ASSIGNED') {
                  setPayload('{\n  "sosId": 105,\n  "distance": 2.3\n}');
                } else {
                  setPayload('{\n  "message": "Nội dung thông báo hệ thống test"\n}');
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.code}>{ev.name} ({ev.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-555 dark:text-gray-400">Dữ liệu sự kiện (JSON Payload)</label>
            <textarea
              rows={6}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full px-3 py-2 font-mono text-[10px] border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-350 rounded-xl font-bold cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-1.5"
          >
            <Send size={12} />
            Bắn Sự Kiện
          </button>
        </div>
      </div>
    </div>
  );
}
