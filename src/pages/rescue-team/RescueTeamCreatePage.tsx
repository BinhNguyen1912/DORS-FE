import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { rescueTeamApi, locationApi } from '../../apis';
import { useRef, useCallback } from 'react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import type { Province, AdministrativeUnit } from '../../types';
import { useAuthStore, toast } from '../../stores';
import ImageUpload from '../../components/common/ImageUpload';
import LocationPickerMap from '../../components/rescue-team/LocationPickerMap';

// Zod validation schema - provinceId/adminUnitId are optional when coordinates are provided
const rescueTeamSchema = z
  .object({
    name: z.string().min(2, 'Tên đội cứu hộ phải có ít nhất 2 ký tự'),
    provinceId: z.string().optional(),
    adminUnitId: z.string().optional(),
    teamType: z.enum(['DAN_PHONG', 'PCCC', 'QUAN_SU', 'TINH_NGUYEN', 'Y_TE', 'TONG_HOP']),
    maxCapacity: z.string().optional(),
    logoUrl: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    specializationIds: z.array(z.number()),
  })
  .refine(
    (data) =>
      (data.provinceId && data.adminUnitId) ||
      (data.latitude && data.longitude),
    {
      message:
        'Vui lòng chọn vị trí trên bản đồ hoặc chọn Tỉnh/Thành phố và Quận/Xã/Phường',
      path: ['provinceId'],
    }
  );

type RescueTeamForm = z.infer<typeof rescueTeamSchema>;

const teamTypeLabels: Record<string, string> = {
  DAN_PHONG: 'Dân phòng',
  PCCC: 'Phòng cháy chữa cháy (PCCC)',
  QUAN_SU: 'Quân sự',
  TINH_NGUYEN: 'Tình nguyện',
  Y_TE: 'Y tế',
  TONG_HOP: 'Tổng hợp',
};

export default function RescueTeamCreatePage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<AdministrativeUnit[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const resolveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();

  const [hasAutoPopulatedProvince, setHasAutoPopulatedProvince] = useState(false);
  const [hasAutoPopulatedWard, setHasAutoPopulatedWard] = useState(false);
  
  // Spec dropdown states
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);
  const [specSearch, setSpecSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<RescueTeamForm>({
    resolver: zodResolver(rescueTeamSchema),
    defaultValues: {
      teamType: 'TONG_HOP',
      provinceId: user?.provinceId ? String(user.provinceId) : '',
      adminUnitId: user?.adminUnitId ? String(user.adminUnitId) : '',
      specializationIds: [],
    },
  });

  const provinceIdStr = watch('provinceId');
  const provinceId = provinceIdStr ? Number(provinceIdStr) : undefined;
  const selectedSpecs = watch('specializationIds') || [];

  // Auto-resolve province/ward from GPS coordinates after user picks on map
  const handleMapLocationChange = useCallback(
    (lat: string, lng: string) => {
      setValue('latitude', lat);
      setValue('longitude', lng);

      if (resolveDebounceRef.current) {
        clearTimeout(resolveDebounceRef.current);
      }

      resolveDebounceRef.current = setTimeout(async () => {
        setIsResolvingLocation(true);
        try {
          const resolved = await locationApi.resolveLocation(
            Number(lat),
            Number(lng),
          );
          if (resolved) {
            setValue('provinceId', String(resolved.provinceId));
            // Trigger ward list reload before setting adminUnitId
            await new Promise<void>((resolve) => {
              const check = setInterval(() => {
                clearInterval(check);
                resolve();
              }, 600);
            });
            setValue('adminUnitId', String(resolved.adminUnitId));
          }
        } catch (err) {
          console.error('Lỗi khi tự động xác định đơn vị hành chính từ tọa độ:', err);
        } finally {
          setIsResolvingLocation(false);
        }
      }, 800);
    },
    [setValue],
  );



  // Pre-populate province from user profile when provinces are loaded
  useEffect(() => {
    if (user && provinces.length > 0 && !hasAutoPopulatedProvince) {
      if (user.provinceId) {
        setValue('provinceId', String(user.provinceId));
        setHasAutoPopulatedProvince(true);
      }
    }
  }, [user, provinces, setValue, hasAutoPopulatedProvince]);

  // Pre-populate ward from user profile when wards are loaded
  useEffect(() => {
    if (user && wards.length > 0 && !hasAutoPopulatedWard) {
      if (user.adminUnitId && wards.some((w) => String(w.id) === String(user.adminUnitId))) {
        setValue('adminUnitId', String(user.adminUnitId));
        setHasAutoPopulatedWard(true);
      }
    }
  }, [user, wards, setValue, hasAutoPopulatedWard]);

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await locationApi.getAllProvinces();
        setProvinces(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách Tỉnh/Thành phố:', err);
      }
    };
    fetchProvinces();
  }, []);

  // Load administrative units when provinceId changes
  useEffect(() => {
    if (!provinceId) {
      setWards([]);
      setValue('adminUnitId', '');
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const data = await locationApi.getWardsByProvinceId(provinceId);
        setWards(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách quận/huyện:', err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [provinceId, setValue]);

  // Load specializations on mount
  useEffect(() => {
    const fetchSpecializations = async () => {
      setLoadingSpecializations(true);
      try {
        const data = await rescueTeamApi.getSpecializations({ isActive: true });
        setSpecializations(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách chuyên môn:', err);
      } finally {
        setLoadingSpecializations(false);
      }
    };
    fetchSpecializations();
  }, []);

  const handleToggleSpec = (id: number) => {
    if (selectedSpecs.includes(id)) {
      setValue('specializationIds', selectedSpecs.filter((x) => x !== id));
    } else {
      setValue('specializationIds', [...selectedSpecs, id]);
    }
  };

  const onSubmit = async (data: RescueTeamForm) => {
    setError(null);
    setIsLoading(true);
    try {
      const submitData: any = {
        name: data.name,
        teamType: data.teamType,
        maxCapacity: data.maxCapacity ? Number(data.maxCapacity) : undefined,
        logoUrl: data.logoUrl || undefined,
        specializationIds: data.specializationIds.length > 0 ? data.specializationIds : undefined,
      };

      // Only send province/adminUnit if explicitly selected
      if (data.provinceId) submitData.provinceId = Number(data.provinceId);
      if (data.adminUnitId) submitData.adminUnitId = Number(data.adminUnitId);

      // Construct GeoJSON point if coordinates are provided (backend resolves ids from coords if needed)
      if (data.latitude && data.longitude) {
        submitData.baseLocation = {
          type: 'Point',
          coordinates: [Number(data.longitude), Number(data.latitude)], // GeoJSON: [lng, lat]
        };
      }

      await rescueTeamApi.create(submitData);
      toast.success('Tạo đội cứu hộ mới thành công!');
      navigate(ROUTES.RESCUE_TEAM_LIST);
    } catch (err: any) {
      toast.api(err, 'Lỗi khi tạo đội cứu hộ');
      setError(err.response?.data?.message || 'Lỗi khi tạo đội cứu hộ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full text-left">
      {/* Page Header */}
      <div className="flex items-center">
        <Link
          to={ROUTES.RESCUE_TEAM_LIST}
          className="p-1.5 rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-slate-700/60 shadow-sm transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Quay lại</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
          <Info size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-gray-700 space-y-4">

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên Đội */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Tên đội cứu hộ *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="Nhập tên đội cứu hộ..."
                className={cn(
                  'w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                  errors.name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400'
                )}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Phân Loại Đội */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Phân loại đội cứu hộ *
              </label>
              <select
                {...register('teamType')}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-semibold"
              >
                {Object.entries(teamTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tỉnh / Thành Phố */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                Tỉnh / Thành phố
                {isResolvingLocation ? (
                  <span className="flex items-center gap-1 text-indigo-500 font-normal">
                    <Loader2 size={10} className="animate-spin" /> Đang tự động xác định...
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(Tự động điền từ bản đồ)</span>
                )}
              </label>
              <select
                {...register('provinceId')}
                className={cn(
                  'w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold',
                  errors.provinceId
                    ? 'border-red-500 focus:border-red-500'
                    : watch('provinceId')
                    ? 'border-green-400 dark:border-green-600'
                    : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400'
                )}
              >
                <option value="">-- Chọn hoặc để hệ thống tự điền --</option>
                {provinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
              {errors.provinceId && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.provinceId.message}</p>
              )}
            </div>

            {/* Quận / Huyện / Phường / Xã */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                Quận / Huyện / Phường / Xã
                <span className="text-gray-400 dark:text-gray-500 font-normal">(Tự động điền từ bản đồ)</span>
              </label>
              <select
                {...register('adminUnitId')}
                disabled={!provinceId || loadingWards}
                className={cn(
                  'w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold',
                  errors.adminUnitId
                    ? 'border-red-500 focus:border-red-500'
                    : watch('adminUnitId')
                    ? 'border-green-400 dark:border-green-600'
                    : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400',
                  (!provinceId || loadingWards) && 'opacity-60 cursor-not-allowed'
                )}
              >
                <option value="">
                  {loadingWards ? 'Đang tải danh sách...' : '-- Chọn hoặc để hệ thống tự điền --'}
                </option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
              {errors.adminUnitId && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.adminUnitId.message}</p>
              )}
            </div>

            {/* Sức Chứa Tối Đa */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Sức chứa tối đa (Thành viên) <span className="text-gray-400 dark:text-gray-500 font-normal">(Tùy chọn)</span>
              </label>
              <input
                type="number"
                {...register('maxCapacity')}
                placeholder="Nhập số thành viên tối đa (ví dụ: 15)..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Tải Lên Logo Đội Cứu Hộ */}
            <div className="space-y-1.5">
              <Controller
                control={control}
                name="logoUrl"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    folder="rescue-teams"
                    label="Logo đội cứu hộ (Tùy chọn)"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Location Coordinates Card with Interactive Map */}
        <LocationPickerMap
          latitude={watch('latitude')}
          longitude={watch('longitude')}
          onChange={handleMapLocationChange}
          isResolvingLocation={isResolvingLocation}
          provinceId={provinceId}
          adminUnitId={watch('adminUnitId')}
          provinces={provinces}
          wards={wards}
        />

        {/* Specializations Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700/60 space-y-4">
          <div className="space-y-1.5 text-left relative">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Chuyên môn sở hữu * <span className="text-gray-400 font-normal">(Chọn nhiều từ danh sách)</span>
            </label>
            
            {/* Combo box trigger */}
            <div
              onClick={() => setIsSpecDropdownOpen(!isSpecDropdownOpen)}
              className="w-full min-h-[38px] px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer flex flex-wrap gap-1.5 items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              {selectedSpecs.length === 0 ? (
                <span className="text-gray-400 font-medium">-- Chọn chuyên môn của đội --</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedSpecs.map((id) => {
                    const spec = specializations.find(s => s.id === id);
                    return spec ? (
                      <span
                        key={id}
                        className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-bold rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-1 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSpec(id);
                        }}
                      >
                        {spec.name}
                        <span className="text-indigo-450 hover:text-indigo-650 font-extrabold cursor-pointer">×</span>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <span className="text-gray-400 text-[10px]">▼</span>
            </div>

            {/* Dropdown panel */}
            {isSpecDropdownOpen && (
              <>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-10" onClick={() => { setIsSpecDropdownOpen(false); setSpecSearch(''); }} />
                
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-slate-100 dark:border-slate-700/60 rounded-xl shadow-lg p-2.5 z-20 space-y-2 max-h-60 overflow-y-auto">
                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Tìm nhanh chuyên môn..."
                    value={specSearch}
                    onChange={(e) => setSpecSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {loadingSpecializations ? (
                    <p className="text-[10px] text-center text-gray-400 py-2">Đang tải...</p>
                  ) : specializations.length === 0 ? (
                    <p className="text-[10px] text-center text-gray-400 py-2">Không có chuyên môn cho loại đội này</p>
                  ) : (
                    <div className="space-y-1">
                      {specializations
                        .filter(s => s.name.toLowerCase().includes(specSearch.toLowerCase()))
                        .map((spec) => {
                          const isSelected = selectedSpecs.includes(spec.id);
                          return (
                            <div
                              key={spec.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSpec(spec.id);
                              }}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all",
                                isSelected 
                                  ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-bold" 
                                  : "hover:bg-slate-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-medium"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-3.5 h-3.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                              />
                              <span className="text-[11px] select-none">{spec.name}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <Link
            to={ROUTES.RESCUE_TEAM_LIST}
            className="px-5 py-2 border border-slate-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isLoading && <Loader2 className="animate-spin" size={14} />}
            <Save size={14} />
            Lưu & Tạo Đội
          </button>
        </div>
      </form>
    </div>
  );
}
