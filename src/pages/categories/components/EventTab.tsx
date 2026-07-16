import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Eye, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import PhonePreview from './PhonePreview';
import { useAuthStore } from '../../../stores';

interface EventTabProps {
  events: any[];
  setEvents?: React.Dispatch<React.SetStateAction<any[]>>;
  templates: any[];
}

export default function EventTab({ events, setEvents, templates }: EventTabProps) {
  const { user } = useAuthStore();
  const [selectedEventId, setSelectedEventId] = useState<number>(1);
  const [previewChannel, setPreviewChannel] = useState<'app' | 'sms' | 'email' | 'push'>('app');
  const [previewData, setPreviewData] = useState('');

  // Details column open state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // Mode of right panel: details page or add/edit form
  const [rightPanelMode, setRightPanelMode] = useState<'details' | 'form'>('details');

  // Right column active sub-tab inside details mode
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'template' | 'history' | 'recipients'>('template');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFiltersCount = (filterGroup ? 1 : 0) + (filterStatus ? 1 : 0) + (filterPriority ? 1 : 0);

  // Modals state
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState('SOS');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');

  // Selected event
  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0] || {
    id: 1,
    code: 'SOS_CREATED',
    name: 'Có yêu cầu SOS mới',
    group: 'SOS',
    status: 'ACTIVE',
    priority: 'URGENT',
    description: 'Khi người dân tạo một yêu cầu cứu hộ SOS mới, hệ thống sẽ tạo sự kiện này.',
    createdAt: '10/06/2026 10:30',
    updatedAt: '10/06/2026 10:30'
  };

  // Build preview data from actual user and system data
  useEffect(() => {
    const data = {
      senderName: user?.fullName || 'Nguyễn Văn A',
      time: new Date().toLocaleString('vi-VN'),
    };
    setPreviewData(JSON.stringify(data, null, 2));
  }, [user]);

  // Filter events
  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = !filterGroup || ev.group === filterGroup;
    const matchesStatus = !filterStatus || (filterStatus === 'ACTIVE' ? (ev.status === 'ACTIVE' || !ev.status) : ev.status === 'INACTIVE');
    const matchesPriority = !filterPriority || ev.priority === filterPriority;
    return matchesSearch && matchesGroup && matchesStatus && matchesPriority;
  });

  // Get templates for selected event
  const eventTemplates = templates.filter(t => t.eventCode === selectedEvent.code);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(eventTemplates[0]?.id || 101);
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || eventTemplates[0] || templates[0];

  const getRenderedPreview = (channelType: 'app' | 'sms' | 'email' | 'push') => {
    let titleTpl = 'Có thông báo mới';
    let contentTpl = 'Bạn có thông báo mới từ hệ thống cứu hộ.';

    if (activeTemplate) {
      const hasChannel = activeTemplate.channels.map((c: string) => c.toLowerCase()).includes(channelType);
      if (hasChannel) {
        titleTpl = activeTemplate.title;
        contentTpl = activeTemplate.content;
      }
    }

    try {
      const vars = JSON.parse(previewData);
      let renderedTitle = titleTpl;
      let renderedContent = contentTpl;

      Object.keys(vars).forEach(key => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        renderedTitle = renderedTitle.replace(regex, vars[key]);
        renderedContent = renderedContent.replace(regex, vars[key]);
      });

      return { title: renderedTitle, content: renderedContent };
    } catch {
      return { title: titleTpl, content: contentTpl };
    }
  };

  const previewText = getRenderedPreview(previewChannel);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormCode('');
    setFormName('');
    setFormGroup('SOS');
    setFormPriority('MEDIUM');
    setFormDescription('');
    setFormStatus('ACTIVE');
    setRightPanelMode('form');
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (ev: any) => {
    setEditingEvent(ev);
    setFormCode(ev.code);
    setFormName(ev.name);
    setFormGroup(ev.group);
    setFormPriority(ev.priority);
    setFormDescription(ev.description || '');
    setFormStatus(ev.status || 'ACTIVE');
    setRightPanelMode('form');
    setIsDetailOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    if (setEvents) {
      if (editingEvent) {
        setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? {
          ...ev,
          code: formCode,
          name: formName,
          group: formGroup,
          priority: formPriority,
          description: formDescription,
          status: formStatus,
          updatedAt: new Date().toLocaleString('vi-VN')
        } : ev));
      } else {
        const newId = events.length > 0 ? Math.max(...events.map(ev => ev.id)) + 1 : 1;
        const newEvent = {
          id: newId,
          code: formCode,
          name: formName,
          group: formGroup,
          status: formStatus,
          priority: formPriority,
          description: formDescription,
          createdAt: new Date().toLocaleString('vi-VN'),
          updatedAt: new Date().toLocaleString('vi-VN')
        };
        setEvents(prev => [...prev, newEvent]);
        setSelectedEventId(newId);
      }
    }
    setRightPanelMode('details');
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      if (setEvents) {
        setEvents(prev => prev.filter(ev => ev.id !== id));
        if (selectedEventId === id) {
          const remaining = events.filter(ev => ev.id !== id);
          if (remaining.length > 0) {
            setSelectedEventId(remaining[0].id);
          }
        }
      }
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterGroup('');
    setFilterStatus('');
    setFilterPriority('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none font-sans text-black">
      {/* Left Column: Danh sách sự kiện (lg:col-span-8 or lg:col-span-12) */}
      <div className={cn(
        "bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 text-left transition-all duration-300",
        isDetailOpen ? "lg:col-span-8" : "lg:col-span-12"
      )}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-black text-sm">
              Danh sách sự kiện
            </h3>
            <p className="text-[11px] text-black mt-1 font-normal">
              Quản lý tất cả sự kiện trong hệ thống
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
          >
            + Thêm sự kiện
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2.5 items-center relative">
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-black text-xs focus:outline-none text-left font-normal"
          />

          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-normal bg-white text-black transition-all cursor-pointer hover:bg-slate-55 flex items-center gap-1",
                activeFiltersCount > 0 && "border-blue-600 bg-blue-50/50"
              )}
            >
              Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-250 rounded-2xl shadow-lg p-4 space-y-3.5 z-10 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] text-black font-semibold">Nhóm</label>
                  <select 
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white text-black cursor-pointer focus:outline-none font-normal"
                  >
                    <option value="">Tất cả nhóm</option>
                    <option value="SOS">SOS</option>
                    <option value="TEAM">TEAM</option>
                    <option value="FLOOD">FLOOD</option>
                    <option value="REQUEST">REQUEST</option>
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="WEATHER">WEATHER</option>
                    <option value="BROADCAST">BROADCAST</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-black font-semibold">Trạng thái</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white text-black cursor-pointer focus:outline-none font-normal"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm dừng</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-black font-semibold">Mức độ</label>
                  <select 
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white text-black cursor-pointer focus:outline-none font-normal"
                  >
                    <option value="">Tất cả mức độ</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="px-3.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-normal cursor-pointer hover:bg-blue-700"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {(searchQuery || activeFiltersCount > 0) && (
            <button 
              onClick={() => {
                resetFilters();
                setIsFilterOpen(false);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-black rounded-xl text-xs font-normal transition-all cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-black font-semibold">
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Mã sự kiện</th>
                <th className="py-3 px-4">Tên sự kiện</th>
                <th className="py-3 px-4">Nhóm</th>
                <th className="py-3 px-4">Mức độ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Số Template</th>
                <th className="py-3 px-4">Cập nhật cuối</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-black font-normal">
                    Không tìm thấy sự kiện nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => {
                  const templatesCount = templates.filter(t => t.eventCode === ev.code).length;
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        if (rightPanelMode === 'form') {
                          setRightPanelMode('details');
                        }
                        const list = templates.filter(t => t.eventCode === ev.code);
                        if (list.length > 0) {
                          setSelectedTemplateId(list[0].id);
                        }
                      }}
                      className={cn(
                        "hover:bg-slate-50 transition-colors cursor-pointer font-normal",
                        selectedEventId === ev.id && "bg-blue-50/50 border-l-2 border-blue-600"
                      )}
                    >
                      <td className="py-3 px-4 font-normal text-black text-left">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-normal text-black text-left">{ev.code}</td>
                      <td className="py-3 px-4 text-black text-left font-normal">{ev.name}</td>
                      <td className="py-3 px-4 text-left">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[9px] font-normal uppercase">
                          {ev.group}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-normal uppercase",
                          ev.priority === 'CRITICAL' && "bg-red-100 text-red-700",
                          ev.priority === 'URGENT' && "bg-orange-100 text-orange-700",
                          ev.priority === 'HIGH' && "bg-amber-100 text-amber-700",
                          ev.priority === 'MEDIUM' && "bg-blue-100 text-blue-700",
                          ev.priority === 'LOW' && "bg-slate-100 text-slate-700"
                        )}>
                          {ev.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-normal",
                          ev.status === 'ACTIVE' || !ev.status
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        )}>
                          {ev.status === 'ACTIVE' || !ev.status ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-black text-left font-normal">{templatesCount}</td>
                      <td className="py-3 px-4 text-black text-left font-normal">{ev.updatedAt || ev.createdAt}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setRightPanelMode('details');
                              setIsDetailOpen(true);
                              const list = templates.filter(t => t.eventCode === ev.code);
                              if (list.length > 0) {
                                setSelectedTemplateId(list[0].id);
                              }
                            }}
                            title="Xem chi tiết"
                            className="p-1 hover:bg-slate-100 text-blue-600 rounded transition-all cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(ev)}
                            title="Sửa sự kiện"
                            className="p-1 hover:bg-slate-100 text-amber-600 rounded transition-all cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(ev.id)}
                            title="Xóa sự kiện"
                            className="p-1 hover:bg-slate-100 text-red-650 rounded transition-all cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex justify-between items-center text-xs text-black border-t border-slate-100 pt-3 font-normal">
          <div>
            Hiển thị 1 - {filteredEvents.length} trong tổng số {filteredEvents.length} sự kiện
          </div>
          <div className="flex gap-1 items-center">
            <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-55 cursor-pointer font-normal">&lt;</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded font-normal">1</button>
            <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-55 cursor-pointer font-normal">&gt;</button>
          </div>
          <select className="border border-slate-300 rounded px-2 py-1 bg-white cursor-pointer font-normal focus:outline-none">
            <option>10 / trang</option>
            <option>20 / trang</option>
            <option>50 / trang</option>
          </select>
        </div>
      </div>

      {/* Right Column: details or form (lg:col-span-4) */}
      {isDetailOpen && (
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 text-left animate-in fade-in slide-in-from-right-5 duration-200">
          {rightPanelMode === 'form' ? (
            // Add/Edit event form
            <>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-black text-sm">
                  {editingEvent ? 'Cập nhật sự kiện' : 'Thêm sự kiện mới'}
                </h3>
                <button 
                  onClick={() => setRightPanelMode('details')}
                  className="p-1 hover:bg-slate-100 rounded-lg text-black transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Event Code */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Mã sự kiện *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: DISASTER_ALERT"
                    disabled={!!editingEvent}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-black focus:outline-none font-normal disabled:opacity-50"
                  />
                </div>

                {/* Event Name */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Tên sự kiện *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Cảnh báo thiên tai khẩn cấp"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Event Group */}
                  <div className="space-y-1.5">
                    <label className="block text-black font-normal">Nhóm sự kiện *</label>
                    <select
                      value={formGroup}
                      onChange={(e) => setFormGroup(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal cursor-pointer"
                    >
                      <option value="SOS">SOS</option>
                      <option value="TEAM">TEAM</option>
                      <option value="FLOOD">FLOOD</option>
                      <option value="REQUEST">REQUEST</option>
                      <option value="SYSTEM">SYSTEM</option>
                      <option value="WEATHER">WEATHER</option>
                      <option value="BROADCAST">BROADCAST</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="block text-black font-normal">Mức độ mặc định *</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal cursor-pointer"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Trạng thái *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm dừng</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Mô tả sự kiện</label>
                  <textarea
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả sự kiện được kích hoạt khi nào..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('details')}
                    className="px-4 py-2 border border-slate-300 text-black hover:bg-slate-100 rounded-xl font-normal transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer font-normal"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </>
          ) : (
            // Standard Event Details
            <>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-black text-sm">
                  Chi tiết sự kiện
                </h3>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-black transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sub-tabs header */}
              <div className="flex border-b border-slate-250 text-xs gap-1 font-normal">
                {[
                  { key: 'info', label: 'Thông tin' },
                  { key: 'template', label: `Template (${eventTemplates.length})` },
                  { key: 'history', label: 'Lịch sử gửi' },
                  { key: 'recipients', label: 'Người nhận gần đây' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDetailTab(tab.key as any)}
                    className={cn(
                      "pb-2 px-1 text-xs cursor-pointer border-b-2 transition-all font-normal",
                      activeDetailTab === tab.key
                        ? "text-blue-600 border-blue-600"
                        : "text-black hover:text-blue-600 border-transparent"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Detail Sub-tab Content: Info tab */}
              {activeDetailTab === 'info' && (
                <div className="space-y-3.5 text-xs text-black font-normal">
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Tên sự kiện</p>
                    <p className="text-black text-xs leading-snug font-normal">{selectedEvent.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Mã sự kiện</p>
                    <p className="font-mono text-black font-normal text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block">{selectedEvent.code}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Nhóm sự kiện</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-normal uppercase tracking-wider border border-blue-200">
                      {selectedEvent.group}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Mô tả sự kiện</p>
                    <p className="text-black leading-relaxed font-normal bg-slate-50 p-2.5 rounded border border-slate-200">{selectedEvent.description || 'Chưa có mô tả'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Mức độ mặc định</p>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[9px] font-normal uppercase text-black">
                      {selectedEvent.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[8px] text-black uppercase tracking-wider mb-0.5">Ngày tạo</p>
                      <p className="text-black font-normal">{selectedEvent.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-black uppercase tracking-wider mb-0.5">Cập nhật cuối</p>
                      <p className="text-black font-normal">{selectedEvent.updatedAt}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail Sub-tab Content: Template list and preview tab */}
              {activeDetailTab === 'template' && (
                <div className="space-y-4.5 font-normal">
                  {/* Event Name Header card inside details */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[9px] uppercase tracking-wider font-normal">
                        {selectedEvent.group} {selectedEvent.code}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-normal">
                        Hoạt động
                      </span>
                    </div>
                    <p className="text-xs text-black mt-1 font-normal">
                      {selectedEvent.name} trong hệ thống
                    </p>
                  </div>

                  {/* Template list section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs text-black uppercase tracking-wider font-normal">
                        Danh sách template ({eventTemplates.length})
                      </h4>
                      <button className="text-[10px] text-blue-600 hover:underline cursor-pointer font-normal">
                        + Thêm template
                      </button>
                    </div>

                    {/* Template Items */}
                    <div className="space-y-2">
                      {eventTemplates.length === 0 ? (
                        <div className="p-4 border border-dashed border-slate-300 text-center text-xs text-black rounded-xl font-normal">
                          Chưa có template nào được cấu hình cho sự kiện này.
                        </div>
                      ) : (
                        eventTemplates.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTemplateId(t.id)}
                            className={cn(
                              "p-3 rounded-xl border transition-all cursor-pointer space-y-1 bg-white text-left font-normal",
                              selectedTemplateId === t.id
                                ? "border-blue-600 shadow-sm"
                                : "border-slate-200 hover:border-slate-350"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[11px] text-black font-normal">{t.name}</span>
                              {t.isActive && (
                                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-normal">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-black font-normal">
                              <span>{t.channels.join(', ')}</span>
                              <span>Cập nhật: {selectedEvent.updatedAt || '10/06/2026 10:30'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Template Live Preview section */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="text-xs text-black uppercase tracking-wider font-normal">
                      Xem trước template
                    </h4>

                    {/* Preview channel Sub-tabs */}
                    <div className="flex border-b border-slate-200 text-[10px] gap-1 font-normal">
                      {[
                        { key: 'app', label: 'In-App' },
                        { key: 'sms', label: 'SMS' },
                        { key: 'email', label: 'Email' },
                        { key: 'push', label: 'Push' }
                      ].map(c => (
                        <button
                          key={c.key}
                          onClick={() => setPreviewChannel(c.key as any)}
                          className={cn(
                            "flex-1 py-1.5 text-center transition-all cursor-pointer border-b-2 text-[9px] font-normal",
                            previewChannel === c.key
                              ? "text-blue-600 border-blue-600"
                              : "text-black hover:text-blue-600 border-transparent"
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* Layout for device mock and variables side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                      {/* Shared PhonePreview Component */}
                      <PhonePreview title={previewText.title} content={previewText.content} channel={previewChannel} />

                      {/* Available Variables list */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-black uppercase tracking-wider block font-normal">Biến khả dụng</span>
                        <div className="flex flex-wrap gap-1">
                          {['citizenName', 'address', 'priority', 'sosId', 'time', 'teamName', 'distance', 'province', 'district'].map(v => (
                            <span key={v} className="px-1.5 py-0.5 bg-slate-100 text-black rounded text-[8px] border border-slate-300 font-normal">
                              {v}
                            </span>
                          ))}
                          <span className="px-1.5 py-0.5 bg-slate-100 text-black rounded text-[8px] border border-slate-300 font-normal">...</span>
                        </div>
                        <button className="text-[9px] text-blue-600 hover:underline block cursor-pointer font-normal">
                          Xem dữ liệu mẫu (JSON)
                        </button>
                      </div>
                    </div>

                    {/* Bottom buttons for template action */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 py-1.5 border border-slate-300 hover:bg-slate-55 rounded-xl text-[10px] text-black transition-all cursor-pointer text-center font-normal">
                        Chỉnh sửa template
                      </button>
                      <button className="flex-1 py-1.5 border border-red-200 hover:bg-red-50 rounded-xl text-[10px] text-red-650 transition-all cursor-pointer text-center font-normal">
                        Xóa template
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail Sub-tab Content: History tab */}
              {activeDetailTab === 'history' && (
                <div className="p-4 text-center text-xs text-black border border-dashed border-slate-300 rounded-xl font-normal">
                  Chưa có dữ liệu lịch sử gửi cho sự kiện này.
                </div>
              )}

              {/* Detail Sub-tab Content: Recipients tab */}
              {activeDetailTab === 'recipients' && (
                <div className="p-4 text-center text-xs text-black border border-dashed border-slate-300 rounded-xl font-normal">
                  Chưa có dữ liệu người nhận gần đây.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
