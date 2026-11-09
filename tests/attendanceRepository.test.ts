import {beforeEach, describe, expect, it} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getClassroom, getStudents } from '@/data/demoData';
import {
  DuplicateSubmissionError,
  getAttendance,
  getSubmission,
  markAllPresent,
  setStudentStatus,
  submitAttendance,
} from '@/services/attendanceRepository';

const classroom = getClassroom('BCA', 1)!;
const bcaSecondYear = getClassroom('BCA', 2)!;
const hour = 'Hour 1';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('local demo attendance', () => {
  it('saves and restores all four attendance statuses', async () => {
    const students = getStudents(classroom);
    const statuses = ['present', 'absent', 'od', 'informed_leave'] as const;
    for (const [index, status] of statuses.entries()) {
      await setStudentStatus(classroom, hour, students[index]!.registerNumber, status);
    }

    const saved = await getAttendance(classroom, hour);
    expect(Object.values(saved)).toEqual(statuses);
    expect(await AsyncStorage.getItem('demo_attendance_BCA_1_Hour_1'))
      .not.toBeNull();
  });

  it('marks each student present and rejects unknown students', async () => {
    const attendance = await markAllPresent(classroom, hour);
    expect(Object.keys(attendance)).toHaveLength(getStudents(classroom).length);
    expect(new Set(Object.values(attendance))).toEqual(new Set(['present']));
    await expect(
      setStudentStatus(classroom, hour, 'REAL-STUDENT-RECORD', 'absent'),
    ).rejects.toThrow('not part of the selected class');
  });

  it('tracks attendance against each of the 55 actual BCA Second Year register numbers', async () => {
    const students = getStudents(bcaSecondYear);
    const statuses = ['present', 'absent', 'od', 'informed_leave'] as const;

    for (const [index, student] of students.entries()) {
      await setStudentStatus(
        bcaSecondYear,
        hour,
        student.registerNumber,
        statuses[index % statuses.length]!,
      );
    }

    const saved = await getAttendance(bcaSecondYear, hour);
    expect(Object.keys(saved)).toHaveLength(55);
    for (const [index, student] of students.entries()) {
      expect(saved[student.registerNumber]).toBe(
        statuses[index % statuses.length],
      );
    }

    const allPresent = await markAllPresent(bcaSecondYear, hour);
    expect(Object.keys(allPresent)).toHaveLength(55);
    expect(Object.values(allPresent).every((status) => status === 'present'))
      .toBe(true);
  });

  it('clears saved demo attendance and receipts from the replaced BCA Second Year roster', async () => {
    await AsyncStorage.setItem(
      'demo_attendance_BCA_2_Hour_1',
      JSON.stringify({'DEMO-26-BCA-2-001': 'present'}),
    );
    await AsyncStorage.setItem(
      'demo_submission_BCA_2_Hour_1',
      JSON.stringify({classroom: {}, hour}),
    );

    expect(await getAttendance(bcaSecondYear, hour)).toEqual({});
    expect(await getSubmission(bcaSecondYear, hour)).toBeNull();
  });

  it('saves a receipt and permanently prevents edits or duplicate submission', async () => {
    const students = getStudents(classroom);
    await setStudentStatus(classroom, hour, students[0]!.registerNumber, 'present');
    await setStudentStatus(classroom, hour, students[1]!.registerNumber, 'absent');

    const receipt = await submitAttendance(classroom, hour);
    expect(receipt.present).toBe(1);
    expect(receipt.absent).toBe(1);
    expect(receipt.unmarked).toBe(students.length - 2);
    expect(await getSubmission(classroom, hour)).toEqual(receipt);

    await expect(submitAttendance(classroom, hour))
      .rejects.toBeInstanceOf(DuplicateSubmissionError);
    await expect(
      setStudentStatus(classroom, hour, students[0]!.registerNumber, 'od'),
    ).rejects.toBeInstanceOf(DuplicateSubmissionError);
    await expect(markAllPresent(classroom, hour))
      .rejects.toBeInstanceOf(DuplicateSubmissionError);
    expect(await getAttendance(classroom, hour)).toEqual({
      [students[0]!.registerNumber]: 'present',
      [students[1]!.registerNumber]: 'absent',
    });
  });

  it('serializes simultaneous submissions so only one receipt is created', async () => {
    const results = await Promise.allSettled([
      submitAttendance(classroom, hour),
      submitAttendance(classroom, hour),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await getSubmission(classroom, hour)).not.toBeNull();
  });
});
