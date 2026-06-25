import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, MapPin, Users, Heart, AlertTriangle } from 'lucide-react';
import { householdApi } from '../../apis';
import { ROUTES } from '../../constants';
import Loader from '../../components/common/Loader';

export default function HouseholdDetailPage() {
  const { id } = useParams();
  const { data: household, isLoading } = useQuery({
    queryKey: ['household', id],
    queryFn: () => householdApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Loader
        layout="block"
        size="md"
        colorClass="text-indigo-650"
        text="Đang tải chi tiết hộ dân..."
        className="min-h-[400px]"
      />
    );
  }

  if (!household) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Household not found
        </p>
        <Link
          to={ROUTES.HOUSEHOLD_LIST}
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
            to={ROUTES.HOUSEHOLD_LIST}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Household #{household.id}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Detailed information
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
          <Edit size={20} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Location Information
            </h2>
          </div>
          <div className="space-y-3">
            <DetailRow label="Province ID" value={household.provinceId} />
            <DetailRow label="Admin Unit ID" value={household.adminUnitId} />
            <DetailRow label="Address" value={household.addressDetail || '-'} />
            <DetailRow label="Floor Count" value={household.floorCount || '-'} />
          </div>
        </div>

        {/* Member Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Household Members
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Total" value={household.totalMembers} />
            <StatBox label="Elderly" value={household.elderlyCount} />
            <StatBox label="Children" value={household.childrenCount} />
            <StatBox label="Pregnant" value={household.pregnantCount} />
            <StatBox label="Disabled" value={household.disabledCount} />
          </div>
        </div>

        {/* Health Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Health Information
            </h2>
          </div>
          <div className="space-y-3">
            <DetailRow
              label="Has Chronic Illness"
              value={household.hasChronicIllness ? 'Yes' : 'No'}
            />
            <DetailRow label="Health Notes" value={household.healthNotes || '-'} />
          </div>
        </div>

        {/* Environmental Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-indigo-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Environmental Factors
            </h2>
          </div>
          <div className="space-y-3">
            <DetailRow
              label="Near Manhole"
              value={household.nearManhole ? 'Yes' : 'No'}
            />
            <DetailRow
              label="Near Waste Site"
              value={household.nearWasteSite ? 'Yes' : 'No'}
            />
            <DetailRow
              label="Near Production"
              value={household.nearProduction ? 'Yes' : 'No'}
            />
            <DetailRow
              label="Near Canal"
              value={household.nearCanal ? 'Yes' : 'No'}
            />
            <DetailRow label="Notes" value={household.envNotes || '-'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  );
}
