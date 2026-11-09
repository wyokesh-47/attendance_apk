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

export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'od', label: 'OD' },
  { value: 'informed_leave', label: 'Informed Leave' },
] as const;

const bcaSecondYearStudents: DemoStudent[] = [
  {registerNumber: '25054610500111001', name: 'ARAVIND S'},
  {registerNumber: '25054610500111002', name: 'ARUN P'},
  {registerNumber: '25054610500111003', name: 'BHARANI D'},
  {registerNumber: '25054610500111004', name: 'DANIEL RAJ R S'},
  {registerNumber: '25054610500111005', name: 'DHARANI KUMAR S'},
  {registerNumber: '25054610500111006', name: 'FAIZAL K'},
  {registerNumber: '25054610500111007', name: 'JEYAKANTHAN S'},
  {registerNumber: '25054610500111008', name: 'JITHIN MATHEW V'},
  {registerNumber: '25054610500111009', name: 'KARTHICK K'},
  {registerNumber: '25054610500111010', name: 'KARTHICK RAJA K'},
  {registerNumber: '25054610500111011', name: 'MANOJ V'},
  {registerNumber: '25054610500111012', name: 'MUGESH K'},
  {registerNumber: '25054610500111013', name: 'MUGIL M'},
  {registerNumber: '25054610500111014', name: 'NITHISH B'},
  {registerNumber: '25054610500111015', name: 'NOVAS JONE I'},
  {registerNumber: '25054610500111016', name: 'PIRATHISH S'},
  {registerNumber: '25054610500111017', name: 'PRADHAP P'},
  {registerNumber: '25054610500111018', name: 'PRATHEEPREMO G'},
  {registerNumber: '25054610500111019', name: 'PRIYA DHARSHAN S'},
  {registerNumber: '25054610500111020', name: 'RAMASAMY G'},
  {registerNumber: '25054610500111021', name: 'SABARESHWARAM M'},
  {registerNumber: '25054610500111022', name: 'SAKTHI S'},
  {registerNumber: '25054610500111023', name: 'SANJAY MOHAN'},
  {registerNumber: '25054610500111024', name: 'SARAVANAKUMAR D'},
  {registerNumber: '25054610500111025', name: 'SATHISH K'},
  {registerNumber: '25054610500111026', name: 'SUBASH S'},
  {registerNumber: '25054610500111027', name: 'SURENDRAN V'},
  {registerNumber: '25054610500111028', name: 'THIRUMALAI SELVAN E'},
  {registerNumber: '25054610500111029', name: 'THIRUMURUGAN D'},
  {registerNumber: '25054610500111030', name: 'THIRUPUGAL R'},
  {registerNumber: '25054610500111031', name: 'THIRUSAKTHI S'},
  {registerNumber: '25054610500111032', name: 'VISHNU H'},
  {registerNumber: '25054610500111033', name: 'VISHNU P'},
  {registerNumber: '25054610500111034', name: 'YOGESHWARAN C'},
  {registerNumber: '25054610500111035', name: 'YOGESHWARAN R'},
  {registerNumber: '25054610500111036', name: 'YOGESHWAR M'},
  {registerNumber: '25054610500111037', name: 'YOGESWARAN S'},
  {registerNumber: '25054610500112038', name: 'ANANTHI S'},
  {registerNumber: '25054610500112039', name: 'ANUSRI M'},
  {registerNumber: '25054610500112040', name: 'ASHWINI D'},
  {registerNumber: '25054610500112041', name: 'BAVADHARANI M'},
  {registerNumber: '25054610500112042', name: 'HARINISHRI R'},
  {registerNumber: '25054610500112043', name: 'JANANI M'},
  {registerNumber: '25054610500112044', name: 'KAVIPRIYA D'},
  {registerNumber: '25054610500112045', name: 'MUMTAJ K'},
  {registerNumber: '25054610500112046', name: 'NIHARIGA B'},
  {registerNumber: '25054610500112047', name: 'SABEEHA BANU S'},
  {registerNumber: '25054610500112048', name: 'SAFRINA J'},
  {registerNumber: '25054610500112049', name: 'SAVITHA S'},
  {registerNumber: '25054610500112050', name: 'SRINITHI D'},
  {registerNumber: '25054610500112051', name: 'SRINITHI M S'},
  {registerNumber: '25054610500112052', name: 'SUJATHA B'},
  {registerNumber: '25054610500112053', name: 'SUPRIYA B'},
  {registerNumber: '25054610500112054', name: 'YOGETHA R'},
  {registerNumber: '25054610500112055', name: 'YUVASREE P'},
];

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
