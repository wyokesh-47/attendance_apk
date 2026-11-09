import {describe, expect, it} from '@jest/globals';

import {
  DEPARTMENTS,
  HOURS,
  STUDY_YEARS,
  getClassroom,
  getStudents,
  searchStudents,
} from '@/data/demoData';

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

  it('returns the 55 provided BCA Second Year students without duplicates or demo records', () => {
    const students = getStudents(getClassroom('BCA', 2)!);
    const registerNumbers = students.map((student) => student.registerNumber);

    expect(students).toHaveLength(55);
    expect(new Set(registerNumbers).size).toBe(55);
    expect(students.every((student) => !student.name.startsWith('Demo ')))
      .toBe(true);
    expect(students.every((student) => !student.registerNumber.includes('DEMO')))
      .toBe(true);
    expect(registerNumbers.slice(0, 37)).toEqual(
      Array.from({length: 37}, (_, index) =>
        `25054610500111${String(index + 1).padStart(3, '0')}`,
      ),
    );
    expect(registerNumbers.slice(37)).toEqual(
      Array.from({length: 18}, (_, index) =>
        `25054610500112${String(index + 38).padStart(3, '0')}`,
      ),
    );
    expect(students[0]).toEqual({
      registerNumber: '25054610500111001',
      name: 'ARAVIND S',
    });
    expect(students[36]).toEqual({
      registerNumber: '25054610500111037',
      name: 'YOGESWARAN S',
    });
    expect(students[37]).toEqual({
      registerNumber: '25054610500112038',
      name: 'ANANTHI S',
    });
    expect(students[54]).toEqual({
      registerNumber: '25054610500112055',
      name: 'YUVASREE P',
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

  it('searches the actual BCA Second Year register numbers and names', () => {
    const students = getStudents(getClassroom('BCA', 2)!);
    expect(searchStudents(students, '25054610500112042')).toContainEqual(
      students[41],
    );
    expect(searchStudents(students, 'harinishri')).toContainEqual(
      students[41],
    );
  });
});
