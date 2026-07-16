import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../../apis';
import type { 
  NotificationTemplate, 
  NotificationEvent, 
  NotificationTemplateGroup 
} from '../../../types/notification';
import { 
  NotificationPriority, 
  NotificationChannel 
} from '../../../types/notification';
import { toast } from '../../../stores';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: NotificationTemplate | null;
  events: NotificationEvent[];
  groups: NotificationTemplateGroup[];
  onSaveSuccess: () => void;
}

export default function TemplateFormModal({
  isOpen,
  onClose,
  template,
  events,
  groups,
  onSaveSuccess,
}: TemplateFormModalProps) {
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [eventId, setEventId] = useState<number | ''>('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [titleTemplate, setTitleTemplate] = useState('');
  const [contentTemplate, setContentTemplate] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>(NotificationPriority.LOW);
  const [channels, setChannels] = useState<NotificationChannel[]>([NotificationChannel.APP]);
  const [variables, setVariables] = useState('');
  const [provinceId, setProvinceId] = useState<number | ''>('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name);
        setCode(template.code);
        setEventId(template.eventId);
        setGroupId(template.groupId);
        setTitleTemplate(template.titleTemplate);
        setContentTemplate(template.contentTemplate);
        setPriority(template.defaultPriority);
        setChannels(template.defaultChannels || [NotificationChannel.APP]);
        setVariables(Array.isArray(template.variables) ? template.variables.join(', ') : '');
        setProvinceId(template.provinceId || '');
        setIsDefault(!!template.isDefault);
        setIsActive(!!template.isActive);
      } else {
        setName('');
        setCode('');
        setEventId(events[0]?.id || '');
        setGroupId(groups[0]?.id || '');
        setTitleTemplate('');
        setContentTemplate('');
        setPriority(NotificationPriority.LOW);
        setChannels([NotificationChannel.APP]);
        setVariables('');
        setProvinceId('');
        setIsDefault(false);
        setIsActive(true);
      }
    }
  }, [isOpen, template, events, groups]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const vars = variables.split(',').map(v => v.trim()).filter(Boolean);
      const payload = {
        name,
        code,
        eventId: Number(eventId),
        groupId: Number(groupId),
        titleTemplate,
        contentTemplate,
        defaultPriority: priority,
        defaultChannels: channels,
        variables: vars,
        provinceId: provinceId ? Number(provinceId) : undefined,
        isDefault,
        isActive,
      };

      if (template) {
        return notificationApi.updateTemplate(template.id, payload);
      } else {
        return notificationApi.createTemplate(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success(template ? 'Cập nhật template thành công!' : 'Tạo template mới thành công!');
      onSaveSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi khi lưu template');
    },
  });

  const handleToggleChannel = (channel: NotificationChannel) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col h-full text-left">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {template ? 'Chỉnh sửa template thông báo' : 'Thêm template thông báo mới'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer">
            ✕
          </button>
        </div>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold"
        >
          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Tên template *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: SOS tạo mới mặc định"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Mã code template *</label>
            <input
              type="text"
              required
              disabled={!!template}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: SOS_CREATED_DEFAULT"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Sự kiện kích hoạt *</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="">Chọn sự kiện</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name} ({ev.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Nhóm template *</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="">Chọn nhóm</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Tiêu đề mẫu (Title Template) *</label>
            <input
              type="text"
              required
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              placeholder="Ví dụ: 🚨 Có yêu cầu SOS mới từ {{citizenName}}"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Nội dung mẫu (Content Template) *</label>
            <textarea
              rows={4}
              required
              value={contentTemplate}
              onChange={(e) => setContentTemplate(e.target.value)}
              placeholder="Ví dụ: Địa chỉ: {{address}}. Vui lòng điều động cứu trợ gấp."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Mức độ ưu tiên mặc định</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
              >
                {Object.values(NotificationPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Thuộc Tỉnh/Thành phố (Tùy chọn)</label>
              <input
                type="number"
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value ? Number(e.target.value) : '')}
                placeholder="Mã ID Tỉnh (ví dụ: 1)"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-gray-500 dark:text-gray-400">Các kênh thông báo mặc định</label>
            <div className="flex gap-4">
              {Object.values(NotificationChannel).map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes(c)}
                    onChange={() => handleToggleChannel(c)}
                    className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-500 dark:text-gray-400">Biến sử dụng (phân tách bởi dấu phẩy)</label>
            <input
              type="text"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder="Ví dụ: citizenName, address, priority"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-gray-900/40 p-3 rounded-xl">
            <div>
              <p className="text-gray-800 dark:text-slate-200 text-xs font-bold leading-none">Template mặc định</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Sử dụng mẫu này làm mặc định cho sự kiện</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-gray-900/40 p-3 rounded-xl">
            <div>
              <p className="text-gray-800 dark:text-slate-200 text-xs font-bold leading-none">Trạng thái kích hoạt</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Bật/Tắt template này</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all disabled:opacity-60 cursor-pointer"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
