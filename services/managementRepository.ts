import {rows, rpc} from './cloud';
import type {AttendanceMap, AttendanceStatus, DemoStudent} from '@/types/attendance';
import type {ClassAttendanceData, CloudClass, CloudDepartment, CloudEnrollment, CloudRecord, CloudSession,
  CloudSummary, DashboardData, ManagedAccount, AttendanceChange} from '@/types/management';

export function collegeToday(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
export function shiftDate(value: string, days: number): string {
  if (!validDate(value)) throw new Error('Enter a valid date as YYYY-MM-DD.');
  const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function assertSelection(date: string, hour: number) {
  if (!validDate(date) || !Number.isInteger(hour) || hour < 1 || hour > 5) throw new Error('Choose a valid date and an hour from 1 to 5.');
}
async function allRows<T>(query: string): Promise<T[]> {
  const output: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const batch = await rows<T[]>(`${query}&limit=500&offset=${offset}`);
    output.push(...batch);
    if (batch.length < 500) return output;
  }
}
function eligibility(date: string) {return `joined_on=lte.${date}&or=(left_on.is.null,left_on.gte.${date})`;}

export async function getDashboard(date: string, hour: number, principal: boolean): Promise<DashboardData> {
  assertSelection(date, hour);
  let accountsError: string | undefined;
  const [departments, classes, dailySummaries, enrollments, accounts] = await Promise.all([
    allRows<CloudDepartment>('departments?select=id,code,name&order=name'),
    allRows<CloudClass>(`classes?select=id,department_id,study_year,section,departments(id,code,name),academic_years!inner(starts_on,ends_on)&academic_years.starts_on=lte.${date}&academic_years.ends_on=gte.${date}&order=study_year,section,id`),
    allRows<CloudSummary>(`attendance_summary?select=*&attendance_date=eq.${date}&order=hour,session_id`),
    allRows<{class_id: string}>(`enrollments?select=id,class_id&${eligibility(date)}&order=id`),
    principal ? rpc<ManagedAccount[]>('list_managed_accounts').catch((error: unknown) => {
      accountsError = error instanceof Error ? error.message : 'Could not load account approvals.';
      return [];
    }) : Promise.resolve([]),
  ]);
  const assignmentClasses = principal ? classes : [];
  const enrollmentCounts: Record<string, number> = {};
  for (const item of enrollments) enrollmentCounts[item.class_id] = (enrollmentCounts[item.class_id] || 0) + 1;
  // Department browsing is shared. Class/student access remains enforced by RLS,
  // and staff assignments may span any number of departments.
  return {departments, classes, summaries: dailySummaries.filter((item) => item.hour === hour),
    dailySummaries, enrollmentCounts, accounts, assignmentClasses, accountsError};
}

export type DepartmentAttendanceCounts = {
  total_students: number; present: number; absent: number; od: number; informed_leave: number;
};

function attendanceCountsForClasses(classIds: Set<string>, data: DashboardData): DepartmentAttendanceCounts {
  const counts: DepartmentAttendanceCounts = {total_students: 0, present: 0, absent: 0, od: 0, informed_leave: 0};
  for (const classroom of data.classes) {
    if (classIds.has(classroom.id)) counts.total_students += data.enrollmentCounts[classroom.id] ?? 0;
  }
  for (const summary of data.dailySummaries ?? []) {
    if (!classIds.has(summary.class_id) || summary.status !== 'submitted') continue;
    counts.present += summary.present;
    counts.absent += summary.absent;
    counts.od += summary.od;
    counts.informed_leave += summary.informed_leave;
  }
  return counts;
}

export function departmentAttendanceCounts(code: string, data: DashboardData): DepartmentAttendanceCounts {
  return attendanceCountsForClasses(new Set(data.classes
    .filter((classroom) => classroom.departments.code === code)
    .map((classroom) => classroom.id)), data);
}

export function collegeAttendanceCounts(data: DashboardData): DepartmentAttendanceCounts {
  return attendanceCountsForClasses(new Set(data.classes.map((classroom) => classroom.id)), data);
}

export function classCounts(classId: string, data: DashboardData) {
  const summary = data.summaries.find((item) => item.class_id === classId);
  return summary ?? {total_students: data.enrollmentCounts[classId] || 0,
    present: 0, absent: 0, od: 0, informed_leave: 0, unmarked: data.enrollmentCounts[classId] || 0, status: 'not_started' as const};
}

export async function getClassAttendance(classId: string, date: string, hour: number): Promise<ClassAttendanceData> {
  assertSelection(date, hour);
  if (!/^[0-9a-f-]{36}$/i.test(classId)) throw new Error('Invalid class selection.');
  const [classes, sessions] = await Promise.all([
    rows<CloudClass[]>(`classes?select=id,department_id,study_year,section,departments(id,code,name)&id=eq.${classId}`),
    rows<CloudSession[]>(`attendance_sessions?select=*,created_by_profile:profiles!attendance_sessions_created_by_fkey(name),submitted_by_profile:profiles!attendance_sessions_submitted_by_fkey(name)&class_id=eq.${classId}&attendance_date=eq.${date}&hour=eq.${hour}`),
  ]);
  if (!classes[0]) throw new Error('Class not found, or your account does not have access.');
  const session = sessions[0] ?? null;
  let students: CloudEnrollment[];
  let records: CloudRecord[] = [];
  let changes: AttendanceChange[] = [];
  if (session) {
    const [roster, recordRows, changeRows] = await Promise.all([
      allRows<{enrollments: CloudEnrollment}>(`attendance_session_roster?select=enrollments(id,class_id,students(id,name,register_number))&session_id=eq.${session.id}&order=enrollment_id`),
      allRows<CloudRecord>(`attendance_records?select=id,session_id,enrollment_id,status,version&session_id=eq.${session.id}&order=id`),
      allRows<AttendanceChange>(`attendance_changes?select=*,attendance_records!inner(session_id)&attendance_records.session_id=eq.${session.id}&order=changed_at.desc,id`),
    ]);
    students = roster.map((item) => item.enrollments);
    records = recordRows; changes = changeRows;
  } else {
    students = await allRows<CloudEnrollment>(`enrollments?select=id,class_id,students(id,name,register_number)&class_id=eq.${classId}&${eligibility(date)}&order=id`);
  }
  const byEnrollment = new Map(records.map((item) => [item.enrollment_id, item]));
  return {classroom: classes[0], session, changes,
    students: students.map((item) => ({...item, record: byEnrollment.get(item.id)}))
      .sort((a, b) => a.students.register_number.localeCompare(b.students.register_number))};
}

export async function getClassRosterCount(classId: string, date: string): Promise<number> {
  assertSelection(date, 1);
  if (!/^[0-9a-f-]{36}$/i.test(classId)) throw new Error('Invalid class selection.');
  const enrollments = await allRows<{id: string}>(`enrollments?select=id&class_id=eq.${classId}&${eligibility(date)}&order=id`);
  return enrollments.length;
}

export async function getClassHourSummaries(classId: string, date: string): Promise<CloudSummary[]> {
  assertSelection(date, 1);
  if (!/^[0-9a-f-]{36}$/i.test(classId)) throw new Error('Invalid class selection.');
  return allRows<CloudSummary>(`attendance_summary?select=*&class_id=eq.${classId}&attendance_date=eq.${date}&order=hour,session_id`);
}

export function getCloudHourProgress(
  classId: string,
  date: string,
  hour: number,
  rosterCount: number,
  summaries: CloudSummary[],
): {sessionId: string | null; total: number; marked: number; submitted: boolean} {
  const session = summaries.find((item) => item.class_id === classId && item.attendance_date === date && item.hour === hour);
  return {
    sessionId: session?.session_id ?? null,
    total: session?.total_students ?? rosterCount,
    marked: session?.marked ?? 0,
    submitted: session?.status === 'submitted',
  };
}

export async function approveWithAccess(user: string, role: 'staff' | 'hod', target?: string) {
  if (role === 'hod' && !target) throw new Error('Select an HOD department.');
  if (role === 'staff' && target) throw new Error('Staff access is assigned automatically.');
  await rpc('approve_account_with_access', {p_user: user, p_role: role,
    p_class: null, p_department: role === 'hod' ? target : null});
}
export async function rejectPendingAccount(user: string) {
  if (!user) throw new Error('Choose a pending account to reject.');
  await rpc('reject_pending_account', {p_user: user});
}
export async function openAttendanceSession(classId: string, date: string, hour: number): Promise<string> {
  assertSelection(date, hour);
  if (!/^[0-9a-f-]{36}$/i.test(classId)) throw new Error('Invalid class selection.');
  return rpc<string>('open_attendance_session', {p_class: classId, p_date: date, p_hour: hour});
}
export async function submitAttendanceSession(session: Pick<CloudSession, 'id' | 'version'>): Promise<CloudSession> {
  return rpc<CloudSession>('submit_attendance', {p_session: session.id, p_expected_version: session.version});
}
export async function markAllCloudPresent(session: Pick<CloudSession, 'id' | 'version'>): Promise<void> {
  await rpc('mark_all_present', {p_session: session.id, p_expected_version: session.version});
}
export function cloudAttendanceMap(data: ClassAttendanceData): AttendanceMap {
  const attendance: AttendanceMap = {};
  for (const student of data.students) {
    if (student.record) attendance[student.students.register_number] = student.record.status;
  }
  return attendance;
}
export function cloudStudents(data: ClassAttendanceData): DemoStudent[] {
  return data.students.map(({students}) => ({
    name: students.name,
    registerNumber: students.register_number,
  }));
}
export async function saveAttendanceChange(data: ClassAttendanceData, enrollmentId: string, status: AttendanceStatus, reason: string, manager: boolean) {
  if (!data.session) throw new Error('Start this attendance session first.');
  const student = data.students.find((item) => item.id === enrollmentId);
  if (!student) throw new Error('Student not in this class.');
  if (manager) {
    if (data.session.status !== 'submitted' || !student.record) throw new Error('Staff must finish and submit this attendance first.');
    if (reason.trim().length < 3 || reason.trim().length > 1000) throw new Error('Enter a correction reason between 3 and 1000 characters.');
    if (student.record.status === status) throw new Error('Choose a different attendance status.');
    await rpc('correct_attendance', {p_record: student.record.id, p_status: status, p_reason: reason.trim(), p_expected_version: student.record.version, p_request: null});
  } else if (data.session.status === 'draft') {
    await rpc('mark_student', {p_session: data.session.id, p_enrollment: enrollmentId, p_status: status, p_expected_version: student.record?.version ?? 0});
  } else {
    if (!student.record || student.record.status === status) throw new Error('Choose a different attendance status.');
    if (reason.trim().length < 3 || reason.trim().length > 1000) throw new Error('Enter a correction reason between 3 and 1000 characters.');
    await rpc('request_correction', {p_record: student.record.id, p_status: status, p_reason: reason.trim(), p_expected_version: student.record.version});
  }
}
