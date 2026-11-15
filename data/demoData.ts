import type { Classroom, Department, DemoStudent } from '@/types/attendance';

export const DEPARTMENTS: Department[] = [
  { name: 'B.C.A', code: 'BCA', abbreviation: 'BCA' },
  { name: 'B.Sc. CS', code: 'BSCCS', abbreviation: 'CS' },
  { name: 'B.Sc. AIML', code: 'BSCAIML', abbreviation: 'AIML' },
  { name: 'B.B.A', code: 'BBA', abbreviation: 'BBA' },
  { name: 'M.B.A', code: 'MBA', abbreviation: 'MBA' },
  { name: 'B.Com', code: 'BCOM', abbreviation: 'COM' },
  { name: 'B.Com CA', code: 'BCOMCA', abbreviation: 'CA' },
];

export const STUDY_YEARS = ['First Year', 'Second Year', 'Third Year'];
export const HOURS = ['Hour 1', 'Hour 2', 'Hour 3', 'Hour 4', 'Hour 5'];

export type HourSchedule = {
  hour: string;
  period: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  time: string;
};

export const HOUR_SCHEDULES: Record<string, HourSchedule> = {
  'Hour 1': {
    hour: 'Hour 1',
    period: 'Period I',
    startHour: 9,
    startMinute: 0,
    endHour: 9,
    endMinute: 50,
    time: '9:00 AM – 9:50 AM',
  },
  'Hour 2': {
    hour: 'Hour 2',
    period: 'Period II',
    startHour: 9,
    startMinute: 50,
    endHour: 10,
    endMinute: 40,
    time: '9:50 AM – 10:40 AM',
  },
  'Hour 3': {
    hour: 'Hour 3',
    period: 'Period III',
    startHour: 11,
    startMinute: 0,
    endHour: 11,
    endMinute: 50,
    time: '11:00 AM – 11:50 AM',
  },
  'Hour 4': {
    hour: 'Hour 4',
    period: 'Period IV',
    startHour: 11,
    startMinute: 50,
    endHour: 12,
    endMinute: 40,
    time: '11:50 AM – 12:40 PM',
  },
  'Hour 5': {
    hour: 'Hour 5',
    period: 'Period V',
    startHour: 12,
    startMinute: 40,
    endHour: 13,
    endMinute: 30,
    time: '12:40 PM – 1:30 PM',
  },
};

export type HourTimingStatus = {
  schedule: HourSchedule;
  isExpired: boolean;
  isActive: boolean;
  isUpcoming: boolean;
  timeLabel: string;
};

export function getHourTimingStatus(hour: string, now: Date = new Date()): HourTimingStatus | null {
  const schedule = HOUR_SCHEDULES[hour];
  if (!schedule) return null;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;

  const isExpired = currentMinutes >= endMinutes;
  const isActive = currentMinutes >= startMinutes && currentMinutes < endMinutes;
  const isUpcoming = currentMinutes < startMinutes;

  return {
    schedule,
    isExpired,
    isActive,
    isUpcoming,
    timeLabel: schedule.time,
  };
}

export function getCurrentActivePeriod(now: Date = new Date()): {
  label: string;
  hour: string | null;
  status: 'active' | 'break' | 'before' | 'after';
} {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const hour of HOURS) {
    const s = HOUR_SCHEDULES[hour];
    const start = s.startHour * 60 + s.startMinute;
    const end = s.endHour * 60 + s.endMinute;
    if (currentMinutes >= start && currentMinutes < end) {
      return {
        label: `${s.period} (${s.hour}) Active`,
        hour,
        status: 'active',
      };
    }
  }
  if (currentMinutes >= 10 * 60 + 40 && currentMinutes < 11 * 60) {
    return {
      label: 'Tea Break (10:40 AM – 11:00 AM)',
      hour: null,
      status: 'break',
    };
  }
  if (currentMinutes < 9 * 60) {
    return {
      label: 'College starts at 9:00 AM',
      hour: null,
      status: 'before',
    };
  }
  return {
    label: 'College hours ended for today',
    hour: null,
    status: 'after',
  };
}

export function formatLiveDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
}

export function formatLiveTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);
}

export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'od', label: 'OD' },
  { value: 'informed_leave', label: 'Informed Leave' },
] as const;

const bcaSecondYearStudents: DemoStudent[] = Array.from(
  {length: 55},
  (_, index) => {
    const number = String(index + 1).padStart(3, '0');
    return {
      registerNumber: `DEMO-BCA2-${number}`,
      name: `Demo Student ${number}`,
    };
  },
);

const firstNames = [
  'Aven', 'Mira', 'Kian', 'Liora', 'Riven', 'Sena', 'Niko', 'Tavi',
  'Elara', 'Zev', 'Anya', 'Orin', 'Veda', 'Remi', 'Ilan', 'Noor',
  'Arin', 'Cleo', 'Eren', 'Faye', 'Juno', 'Kavi', 'Lumi', 'Milan',
];

const lastNames = [
  'Vale', 'Rowan', 'Sol', 'Marlow', 'Aster', 'Reed', 'Wren', 'Briar',
  'Ellis', 'Lake', 'Sage', 'Arden', 'Voss', 'Quill', 'North', 'Raine',
  'Linden', 'Skye', 'Hollis', 'Moss', 'Perrin', 'Sterling', 'West',
];

export function getClassroom(code: string, year: number): Classroom | undefined {
  const department = DEPARTMENTS.find((item) => item.code === code);
  if (!department || !Number.isInteger(year) || year < 1 || year > 3) {
    return undefined;
  }
  return { department, year };
}

export function getClassroomLabel(classroom: Classroom): string {
  return `${classroom.department.name} · ${STUDY_YEARS[classroom.year - 1]}`;
}

export function getStorageKey(classroom: Classroom): string {
  return `${classroom.department.code}_${classroom.year}`;
}

export function getStudents(classroom: Classroom): DemoStudent[] {
  if (classroom.department.code === 'BCA' && classroom.year === 2) {
    return bcaSecondYearStudents;
  }

  const departmentIndex = DEPARTMENTS.findIndex(
    (department) => department.code === classroom.department.code,
  );
  const count = 45 + ((departmentIndex * 4 + classroom.year * 7) % 21);
  const seed = departmentIndex * 11 + classroom.year * 17;

  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const first = firstNames[(index + seed) % firstNames.length];
    const last =
      lastNames[(index * 7 + seed * 3 + classroom.year) % lastNames.length];
    const serial = String(number).padStart(3, '0');
    return {
      name: `Demo ${first} ${last}`,
      registerNumber: `DEMO-26-${classroom.department.code}-${classroom.year}-${serial}`,
      rollNumber: `${classroom.department.abbreviation}-${classroom.year}-${serial}`,
    };
  });
}

export function searchStudents(students: DemoStudent[], query: string): DemoStudent[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return students;
  return students.filter((student) =>
    `${student.name} ${student.registerNumber} ${student.rollNumber ?? ''}`
      .toLowerCase()
      .includes(normalized),
  );
}
