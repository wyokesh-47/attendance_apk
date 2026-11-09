import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DemoRegistration, StaffProfile } from '@/types/attendance';

const REGISTRATIONS_KEY = 'demo_staff_registrations';
export const DEFAULT_DEMO_PROFILE: StaffProfile = {
  name: 'Demo Staff',
  email: 'staff@demo.edu',
};

export class PendingApprovalError extends Error {
  constructor() {
    super('This demo staff registration is awaiting Principal approval.');
    this.name = 'PendingApprovalError';
  }
}

export class UnapprovedStaffError extends Error {
  constructor() {
    super('No approved demo staff account was found. Register and wait for approval.');
    this.name = 'UnapprovedStaffError';
  }
}

async function readRegistrations(): Promise<DemoRegistration[]> {
  const raw = await AsyncStorage.getItem(REGISTRATIONS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved demo registrations have an invalid format.');
  }
  return parsed as DemoRegistration[];
}

export async function registerDemoStaff(
  profile: StaffProfile,
): Promise<void> {
  const email = profile.email.trim().toLowerCase();
  if (!profile.name.trim() || !email.includes('@')) {
    throw new Error('Enter a display name and valid demo email.');
  }
  if (email === DEFAULT_DEMO_PROFILE.email) {
    throw new Error('This email is already used by the approved demo account.');
  }
  const registrations = await readRegistrations();
  if (registrations.some((registration) => registration.email === email)) {
    throw new Error('A demo registration already exists for this email.');
  }
  registrations.push({
    name: profile.name.trim(),
    email,
    status: 'pending_approval',
  });
  await AsyncStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
}

export async function signInDemoStaff(
  email: string,
  password: string,
): Promise<StaffProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes('@') || password.trim().length < 4) {
    throw new Error('Enter a valid demo email and a password of at least 4 characters.');
  }
  if (normalizedEmail === DEFAULT_DEMO_PROFILE.email) {
    return DEFAULT_DEMO_PROFILE;
  }
  const registrations = await readRegistrations();
  if (registrations.some((item) => item.email === normalizedEmail)) {
    throw new PendingApprovalError();
  }
  throw new UnapprovedStaffError();
}
