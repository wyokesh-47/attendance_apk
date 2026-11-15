import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {rows, rpc} from '@/services/cloud';
import {approveWithAccess, classCounts, cloudAttendanceMap, cloudStudents, collegeAttendanceCounts, collegeToday, departmentAttendanceCounts, getClassAttendance, getClassHourSummaries, getClassRosterCount, getCloudHourProgress, getDashboard, markAllCloudPresent, openAttendanceSession, rejectPendingAccount, saveAttendanceChange, shiftDate, submitAttendanceSession, validDate} from '@/services/managementRepository';
import type {ClassAttendanceData, CloudSummary, DashboardData, ManagedAccount} from '@/types/management';

jest.mock('@/services/cloud', () => ({rows: jest.fn(), rpc: jest.fn()}));
const mockRows = rows as jest.MockedFunction<typeof rows>;
const mockRpc = rpc as jest.MockedFunction<typeof rpc>;
beforeEach(() => {jest.resetAllMocks(); mockRpc.mockResolvedValue(undefined);});

const data: ClassAttendanceData = {
  classroom: {id: 'class-1', department_id: 'dept-1', study_year: 2, section: 'A', departments: {id: 'dept-1', code: 'BCA', name: 'B.C.A'}},
  session: {id: 'session-1', class_id: 'class-1', attendance_date: '2026-11-09', hour: 1, status: 'submitted', version: 12, submitted_at: null},
  students: [{id: 'enrollment-1', class_id: 'class-1', students: {id: 'student-1', name: 'Student One', register_number: '001'},
    record: {id: 'record-1', session_id: 'session-1', enrollment_id: 'enrollment-1', status: 'absent', version: 4}}], changes: [],
};

describe('class attendance and account management', () => {
  it('rejects invalid dates and crosses month/year boundaries correctly', () => {
    expect(validDate('2026-02-30')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
    expect(validDate('2026-11-09&hour=eq.2')).toBe(false);
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('uses the Asia/Kolkata calendar date for attendance', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-28T19:00:00.000Z'));
    try {
      expect(collegeToday()).toBe('2026-03-01');
    } finally {
      jest.useRealTimers();
    }
  });
  it('loads the class roster count and hour summaries for the requested cloud class and date', async () => {
    const classId = '00000000-0000-0000-0000-000000000001';
    const date = '2026-11-15';
    mockRows.mockResolvedValueOnce(Array.from({length: 55}, (_, index) => ({id: `enrollment-${index + 1}`})));
    expect(await getClassRosterCount(classId, date)).toBe(55);
    expect(mockRows.mock.calls[0]?.[0]).toContain(`class_id=eq.${classId}`);
    expect(mockRows.mock.calls[0]?.[0]).toContain(`joined_on=lte.${date}`);

    mockRows.mockResolvedValueOnce([]);
    expect(await getClassHourSummaries(classId, date)).toEqual([]);
    expect(mockRows.mock.calls[1]?.[0]).toContain(`class_id=eq.${classId}`);
    expect(mockRows.mock.calls[1]?.[0]).toContain(`attendance_date=eq.${date}`);
    expect(mockRows.mock.calls[1]?.[0]).toContain('attendance_summary?');
  });
  it('keeps hour status independent and marks green-check eligibility only for submitted sessions', () => {
    const classId = 'class-1';
    const date = '2026-11-15';
    const summaries: CloudSummary[] = [
      {session_id: 'hour-1', class_id: classId, attendance_date: date, hour: 1, status: 'draft',
        version: 2, total_students: 55, marked: 4, unmarked: 51, present: 4, absent: 0, od: 0, informed_leave: 0},
      {session_id: 'hour-2', class_id: classId, attendance_date: date, hour: 2, status: 'submitted',
        version: 3, total_students: 55, marked: 55, unmarked: 0, present: 55, absent: 0, od: 0, informed_leave: 0},
      {session_id: 'other-class-hour-2', class_id: 'other-class', attendance_date: date, hour: 2, status: 'submitted',
        version: 1, total_students: 55, marked: 55, unmarked: 0, present: 55, absent: 0, od: 0, informed_leave: 0},
    ];

    expect(getCloudHourProgress(classId, date, 1, 55, summaries))
      .toEqual({sessionId: 'hour-1', total: 55, marked: 4, submitted: false});
    expect(getCloudHourProgress(classId, date, 2, 55, summaries))
      .toEqual({sessionId: 'hour-2', total: 55, marked: 55, submitted: true});
    expect(getCloudHourProgress(classId, date, 3, 55, summaries))
      .toEqual({sessionId: null, total: 55, marked: 0, submitted: false});
    for (const hour of [1, 3, 4, 5]) {
      expect(getCloudHourProgress(classId, date, hour, 55, summaries).submitted).toBe(false);
    }
    expect(getCloudHourProgress(classId, '2026-11-14', 2, 55, summaries))
      .toEqual({sessionId: null, total: 55, marked: 0, submitted: false});
  });
  it('shows 45 unmarked students before a session starts, rather than treating them as absent', () => {
    const dashboard = {summaries: [], enrollmentCounts: {'class-1': 45}} as unknown as DashboardData;
    expect(classCounts('class-1', dashboard)).toMatchObject({total_students: 45, unmarked: 45, present: 0, absent: 0, od: 0, informed_leave: 0});
  });
  it('uses the session snapshot totals after enrollment changes', () => {
    const dashboard = {summaries: [{class_id: 'class-1', total_students: 45, present: 40, absent: 3, od: 1, informed_leave: 1, unmarked: 0}], enrollmentCounts: {'class-1': 50}} as unknown as DashboardData;
    expect(classCounts('class-1', dashboard)).toMatchObject({total_students: 45, present: 40, absent: 3, od: 1, informed_leave: 1, unmarked: 0});
  });
  it('corrects Absent to Present with a reason and the exact version the editor viewed', async () => {
    await saveAttendanceChange(data, 'enrollment-1', 'present', '  Marked absent by mistake  ', true);
    expect(mockRpc).toHaveBeenCalledWith('correct_attendance', {p_record: 'record-1', p_status: 'present', p_reason: 'Marked absent by mistake', p_expected_version: 4, p_request: null});
  });
  it('does not attempt a correction without a reason or on an unsubmitted class', async () => {
    await expect(saveAttendanceChange(data, 'enrollment-1', 'present', '', true)).rejects.toThrow('reason');
    await expect(saveAttendanceChange({...data, session: {...data.session!, status: 'draft'}}, 'enrollment-1', 'present', 'Mistake', true)).rejects.toThrow('submit');
    expect(mockRpc).not.toHaveBeenCalled();
  });
  it('propagates a version conflict without silently retrying or overwriting', async () => {
    mockRpc.mockRejectedValueOnce(new Error('Attendance changed. Refresh before saving'));
    await expect(saveAttendanceChange(data, 'enrollment-1', 'present', 'Mistake', true)).rejects.toThrow('Refresh');
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });
  it('sends staff corrections for submitted attendance as a request', async () => {
    await saveAttendanceChange(data, 'enrollment-1', 'present', 'Student was present', false);
    expect(mockRpc).toHaveBeenCalledWith('request_correction', {p_record: 'record-1', p_status: 'present', p_reason: 'Student was present', p_expected_version: 4});
  });
  it('saves a first draft mark with expected version zero', async () => {
    const draft = {...data, session: {...data.session!, status: 'draft' as const}, students: [{...data.students[0], record: undefined}]};
    await saveAttendanceChange(draft, 'enrollment-1', 'od', '', false);
    expect(mockRpc).toHaveBeenCalledWith('mark_student', {p_session: 'session-1', p_enrollment: 'enrollment-1', p_status: 'od', p_expected_version: 0});
  });
  it('opens the selected cloud class/date/hour and submits without client-supplied identity', async () => {
    const classId = '00000000-0000-0000-0000-000000000001';
    await openAttendanceSession(classId, '2026-11-09', 3);
    await submitAttendanceSession({id: 'session-1', version: 12});

    expect(mockRpc).toHaveBeenNthCalledWith(1, 'open_attendance_session', {
      p_class: classId, p_date: '2026-11-09', p_hour: 3,
    });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'submit_attendance', {
      p_session: 'session-1', p_expected_version: 12,
    });
    expect(mockRpc.mock.calls[1]?.[1]).not.toHaveProperty('p_staff_id');
    expect(mockRpc.mock.calls[1]?.[1]).not.toHaveProperty('p_email');
  });
  it('marks all students through the authenticated cloud session RPC', async () => {
    await markAllCloudPresent({id: 'session-1', version: 5});
    expect(mockRpc).toHaveBeenCalledWith('mark_all_present', {
      p_session: 'session-1', p_expected_version: 5,
    });
  });
  it('approves HOD with a department and automatically grants Staff access', async () => {
    await approveWithAccess('hod-user', 'hod', 'department-1');
    await approveWithAccess('staff-user', 'staff');
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'approve_account_with_access', {p_user: 'hod-user', p_role: 'hod', p_class: null, p_department: 'department-1'});
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'approve_account_with_access', {p_user: 'staff-user', p_role: 'staff', p_class: null, p_department: null});
  });
  it('rejects a selected pending account through the Principal RPC', async () => {
    await rejectPendingAccount('pending-user');
    expect(mockRpc).toHaveBeenCalledWith('reject_pending_account', {p_user: 'pending-user'});
  });
  it('requires an account ID before requesting rejection', async () => {
    await expect(rejectPendingAccount('')).rejects.toThrow('pending account');
    expect(mockRpc).not.toHaveBeenCalled();
  });
  it('loads account assignments from the Principal directory RPC', async () => {
    const account: ManagedAccount = {
      id: 'staff-user', name: 'Staff One', email: 'staff@example.com', role: 'staff', approval_status: 'approved',
      class_assignments: [{class_id: 'class-1', department_id: 'department-1', department_code: 'BCA',
        department_name: 'B.C.A', study_year: 2, section: 'A', is_active: true}],
      department_assignments: [],
    };
    mockRows.mockResolvedValue([]);
    mockRpc.mockResolvedValueOnce([account]);

    const dashboard = await getDashboard('2026-11-09', 1, true);

    expect(mockRpc).toHaveBeenCalledWith('list_managed_accounts');
    expect(dashboard.accounts).toEqual([account]);
  });
  it('requires a department for HOD and prevents manual Staff class assignment', async () => {
    await expect(approveWithAccess('user', 'hod', '')).rejects.toThrow('department');
    await expect(approveWithAccess('user', 'staff', 'class-1')).rejects.toThrow('automatically');
    expect(mockRpc).not.toHaveBeenCalled();
  });
  it('loads one daily summary set, scopes the selected hour, and does not request the Principal directory for an HOD', async () => {
    const hourThree = {session_id: 'session-3', class_id: 'class-1', attendance_date: '2026-11-09', hour: 3,
      status: 'submitted' as const, version: 1, total_students: 45, marked: 45, unmarked: 0, present: 42, absent: 2, od: 1, informed_leave: 0};
    mockRows.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([hourThree]).mockResolvedValueOnce([]);
    const result = await getDashboard('2026-11-09', 3, false);
    expect(mockRows.mock.calls.some(([query]) => query.includes('attendance_date=eq.2026-11-09'))).toBe(true);
    expect(result.summaries).toEqual([hourThree]);
    expect(result.dailySummaries).toEqual([hourThree]);
    expect(mockRpc).not.toHaveBeenCalled();
  });
  it('counts headcount once and adds attendance statuses across every submitted hour', () => {
    const dashboard = {
      classes: [
        {id: 'bca-a', departments: {code: 'BCA'}},
        {id: 'bca-b', departments: {code: 'BCA'}},
        {id: 'bba-a', departments: {code: 'BBA'}},
      ],
      enrollmentCounts: {'bca-a': 55, 'bca-b': 20, 'bba-a': 30},
      dailySummaries: [
        {class_id: 'bca-a', hour: 1, status: 'submitted', present: 50, absent: 3, od: 1, informed_leave: 1},
        {class_id: 'bca-a', hour: 2, status: 'submitted', present: 49, absent: 4, od: 1, informed_leave: 1},
        {class_id: 'bca-b', hour: 1, status: 'draft', present: 18, absent: 1, od: 1, informed_leave: 0},
        {class_id: 'bba-a', hour: 1, status: 'submitted', present: 29, absent: 0, od: 1, informed_leave: 0},
      ],
    } as unknown as DashboardData;

    expect(departmentAttendanceCounts('BCA', dashboard)).toEqual({
      total_students: 75, present: 99, absent: 7, od: 2, informed_leave: 2,
    });
    expect(collegeAttendanceCounts(dashboard)).toEqual({
      total_students: 105, present: 128, absent: 7, od: 3, informed_leave: 2,
    });
  });
  it('lets Principal assign any class active on the selected attendance date', async () => {
    const activeClass = {...data.classroom, study_year: 2};
    mockRows.mockResolvedValue([]);
    mockRows.mockResolvedValueOnce([activeClass.departments]);
    mockRows.mockResolvedValueOnce([activeClass]);
    mockRpc.mockResolvedValueOnce([]);

    const result = await getDashboard('2026-11-09', 1, true);

    expect(result.classes).toEqual([activeClass]);
    expect(result.assignmentClasses).toEqual([activeClass]);
    expect(mockRows).toHaveBeenCalledTimes(4);
  });
  it('loads the staff identities who opened and submitted a shared attendance session', async () => {
    const classId = '00000000-0000-0000-0000-000000000001';
    mockRows.mockResolvedValueOnce([{...data.classroom, id: classId}]);
    mockRows.mockResolvedValueOnce([{
      ...data.session,
      class_id: classId,
      created_by_profile: {name: 'Staff One'},
      submitted_by_profile: {name: 'Staff Two'},
    }]);
    mockRows.mockResolvedValueOnce([]);
    mockRows.mockResolvedValueOnce([]);
    mockRows.mockResolvedValueOnce([]);

    const result = await getClassAttendance(classId, '2026-11-09', 1);

    expect(result.session?.submitted_by_profile?.name).toBe('Staff Two');
    expect(mockRows.mock.calls[1]?.[0]).toContain('profiles!attendance_sessions_submitted_by_fkey(name)');
  });
  it('loads the submitted session and all 55 cloud roster records for the selected hour', async () => {
    const classId = '00000000-0000-0000-0000-000000000001';
    const enrollments = Array.from({length: 55}, (_, index) => ({
      id: `enrollment-${index + 1}`,
      class_id: classId,
      students: {
        id: `student-${index + 1}`,
        name: `Student ${index + 1}`,
        register_number: String(index + 1).padStart(3, '0'),
      },
    }));
    const attendanceStatuses = ['present', 'absent', 'od', 'informed_leave'] as const;
    mockRows.mockResolvedValueOnce([{...data.classroom, id: classId}]);
    mockRows.mockResolvedValueOnce([{
      ...data.session,
      class_id: classId,
      hour: 4,
      submitted_at: '2026-11-09T08:30:00.000Z',
    }]);
    mockRows.mockResolvedValueOnce(enrollments.map((enrollment) => ({enrollments: enrollment})));
    mockRows.mockResolvedValueOnce(enrollments.map((enrollment, index) => ({
      id: `record-${index + 1}`,
      session_id: 'session-1',
      enrollment_id: enrollment.id,
      status: attendanceStatuses[index % attendanceStatuses.length]!,
      version: 1,
    })));
    mockRows.mockResolvedValueOnce([]);

    const result = await getClassAttendance(classId, '2026-11-09', 4);

    expect(mockRows.mock.calls[1]?.[0]).toContain(`class_id=eq.${classId}&attendance_date=eq.2026-11-09&hour=eq.4`);
    expect(result.session?.submitted_at).toBe('2026-11-09T08:30:00.000Z');
    expect(result.students).toHaveLength(55);
    expect(cloudStudents(result)).toHaveLength(55);
    expect(Object.keys(cloudAttendanceMap(result))).toHaveLength(55);
    expect(result.students[0]?.students.register_number).toBe('001');
    expect(result.students[54]?.students.register_number).toBe('055');
    expect(result.students.map((student) => student.record?.status)).toEqual(
      enrollments.map((_, index) => attendanceStatuses[index % attendanceStatuses.length]),
    );
  });
  it('keeps all departments visible even when staff have no class in a department', async () => {
    const departments = [{id: 'bca', code: 'BCA', name: 'B.C.A'}, {id: 'aiml', code: 'BSCAIML', name: 'B.Sc. AIML'}];
    mockRows.mockResolvedValue([]);
    mockRows.mockResolvedValueOnce(departments);
    const dashboard = await getDashboard('2026-11-09', 1, false);
    expect(dashboard.departments).toEqual(departments);
    expect(dashboard.classes).toEqual([]);
  });
  it('keeps the department dashboard available when account management needs a database update', async () => {
    mockRows.mockResolvedValue([]);
    mockRows.mockResolvedValueOnce([{id: 'bca', code: 'BCA', name: 'B.C.A'}]);
    mockRpc.mockRejectedValue(new Error('Account directory unavailable'));
    const dashboard = await getDashboard('2026-11-09', 1, true);
    expect(dashboard.departments).toHaveLength(1);
    expect(dashboard.accountsError).toBe('Account directory unavailable');
    expect(dashboard.accounts).toEqual([]);
  });
});
