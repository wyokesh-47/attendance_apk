export type AttendanceStatus = 'present' | 'absent' | 'od' | 'informed_leave';

export type Department = {
  name: string;
  code: string;
  abbreviation: string;
};

export type Classroom = {
  department: Department;
  year: number;
};

export type DemoStudent = {
  name: string;
  registerNumber: string;
  rollNumber?: string;
};

export type AttendanceMap = Record<string, AttendanceStatus>;

export type SubmissionReceipt = {
  classroom: Classroom;
  hour: string;
  submittedAt: string;
  present: number;
  absent: number;
  od: number;
  informedLeave: number;
  unmarked: number;
};

export type StaffProfile = {
  name: string;
  email: string;
};

export type DemoRegistration = StaffProfile & {
  status: 'pending_approval';
};
