export const teamTypeLabels: Record<string, string> = {
  PCCC: 'PCCC',
  Y_TE: 'Y Tế',
  DAN_PHONG: 'Dân phòng',
  QUAN_SU: 'Quân sự',
  TINH_NGUYEN: 'Tình nguyện',
  TONG_HOP: 'Tổng hợp',
  PROFESSIONAL: 'PCCC',
  VOLUNTEER_SPONTANEOUS: 'Tình nguyện',
};

export const teamTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
  PCCC: { bg: 'bg-red-50 text-red-700 border-red-150', text: 'text-red-700', dot: 'bg-red-500' },
  Y_TE: { bg: 'bg-green-50 text-green-700 border-green-150', text: 'text-green-700', dot: 'bg-green-500' },
  DAN_PHONG: { bg: 'bg-blue-50 text-blue-700 border-blue-150', text: 'text-blue-700', dot: 'bg-blue-500' },
  QUAN_SU: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
  TINH_NGUYEN: { bg: 'bg-purple-50 text-purple-700 border-purple-150', text: 'text-purple-700', dot: 'bg-purple-500' },
  TONG_HOP: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-150', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  PROFESSIONAL: { bg: 'bg-red-50 text-red-700 border-red-150', text: 'text-red-700', dot: 'bg-red-500' },
  VOLUNTEER_SPONTANEOUS: { bg: 'bg-purple-50 text-purple-700 border-purple-150', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const statusLabels: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang làm nhiệm vụ',
  OFF_DUTY: 'Ngoại tuyến',
  STANDBY: 'Dự phòng',
  ACTIVE: 'Sẵn sàng',
  ON_DUTY: 'Đang làm nhiệm vụ',
  INACTIVE: 'Ngoại tuyến',
};

export const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  BUSY: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  OFF_DUTY: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
  STANDBY: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400',
  ON_DUTY: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400',
};
