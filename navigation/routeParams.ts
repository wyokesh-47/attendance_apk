import {getClassroom} from '@/data/demoData';
import type {Classroom} from '@/types/attendance';

export function resolveClassroom(
  code: string | string[] | undefined,
  year: string | string[] | undefined,
): Classroom | undefined {
  const departmentCode = Array.isArray(code) ? code[0] : code;
  const yearValue = Array.isArray(year) ? year[0] : year;
  if (!departmentCode || !yearValue) return undefined;
  return getClassroom(departmentCode, Number(yearValue));
}

export function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
