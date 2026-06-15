import { ROUTES } from '../constants';

/**
 * Feature Flags Configuration
 * 
 * Set to `true` if the page/route is fully implemented and should be accessible.
 * Set to `false` if it is still under construction and should show the lock screen.
 */
export const FEATURE_FLAGS: Record<string, boolean> = {
  [ROUTES.DASHBOARD]: true,

  // Households module
  [ROUTES.HOUSEHOLD_LIST]: false,
  [ROUTES.HOUSEHOLD_CREATE]: false,
  [ROUTES.HOUSEHOLD_DETAIL]: false,

  // Rescue Teams module
  [ROUTES.RESCUE_TEAM_LIST]: true,
  [ROUTES.RESCUE_TEAM_CREATE]: true,
  [ROUTES.RESCUE_TEAM_DETAIL]: true,

  // Disasters module
  [ROUTES.DISASTER_LIST]: false,
  [ROUTES.DISASTER_DETAIL]: false,

  // Donations module
  [ROUTES.DONATION_LIST]: false,
  [ROUTES.DONATION_CAMPAIGN]: false,
};
