export const WS_NAMESPACES = {
  DISPATCH: '/dispatch',
  NOTIFICATION: '/notification',
  TRACKING: '/tracking',
} as const;

export const DISPATCH_EVENTS = {
  // Server -> Client
  SOS_CREATED: 'sos:created',
  SOS_STATUS_UPDATED: 'sos:status-updated',
  SOS_NO_TEAM: 'sos:no-team-available',
  TEAM_ASSIGNED: 'sos:assigned',
  TEAM_REASSIGNED: 'sos:reassigned',
  SOS_OFFER: 'sos:offer',
  SOS_OFFER_CLAIMED: 'sos:offer-claimed',
  SOS_CLAIM_RESULT: 'sos:claim-result',

  // Client -> Server
  JOIN_PROVINCE_ROOM: 'join:province',
  JOIN_TEAM_ROOM: 'join:team',
  UPDATE_TEAM_LOCATION: 'team:update-location',
  SOS_CLAIM: 'sos:claim',
} as const;

export const NOTIFICATION_EVENTS = {
  // Server -> Client
  PUSH: 'notification:push',
  BADGE_UPDATE: 'notification:badge',

  // Client -> Server
  MARK_READ: 'notification:mark-read',
} as const;

export const TRACKING_EVENTS = {
  // Future implementation
  TEAM_LOCATION_UPDATE: 'tracking:team-location',
  SOS_HEATMAP_UPDATE: 'tracking:sos-heatmap',
} as const;
