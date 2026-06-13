export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
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
  leaderId: number;
  leaderName: string;
  leaderPhone: string;
  teamType: 'PROFESSIONAL' | 'VOLUNTEER_SPONTANEOUS';
  status: 'ACTIVE' | 'INACTIVE' | 'ON_DUTY' | 'OFF_DUTY';
  location?: any;
  specializationIds?: number[];
  missionsCount?: number;
  rescuedCount?: number;
  hoursActive?: number;
  logoUrl?: string | null;
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
