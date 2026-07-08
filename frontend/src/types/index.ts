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

export interface DepartmentDto {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  headEmployeeId?: string;
  headEmployeeName?: string;
  employeeCount: number;
  positionCount: number;
  createdAt: string;
}

export interface PositionDto {
  id: string;
  title: string;
  description?: string;
  minSalary: number;
  maxSalary: number;
  salaryGrade?: string;
  isActive: boolean;
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  createdAt: string;
}

export interface EmployeeListDto {
  id: string;
  employeeNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName?: string;
  positionTitle?: string;
  status: string;
  hireDate: string;
  isActive: boolean;
}

export interface EmployeeDetailDto {
  id: string;
  userId: string;
  employeeNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  profilePhotoUrl?: string;
  hireDate: string;
  regularizationDate?: string;
  resignationDate?: string;
  status: string;
  employmentType?: string;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionTitle?: string;
  managerId?: string;
  managerName?: string;
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
  tinNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export const EMPLOYMENT_STATUSES = ['Active', 'Inactive', 'Resigned', 'Terminated', 'OnLeave', 'Probationary'] as const;

export interface AttendanceDto {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentName?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: string;
  overtimeHours?: string;
  undertimeHours?: string;
  isLate: boolean;
  notes?: string;
  shiftName?: string;
}

export interface TodayAttendanceStatusDto {
  today?: AttendanceDto;
  canClockIn: boolean;
  canClockOut: boolean;
}

export interface LeaveBalanceDto {
  id: string;
  employeeId: string;
  leaveType: string;
  year: number;
  totalEntitlement: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export const LEAVE_TYPES = ['Vacation', 'Sick', 'Emergency', 'Casual', 'Maternity', 'Paternity'] as const;
export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'] as const;
