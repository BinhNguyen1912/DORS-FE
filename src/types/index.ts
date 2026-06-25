export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  role: string;
  provinceId?: number;
  adminUnitId?: number;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  
  // Additional fields from backend UserEntity
  nationalId?: string;
  nationalIdVerified?: boolean;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phoneVerified?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  addressDetail?: string;
  homeLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  trustScore?: number;
  isVerified?: boolean;
  isVolunteer?: boolean;
  needsHelp?: boolean;
  userRoles?: {
    id: number;
    userId: number;
    roleId: number;
    provinceId: number;
    isActive: boolean;
    role?: {
      id: number;
      name: string;
      description?: string;
      level: number;
      isSystem: boolean;
      isActive: boolean;
    };
  }[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  nationalId?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  provinceId: number;
  adminUnitId?: number;
  isVolunteer?: boolean;
  needsHelp?: boolean;
}

export interface HouseholdProfile {
  id: number;
  residentId: number;
  provinceId: number;
  adminUnitId: number;
  addressDetail?: string;
  homeLocation?: any;
  floorCount?: number;
  totalMembers: number;
  elderlyCount: number;
  childrenCount: number;
  pregnantCount: number;
  disabledCount: number;
  hasChronicIllness: boolean;
  healthNotes?: string;
  assetValueLevel?: string;
  businessType?: string;
  waterUsageLevel?: string;
  productionType?: string;
  nearManhole: boolean;
  nearWasteSite: boolean;
  nearProduction: boolean;
  nearCanal: boolean;
  envNotes?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: number;
}

export interface RescueTeam {
  id: number;
  name: string;
  leaderId?: number;
  leaderName: string;
  leaderPhone: string;
  teamType: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_DUTY' | 'OFF_DUTY';
  provinceId?: number;
  adminUnitId?: number;
  maxCapacity?: number;
  location?: any;
  currentLocation?: any;
  baseLocation?: any;
  specializationIds?: number[];
  missionsCount?: number;
  rescuedCount?: number;
  hoursActive?: number;
  logoUrl?: string | null;
  leader?: User | null;
  leaderCitizenName?: string;
  specializations?: any[];
  email?: string;
  foundingDate?: string;
  baseLocationAddress?: string;
  coverageAreaSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DisasterEvent {
  id: number;
  name: string;
  type: string;
  provinceId: number;
  location?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  startTime: string;
  endTime?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SosRequest {
  id: number;
  requesterName?: string;
  requesterPhone?: string;
  requestType: string;
  latitude?: number;
  longitude?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'PENDING_SPECIALIST' | 'DISPATCHED' | 'ON_SITE' | 'RESOLVED' | 'CANCELLED';
  provinceId?: number;
  adminUnitId?: number;
  trappedPeopleCount: number;
  specialNeedsTags?: string[];
  imageUrls?: string[];
  requiresEquipment?: boolean;
  specialistPending?: boolean;
  specialistType?: string;
  pendingSince?: string;
  assignedTeamId?: number;
  assignedTeam?: RescueTeam | null;
  source?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: number;
  donorName: string;
  donorType: 'INDIVIDUAL' | 'ORGANIZATION';
  type: 'CASH' | 'GOODS' | 'SERVICES';
  amount?: number;
  goodsDescription?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
  campaignId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DonationCampaign {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  targetAmount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Province {
  id: number;
  code: number;
  name: string;
  shortName?: string;
  isActive: boolean;
}

export interface AdministrativeUnit {
  id: number;
  provinceId: number;
  parentId?: number;
  type: 'DISTRICT' | 'COMMUNE' | 'WARD' | 'HAMLET';
  code: string;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  level: number;
  isSystem: boolean;
  isActive: boolean;
  provinceId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RescueTeamMember {
  id: number;
  teamId: number;
  userId: number | null;
  citizenName: string | null;
  citizenPhone: string | null;
  roleInTeam: 'LEADER' | 'DEPUTY_LEADER' | 'MEMBER';
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  specializationIds: number[];
  missionsCount: number;
  rescuedCount: number;
  hoursActive: number;
  user?: User | null;
}

