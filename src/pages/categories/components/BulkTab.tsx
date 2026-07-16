import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi, notificationApi } from '../../../apis';
import { cn } from '../../../lib/utils';
import { toast } from '../../../stores';
import { ROLES, isUserInRole, renderFormattedText } from '../utils/notification.helpers';
import PhonePreview from './PhonePreview';
import RichTextEditor from './RichTextEditor';

interface BulkTabProps {
  events: any[];
  templates: any[];
}

export default function BulkTab({ events, templates }: BulkTabProps) {
  const [selectedEventCode, setSelectedEventCode] = useState(events[0]?.code || 'SOS_CREATED');

  // Filter templates matching selected event
  const matchingTemplates = templates.filter(t => t.eventCode === selectedEventCode);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState(matchingTemplates[0]?.code || templates[0]?.code || 'SOS_CREATED_DEFAULT');

  // Custom message title & content states (editable by user)
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch real users list from API
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-list-bulk'],
    queryFn: () => userApi.getAll({ limit: 100 }),
  });
  const users = usersData?.data || [];

  // When selected event or template changes, initialize title & content
  useEffect(() => {
    const activeTpl = templates.find(t => t.code === selectedTemplateCode) || templates[0];
    if (activeTpl) {
      setMessageTitle(activeTpl.title || '🚨 Có thông báo mới');
      setMessageContent(activeTpl.content || 'Nội dung thông báo chi tiết...');
    }
  }, [selectedTemplateCode, templates]);

  // Recipient selection mode: 'roles' (multiple business roles) or 'individual' (select specific people)
  const [recipientMode, setRecipientMode] = useState<'roles' | 'individual'>('roles');

  // Selected roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['leader', 'admin', 'citizen']);

  // Selected individual people
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<number[]>([]);

  // Search query for individuals
  const [peopleSearch, setPeopleSearch] = useState('');

  // Handle Role checkbox toggle
  const toggleRole = (roleKey: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleKey)
        ? prev.filter(r => r !== roleKey)
        : [...prev, roleKey]
    );
  };

  // Toggle all roles
  const toggleAllRoles = () => {
    if (selectedRoles.length === ROLES.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(ROLES.map(r => r.key));
    }
  };

  // Handle Person checkbox toggle
  const togglePerson = (id: number) => {
    setSelectedPeopleIds(prev =>
      prev.includes(id)
        ? prev.filter(pId => pId !== id)
        : [...prev, id]
    );
  };

  // Toggle all people
  const toggleAllPeople = (visiblePeopleIds: number[]) => {
    const allSelected = visiblePeopleIds.every(id => selectedPeopleIds.includes(id));
    if (allSelected) {
      setSelectedPeopleIds(prev => prev.filter(id => !visiblePeopleIds.includes(id)));
    } else {
      setSelectedPeopleIds(prev => Array.from(new Set([...prev, ...visiblePeopleIds])));
    }
  };

  // Format Helper: inserts **bold** or *italic* at selection
  const insertFormatting = (type: 'bold' | 'italic') => {
    const textarea = document.getElementById('message-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    if (type === 'bold') {
      replacement = `**${selectedText || 'chữ in đậm'}**`;
    } else {
      replacement = `*${selectedText || 'chữ in nghiêng'}*`;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setMessageContent(newText);

    // Refocus and set cursor
    setTimeout(() => {
      textarea.focus();
      const offset = type === 'bold' ? 2 : 1;
      textarea.setSelectionRange(start + offset, start + offset + (selectedText || 'chữ').length);
    }, 50);
  };

  // Submit bulk send to Backend API
  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Resolve recipientUserIds
    let recipientUserIds: number[] = [];
    if (recipientMode === 'individual') {
      recipientUserIds = selectedPeopleIds;
    } else {
      recipientUserIds = users
        .filter(u => selectedRoles.some(rKey => isUserInRole(u, rKey)))
        .map(u => u.id);
    }

    try {
      await notificationApi.sendNotification({
        event: selectedEventCode,
        data: {
          title: messageTitle,
          content: messageContent,
          message: messageContent, // Matches {{message}} variable in SYSTEM_NOTICE
          // citizenName: 'Nguyễn Văn A',
          // address: 'Quận 1, TP. Hồ Chí Minh',
          // priority: 'Khẩn cấp',
          // distance: '2.5',
          // depth: '45'
        },
        recipientUserIds
      });
      // Increment bell icon count by dispatching global event
      window.dispatchEvent(new Event('new-notification'));
      toast.success('Bạn có 1 thông báo mới');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gửi thông báo');
    } finally {
      setIsSending(false);
    }
  };

  // Filter people list based on search
  const filteredPeople = users.filter(u =>
    u.fullName.toLowerCase().includes(peopleSearch.toLowerCase()) ||
    (u.phone && u.phone.includes(peopleSearch)) ||
    (u.email && u.email.toLowerCase().includes(peopleSearch.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none font-sans text-black">
      {/* Configuration Column (lg:col-span-8) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 text-left">
        <div>
          <h3 className="font-semibold text-black text-sm">
            Gửi thông báo hàng loạt theo nghiệp vụ
          </h3>
          <p className="text-[11px] text-black mt-1 font-normal">
            Cấu hình tin nhắn, chỉnh sửa nội dung và lựa chọn linh hoạt đối tượng nhận tin từ Backend API
          </p>
        </div>

        <form onSubmit={handleSendBulk} className="space-y-4 text-xs font-normal">
          {/* Select Event & Template */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-black font-normal">Sự kiện nghiệp vụ</label>
              <select
                value={selectedEventCode}
                onChange={(e) => {
                  setSelectedEventCode(e.target.value);
                  const firstTpl = templates.find(t => t.eventCode === e.target.value);
                  if (firstTpl) setSelectedTemplateCode(firstTpl.code);
                }}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-black cursor-pointer focus:outline-none"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.code}>{ev.name} ({ev.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-black font-normal">Mẫu tin nhắn mặc định</label>
              <select
                value={selectedTemplateCode}
                onChange={(e) => setSelectedTemplateCode(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 bg-white text-black cursor-pointer focus:outline-none"
              >
                {matchingTemplates.length === 0 ? (
                  <option value={templates[0]?.code}>{templates[0]?.name}</option>
                ) : (
                  matchingTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.code}>{tpl.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Edit message block (Title & Content with formatting tools) */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-black font-semibold block">Nội dung gửi đi (Cho phép tinh chỉnh)</span>

            {/* Message Title */}
            <div className="space-y-1">
              <label className="text-[10px] text-black font-semibold">Tiêu đề thông báo</label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Nhập tiêu đề..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-black focus:outline-none"
              />
            </div>

            {/* Message Content with RichTextEditor */}
            <div className="space-y-1">
              <label className="text-[10px] text-black font-semibold">Nội dung chi tiết</label>
              <RichTextEditor
                value={messageContent}
                onChange={setMessageContent}
                placeholder="Nhập nội dung thông báo..."
              />
            </div>
          </div>

          {/* Recipient Configuration */}
          <div className="space-y-3.5">
            <span className="text-[11px] text-black font-semibold block">Đối tượng nhận tin</span>

            {/* Toggle Modes */}
            <div className="flex border-b border-slate-200 text-xs font-normal gap-4 pb-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipientMode"
                  checked={recipientMode === 'roles'}
                  onChange={() => setRecipientMode('roles')}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span>Gửi theo nhóm vai trò</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipientMode"
                  checked={recipientMode === 'individual'}
                  onChange={() => setRecipientMode('individual')}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span>Gửi cho cá nhân cụ thể</span>
              </label>
            </div>

            {/* Mode 1: Multi-select Roles */}
            {recipientMode === 'roles' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-black font-semibold">Chọn nhóm vai trò (Cho phép chọn nhiều)</span>
                  <button
                    type="button"
                    onClick={toggleAllRoles}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    {selectedRoles.length === ROLES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 p-3 border border-slate-200 rounded-xl bg-slate-55">
                  {ROLES.map(r => (
                    <label key={r.key} className="flex items-center gap-1.5 cursor-pointer font-normal">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(r.key)}
                        onChange={() => toggleRole(r.key)}
                        className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 2: Select Individual People */}
            {recipientMode === 'individual' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, số điện thoại, email..."
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-black text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleAllPeople(filteredPeople.map(p => p.id))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-350 rounded-xl text-xs font-normal"
                  >
                    Chọn toàn bộ kết quả ({filteredPeople.length})
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-slate-55">
                  {isLoadingUsers ? (
                    <div className="p-8 text-center text-black font-normal">Đang tải danh sách người dùng...</div>
                  ) : (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-[10px] text-black">
                          <th className="py-2 px-3 w-8">Chọn</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-3">Số điện thoại</th>
                          <th className="py-2 px-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredPeople.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-black font-normal">Không tìm thấy người dùng phù hợp.</td>
                          </tr>
                        ) : (
                          filteredPeople.map(p => (
                            <tr key={p.id} className="hover:bg-slate-100/50">
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedPeopleIds.includes(p.id)}
                                  onChange={() => togglePerson(p.id)}
                                  className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5"
                                />
                              </td>
                              <td className="py-2 px-3 font-medium text-black">{p.fullName}</td>
                              <td className="py-2 px-3 text-black">{p.phone || 'Chưa cập nhật'}</td>
                              <td className="py-2 px-3 text-black">{p.email || 'Chưa cập nhật'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="text-[10px] text-black font-semibold">
                  Đã chọn: {selectedPeopleIds.length} cá nhân nhận thông báo
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-normal transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {isSending ? 'Đang gửi...' : 'Gửi thông báo hàng loạt'}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Reusable Simulated Live Device Preview (lg:col-span-4) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col items-center space-y-4 text-left">
        <h3 className="font-semibold text-black uppercase tracking-wider text-xs border-b border-slate-150 pb-2 w-full text-left">
          Xem trước tin nhắn thực tế
        </h3>

        <p className="text-[10px] text-black w-full text-left font-normal leading-relaxed bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
          Chữ nằm giữa thẻ **in đậm** hoặc *in nghiêng* sẽ được chuyển đổi hiển thị định dạng tương ứng trên điện thoại của người nhận.
        </p>

        {/* Reusable Phone preview component */}
        <PhonePreview title={messageTitle} content={messageContent} channel="app" />
      </div>
    </div>
  );
}
