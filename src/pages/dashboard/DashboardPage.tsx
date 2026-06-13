import {
  Users,
  Home,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { householdApi, rescueTeamApi, disasterApi, donationApi } from '../../apis';

const stats = [
  {
    label: 'Total Households',
    key: 'households',
    icon: Home,
    color: 'bg-blue-500',
    api: () => householdApi.getAll({ limit: 1 }).then((res) => res.total),
  },
  {
    label: 'Rescue Teams',
    key: 'teams',
    icon: Users,
    color: 'bg-green-500',
    api: () => rescueTeamApi.getAll({ limit: 1 }).then((res) => res.total),
  },
  {
    label: 'Active Disasters',
    key: 'disasters',
    icon: AlertTriangle,
    color: 'bg-red-500',
    api: () => disasterApi.getAll({ status: 'ACTIVE', limit: 1 }).then((res) => res.total),
  },
  {
    label: 'Total Donations',
    key: 'donations',
    icon: Heart,
    color: 'bg-purple-500',
    api: () => donationApi.getAll({ limit: 1 }).then((res) => res.total),
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of the Flood Relief System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.key} label={stat.label} icon={stat.icon} color={stat.color} api={stat.api} />
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}

function StatCard({
  label,
  icon: Icon,
  color,
  api,
}: {
  label: string;
  icon: any;
  color: string;
  api: () => Promise<number>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', label],
    queryFn: api,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {isLoading ? '—' : data ?? 0}
          </p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <QuickActionButton
          label="Report Disaster"
          icon={AlertTriangle}
          href="/disaster/list"
          color="text-red-600"
        />
        <QuickActionButton
          label="Add Household"
          icon={Home}
          href="/household/create"
          color="text-blue-600"
        />
        <QuickActionButton
          label="Create Team"
          icon={Users}
          href="/rescue-team/create"
          color="text-green-600"
        />
        <QuickActionButton
          label="New Donation"
          icon={Heart}
          href="/donation/list"
          color="text-purple-600"
        />
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  icon: Icon,
  href,
  color,
}: {
  label: string;
  icon: any;
  href: string;
  color: string;
}) {
  return (
<a
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <Icon className={color} size={24} />
      <span className="font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </a>
  );
}

function RecentActivity() {
  const { data: disasters } = useQuery({
    queryKey: ['disasters', 'recent'],
    queryFn: () => disasterApi.getAll({ limit: 5 }),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Disasters
      </h2>
      <div className="space-y-4">
        {disasters?.data?.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No recent disasters
          </p>
        )}
        {disasters?.data?.map((disaster) => (
          <div
            key={disaster.id}
            className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  disaster.status === 'ACTIVE'
                    ? 'bg-red-500'
                    : disaster.status === 'RESOLVED'
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {disaster.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {disaster.type}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                disaster.severity === 'CRITICAL'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : disaster.severity === 'HIGH'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}
            >
              {disaster.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
