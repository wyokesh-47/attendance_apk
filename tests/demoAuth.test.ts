import {beforeEach, describe, expect, it} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_DEMO_PROFILE,
  PendingApprovalError,
  registerDemoStaff,
  signInDemoStaff,
} from '@/services/demoAuth';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('demo staff access', () => {
  it('allows the fictional pre-approved demo staff account', async () => {
    await expect(signInDemoStaff(DEFAULT_DEMO_PROFILE.email, 'demo1234'))
      .resolves.toEqual(DEFAULT_DEMO_PROFILE);
  });

  it('keeps new registrations pending approval and does not store passwords', async () => {
    await registerDemoStaff({name: 'Sample Staff', email: 'sample@demo.edu'});
    await expect(signInDemoStaff('sample@demo.edu', 'demo1234'))
      .rejects.toBeInstanceOf(PendingApprovalError);

    const saved = await AsyncStorage.getItem('demo_staff_registrations');
    expect(saved).toContain('"status":"pending_approval"');
    expect(saved).not.toContain('demo1234');
  });

  it('rejects invalid credentials and duplicate registrations', async () => {
    await expect(signInDemoStaff('not-an-email', '123'))
      .rejects.toThrow('valid demo email');
    await registerDemoStaff({name: 'Sample Staff', email: 'sample@demo.edu'});
    await expect(registerDemoStaff({name: 'Another Staff', email: 'SAMPLE@DEMO.EDU'}))
      .rejects.toThrow('already exists');
  });
});
