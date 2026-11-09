export type UserRole = 'staff' | 'hod' | 'principal';
export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  department_code?: string | null;
};

export function canManageDepartment(profile: AccountProfile, department: string): boolean {
  return profile.approved && (profile.role === 'principal' ||
    (profile.role === 'hod' && profile.department_code === department));
}
