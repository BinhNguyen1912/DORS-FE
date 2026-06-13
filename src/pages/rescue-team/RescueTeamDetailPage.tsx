import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, MapPin, Phone, Users, Clock, Award } from 'lucide-react';
import { rescueTeamApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400',
  ON_DUTY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OFF_DUTY: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const teamTypeColors = {
  PROFESSIONAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  VOLUNTEER_SPONTANEOUS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function RescueTeamDetailPage() {
  const { id } = useParams();
  const { data: team, isLoading } = useQuery({
    queryKey: ['rescue-team', id],
    queryFn: () => rescueTeamApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Rescue team not found</p>
        <Link
          to={ROUTES.RESCUE_TEAM_LIST}
          className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.RESCUE_TEAM_LIST}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {team.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Team ID: {team.id}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
          <Edit size={20} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Status
            </h2>
            <div className="flex gap-2">
              <span
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-full',
                  statusColors[team.status as keyof typeof statusColors]
                )}
              >
                {team.status.replace('_', ' ')}
              </span>
              <span
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-full',
                  teamTypeColors[team.teamType as keyof typeof teamTypeColors]
                )}
              >
                {team.teamType.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatBox
              icon={Users}
              label="Missions"
              value={team.missionsCount ?? 0}
              color="text-blue-600"
            />
            <StatBox
              icon={Award}
              label="Rescued"
              value={team.rescuedCount ?? 0}
              color="text-green-600"
            />
            <StatBox
              icon={Clock}
              label="Hours Active"
              value={team.hoursActive ?? 0}
              color="text-purple-600"
            />
          </div>
        </div>

        {/* Leader Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Leader Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Users className="text-indigo-600" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {team.leaderName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Phone className="text-indigo-600" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {team.leaderPhone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Location
            </h2>
          </div>
          {team.location ? (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Location: {JSON.stringify(team.location)}
              </p>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No location data</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activity Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Team created
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Last updated
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(team.updatedAt).toLocaleDateString()}
</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={color} size={20} />
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
