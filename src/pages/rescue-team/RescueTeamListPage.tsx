import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Eye, Edit, Trash2, MapPin, Phone } from 'lucide-react';
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

export default function RescueTeamListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [teamType, setTeamType] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['rescue-teams', page, status, teamType],
    queryFn: () =>
      rescueTeamApi.getAll({ page, limit: 10, status: status || undefined, teamType: teamType || undefined }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rescue Teams
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage rescue team information
          </p>
        </div>
        <Link
          to={ROUTES.RESCUE_TEAM_CREATE}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={20} />
          Create Team
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="OFF_DUTY">Off Duty</option>
          </select>
          <select
            value={teamType}
            onChange={(e) => setTeamType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="VOLUNTEER_SPONTANEOUS">Volunteer Spontaneous</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No rescue teams found
          </div>
        ) : (
          data?.data?.map((team) => (
            <div
              key={team.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {team.leaderName}
                  </p>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    statusColors[team.status as keyof typeof statusColors]
                  )}
                >
                  {team.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Phone size={16} />
                  {team.leaderPhone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin size={16} />
                  Location available
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    teamTypeColors[team.teamType as keyof typeof teamTypeColors]
                  )}
                >
                  {team.teamType.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(ROUTES.RESCUE_TEAM_DETAIL.replace(':id', String(team.id)))
                  }
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Eye size={16} />
                  View
                </button>
                <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Edit size={16} />
                </button>
                <button className="p-2 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 10 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {Math.ceil(data.total / 10)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 10 >= data.total}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
