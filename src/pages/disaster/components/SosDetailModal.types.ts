export interface SosDetailModalProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

export const severityLabels = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Nguy kịch',
};

export const severityColors = {
  LOW: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  MEDIUM: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  HIGH: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900',
  CRITICAL: 'bg-red-50 text-red-650 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 animate-pulse',
};

export const statusLabels = {
  PENDING: 'Chờ duyệt',
  PENDING_SPECIALIST: 'Chờ Đội chuyên môn',
  DISPATCHED: 'Đang di chuyển',
  ON_SITE: 'Đã tiếp cận',
  RESOLVED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const statusColors = {
  PENDING: 'text-yellow-600 dark:text-yellow-450 font-bold',
  PENDING_SPECIALIST: 'text-purple-600 dark:text-purple-400 font-bold',
  DISPATCHED: 'text-blue-600 dark:text-blue-400 font-bold',
  ON_SITE: 'text-teal-600 dark:text-teal-400 font-bold',
  RESOLVED: 'text-green-600 dark:text-green-400 font-bold',
  CANCELLED: 'text-gray-500 dark:text-gray-400 font-bold',
};
