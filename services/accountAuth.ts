import type {AccountProfile} from '@/types/auth';
import {rpc} from '@/services/cloud';

export async function loadAccountProfile(): Promise<AccountProfile> {
  const profile = await rpc<AccountProfile | null>('my_profile');
  if (!profile) throw new Error('Your attendance profile is missing. Ask the administrator to apply the database setup.');
  if (!profile.approved) {
    const status = profile.approval_status;
    if (status === 'suspended' || status === 'rejected') throw new Error(`Your account is ${status}. Contact the Principal.`);
    throw new Error('Your account is pending Principal approval.');
  }
  if (!['staff', 'hod', 'principal'].includes(profile.role)) throw new Error('Your account has an unsupported role. Contact the administrator.');
  return profile;
}
