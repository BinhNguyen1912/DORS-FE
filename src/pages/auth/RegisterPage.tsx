import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Select from 'react-select';
import { Loader2, Eye, EyeOff, User, Phone, Lock, MapPin, Info } from 'lucide-react';
import { authApi, locationApi } from '../../apis';
import { useAuthStore, toast } from '../../stores';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import type { Province, AdministrativeUnit } from '../../types';
import { registerSchema, type RegisterForm } from '../../schemas';

// Glassmorphic Custom Styles for react-select
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: state.isFocused ? '#f06400' : 'rgba(255, 255, 255, 0.15)',
    borderRadius: '0.75rem', // rounded-xl
    paddingLeft: '2.5rem', // Room for left MapPin icon
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
    color: '#fff',
    minHeight: '48px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(240, 100, 0, 0.2)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#f06400' : 'rgba(255, 255, 255, 0.25)',
    },
    cursor: 'pointer',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#fff',
    textAlign: 'left',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'left',
  }),
  input: (base: any) => ({
    ...base,
    color: '#fff',
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: '#000000', // Pure black menu background
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '0.75rem',
    marginTop: '4px',
    overflow: 'hidden',
  }),
  menuList: (base: any) => ({
    ...base,
    padding: '4px 0',
    maxHeight: '220px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? '#ffffff' // White background for selected option
      : state.isFocused 
        ? 'rgba(255, 255, 255, 0.15)' 
        : 'transparent',
    color: state.isSelected ? '#000000' : '#ffffff', // Black text for selected, white for others
    cursor: 'pointer',
    textAlign: 'left',
    '&:active': {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      color: '#fff',
    },
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};

const generateRandomNationalId = (): string => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  
  const [wards, setWards] = useState<AdministrativeUnit[]>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      provinceId: '',
      adminUnitId: '',
      password: '',
      confirmPassword: '',
      isVolunteer: false,
      needsHelp: false,
    },
  });

  // Load Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const data = await locationApi.getAllProvinces();
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        setProvinces(sorted);
      } catch (err) {
        console.error('Failed to load provinces, loading fallback', err);
        setProvinces([
          { id: 1, name: 'Hà Nội', code: 1, isActive: true },
          { id: 2, name: 'TP. Hồ Chí Minh', code: 79, isActive: true },
          { id: 3, name: 'Đà Nẵng', code: 48, isActive: true },
          { id: 4, name: 'Quảng Bình', code: 44, isActive: true },
          { id: 5, name: 'Quảng Trị', code: 45, isActive: true },
          { id: 6, name: 'Thừa Thiên Huế', code: 46, isActive: true },
          { id: 7, name: 'Hải Phòng', code: 31, isActive: true },
          { id: 8, name: 'Cần Thơ', code: 92, isActive: true },
        ]);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Load Wards / Administrative Units based on Province
  useEffect(() => {
    if (!selectedProvinceId) {
      return;
    }
    const fetchWards = async () => {
      setIsLoadingWards(true);
      try {
        const data = await locationApi.getWardsByProvinceId(parseInt(selectedProvinceId, 10));
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        setWards(sorted);
      } catch (err) {
        console.error('Failed to load administrative units, loading fallback', err);
        setWards([
          { id: 101, name: 'Phường Hòa Khánh Nam', code: '101', type: 'WARD', provinceId: parseInt(selectedProvinceId, 10) },
          { id: 102, name: 'Phường Hòa Khánh Bắc', code: '102', type: 'WARD', provinceId: parseInt(selectedProvinceId, 10) },
          { id: 103, name: 'Phường Hòa Minh', code: '103', type: 'WARD', provinceId: parseInt(selectedProvinceId, 10) },
          { id: 104, name: 'Xã Hòa Tiến', code: '104', type: 'COMMUNE', provinceId: parseInt(selectedProvinceId, 10) },
        ]);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedProvinceId]);

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setIsLoading(true);
    try {
      const randomNationalId = generateRandomNationalId();

      const response = await authApi.register({
        fullName: data.fullName,
        phone: data.phone,
        password: data.password,
        provinceId: parseInt(data.provinceId, 10),
        adminUnitId: data.adminUnitId ? parseInt(data.adminUnitId, 10) : undefined,
        nationalId: randomNationalId,
        dateOfBirth: '2000-01-01T00:00:00.000Z',
        gender: 'OTHER',
        isVolunteer: data.isVolunteer,
        needsHelp: data.needsHelp,
      });

      setAuth(response.user, response.accessToken);
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      toast.success('Đăng ký tài khoản thành công!');
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      toast.api(err, 'Đăng ký không thành công');
      const errorResponse = err as { response?: { data?: { message?: string | string[] } } };
      const rawMessage = errorResponse.response?.data?.message;
      let finalMessage = 'Đăng ký tài khoản không thành công. Vui lòng thử lại.';
      if (Array.isArray(rawMessage)) {
        finalMessage = rawMessage.join(', ');
      } else if (typeof rawMessage === 'string') {
        finalMessage = rawMessage;
      }
      setError(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Options formatting for React Select
  const provinceOptions = provinces.map(p => ({
    value: p.id.toString(),
    label: p.name
  }));

  const wardOptions = wards.map(w => {
    let typePrefix = '';
    if (w.type === 'DISTRICT') typePrefix = 'Quận/Huyện';
    else if (w.type === 'WARD') typePrefix = 'Phường';
    else if (w.type === 'COMMUNE') typePrefix = 'Xã';
    else if (w.type === 'HAMLET') typePrefix = 'Ấn/Thôn';
    
    return {
      value: w.id.toString(),
      label: typePrefix ? `${typePrefix}: ${w.name}` : w.name
    };
  });

  return (
    <div className="w-full max-w-[500px] border border-white/20 bg-black/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col relative text-white">
      <div className="flex items-center justify-center mb-4">
        <img src="/logo.png" alt="Cứu Hộ Việt Nam" className="h-10 sm:h-20 w-auto object-contain" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-wide !text-white pb-4 uppercase">
        Đăng ký tài khoản
      </h2>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-200 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Họ và Tên */}
        <div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
              <User size={20} />
            </div>
            <input
              {...register('fullName')}
              type="text"
              placeholder="Họ và Tên"
              className={cn(
                "w-full pl-12 pr-4 py-3.5 bg-white/10 border rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
                errors.fullName ? "border-rose-500/60 focus:border-rose-500" : "border-white/15 focus:border-orange-500"
              )}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Số Điện Thoại */}
        <div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
              <Phone size={20} />
            </div>
            <input
              {...register('phone')}
              type="tel"
              placeholder="Số Điện Thoại"
              className={cn(
                "w-full pl-12 pr-4 py-3.5 bg-white/10 border rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
                errors.phone ? "border-rose-500/60 focus:border-rose-500" : "border-white/15 focus:border-orange-500"
              )}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Tỉnh / Thành phố */}
        <div>
          <div className="relative z-30">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none z-10">
              <MapPin size={20} />
            </div>
            <Controller
              name="provinceId"
              control={control}
              render={({ field: { onChange, value, ref } }) => {
                const selectedOption = provinceOptions.find(opt => opt.value === value) || null;
                return (
                  <Select
                    ref={ref}
                    value={selectedOption}
                    onChange={(val) => {
                      onChange(val ? val.value : '');
                      setSelectedProvinceId(val ? val.value : null);
                      setValue('adminUnitId', ''); // Reset ward selection when province changes
                      setWards([]);
                    }}
                    options={provinceOptions}
                    placeholder={isLoadingProvinces ? "Đang tải tỉnh/thành..." : "Tỉnh / Thành Phố"}
                    styles={customSelectStyles}
                    isSearchable
                    isClearable
                  />
                );
              }}
            />
          </div>
          {errors.provinceId && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">{errors.provinceId.message}</p>
          )}
        </div>

        {/* Phường / Xã / Quận / Huyện */}
        <div>
          <div className="relative z-20">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none z-10">
              <MapPin size={20} />
            </div>
            <Controller
              name="adminUnitId"
              control={control}
              render={({ field: { onChange, value, ref } }) => {
                const selectedOption = wardOptions.find(opt => opt.value === value) || null;
                return (
                  <Select
                    ref={ref}
                    value={selectedOption}
                    onChange={(val) => onChange(val ? val.value : '')}
                    options={wardOptions}
                    placeholder={
                      !selectedProvinceId 
                        ? "Phường/Xã/Quận/Huyện" 
                        : isLoadingWards 
                          ? "Đang tải phường/xã..." 
                          : "Phường/Xã/Quận/Huyện"
                    }
                    isDisabled={!selectedProvinceId || isLoadingWards}
                    styles={customSelectStyles}
                    isSearchable
                    isClearable
                  />
                );
              }}
            />
          </div>
          {errors.adminUnitId && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">{errors.adminUnitId.message}</p>
          )}
        </div>

        {/* Mật Khẩu */}
        <div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
              <Lock size={20} />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật Khẩu"
              className={cn(
                "w-full pl-12 pr-12 py-3.5 bg-white/10 border rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
                errors.password ? "border-rose-500/60 focus:border-rose-500" : "border-white/15 focus:border-orange-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">{errors.password.message}</p>
          )}
        </div>

        {/* Xác nhận mật khẩu */}
        <div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
              <Lock size={20} />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Xác Nhận Mật Khẩu"
              className={cn(
                "w-full pl-12 pr-12 py-3.5 bg-white/10 border rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
                errors.confirmPassword ? "border-rose-500/60 focus:border-rose-500" : "border-white/15 focus:border-orange-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Checkbox Roles */}
        <div className="space-y-2.5 pt-2">
          {/* Tôi là tình nguyện viên */}
          <label className="flex items-center gap-3 cursor-pointer select-none group text-sm w-fit">
            <input
              type="checkbox"
              {...register('isVolunteer')}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-orange-600 focus:ring-orange-500 focus:ring-offset-slate-900 focus:ring-offset-2 transition-all cursor-pointer"
            />
            <span className="text-white/90 font-medium flex items-center">
              Tôi là tình nguyện viên
              <span
                className="inline-flex items-center justify-center ml-1.5 text-white/50 hover:text-white transition-colors cursor-help"
                title="Đăng ký hỗ trợ các hoạt động cứu hộ, ứng phó thiên tai"
              >
                <Info size={14} />
              </span>
            </span>
          </label>

          {/* Tôi cần sự trợ giúp */}
          <label className="flex items-center gap-3 cursor-pointer select-none group text-sm w-fit">
            <input
              type="checkbox"
              {...register('needsHelp')}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-orange-600 focus:ring-orange-500 focus:ring-offset-slate-900 focus:ring-offset-2 transition-all cursor-pointer"
            />
            <span className="text-white/90 font-medium flex items-center">
              Tôi cần sự trợ giúp
              <span
                className="inline-flex items-center justify-center ml-1.5 text-white/50 hover:text-white transition-colors cursor-help"
                title="Đăng ký nhận hỗ trợ khẩn cấp, cứu hộ vùng thiên tai ngập lụt"
              >
                <Info size={14} />
              </span>
            </span>
          </label>
        </div>

        {/* Consent terms text */}
        <p className="text-xs text-white/70 text-center leading-relaxed pt-2">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <a href="#" className="text-orange-500 hover:text-orange-400 font-semibold hover:underline">
            Điều Khoản Dịch Vụ
          </a>{' '}
          và{' '}
          <a href="#" className="text-orange-500 hover:text-orange-400 font-semibold hover:underline">
            Chính Sách Bảo Mật
          </a>{' '}
          của chúng tôi.
        </p>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-[#f06400] hover:bg-[#e05d00] active:scale-[0.985] text-white text-base font-bold rounded-xl tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 disabled:bg-orange-600/50 disabled:cursor-not-allowed select-none cursor-pointer mt-4 uppercase"
        >
          {isLoading && <Loader2 className="animate-spin" size={18} />}
          ĐĂNG KÝ NGAY
        </button>
      </form>

      {/* Navigation Redirect */}
      <p className="pt-4 text-center text-sm text-white/70">
        Đã có tài khoản?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-orange-500 hover:text-orange-400 font-semibold hover:underline transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
