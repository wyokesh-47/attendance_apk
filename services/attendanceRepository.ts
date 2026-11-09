import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStorageKey, getStudents, HOURS } from '@/data/demoData';
import type {
  AttendanceMap,
  AttendanceStatus,
  Classroom,
  SubmissionReceipt,
} from '@/types/attendance';

export class DuplicateSubmissionError extends Error {
  constructor() {
    super('Attendance for this class hour has already been submitted.');
    this.name = 'DuplicateSubmissionError';
  }
}

const storageKeys = {
  attendance: (classroom: Classroom, hour: string) =>
    `demo_attendance_${getStorageKey(classroom)}_${hour.replaceAll(' ', '_')}`,
  receipt: (classroom: Classroom, hour: string) =>
    `demo_submission_${getStorageKey(classroom)}_${hour.replaceAll(' ', '_')}`,
};

const mutationTails = new Map<string, Promise<void>>();
let bcaSecondYearRosterMigration: Promise<void> | null = null;

async function ensureCurrentRoster(classroom: Classroom): Promise<void> {
  if (classroom.department.code !== 'BCA' || classroom.year !== 2) return;

  if (!bcaSecondYearRosterMigration) {
    bcaSecondYearRosterMigration = (async () => {
      const versionKey = 'attendance_roster_BCA_2_version';
      const currentVersion = await AsyncStorage.getItem(versionKey);
      if (currentVersion === 'actual-55-v1') return;

      const oldRosterKeys = HOURS.flatMap((hour) => [
        storageKeys.attendance(classroom, hour),
        storageKeys.receipt(classroom, hour),
      ]);
      await AsyncStorage.multiRemove(oldRosterKeys);
      await AsyncStorage.setItem(versionKey, 'actual-55-v1');
    })();
  }

  try {
    await bcaSecondYearRosterMigration;
  } finally {
    bcaSecondYearRosterMigration = null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

async function serializeMutation<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = mutationTails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  mutationTails.set(key, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (mutationTails.get(key) === current) mutationTails.delete(key);
  }
}

function assertEditable(receipt: SubmissionReceipt | null): void {
  if (receipt) {
    throw new DuplicateSubmissionError();
  }
}

export async function getAttendance(
  classroom: Classroom,
  hour: string,
): Promise<AttendanceMap> {
  await ensureCurrentRoster(classroom);
  const raw = await AsyncStorage.getItem(storageKeys.attendance(classroom, hour));
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error('Saved attendance has an invalid format.');
  }
  const knownStudents = new Set(
    getStudents(classroom).map((student) => student.registerNumber),
  );
  const result: AttendanceMap = {};
  for (const [registerNumber, status] of Object.entries(parsed)) {
    if (!knownStudents.has(registerNumber)) {
      throw new Error(`Saved attendance contains an unknown student: ${registerNumber}.`);
    }
    if (
      status !== 'present' &&
      status !== 'absent' &&
      status !== 'od' &&
      status !== 'informed_leave'
    ) {
      throw new Error(`Saved attendance status for ${registerNumber} is invalid.`);
    }
    result[registerNumber] = status;
  }
  return result;
}

export async function getSubmission(
  classroom: Classroom,
  hour: string,
): Promise<SubmissionReceipt | null> {
  await ensureCurrentRoster(classroom);
  const raw = await AsyncStorage.getItem(storageKeys.receipt(classroom, hour));
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error('Saved receipt has an invalid format.');
  }
  const savedClassroom = isRecord(parsed.classroom) ? parsed.classroom : null;
  const savedDepartment =
    savedClassroom && isRecord(savedClassroom.department)
      ? savedClassroom.department
      : null;
  if (
    !savedClassroom ||
    !savedDepartment ||
    savedDepartment.code !== classroom.department.code ||
    savedClassroom.year !== classroom.year ||
    parsed.hour !== hour ||
    typeof parsed.submittedAt !== 'string' ||
    Number.isNaN(Date.parse(parsed.submittedAt))
  ) {
    throw new Error('Saved receipt does not match the selected class hour.');
  }
  const {present, absent, od, informedLeave, unmarked} = parsed;
  if (
    !isNonNegativeInteger(present) ||
    !isNonNegativeInteger(absent) ||
    !isNonNegativeInteger(od) ||
    !isNonNegativeInteger(informedLeave) ||
    !isNonNegativeInteger(unmarked) ||
    present + absent + od + informedLeave + unmarked !== getStudents(classroom).length
  ) {
    throw new Error('Saved receipt contains invalid attendance totals.');
  }

  return {
    classroom,
    hour,
    submittedAt: parsed.submittedAt,
    present,
    absent,
    od,
    informedLeave,
    unmarked,
  };
}

export async function setStudentStatus(
  classroom: Classroom,
  hour: string,
  registerNumber: string,
  status: AttendanceStatus,
): Promise<AttendanceMap> {
  const students = getStudents(classroom);
  if (!students.some((student) => student.registerNumber === registerNumber)) {
    throw new Error('This student is not part of the selected class.');
  }
  return serializeMutation(storageKeys.attendance(classroom, hour), async () => {
    const receipt = await getSubmission(classroom, hour);
    assertEditable(receipt);
    const attendance = await getAttendance(classroom, hour);
    attendance[registerNumber] = status;
    await AsyncStorage.setItem(
      storageKeys.attendance(classroom, hour),
      JSON.stringify(attendance),
    );
    return attendance;
  });
}

export async function markAllPresent(
  classroom: Classroom,
  hour: string,
): Promise<AttendanceMap> {
  return serializeMutation(storageKeys.attendance(classroom, hour), async () => {
    const receipt = await getSubmission(classroom, hour);
    assertEditable(receipt);
    const students = getStudents(classroom);
    const attendance = Object.fromEntries(
      students.map((student) => [student.registerNumber, 'present']),
    ) as AttendanceMap;
    await AsyncStorage.setItem(
      storageKeys.attendance(classroom, hour),
      JSON.stringify(attendance),
    );
    return attendance;
  });
}

export async function submitAttendance(
  classroom: Classroom,
  hour: string,
): Promise<SubmissionReceipt> {
  return serializeMutation(storageKeys.attendance(classroom, hour), async () => {
    const existing = await getSubmission(classroom, hour);
    if (existing) throw new DuplicateSubmissionError();

    const students = getStudents(classroom);
    const attendance = await getAttendance(classroom, hour);
    const values = Object.values(attendance);
    const count = (status: AttendanceStatus) =>
      values.filter((value) => value === status).length;
    const receipt: SubmissionReceipt = {
      classroom,
      hour,
      submittedAt: new Date().toISOString(),
      present: count('present'),
      absent: count('absent'),
      od: count('od'),
      informedLeave: count('informed_leave'),
      unmarked: students.length - values.length,
    };
    await AsyncStorage.setItem(
      storageKeys.receipt(classroom, hour),
      JSON.stringify(receipt),
    );
    return receipt;
  });
}
