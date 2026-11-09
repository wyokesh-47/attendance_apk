import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

enum AttendanceStatus { present, absent, late, excused }

extension AttendanceStatusLabel on AttendanceStatus {
  String get label => switch (this) {
        AttendanceStatus.present => 'Present',
        AttendanceStatus.absent => 'Absent',
        AttendanceStatus.late => 'Late',
        AttendanceStatus.excused => 'Excused',
      };
}

class Department {
  const Department(this.name, this.code, this.abbreviation);

  final String name;
  final String code;
  final String abbreviation;
}

const departments = <Department>[
  Department('B.C.A', 'BCA', 'BCA'),
  Department('B.Sc. CS', 'BSCCS', 'CS'),
  Department('B.Sc. AIML', 'BSCAIML', 'AIML'),
  Department('B.B.A', 'BBA', 'BBA'),
  Department('M.B.A', 'MBA', 'MBA'),
  Department('B.Com', 'BCOM', 'COM'),
  Department('B.Com CA', 'BCOMCA', 'CA'),
];

const studyYears = <String>['First Year', 'Second Year', 'Third Year'];
const hourLabels = <String>[
  'Hour 1',
  'Hour 2',
  'Hour 3',
  'Hour 4',
  'Hour 5',
];

class Classroom {
  const Classroom({required this.department, required this.year});

  final Department department;
  final int year;

  String get yearName => studyYears[year - 1];
  String get label => '${department.name} · $yearName';
  String get storageKey => '${department.code}_$year';
}

class DemoStudent {
  const DemoStudent({
    required this.name,
    required this.registerNumber,
    required this.rollNumber,
    required this.classroom,
  });

  final String name;
  final String registerNumber;
  final String rollNumber;
  final Classroom classroom;
}

class SubmissionReceipt {
  const SubmissionReceipt({
    required this.classroom,
    required this.hour,
    required this.submittedAt,
    required this.present,
    required this.absent,
    required this.late,
    required this.excused,
    required this.unmarked,
  });

  final Classroom classroom;
  final String hour;
  final DateTime submittedAt;
  final int present;
  final int absent;
  final int late;
  final int excused;
  final int unmarked;
}

abstract interface class AttendanceRepository {
  List<DemoStudent> studentsFor(Classroom classroom);

  Future<Map<String, AttendanceStatus>> attendanceFor(
    Classroom classroom,
    String hour,
  );

  Future<void> setStatus(
    Classroom classroom,
    String hour,
    String registerNumber,
    AttendanceStatus status,
  );

  Future<void> markAllPresent(Classroom classroom, String hour);

  Future<SubmissionReceipt> submit(Classroom classroom, String hour);
}

class DemoAttendanceRepository implements AttendanceRepository {
  DemoAttendanceRepository(this._preferences);

  final SharedPreferences _preferences;

  static const _firstNames = <String>[
    'Aven', 'Mira', 'Kian', 'Liora', 'Riven', 'Sena', 'Niko', 'Tavi',
    'Elara', 'Zev', 'Anya', 'Orin', 'Veda', 'Remi', 'Ilan', 'Noor',
    'Arin', 'Cleo', 'Eren', 'Faye', 'Juno', 'Kavi', 'Lumi', 'Milan',
  ];

  static const _lastNames = <String>[
    'Vale', 'Rowan', 'Sol', 'Marlow', 'Aster', 'Reed', 'Wren', 'Briar',
    'Ellis', 'Lake', 'Sage', 'Arden', 'Voss', 'Quill', 'North', 'Raine',
    'Linden', 'Skye', 'Hollis', 'Moss', 'Perrin', 'Sterling', 'West',
  ];

  @override
  List<DemoStudent> studentsFor(Classroom classroom) {
    final departmentIndex = departments.indexOf(classroom.department);
    final count = 45 + ((departmentIndex * 4 + classroom.year * 7) % 21);
    final seed = departmentIndex * 11 + classroom.year * 17;
    return List<DemoStudent>.generate(count, (index) {
      final number = index + 1;
      final first = _firstNames[(index + seed) % _firstNames.length];
      final last = _lastNames[
          (index * 7 + seed * 3 + classroom.year) % _lastNames.length];
      final serial = number.toString().padLeft(3, '0');
      return DemoStudent(
        name: 'Demo $first $last',
        registerNumber:
            'DEMO-26-${classroom.department.code}-${classroom.year}-$serial',
        rollNumber:
            '${classroom.department.abbreviation}-${classroom.year}-$serial',
        classroom: classroom,
      );
    });
  }

  String _key(Classroom classroom, String hour) =>
      'demo_attendance_${classroom.storageKey}_${hour.replaceAll(' ', '_')}';

  @override
  Future<Map<String, AttendanceStatus>> attendanceFor(
    Classroom classroom,
    String hour,
  ) async {
    final raw = _preferences.getString(_key(classroom, hour));
    if (raw == null) return {};
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Saved demo attendance has an invalid format.');
    }
    final result = <String, AttendanceStatus>{};
    for (final entry in decoded.entries) {
      final value = entry.value;
      if (value is! String) {
        throw const FormatException('A saved attendance status is invalid.');
      }
      result[entry.key] = AttendanceStatus.values.byName(value);
    }
    return result;
  }

  Future<void> _save(
    Classroom classroom,
    String hour,
    Map<String, AttendanceStatus> statuses,
  ) async {
    final encoded = jsonEncode(
      statuses.map((key, value) => MapEntry(key, value.name)),
    );
    final saved = await _preferences.setString(
      _key(classroom, hour),
      encoded,
    );
    if (!saved) throw StateError('Could not save demo attendance locally.');
  }

  @override
  Future<void> setStatus(
    Classroom classroom,
    String hour,
    String registerNumber,
    AttendanceStatus status,
  ) async {
    final statuses = await attendanceFor(classroom, hour);
    statuses[registerNumber] = status;
    await _save(classroom, hour, statuses);
  }

  @override
  Future<void> markAllPresent(Classroom classroom, String hour) async {
    final statuses = <String, AttendanceStatus>{
      for (final student in studentsFor(classroom))
        student.registerNumber: AttendanceStatus.present,
    };
    await _save(classroom, hour, statuses);
  }

  @override
  Future<SubmissionReceipt> submit(Classroom classroom, String hour) async {
    final students = studentsFor(classroom);
    final statuses = await attendanceFor(classroom, hour);
    int count(AttendanceStatus status) =>
        statuses.values.where((value) => value == status).length;
    final receipt = SubmissionReceipt(
      classroom: classroom,
      hour: hour,
      submittedAt: DateTime.now(),
      present: count(AttendanceStatus.present),
      absent: count(AttendanceStatus.absent),
      late: count(AttendanceStatus.late),
      excused: count(AttendanceStatus.excused),
      unmarked: students.length - statuses.length,
    );
    final saved = await _preferences.setString(
      'demo_submission_${classroom.storageKey}_${hour.replaceAll(' ', '_')}',
      jsonEncode({
        'submittedAt': receipt.submittedAt.toIso8601String(),
        'present': receipt.present,
        'absent': receipt.absent,
        'late': receipt.late,
        'excused': receipt.excused,
        'unmarked': receipt.unmarked,
      }),
    );
    if (!saved) throw StateError('Could not save the demo submission locally.');
    return receipt;
  }
}
