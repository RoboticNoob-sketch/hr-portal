export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  user: User;
}

export interface UserListDto {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface HrDashboardDto {
  totalEmployees: number;
  activeHirings: number;
  pendingLeaveRequests: number;
  payrollStatus: string;
  recentActivities: RecentActivityDto[];
  pendingApprovals: PendingApprovalDto[];
  attendanceSummary: AttendanceSummaryDto;
}

export interface RecentActivityDto {
  title: string;
  description: string;
  timeAgo: string;
  iconType: string;
}

export interface PendingApprovalDto {
  id: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  type: string;
  status: string;
  requestedAt: string;
}

export interface AttendanceSummaryDto {
  bars: { month: string; present: number; absent: number }[];
}

export interface EmployeeDashboardDto {
  profile: EmployeeProfileSummaryDto;
  leaveBalances: LeaveBalanceSummaryDto[];
  todayAttendance?: TodayAttendanceDto;
  recentAnnouncements: AnnouncementSummaryDto[];
}

export interface EmployeeProfileSummaryDto {
  employeeId: string;
  fullName: string;
  position: string;
  department: string;
  employeeNumber: string;
  profilePhotoUrl?: string;
  employmentStatus: string;
}

export interface LeaveBalanceSummaryDto {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
}

export interface TodayAttendanceDto {
  clockIn?: string;
  clockOut?: string;
  isClockedIn: boolean;
  totalHours: string;
}

export interface AnnouncementSummaryDto {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  authorName?: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  category: string;
  publishDate: string;
  expiryDate?: string;
  isPublished: boolean;
  targetAudience?: string;
  authorName?: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}
