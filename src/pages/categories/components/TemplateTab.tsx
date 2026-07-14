import React, { useState } from 'react';
import { Plus, X, Eye, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { notificationApi } from '../../../apis';
import { toast } from '../../../stores';

interface TemplateTabProps {
  templates: any[];
  onRefresh?: () => void;
}

export default function TemplateTab({ templates, onRefresh }: TemplateTabProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(101);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'details' | 'form'>('details');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFiltersCount = filterChannel ? 1 : 0;

  // Form & Edit state
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formEventCode, setFormEventCode] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [formChannels, setFormChannels] = useState<string[]>(['APP']);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || {
    id: 101,
    code: 'DEFAULT',
    name: 'Không có template',
    eventCode: 'NONE',
    priority: 'MEDIUM',
    channels: ['APP'],
    title: '',
    content: '',
    isActive: false
  };

  // Filter templates
  const filteredTemplates = templates.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.eventCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = !filterChannel || tpl.channels.map((c: string) => c.toUpperCase()).includes(filterChannel.toUpperCase());
    return matchesSearch && matchesChannel;
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormCode('');
    setFormName('');
    setFormEventCode('');
    setFormPriority('MEDIUM');
    setFormChannels(['APP']);
    setFormTitle('');
    setFormContent('');
    setFormIsActive(true);
    setRightPanelMode('form');
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setFormCode(tpl.code);
    setFormName(tpl.name);
    setFormEventCode(tpl.eventCode);
    setFormPriority(tpl.priority);
    setFormChannels(tpl.channels);
    setFormTitle(tpl.title || '');
    setFormContent(tpl.content || '');
    setFormIsActive(tpl.isActive || false);
    setRightPanelMode('form');
    setIsDetailOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim() || !formEventCode.trim()) return;

    try {
      if (editingTemplate) {
        await notificationApi.updateTemplate(editingTemplate.id, {
          code: formCode,
          name: formName,
          titleTemplate: formTitle,
          contentTemplate: formContent,
          isActive: formIsActive,
          defaultPriority: formPriority as any,
          defaultChannels: formChannels as any,
        });
        toast.success('Cập nhật mẫu thông báo thành công!');
      } else {
        await notificationApi.createTemplate({
          code: formCode,
          name: formName,
          titleTemplate: formTitle,
          contentTemplate: formContent,
          isActive: formIsActive,
          defaultPriority: formPriority as any,
          defaultChannels: formChannels as any,
        });
        toast.success('Tạo mẫu thông báo thành công!');
      }
      onRefresh?.();
      setRightPanelMode('details');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu mẫu thông báo');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa template này?')) {
      try {
        await notificationApi.deleteTemplate(id);
        toast.success('Xóa mẫu thông báo thành công!');
        onRefresh?.();
      } catch (err: any) {
        toast.error(err.message || 'Lỗi khi xóa mẫu thông báo');
      }
    }
  };


  const handleChannelCheckbox = (channel: string) => {
    setFormChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterChannel('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none font-sans text-black">
      {/* Left Column: Danh sách template (lg:col-span-8 or lg:col-span-12) */}
      <div className={cn(
        "bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 text-left transition-all duration-300",
        isDetailOpen ? "lg:col-span-8" : "lg:col-span-12"
      )}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-black text-sm">
              Danh sách mẫu thông báo
            </h3>
            <p className="text-[11px] text-black mt-1 font-normal">
              Quản lý tất cả mẫu thiết kế tin nhắn/thông báo của hệ thống
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
          >
            + Thêm template
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2.5 items-center relative">
          <input
            type="text"
            placeholder="Tìm kiếm template bằng mã code hoặc tên..."
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
                  <label className="text-[10px] text-black font-semibold">Kênh truyền tải</label>
                  <select
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white text-black cursor-pointer focus:outline-none font-normal"
                  >
                    <option value="">Tất cả kênh</option>
                    <option value="APP">In-App</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Push</option>
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
                <th className="py-3 px-4">Tên Template</th>
                <th className="py-3 px-4">Sự Kiện Kích Hoạt</th>
                <th className="py-3 px-4">Kênh Mặc Định</th>
                <th className="py-3 px-4">Mức Độ</th>
                <th className="py-3 px-4">Trạng Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-black font-normal">
                    Không tìm thấy mẫu thông báo nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      if (rightPanelMode === 'form') {
                        setRightPanelMode('details');
                      }
                    }}
                    className={cn(
                      "hover:bg-slate-50 transition-colors cursor-pointer font-normal",
                      selectedTemplateId === tpl.id && "bg-blue-50/50 border-l-2 border-blue-600"
                    )}
                  >
                    <td className="py-3 px-4 text-left">
                      <div>
                        <p className="text-black font-normal">{tpl.name}</p>
                        <span className="font-mono text-[9px] text-black font-normal">{tpl.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <span className="px-2 py-0.5 bg-slate-100 text-black rounded font-mono text-[9px] border border-slate-200">
                        {tpl.eventCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex gap-1">
                        {tpl.channels.map((ch: string) => (
                          <span key={ch} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[9px] font-normal uppercase">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-normal uppercase",
                        tpl.priority === 'CRITICAL' && "bg-red-100 text-red-700",
                        tpl.priority === 'URGENT' && "bg-orange-100 text-orange-700",
                        tpl.priority === 'HIGH' && "bg-amber-100 text-amber-700",
                        tpl.priority === 'MEDIUM' && "bg-blue-100 text-blue-700",
                        tpl.priority === 'LOW' && "bg-slate-100 text-slate-700"
                      )}>
                        {tpl.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-normal",
                        tpl.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-black border border-slate-200"
                      )}>
                        {tpl.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTemplateId(tpl.id);
                            setRightPanelMode('details');
                            setIsDetailOpen(true);
                          }}
                          title="Xem chi tiết"
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded transition-all cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(tpl)}
                          title="Sửa template"
                          className="p-1 hover:bg-slate-100 text-amber-600 rounded transition-all cursor-pointer"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl.id)}
                          title="Xóa template"
                          className="p-1 hover:bg-slate-100 text-red-650 rounded transition-all cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex justify-between items-center text-xs text-black border-t border-slate-100 pt-3 font-normal">
          <div>
            Hiển thị 1 - {filteredTemplates.length} trong tổng số {filteredTemplates.length} template
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
            // Add/Edit template form
            <>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-black text-sm">
                  {editingTemplate ? 'Cập nhật template' : 'Thêm template mới'}
                </h3>
                <button
                  onClick={() => setRightPanelMode('details')}
                  className="p-1 hover:bg-slate-100 rounded-lg text-black transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Template Code */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Mã template *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: SOS_CREATED_APP"
                    disabled={!!editingTemplate}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-black focus:outline-none font-normal disabled:opacity-50"
                  />
                </div>

                {/* Template Name */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Tên template *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Mẫu đẩy qua app khẩn cấp"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal"
                  />
                </div>

                {/* Activation Event */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Sự kiện kích hoạt *</label>
                  <input
                    type="text"
                    required
                    value={formEventCode}
                    onChange={(e) => setFormEventCode(e.target.value)}
                    placeholder="Ví dụ: SOS_CREATED"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="block text-black font-normal">Độ ưu tiên *</label>
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

                  {/* Active checkbox */}
                  <div className="space-y-1.5">
                    <label className="block text-black font-normal">Mẫu mặc định</label>
                    <select
                      value={formIsActive ? 'true' : 'false'}
                      onChange={(e) => setFormIsActive(e.target.value === 'true')}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal cursor-pointer"
                    >
                      <option value="true">Đồng ý</option>
                      <option value="false">Không</option>
                    </select>
                  </div>
                </div>

                {/* Transmitting Channels (Checkboxes) */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Kênh truyền tải *</label>
                  <div className="flex gap-4 pt-1">
                    {['APP', 'PUSH', 'SMS', 'EMAIL'].map(ch => (
                      <label key={ch} className="flex items-center gap-1.5 cursor-pointer font-normal">
                        <input
                          type="checkbox"
                          checked={formChannels.includes(ch)}
                          onChange={() => handleChannelCheckbox(ch)}
                          className="rounded text-blue-600 border-slate-300 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>{ch}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Title Template */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Tiêu đề mẫu (Title Template)</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ví dụ: Có yêu cầu SOS mới từ {{citizenName}}"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-black focus:outline-none font-normal"
                  />
                </div>

                {/* Content Template */}
                <div className="space-y-1.5">
                  <label className="block text-black font-normal">Nội dung mẫu (Content Template)</label>
                  <textarea
                    rows={4}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Ví dụ: Địa chỉ: {{address}}. Vui lòng điều phối..."
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
            // Standard Template Details
            <>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-black text-sm">
                  Chi tiết template
                </h3>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-black transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs text-black font-normal">
                <div>
                  <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Tên Mẫu</p>
                  <p className="text-black font-semibold text-xs leading-snug">{selectedTemplate.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Mã Template</p>
                    <p className="font-mono text-black font-normal mt-1 bg-slate-50 p-1.5 rounded border border-slate-200 inline-block">{selectedTemplate.code}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Sự Kiện Kích Hoạt</p>
                    <p className="font-mono text-black font-normal mt-1 bg-slate-50 p-1.5 rounded border border-slate-200 inline-block">{selectedTemplate.eventCode}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Tiêu Đề Mẫu (Title Template)</p>
                  <p className="text-black mt-1 bg-slate-50 p-2.5 rounded border border-slate-200 leading-snug">{selectedTemplate.title}</p>
                </div>

                <div>
                  <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Nội Dung Mẫu (Content Template)</p>
                  <p className="text-black mt-1 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed whitespace-pre-wrap">{selectedTemplate.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Độ ưu tiên mặc định</p>
                    <span className="mt-1 inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[9px] font-normal uppercase text-black">
                      {selectedTemplate.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-black uppercase tracking-wider mb-0.5">Kênh truyền tải</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTemplate.channels.map((c: string) => (
                        <span key={c} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[8px] font-normal uppercase">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-black font-normal text-xs">Template Mặc Định cho sự kiện</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-normal text-[9px]">
                    {selectedTemplate.isActive ? 'ĐỒNG Ý' : 'KHÔNG'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
