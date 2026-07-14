export const APP_NAME = 'Flood Relief System';

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  HOUSEHOLD: '/household',
  HOUSEHOLD_LIST: '/household/list',
  HOUSEHOLD_CREATE: '/household/create',
  HOUSEHOLD_DETAIL: '/household/:id',
  RESCUE_TEAM: '/rescue-team',
  RESCUE_TEAM_LIST: '/rescue-team/',
  RESCUE_TEAM_DASHBOARD: '/rescue-team/dashboard',
  RESCUE_TEAM_CREATE: '/rescue-team/create',
  RESCUE_TEAM_DETAIL: '/rescue-team/:id',
  TEAM_SPECIALIZATION_LIST: '/rescue-team/specialization',
  DISASTER: '/disaster',
  DISASTER_LIST: '/disaster/dashboard',
  DISASTER_DETAIL: '/disaster/:id',
  SOS_REQUEST_LIST: '/request',
  DONATION: '/donation',
  DONATION_LIST: '/donation/list',
  DONATION_CAMPAIGN: '/donation/campaign',
  USER_LIST: '/categories/users',
  ROLE_LIST: '/categories/roles',
  NOTIFICATION_LIST: '/categories/notifications',
  NOTIFICATION_CENTER: '/notifications',
  RESIDENT: '/resident',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;


export * from './provinceCenters';
