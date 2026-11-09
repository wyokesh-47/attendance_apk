import 'package:attendance_staff_demo/demo_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('provides seven departments, three years, and five hours', () {
    expect(departments.map((department) => department.name), [
      'B.C.A',
      'B.Sc. CS',
      'B.Sc. AIML',
      'B.B.A',
      'M.B.A',
      'B.Com',
      'B.Com CA',
    ]);
    expect(studyYears, ['First Year', 'Second Year', 'Third Year']);
    expect(hourLabels, ['Hour 1', 'Hour 2', 'Hour 3', 'Hour 4', 'Hour 5']);
  });

  test('generates distinct-size fictional rosters for all classes', () async {
    final repository =
        DemoAttendanceRepository(await SharedPreferences.getInstance());
    final counts = <int>{};
    var classesChecked = 0;

    for (final department in departments) {
      for (var year = 1; year <= 3; year++) {
        final classroom = Classroom(department: department, year: year);
        final students = repository.studentsFor(classroom);
        classesChecked++;
        counts.add(students.length);

        expect(students.length, inInclusiveRange(45, 65));
        expect(students.every((student) => student.name.startsWith('Demo ')),
            isTrue);
        expect(
          students.every((student) =>
              student.registerNumber.startsWith('DEMO-') &&
              student.rollNumber.isNotEmpty &&
              student.classroom.label == classroom.label),
          isTrue,
        );
        expect(students.map((student) => student.registerNumber).toSet().length,
            students.length);
      }
    }

    expect(classesChecked, 21);
    expect(counts.length, greaterThan(1));
  });

  test('stores statuses and returns an accurate local demo receipt', () async {
    final preferences = await SharedPreferences.getInstance();
    final repository = DemoAttendanceRepository(preferences);
    final classroom = Classroom(department: departments.first, year: 1);
    final students = repository.studentsFor(classroom);
    const hour = 'Hour 1';

    await repository.setStatus(
      classroom,
      hour,
      students[0].registerNumber,
      AttendanceStatus.present,
    );
    await repository.setStatus(
      classroom,
      hour,
      students[1].registerNumber,
      AttendanceStatus.absent,
    );
    await repository.setStatus(
      classroom,
      hour,
      students[2].registerNumber,
      AttendanceStatus.late,
    );
    await repository.setStatus(
      classroom,
      hour,
      students[3].registerNumber,
      AttendanceStatus.excused,
    );

    final restored = DemoAttendanceRepository(preferences);
    final saved = await restored.attendanceFor(classroom, hour);
    expect(saved.length, 4);
    expect(
      saved[students[0].registerNumber],
      AttendanceStatus.present,
    );

    final receipt = await restored.submit(classroom, hour);
    expect(receipt.present, 1);
    expect(receipt.absent, 1);
    expect(receipt.late, 1);
    expect(receipt.excused, 1);
    expect(receipt.unmarked, students.length - 4);
  });

  test('marks every student present for one class hour', () async {
    final repository =
        DemoAttendanceRepository(await SharedPreferences.getInstance());
    final classroom = Classroom(department: departments.last, year: 3);
    final students = repository.studentsFor(classroom);

    await repository.markAllPresent(classroom, 'Hour 5');

    final statuses = await repository.attendanceFor(classroom, 'Hour 5');
    expect(statuses.length, students.length);
    expect(
      statuses.values.every((status) => status == AttendanceStatus.present),
      isTrue,
    );
  });
}
