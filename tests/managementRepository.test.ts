import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {rows, rpc} from '@/services/cloud';
import {approveWithAccess, classCounts, getDashboard, saveAttendanceChange, shiftDate, validDate} from '@/services/managementRepository';
import type {ClassAttendanceData, DashboardData} from '@/types/management';

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
  it('approves HOD with a department and Staff with a class in a single RPC', async () => {
    await approveWithAccess('hod-user', 'hod', 'department-1');
    await approveWithAccess('staff-user', 'staff', 'class-1');
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'approve_account_with_access', {p_user: 'hod-user', p_role: 'hod', p_class: null, p_department: 'department-1'});
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'approve_account_with_access', {p_user: 'staff-user', p_role: 'staff', p_class: 'class-1', p_department: null});
  });
  it('does not approve accounts without an access assignment', async () => {
    await expect(approveWithAccess('user', 'hod', '')).rejects.toThrow('department');
    expect(mockRpc).not.toHaveBeenCalled();
  });
  it('queries one date/hour and does not request the Principal directory for an HOD', async () => {
    mockRows.mockResolvedValue([]);
    await getDashboard('2026-11-09', 3, false);
    expect(mockRows.mock.calls.some(([query]) => query.includes('attendance_date=eq.2026-11-09&hour=eq.3'))).toBe(true);
    expect(mockRpc).not.toHaveBeenCalled();
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
