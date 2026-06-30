import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Loader2, Camera, Upload } from 'lucide-react';
import { userApi, locationApi, roleApi } from '../../apis';
import { toast, useAuthStore } from '../../stores';
import type { User, Province, AdministrativeUnit } from '../../types';
import api from '../../lib/axios';
import LocationPickerMap from '../../components/rescue-team/LocationPickerMap';

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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adminUnits, setAdminUnits] = useState<AdministrativeUnit[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Address Suggestions States
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const debounceRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [provinceCenter, setProvinceCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Load province center to bound Osm suggestions
  useEffect(() => {
    if (isOpen && provinceId) {
      api.get(`/locations/provinces/${provinceId}/center`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setProvinceCenter(res.data.data);
          } else {
            setProvinceCenter(null);
          }
        })
        .catch((err) => {
          console.error('Error fetching province center:', err);
          setProvinceCenter(null);
        });
    } else {
      setProvinceCenter(null);
    }
  }, [isOpen, provinceId]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (searchText: string) => {
    const selectedProvince = provinces.find((p) => p.id === provinceId)?.name || '';
    const selectedWard = adminUnits.find((w) => w.id === adminUnitId)?.name || '';
    
    if (!searchText.trim() && !selectedWard && !selectedProvince) {
      setSuggestions([]);
      return;
    }
    
    setIsSearchingSuggestions(true);
    try {
      const cleanProvince = selectedProvince.replace(/^(Thành phố|Tỉnh)\s+/i, '');
      const cleanWard = selectedWard.replace(/^(Phường|Xã|Thị trấn)\s+/i, '');

      const queryParts = [];
      if (searchText.trim()) {
        queryParts.push(searchText.trim());
      }
      if (cleanWard) queryParts.push(cleanWard);
      if (cleanProvince) queryParts.push(cleanProvince);
      queryParts.push('Việt Nam');
      
      const query = queryParts.join(', ');
      
      let viewboxValue: string | undefined = undefined;
      if (provinceCenter) {
        const margin = 0.8;
        const minLng = provinceCenter.lng - margin;
        const maxLng = provinceCenter.lng + margin;
        const minLat = provinceCenter.lat - margin;
        const maxLat = provinceCenter.lat + margin;
        viewboxValue = `${minLng},${maxLat},${maxLng},${minLat}`;
      }

      const data = await locationApi.geocode(query, 5, viewboxValue);
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddressDetail(value);
    setShowSuggestions(true);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 600);
  };

  const handleAddressFocus = () => {
    setShowSuggestions(true);
    if (suggestions.length === 0) {
      fetchSuggestions(addressDetail);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const addr = suggestion.address;
    const parts: string[] = [];
    if (addr) {
      if (addr.house_number) parts.push(addr.house_number);
      if (addr.road) parts.push(addr.road);
      if (addr.pedestrian) parts.push(addr.pedestrian);
      if (addr.suburb && parts.length === 0) parts.push(addr.suburb);
    }
    const streetAddress = parts.join(' ');
    const fallbackText = suggestion.display_name.split(',')[0] || suggestion.display_name;
    setAddressDetail(streetAddress || fallbackText);
    if (suggestion.lat && suggestion.lon) {
      setLatitude(parseFloat(suggestion.lat).toFixed(6));
      setLongitude(parseFloat(suggestion.lon).toFixed(6));
    }
    setShowSuggestions(false);
  };

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
      setAvatarError(null);
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
        setAvatarUrl(user.avatarUrl || '');
        if (user.homeLocation && user.homeLocation.coordinates) {
          setLatitude(String(user.homeLocation.coordinates[1]));
          setLongitude(String(user.homeLocation.coordinates[0]));
        } else {
          setLatitude('');
          setLongitude('');
        }
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
        setAvatarUrl('');
        setLatitude('');
        setLongitude('');
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

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Tệp không hợp lệ');
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP...)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Tối đa 5MB');
      toast.error('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setAvatarError(null);
    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<{ url: string }>(
        `/upload/single?folder=avatars`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const uploadedUrl = response.data?.url;
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
      } else {
        setAvatarError('Lỗi nhận link');
      }
    } catch (err: any) {
      console.error('Lỗi upload avatar:', err);
      setAvatarError('Lỗi tải lên');
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        avatarUrl: avatarUrl || null,
        homeLocation: latitude && longitude 
          ? { type: 'Point', coordinates: [Number(longitude), Number(latitude)] } 
          : null,
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
          
          {/* Avatar Upload (Icon only, textless circular design) */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div 
              onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-slate-350 dark:border-slate-650 bg-slate-50 dark:bg-gray-900/50 hover:bg-slate-100 dark:hover:bg-gray-900 cursor-pointer flex items-center justify-center overflow-hidden group transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
                disabled={isUploadingAvatar}
              />
              
              {isUploadingAvatar ? (
                <Loader2 className="animate-spin text-blue-500" size={20} />
              ) : avatarUrl ? (
                <>
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <Camera size={18} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors">
                  <Upload size={18} />
                </div>
              )}
            </div>
            {avatarError && (
              <p className="text-[10px] text-red-500 font-bold mt-1">
                {avatarError}
              </p>
            )}
          </div>
          
          {/* General Information Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Họ và tên <span className="text-red-500 ml-1">(*)</span>
              </label>
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
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Số điện thoại <span className="text-red-500 ml-1">(*)</span>
              </label>
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
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Số CCCD <span className="text-red-500 ml-1">(*)</span>
              </label>
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
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Mật khẩu <span className="text-red-500 ml-1">(*)</span>
              </label>
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
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Ngày sinh <span className="text-red-500 ml-1">(*)</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer"
              />
              {errors.dateOfBirth && <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Giới tính <span className="text-red-500 ml-1">(*)</span>
              </label>
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
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Vai trò hệ thống <span className="text-red-500 ml-1">(*)</span>
              </label>
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
              <label className="text-gray-500 font-bold dark:text-gray-400">
                Địa bàn quản lý <span className="text-red-500 ml-1">(*)</span>
              </label>
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

            <div className="space-y-1 relative" ref={suggestionsRef}>
              <label className="text-gray-500 font-bold dark:text-gray-400">Địa chỉ chi tiết (Số nhà, đường...)</label>
              <div className="relative">
                <input
                  type="text"
                  value={addressDetail}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={handleAddressFocus}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all pr-8"
                  placeholder="ví dụ: 123 Lê Lợi"
                />
                {isSearchingSuggestions && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-gray-400" size={13} />
                  </div>
                )}
              </div>
              
              {showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-700/60">
                  {isSearchingSuggestions && suggestions.length === 0 ? (
                    <div className="p-3 text-center text-gray-400 text-[10px] font-bold">
                      Đang tìm kiếm gợi ý...
                    </div>
                  ) : (
                    suggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(s)}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-gray-700/60 cursor-pointer transition-colors text-left"
                      >
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">
                          {s.address?.house_number ? `${s.address.house_number} ` : ''}
                          {s.address?.road || s.address?.pedestrian || s.address?.suburb || s.display_name.split(',')[0]}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-normal">
                          {s.display_name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Picker Map */}
          <div className="space-y-2">
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              provinceId={provinceId}
              adminUnitId={String(adminUnitId)}
              provinces={provinces}
              wards={adminUnits}
              showSearch={false}
            />
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
