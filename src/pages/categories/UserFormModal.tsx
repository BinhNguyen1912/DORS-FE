import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { userApi, locationApi, roleApi } from '../../apis';
import { toast, useAuthStore } from '../../stores';
import type { User, Province, AdministrativeUnit } from '../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  provinces: Province[];
  onSaveSuccess: () => void;
}

const roleFriendlyNames: Record<string, string> = {
  SYSTEM_ADMIN: 'Quản trị viên hệ thống',
  PROVINCE_ADMIN: 'Quản trị viên cấp tỉnh',
  RESCUE_TEAM_LEADER: 'Đội trưởng đội cứu hộ',
  USER: 'Người dùng thường',
  VOLUNTEER: 'Tình nguyện viên',
};

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  provinces,
  onSaveSuccess,
}: UserFormModalProps) {
  const { user: currentUser } = useAuthStore();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [provinceId, setProvinceId] = useState<number>(1);
  const [roleId, setRoleId] = useState<number>(4);
  const [adminUnitId, setAdminUnitId] = useState<number | ''>('');
  const [addressDetail, setAddressDetail] = useState('');

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adminUnits, setAdminUnits] = useState<AdministrativeUnit[]>([]);

  // Load active roles from backend
  const { data: rolesData } = useQuery({
    queryKey: ['form-roles'],
    queryFn: () => roleApi.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  const roles = rolesData?.data || [];

  // Helper to extract user role ID
  const getUserRoleId = (u: User) => {
    if (u.userRoles && u.userRoles.length > 0) {
      const activeRoleMap = u.userRoles.find(ur => ur.isActive) || u.userRoles[0];
      if (activeRoleMap) {
        return activeRoleMap.roleId;
      }
    }
    return 4;
  };

  // Populate data on edit or reset on create
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (user) {
        setFullName(user.fullName || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        setPassword('');
        setNationalId(user.nationalId || '');
        setGender(user.gender as any || 'MALE');
        setProvinceId(user.provinceId || currentUser?.provinceId || 1);
        setRoleId(getUserRoleId(user));
        setAdminUnitId(user.adminUnitId || '');
        setAddressDetail(user.addressDetail || '');
        if (user.dateOfBirth) {
          try {
            setDateOfBirth(new Date(user.dateOfBirth).toISOString().split('T')[0]);
          } catch (e) {
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
        setProvinceId(currentUser?.provinceId || 1);
        setRoleId(4); // default to USER
        setAdminUnitId('');
        setAddressDetail('');
      }
    }
  }, [isOpen, user, currentUser]);

  // Load Wards dynamically based on selected provinceId
  useEffect(() => {
    if (isOpen && provinceId) {
      locationApi.getWardsByProvinceId(provinceId)
        .then(setAdminUnits)
        .catch((err) => {
          console.error('Error fetching admin units:', err);
          setAdminUnits([]);
        });
    } else {
      setAdminUnits([]);
    }
  }, [isOpen, provinceId]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        fullName,
        phone,
        email: email || undefined,
        nationalId,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        gender,
        provinceId: Number(provinceId),
        roleId: Number(roleId),
        adminUnitId: adminUnitId ? Number(adminUnitId) : null,
        addressDetail: addressDetail || null,
      };

      if (!user) {
        // Create mode needs password
        payload.password = password;
        return userApi.create(payload);
      } else {
        // Edit mode
        return userApi.update(user.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(user ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng mới thành công!');
      onSaveSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.api(err, user ? 'Lỗi khi cập nhật người dùng' : 'Lỗi khi thêm người dùng mới');
    },
  });

  if (!isOpen) return null;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!fullName.trim()) tempErrors.fullName = 'Họ tên không được để trống';
    
    // Validate phone: 10 digits, starting with 0
    if (!phone) {
      tempErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone)) {
      tempErrors.phone = 'Số điện thoại không hợp lệ (ví dụ: 0987654321)';
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email không hợp lệ';
    }

    if (!user && !password) {
      tempErrors.password = 'Mật khẩu không được để trống';
    } else if (!user && password.length < 8) {
      tempErrors.password = 'Mật khẩu phải từ 8 ký tự trở lên';
    }

    if (!nationalId) {
      tempErrors.nationalId = 'Số CCCD không được để trống';
    } else if (!/^\d{9}$|^\d{12}$/.test(nationalId)) {
      tempErrors.nationalId = 'CCCD phải gồm 9 hoặc 12 số';
    }

    if (!dateOfBirth) {
      tempErrors.dateOfBirth = 'Ngày sinh không được để trống';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 text-left flex flex-col max-h-[90vh] font-sans"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {user ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 text-xs font-semibold leading-relaxed">
          
          {/* General Information Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.fullName}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Số điện thoại *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="0987654321"
              />
              {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Email (Không bắt buộc)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="example@gmail.com"
              />
              {errors.email && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Số CCCD *</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="012345678901"
              />
              {errors.nationalId && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.nationalId}</p>}
            </div>
          </div>

          {/* Password only for Create mode */}
          {!user && (
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Mật khẩu *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="Nhập ít nhất 8 ký tự"
              />
              {errors.password && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.password}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Ngày sinh *</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
              />
              {errors.dateOfBirth && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Giới tính *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          {/* Role and Location assignment */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Vai trò hệ thống *</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {roleFriendlyNames[r.name] || r.description || r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Địa bàn quản lý *</label>
              <select
                value={provinceId}
                onChange={(e) => setProvinceId(Number(e.target.value))}
                disabled={currentUser?.role !== 'SYSTEM_ADMIN'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer disabled:opacity-60"
              >
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Đơn vị hành chính (Phường/Xã)</label>
              <select
                value={adminUnitId}
                onChange={(e) => setAdminUnitId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                <option value="">Không có / Chưa xác định</option>
                {adminUnits.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">Địa chỉ chi tiết (Số nhà, đường...)</label>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="ví dụ: 123 Lê Lợi"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {saveMutation.isPending && <Loader2 className="animate-spin" size={13} />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
