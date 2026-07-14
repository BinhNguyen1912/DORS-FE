import {
  X,
  Check,
  Calendar,
  UserCheck,
  FileText,
  Phone,
  MapPin,
  User as UserIcon,
  Mail,
  Clock,
  Activity,
  ShieldCheck,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { User } from '../../../types';

interface CitizenDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: User | null;
  getAdminUnitName: (id?: number) => string;
  tab: 'general' | 'history' | 'trust' | 'support';
  setTab: (t: 'general' | 'history' | 'trust' | 'support') => void;
  formatDate: (d?: string | Date) => string;
  formatDateTime: (d?: string | Date) => string;
  onEdit: (user: User) => void;
  onNotify: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function CitizenDetailModal({
  isOpen,
  onClose,
  citizen,
  getAdminUnitName,
  tab,
  setTab,
  formatDate,
  formatDateTime,
  onEdit,
  onNotify,
  onDelete,
}: CitizenDetailModalProps) {
  if (!isOpen || !citizen) return null;

  const isVerified = citizen.isVerified || citizen.nationalIdVerified;
  const genderText = citizen.gender === 'MALE' ? 'Nam' : citizen.gender === 'FEMALE' ? 'Nữ' : 'Khác';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full md:p-8 p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 text-left flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-150 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {citizen.avatarUrl ? (
                <img src={citizen.avatarUrl} alt={citizen.fullName} className="w-full h-full object-cover rounded-full" />
              ) : (
                citizen.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                {citizen.fullName}
                <span className={cn(
                  'px-2 py-0.5 text-[9px] font-bold rounded flex items-center gap-1 leading-none border',
                  isVerified
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                )}>
                  {isVerified && <Check size={10} />} {isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">ID người dùng: {citizen.id}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded flex items-center gap-1.5 leading-none">
                  <UserCheck size={12} /> {citizen.isVolunteer ? 'Tình nguyện viên' : 'Người dân'}
                </span>
                <span className="px-2.5 py-1 bg-slate-50 dark:bg-gray-900/40 text-gray-500 dark:text-slate-400 text-xs font-semibold rounded flex items-center gap-1.5 leading-none">
                  <Calendar size={12} /> Tham gia: {formatDate(citizen.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex border-b border-slate-150 dark:border-slate-700 gap-4 text-xs font-bold leading-none py-3.5 flex-shrink-0">
          <button
            onClick={() => setTab('general')}
            className={cn('pb-2 px-1 border-b-2 transition-all cursor-pointer border-0 bg-transparent flex items-center gap-1.5', tab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600')}
          >
            <FileText size={13} /> Thông tin chung
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn('pb-2 px-1 border-b-2 transition-all cursor-pointer border-0 bg-transparent flex items-center gap-1.5', tab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600')}
          >
            <Clock size={13} /> Lịch sử hoạt động
          </button>
          <button
            onClick={() => setTab('trust')}
            className={cn('pb-2 px-1 border-b-2 transition-all cursor-pointer border-0 bg-transparent flex items-center gap-1.5', tab === 'trust' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600')}
          >
            <ShieldCheck size={13} /> Điểm tin cậy
          </button>
          <button
            onClick={() => setTab('support')}
            className={cn('pb-2 px-1 border-b-2 transition-all cursor-pointer border-0 bg-transparent flex items-center gap-1.5', tab === 'support' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600')}
          >
            <MessageSquare size={13} /> Hỗ trợ & Ghi chú
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs leading-relaxed">
          {tab === 'general' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <FileText size={14} /> THÔNG TIN CHUNG
              </div>

              {/* Grid Box */}
              <div className="border border-slate-150 dark:border-slate-700/80 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40 divide-y divide-slate-150 dark:divide-slate-700/80">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-700/80">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <Phone size={13} className="text-gray-400" /> Số điện thoại
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      {citizen.phone || 'Chưa cập nhật'}
                      {citizen.phoneVerified && <Check size={12} className="text-emerald-500" />}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <MapPin size={13} className="text-gray-400" /> Khu vực
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {getAdminUnitName(citizen.adminUnitId) || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-700/80">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <FileText size={13} className="text-gray-400" /> CCCD/CMND
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono flex items-center gap-1">
                      {citizen.nationalId || 'Chưa cập nhật'}
                      {citizen.nationalIdVerified && <Check size={12} className="text-emerald-500" />}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <UserCheck size={13} className="text-gray-400" /> Vai trò
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {citizen.isVolunteer ? 'Tình nguyện viên' : 'Người dân'}
                    </span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-700/80">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400" /> Ngày sinh
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatDate(citizen.dateOfBirth)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <Activity size={13} className="text-gray-400" /> Tình trạng hỗ trợ
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase",
                      citizen.needsHelp 
                        ? "bg-red-100 text-red-650 dark:bg-red-950/30 dark:text-red-400" 
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    )}>
                      {citizen.needsHelp ? 'Cần hỗ trợ' : 'Bình thường'}
                    </span>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-700/80">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <UserIcon size={13} className="text-gray-400" /> Giới tính
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{genderText}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <ShieldCheck size={13} className="text-gray-400" /> Trạng thái tài khoản
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase",
                      citizen.isActive 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                        : "bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-450"
                    )}>
                      {citizen.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                    </span>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-700/80">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <Mail size={13} className="text-gray-400" /> Email
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]" title={citizen.email}>
                      {citizen.email || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <Clock size={13} className="text-gray-400" /> Ngày tham gia
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatDate(citizen.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Row 6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 dark:divide-slate-700/80">
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <MapPin size={13} className="text-gray-400" /> Địa chỉ chi tiết
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]" title={citizen.addressDetail}>
                      {citizen.addressDetail || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50/20 dark:bg-gray-900/10">
                    <span className="text-gray-400 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <Clock size={13} className="text-gray-400" /> Cập nhật lần cuối
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatDateTime(citizen.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Cards */}
              <div>
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-3 mt-4">
                  <ShieldCheck size={14} className="text-blue-500" /> XÁC MINH
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Card 1: CCCD */}
                  <div className="flex items-center gap-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-slate-200 text-[10px]">Xác minh CCCD/CMND</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold rounded uppercase">
                        {citizen.nationalIdVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </span>
                      <p className="text-[8px] text-gray-400 font-semibold mt-0.5">
                        {citizen.nationalIdVerified ? `Ngày xác minh: ${formatDate(citizen.createdAt)}` : 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  {/* Card 2: SĐT */}
                  <div className="flex items-center gap-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Phone size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-slate-200 text-[10px]">Xác minh số điện thoại</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold rounded uppercase">
                        {citizen.phoneVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </span>
                      <p className="text-[8px] text-gray-400 font-semibold mt-0.5">
                        {citizen.phoneVerified ? `Ngày xác minh: ${formatDate(citizen.createdAt)}` : 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Email */}
                  <div className="flex items-center gap-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Mail size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-slate-200 text-[10px]">Xác minh email</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold rounded uppercase">
                        {citizen.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </span>
                      <p className="text-[8px] text-gray-400 font-semibold mt-0.5">
                        {citizen.emailVerified ? `Ngày xác minh: ${formatDate(citizen.createdAt)}` : 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <Clock size={14} /> Lịch sử hoạt động
              </div>
              <div className="p-3 border border-slate-100 dark:border-gray-750 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl">
                <p className="font-bold text-gray-900 dark:text-white">Tham gia hệ thống</p>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">Thời gian: {formatDateTime(citizen.createdAt)}</p>
              </div>
              {citizen.updatedAt !== citizen.createdAt && (
                <div className="p-3 border border-slate-100 dark:border-gray-750 bg-slate-50/50 dark:bg-gray-900/30 rounded-xl">
                  <p className="font-bold text-gray-900 dark:text-white">Cập nhật thông tin tài khoản</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">Thời gian: {formatDateTime(citizen.updatedAt)}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'trust' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <ShieldCheck size={14} /> Điểm tin cậy
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-750 rounded-xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Điểm tin cậy của tài khoản</p>
                <div className="text-3xl font-extrabold text-blue-600 mb-1">
                  {citizen.trustScore ?? 50}<span className="text-gray-400 text-sm font-semibold">/100</span>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Đánh giá dựa trên độ chính xác thông tin cá nhân và lịch sử SOS</p>
              </div>
            </div>
          )}

          {tab === 'support' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider mb-2">
                <MessageSquare size={14} /> Ghi chú & Lịch sử tiếp nhận hỗ trợ
              </div>
              <div className="p-4 bg-slate-50 dark:bg-gray-900/30 border border-slate-100 dark:border-gray-750 rounded-xl text-center">
                <p className="text-gray-400 font-medium text-xs">Không có dữ liệu hỗ trợ hoặc ghi chú bổ sung nào cho người dân này.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-150 dark:border-slate-700 flex justify-between items-center flex-shrink-0 mt-4 gap-3 bg-slate-50/50 dark:bg-gray-900/20 -mx-6 -mb-6 md:-mx-8 md:-mb-8 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs"
          >
            Đóng
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onNotify(citizen)}
              className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-900 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-all cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-xs shadow-sm"
            >
              <Send size={13} /> Gửi thông báo
            </button>
            <button
              onClick={() => onEdit(citizen)}
              className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-900 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-all cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-xs shadow-sm"
            >
              <Edit2 size={13} /> Chỉnh sửa
            </button>
            <button
              onClick={() => onDelete(citizen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs shadow-sm"
            >
              <Trash2 size={13} /> Xóa người dùng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
