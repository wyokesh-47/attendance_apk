import type {AttendanceStatus} from './attendance';
import type {UserRole} from './auth';

export type CloudDepartment = {id: string; code: string; name: string};
export type CloudClass = {id: string; department_id: string; study_year: number; section: string; departments: CloudDepartment};
export type CloudSession = {id: string; class_id: string; attendance_date: string; hour: number; status: 'draft' | 'submitted'; version: number; submitted_at: string | null};
export type CloudSummary = {
  session_id: string; class_id: string; attendance_date: string; hour: number;
  status: 'draft' | 'submitted'; version: number; total_students: number;
  marked: number; unmarked: number; present: number; absent: number; od: number; informed_leave: number;
};
export type CloudEnrollment = {id: string; class_id: string; students: {id: string; name: string; register_number: string}};
export type CloudRecord = {id: string; session_id: string; enrollment_id: string; status: AttendanceStatus; version: number};
export type CloudStudent = CloudEnrollment & {record?: CloudRecord};
export type ManagedAccount = {id: string; name: string; email: string; role: UserRole; approval_status: string};
export type AttendanceChange = {id: string; record_id: string; old_status: AttendanceStatus; new_status: AttendanceStatus; changed_by: string; reason: string; changed_at: string};
export type DashboardData = {
  departments: CloudDepartment[]; classes: CloudClass[]; summaries: CloudSummary[];
  enrollmentCounts: Record<string, number>; accounts: ManagedAccount[];
  assignmentClasses: CloudClass[];
  accountsError?: string;
};
export type ClassAttendanceData = {
  classroom: CloudClass; session: CloudSession | null; students: CloudStudent[]; changes: AttendanceChange[];
};
