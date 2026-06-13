import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { householdApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

const householdSchema = z.object({
  residentId: z.number(),
  provinceId: z.number(),
  adminUnitId: z.number(),
  addressDetail: z.string().optional(),
  floorCount: z.number().optional(),
  totalMembers: z.number().min(1, 'At least 1 member required'),
  elderlyCount: z.number().min(0),
  childrenCount: z.number().min(0),
  pregnantCount: z.number().min(0),
  disabledCount: z.number().min(0),
  hasChronicIllness: z.boolean(),
  healthNotes: z.string().optional(),
  assetValueLevel: z.string().optional(),
  businessType: z.string().optional(),
  waterUsageLevel: z.string().optional(),
  productionType: z.string().optional(),
  nearManhole: z.boolean(),
  nearWasteSite: z.boolean(),
  nearProduction: z.boolean(),
  nearCanal: z.boolean(),
  envNotes: z.string().optional(),
});

type HouseholdForm = z.infer<typeof householdSchema>;

export default function HouseholdCreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HouseholdForm>({
    resolver: zodResolver(householdSchema),
    defaultValues: {
      totalMembers: 1,
      elderlyCount: 0,
      childrenCount: 0,
      pregnantCount: 0,
      disabledCount: 0,
      hasChronicIllness: false,
      nearManhole: false,
      nearWasteSite: false,
      nearProduction: false,
      nearCanal: false,
    },
  });

  const onSubmit = async (data: HouseholdForm) => {
    setError(null);
    setIsLoading(true);
    try {
      await householdApi.create(data);
      navigate(ROUTES.HOUSEHOLD_LIST);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create household');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.HOUSEHOLD_LIST}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Household Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Add a new household to the system
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resident ID *
              </label>
              <input
                type="number"
                {...register('residentId', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Province ID *
              </label>
              <input
                type="number"
                {...register('provinceId', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Unit ID *
              </label>
              <input
                type="number"
                {...register('adminUnitId', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address Detail
              </label>
              <input
                type="text"
                {...register('addressDetail')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
                placeholder="Detailed address"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Household Members
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Members *
              </label>
              <input
                type="number"
                {...register('totalMembers', { valueAsNumber: true })}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                  errors.totalMembers
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                )}
              />
              {errors.totalMembers && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.totalMembers.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Elderly
              </label>
              <input
                type="number"
                {...register('elderlyCount', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Children
              </label>
              <input
                type="number"
                {...register('childrenCount', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pregnant
              </label>
              <input
                type="number"
                {...register('pregnantCount', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disabled
              </label>
              <input
                type="number"
                {...register('disabledCount', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Health Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('hasChronicIllness')}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Has Chronic Illness
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Health Notes
              </label>
              <textarea
                {...register('healthNotes')}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
                placeholder="Additional health information..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Environmental Factors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('nearManhole')}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Near Manhole
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('nearWasteSite')}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Near Waste Site
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('nearProduction')}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Near Production
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('nearCanal')}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Near Canal
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Environmental Notes
            </label>
            <textarea
              {...register('envNotes')}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              placeholder="Additional environmental notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            to={ROUTES.HOUSEHOLD_LIST}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading && <Loader2 className="animate-spin" size={20} />}
            <Save size={20} />
            Save Household
          </button>
        </div>
      </form>
    </div>
  );
}
