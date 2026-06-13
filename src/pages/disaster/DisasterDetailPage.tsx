import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { disasterApi } from '../../apis';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

const severityColors = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400',
  ACTIVE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  RESOLVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CLOSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function DisasterDetailPage() {
  const { id } = useParams();
  const { data: event, isLoading } = useQuery({
    queryKey: ['disaster', id],
    queryFn: () => disasterApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Disaster event not found</p>
        <Link
          to={ROUTES.DISASTER_LIST}
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
            to={ROUTES.DISASTER_LIST}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {event.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Event ID: {event.id}</p>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Event Status
          </h2>
          <div className="flex items-center gap-3 mb-6">
            <span
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full',
                severityColors[event.severity as keyof typeof severityColors]
              )}
            >
              {event.severity}
            </span>
            <span
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full',
                statusColors[event.status as keyof typeof statusColors]
              )}
            >
              {event.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.type}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Province</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {event.provinceId}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Clock className="text-indigo-600" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(event.startTime).toLocaleString()}
</p>
              </div>
            </div>
            {event.endTime && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Clock className="text-green-600" size={24} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(event.endTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Location
            </h2>
          </div>
          {event.location ? (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Location: {JSON.stringify(event.location)}
              </p>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No location data</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Description
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {event.description || 'No description available'}
          </p>
        </div>
      </div>
    </div>
  );
}
