import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Phone, Users } from 'lucide-react';
import { rescueTeamApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

const rescueTeamSchema = z.object({
  name: z.string().min(2, 'Team name is required'),
  leaderId: z.number(),
  leaderName: z.string().min(2, 'Leader name is required'),
  leaderPhone: z.string().min(10, 'Valid phone number required'),
  teamType: z.enum(['PROFESSIONAL', 'VOLUNTEER_SPONTANEOUS']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_DUTY', 'OFF_DUTY']),
  location: z.any().optional(),
});

type RescueTeamForm = z.infer<typeof rescueTeamSchema>;

export default function RescueTeamCreatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RescueTeamForm>({
    resolver: zodResolver(rescueTeamSchema),
    defaultValues: {
      teamType: 'VOLUNTEER_SPONTANEOUS',
      status: 'ACTIVE',
    },
  });

  const teamType = watch('teamType');

  const onSubmit = async (data: RescueTeamForm) => {
    setError(null);
    setIsLoading(true);
    try {
      await rescueTeamApi.create(data);
      navigate(ROUTES.RESCUE_TEAM_LIST);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create rescue team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.RESCUE_TEAM_LIST}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Rescue Team
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Add a new rescue team to the system
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
            Team Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                {...register('name')}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                )}
                placeholder="Enter team name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Type *
              </label>
              <select
                {...register('teamType')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              >
                <option value="PROFESSIONAL">Professional</option>
                <option value="VOLUNTEER_SPONTANEOUS">Volunteer Spontaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_DUTY">On Duty</option>
                <option value="OFF_DUTY">Off Duty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leader ID *
              </label>
              <input
                type="number"
                {...register('leaderId', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Leader Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leader Name *
              </label>
              <div className="relative">
                <Users
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  {...register('leaderName')}
                  className={cn(
                    'w-full pl-10 px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                    errors.leaderName
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                  )}
                  placeholder="Enter leader name"
                />
              </div>
              {errors.leaderName && (
                <p className="mt-1 text-sm text-red-500">{errors.leaderName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leader Phone *
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="tel"
                  {...register('leaderPhone')}
                  className={cn(
                    'w-full pl-10 px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                    errors.leaderPhone
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                  )}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.leaderPhone && (
                <p className="mt-1 text-sm text-red-500">{errors.leaderPhone.message}</p>
              )}
            </div>
          </div>
        </div>

        {teamType === 'VOLUNTEER_SPONTANEOUS' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <p className="text-sm text-orange-700 dark:text-orange-400">
              <strong>Note:</strong> Volunteer spontaneous teams have relaxed requirements.
              Statistics like missions count and rescued count will be optional.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link
            to={ROUTES.RESCUE_TEAM_LIST}
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
            Create Team
          </button>
        </div>
      </form>
    </div>
  );
}
