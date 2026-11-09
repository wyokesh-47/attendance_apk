import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {loadAccountProfile} from '@/services/accountAuth';
import {rpc} from '@/services/cloud';

jest.mock('@/services/cloud', () => ({rpc: jest.fn()}));
const mockRpc = rpc as jest.MockedFunction<typeof rpc>;
beforeEach(() => {jest.clearAllMocks();});

describe('Supabase account approval', () => {
  it('accepts the approved Principal role returned by the database', async () => {
    const profile = {id: 'test-id', email: 'testuser1@gmail.com', name: 'Principal', role: 'principal', approved: true};
    mockRpc.mockResolvedValue(profile);
    expect(await loadAccountProfile()).toEqual(profile);
    expect(mockRpc).toHaveBeenCalledWith('my_profile');
  });
  it('keeps pending users out of authenticated screens', async () => {
    mockRpc.mockResolvedValue({role: 'staff', approved: false, approval_status: 'pending'});
    await expect(loadAccountProfile()).rejects.toThrow('pending Principal approval');
  });
  it('distinguishes suspended accounts from accounts waiting for approval', async () => {
    mockRpc.mockResolvedValue({role: 'principal', approved: false, approval_status: 'suspended'});
    await expect(loadAccountProfile()).rejects.toThrow('suspended');
  });
  it('explains a missing attendance profile instead of reporting demo login errors', async () => {
    mockRpc.mockResolvedValue(null);
    await expect(loadAccountProfile()).rejects.toThrow('profile is missing');
  });
  it('does not authorize unknown roles even if the profile is approved', async () => {
    mockRpc.mockResolvedValue({role: 'administrator', approved: true});
    await expect(loadAccountProfile()).rejects.toThrow('unsupported role');
  });
});
