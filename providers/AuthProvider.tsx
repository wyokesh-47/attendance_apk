import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {AppState} from 'react-native';
import type {AccountProfile} from '@/types/auth';
import * as cloud from '@/services/cloud';
import {loadAccountProfile} from '@/services/accountAuth';

type AuthState = {
  profile: AccountProfile | null; loading: boolean; error: string;
  login: (email: string, password: string) => Promise<AccountProfile>;
  logout: () => Promise<void>; reload: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({children}: {children: ReactNode}) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function readProfile() {
    const result = await loadAccountProfile();
    setProfile(result);
    return result;
  }
  async function reload() {
    try { await readProfile(); setError(''); }
    catch (reason) {setProfile(null); setError(reason instanceof Error ? reason.message : 'Unable to verify access.');}
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {if (await cloud.hasSavedSession()) await reload();}
      catch {if (active) setError('Could not restore your session. Please sign in again.');}
      finally {if (active) setLoading(false);}
    })();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void cloud.hasSavedSession().then((saved) => {if (saved) void reload();});
    });
    return () => {active = false; subscription.remove();};
  }, []);
  async function login(email: string, password: string) {
    await cloud.signIn(email, password);
    try {const result = await readProfile(); setError(''); return result;}
    catch (reason) {await cloud.signOut(); throw reason;}
  }
  async function logout() {setProfile(null); await cloud.signOut();}
  return <AuthContext.Provider value={{profile, loading, error, login, logout, reload}}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider missing.');
  return value;
}
