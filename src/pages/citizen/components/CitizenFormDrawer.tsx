import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { userApi } from '../../../apis';
import { toast, useAuthStore } from '../../../stores';
import type { User, AdministrativeUnit } from '../../../types';

interface CitizenFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: User | null;
  adminUnits: AdministrativeUnit[];
  onSaveSuccess: () => void;
  userRoleId: number;
  volunteerRoleId: number;
}

export default function CitizenFormDrawer({
  isOpen,
  onClose,
  citizen,
  adminUnits,
  onSaveSuccess,
  userRoleId,
  volunteerRoleId,
}: CitizenFormDrawerProps) {
  const { user: currentUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [adminUnitId, setAdminUnitId] = useState<number | ''>('');
  const [addressDetail, setAddressDetail] = useState('');
  const [roleId, setRoleId] = useState<number>(userRoleId); // default USER/Resident
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (citizen) {
        setFullName(citizen.fullName || '');
        setPhone(citizen.phone || '');
        setEmail(citizen.email || '');
        setPassword('');
        setNationalId(citizen.nationalId || '');
        setGender(citizen.gender || 'MALE');
        setAdminUnitId(citizen.adminUnitId || '');
        setAddressDetail(citizen.addressDetail || '');
        
        // Active role parsing
        const activeRoleId = citizen.userRoles?.find((ur) => ur.isActive)?.roleId || userRoleId;
        setRoleId(activeRoleId);
        setIsVolunteer(!!citizen.isVolunteer);
        setNeedsHelp(!!citizen.needsHelp);
        
        if (citizen.dateOfBirth) {
          try {
            setDateOfBirth(new Date(citizen.dateOfBirth).toISOString().split('T')[0]);
          } catch {
            setDateOfBirth('');
          }
        } else {
          setDateOfBirth('');
        }
      } else {
        setFullName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setNationalId('');
        setDateOfBirth('');
        setGender('MALE');
        setAdminUnitId('');
        setAddressDetail('');
        setRoleId(userRoleId); // USER role
        setIsVolunteer(false);
        setNeedsHelp(false);
      }
    }
  }, [isOpen, citizen, userRoleId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        fullName,
        phone,
        email: email || undefined,
        nationalId,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        gender,
        provinceId: currentUser?.provinceId || 2,
        roleId: Number(roleId),
        adminUnitId: adminUnitId ? Number(adminUnitId) : null,
        addressDetail: addressDetail || null,
        isVolunteer,
        needsHelp,
      };

      if (!citizen) {
        payload.password = password || '123456'; // Default password
        return userApi.create(payload);
      } else {
        return userApi.update(citizen.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(citizen ? 'Cập nhật người dân thành công!' : 'Thêm người dân thành công!');
      onSaveSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.api(err, 'Lỗi lưu thông tin người dân');
    },
  });

  const validate = () => {
    const temp: Record<string, string> = {};
    if (!fullName.trim()) temp.fullName = 'Họ tên không được để trống';
    if (!phone.trim()) {
      temp.phone = 'SĐT không được để trống';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone)) {
      temp.phone = 'Số điện thoại không hợp lệ';
    }
    if (!nationalId.trim()) {
      temp.nationalId = 'CCCD không được để trống';
    } else if (!/^\d{9}$|^\d{12}$/.test(nationalId)) {
      temp.nationalId = 'CCCD phải gồm 9 hoặc 12 số';
    }
    if (!dateOfBirth) temp.dateOfBirth = 'Ngày sinh không được để trống';
    if (!adminUnitId) temp.adminUnitId = 'Vui lòng chọn khu vực';
    if (!citizen && !password.trim()) {
      temp.password = 'Mật khẩu không được để trống';
    } else if (!citizen && password.length < 6) {
      temp.password = 'Mật khẩu phải từ 6 ký tự';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate();
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] overflow-hidden transition-all duration-300 flex justify-end select-none",
      isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Panel */}
      <div className={cn(
        "relative w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col h-full transition-transform duration-300 ease-out transform text-left",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {citizen ? 'Chỉnh sửa người dân' : 'Thêm người dân'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-all cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-semibold">
          {/* Section 1: Thông tin cá nhân */}
          <div className="space-y-4">
            <h4 className="text-gray-400 font-bold border-l-2 border-blue-500 pl-2 leading-none uppercase text-[10px]">
              Thông tin cá nhân
            </h4>
            
            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400">Số CCCD/CMND *</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Nhập CCCD/CMND"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.nationalId && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.nationalId}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400">Giới tính *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400">Số điện thoại *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-500 dark:text-gray-400">Ngày sinh *</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
                {errors.dateOfBirth && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.dateOfBirth}</p>}
              </div>

              {!citizen && (
                <div className="space-y-1">
                  <label className="text-gray-500 dark:text-gray-400">Mật khẩu *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.password && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.password}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Địa chỉ */}
          <div className="space-y-4 pt-2">
            <h4 className="text-gray-400 font-bold border-l-2 border-blue-500 pl-2 leading-none uppercase text-[10px]">
              Địa chỉ
            </h4>

            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Khu vực *</label>
              <select
                value={adminUnitId}
                onChange={(e) => setAdminUnitId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Chọn khu vực</option>
                {adminUnits.map((ward) => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
              {errors.adminUnitId && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.adminUnitId}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 dark:text-gray-400">Địa chỉ chi tiết</label>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="Nhập địa chỉ chi tiết"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 3: Thông tin khác */}
          <div className="space-y-4 pt-2">
            <h4 className="text-gray-400 font-bold border-l-2 border-blue-500 pl-2 leading-none uppercase text-[10px]">
              Thông tin khác
            </h4>

            {/* Toggle Switch Tình nguyện viên */}
            <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-gray-900/40 p-3 rounded-xl">
              <div>
                <p className="text-gray-800 dark:text-slate-200 text-xs font-bold leading-none">Tình nguyện viên</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Đồng ý tham gia các công tác hỗ trợ khẩn cấp</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVolunteer}
                  onChange={(e) => {
                    setIsVolunteer(e.target.checked);
                    if (e.target.checked) setRoleId(volunteerRoleId);
                    else if (roleId === volunteerRoleId) setRoleId(userRoleId);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-650"></div>
              </label>
            </div>

            {/* Toggle Switch Cần hỗ trợ */}
            <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-gray-900/40 p-3 rounded-xl">
              <div>
                <p className="text-gray-800 dark:text-slate-200 text-xs font-bold leading-none">Cần hỗ trợ</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Đang gặp khó khăn và cần tiếp tế/cứu trợ</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsHelp}
                  onChange={(e) => setNeedsHelp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-650"></div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saveMutation.isPending}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-750 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            {saveMutation.isPending && <Loader2 className="animate-spin" size={13} />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
