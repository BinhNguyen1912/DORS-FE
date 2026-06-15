import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { rescueTeamApi, locationApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import type { Province, AdministrativeUnit } from '../../types';
import { useAuthStore, toast } from '../../stores';
import ImageUpload from '../../components/common/ImageUpload';

// Zod validation schema matching backend inputs (treated as strings from HTML elements, cast on submission)
const rescueTeamSchema = z.object({
  name: z.string().min(2, 'Tên đội cứu hộ phải có ít nhất 2 ký tự'),
  provinceId: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  adminUnitId: z.string().min(1, 'Vui lòng chọn Quận/Huyện/Phường/Xã'),
  teamType: z.enum(['DAN_PHONG', 'PCCC', 'QUAN_SU', 'TINH_NGUYEN', 'Y_TE', 'TONG_HOP']),
  maxCapacity: z.string().optional(),
  logoUrl: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  specializationIds: z.array(z.number()),
});

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

  const navigate = useNavigate();

  const [hasAutoPopulatedProvince, setHasAutoPopulatedProvince] = useState(false);
  const [hasAutoPopulatedWard, setHasAutoPopulatedWard] = useState(false);

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
  const teamType = watch('teamType');
  const selectedSpecs = watch('specializationIds') || [];

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

  // Load specializations when teamType changes
  useEffect(() => {
    // Reset selected specializations on team type change to avoid mismatch
    setValue('specializationIds', []);
    
    const fetchSpecializations = async () => {
      setLoadingSpecializations(true);
      try {
        const data = await rescueTeamApi.getSpecializations({ teamType, isActive: true });
        setSpecializations(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách chuyên môn:', err);
      } finally {
        setLoadingSpecializations(false);
      }
    };
    fetchSpecializations();
  }, [teamType, setValue]);

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
        provinceId: Number(data.provinceId),
        adminUnitId: Number(data.adminUnitId),
        teamType: data.teamType,
        maxCapacity: data.maxCapacity ? Number(data.maxCapacity) : undefined,
        logoUrl: data.logoUrl || undefined,
        specializationIds: data.specializationIds.length > 0 ? data.specializationIds : undefined,
      };

      // Construct GeoJSON point if coordinates are provided
      if (data.latitude && data.longitude) {
        submitData.baseLocation = {
          type: 'Point',
          coordinates: [Number(data.longitude), Number(data.latitude)], // GeoJSON standard: [lng, lat]
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
          className="p-1.5 rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-750 shadow-sm transition-all flex items-center gap-1.5 text-xs font-bold"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">

          
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
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Tỉnh / Thành phố *
              </label>
              <select
                {...register('provinceId')}
                className={cn(
                  'w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold',
                  errors.provinceId
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400'
                )}
              >
                <option value="">-- Chọn Tỉnh / Thành phố --</option>
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
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Quận / Huyện / Phường / Xã *
              </label>
              <select
                {...register('adminUnitId')}
                disabled={!provinceId || loadingWards}
                className={cn(
                  'w-full px-3.5 py-2 rounded-xl text-xs border bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold',
                  errors.adminUnitId
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400',
                  (!provinceId || loadingWards) && 'opacity-60 cursor-not-allowed'
                )}
              >
                <option value="">
                  {loadingWards ? 'Đang tải danh sách...' : '-- Chọn Quận / Huyện / Xã --'}
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

        {/* Location Coordinates Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vĩ Độ (Latitude) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="any"
                {...register('latitude')}
                placeholder="Ví dụ: 16.0678"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
              />
            </div>

            {/* Kinh Độ (Longitude) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="any"
                {...register('longitude')}
                placeholder="Ví dụ: 108.2208"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Specializations Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 space-y-4">


          {loadingSpecializations ? (
            <div className="py-6 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-xs font-medium">Đang tải danh sách chuyên môn...</span>
            </div>
          ) : specializations.length === 0 ? (
            <div className="py-4 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                Không có chuyên môn cụ thể nào được khai báo cho loại đội "{teamTypeLabels[teamType]}"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mb-3">
                Nhấp chọn các chuyên môn mà đội cứu hộ sở hữu (bôi xanh biểu thị trạng thái kích hoạt):
              </p>
              <div className="flex flex-wrap gap-2.5">
                {specializations.map((spec) => {
                  const isSelected = selectedSpecs.includes(spec.id);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleToggleSpec(spec.id)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm',
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                          : 'bg-slate-50/50 hover:bg-slate-100 border-gray-200 text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-750 dark:text-gray-300'
                      )}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      {spec.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <Link
            to={ROUTES.RESCUE_TEAM_LIST}
            className="px-5 py-2 border border-gray-250 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-bold text-xs shadow-sm transition-all"
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
