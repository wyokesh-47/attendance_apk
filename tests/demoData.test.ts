import {describe, expect, it} from '@jest/globals';

import {
  DEPARTMENTS,
  HOURS,
  HOUR_SCHEDULES,
  STUDY_YEARS,
  formatLiveDate,
  formatLiveTime,
  getCurrentActivePeriod,
  getClassroom,
  getHourTimingStatus,
  getStudents,
  searchStudents,
} from '@/data/demoData';
import {getVisibleStudyYears, isStaffBcaDemo} from '@/navigation/routeParams';

describe('Staff BCA demo navigation', () => {
  it('keeps all three year choices and identifies the direct BCA Staff class route', () => {
    expect(isStaffBcaDemo('BCA', 'staff')).toBe(true);
    expect(getVisibleStudyYears([2])).toEqual([1, 2, 3]);
  });

  it('preserves the direct-class routing restriction to BCA Staff only', () => {
    expect(isStaffBcaDemo('BBA', 'staff')).toBe(false);
    expect(isStaffBcaDemo('BCA', 'principal')).toBe(false);
  });
});

describe('class rosters', () => {
  it('keeps generated records for classes other than BCA Second Year', () => {
    expect(DEPARTMENTS).toHaveLength(7);
    expect(STUDY_YEARS).toHaveLength(3);
    expect(HOURS).toHaveLength(5);

    const classCounts = new Set<number>();
    for (const department of DEPARTMENTS) {
      for (const year of [1, 2, 3]) {
        if (department.code === 'BCA' && year === 2) continue;
        const classroom = getClassroom(department.code, year);
        expect(classroom).toBeDefined();
        const students = getStudents(classroom!);
        classCounts.add(students.length);
        expect(students.length).toBeGreaterThanOrEqual(45);
        expect(students.length).toBeLessThanOrEqual(65);
        expect(new Set(students.map((student) => student.registerNumber)).size)
          .toBe(students.length);
        expect(students.every((student) => student.name.startsWith('Demo ')))
          .toBe(true);
        expect(students.every((student) => student.registerNumber.includes('DEMO')))
          .toBe(true);
      }
    }
    expect(classCounts.size).toBeGreaterThan(1);
  });

  it('returns 55 anonymized BCA Second Year demo students without duplicates', () => {
    const students = getStudents(getClassroom('BCA', 2)!);
    const registerNumbers = students.map((student) => student.registerNumber);

    expect(students).toHaveLength(55);
    expect(new Set(registerNumbers).size).toBe(55);
    expect(registerNumbers).toEqual(
      Array.from({length: 55}, (_, index) =>
        `DEMO-BCA2-${String(index + 1).padStart(3, '0')}`,
      ),
    );
    expect(students[0]).toEqual({
      registerNumber: 'DEMO-BCA2-001',
      name: 'Demo Student 001',
    });
    expect(students[54]).toEqual({
      registerNumber: 'DEMO-BCA2-055',
      name: 'Demo Student 055',
    });
  });

  it('searches student names, register numbers and roll numbers', () => {
    const students = getStudents(getClassroom('BCA', 1)!);
    const student = students[0]!;
    expect(searchStudents(students, student.name)).toContainEqual(student);
    expect(searchStudents(students, student.registerNumber.toLowerCase()))
      .toContainEqual(student);
    if (!student.rollNumber) throw new Error('Generated students need a roll number.');
    expect(searchStudents(students, student.rollNumber)).toContainEqual(student);
    expect(searchStudents(students, '   ')).toEqual(students);
    expect(searchStudents(students, 'not-a-student')).toEqual([]);
  });

  it('searches anonymized BCA Second Year register numbers and names', () => {
    const students = getStudents(getClassroom('BCA', 2)!);
    expect(searchStudents(students, 'DEMO-BCA2-042')).toContainEqual(
      students[41],
    );
    expect(searchStudents(students, 'demo student 042')).toContainEqual(
      students[41],
    );
  });

  it('provides exact timings for all five periods', () => {
    expect(HOUR_SCHEDULES['Hour 1'].time).toBe('9:00 AM – 9:50 AM');
    expect(HOUR_SCHEDULES['Hour 2'].time).toBe('9:50 AM – 10:40 AM');
    expect(HOUR_SCHEDULES['Hour 3'].time).toBe('11:00 AM – 11:50 AM');
    expect(HOUR_SCHEDULES['Hour 4'].time).toBe('11:50 AM – 12:40 PM');
    expect(HOUR_SCHEDULES['Hour 5'].time).toBe('12:40 PM – 1:30 PM');
  });

  it('determines whether an hour is active, upcoming, or expired based on time', () => {
    // 9:30 AM
    const at930 = new Date('2026-11-12T09:30:00');
    const h1At930 = getHourTimingStatus('Hour 1', at930)!;
    expect(h1At930.isActive).toBe(true);
    expect(h1At930.isExpired).toBe(false);
    expect(h1At930.isUpcoming).toBe(false);

    // 10:15 AM: Hour 1 has expired, Hour 2 is active
    const at1015 = new Date('2026-11-12T10:15:00');
    const h1At1015 = getHourTimingStatus('Hour 1', at1015)!;
    expect(h1At1015.isExpired).toBe(true);
    expect(h1At1015.isActive).toBe(false);

    const h2At1015 = getHourTimingStatus('Hour 2', at1015)!;
    expect(h2At1015.isActive).toBe(true);
    expect(h2At1015.isExpired).toBe(false);

    // 1:45 PM: all periods are expired
    const at1345 = new Date('2026-11-12T13:45:00');
    expect(getHourTimingStatus('Hour 5', at1345)!.isExpired).toBe(true);
  });

  it('computes current active period status and break intervals', () => {
    const at920 = new Date('2026-11-12T09:20:00');
    expect(getCurrentActivePeriod(at920)).toEqual({
      label: 'Period I (Hour 1) Active',
      hour: 'Hour 1',
      status: 'active',
    });

    const atTeaBreak = new Date('2026-11-12T10:45:00');
    expect(getCurrentActivePeriod(atTeaBreak)).toEqual({
      label: 'Tea Break (10:40 AM – 11:00 AM)',
      hour: null,
      status: 'break',
    });

    const at8am = new Date('2026-11-12T08:00:00');
    expect(getCurrentActivePeriod(at8am).status).toBe('before');

    const at3pm = new Date('2026-11-12T15:00:00');
    expect(getCurrentActivePeriod(at3pm).status).toBe('after');
  });

  it('formats live date and time correctly', () => {
    const testDate = new Date('2026-11-12T11:21:45');
    const dateStr = formatLiveDate(testDate);
    const timeStr = formatLiveTime(testDate);

    expect(dateStr).toContain('12');
    expect(dateStr).toContain('Nov');
    expect(timeStr).toContain('11:21');
  });
});
