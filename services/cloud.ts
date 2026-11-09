import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = 'attendance_auth_session_v1';
type Session = {access_token: string; refresh_token: string; expires_at: number};
let session: Session | null = null;
let refresh: Promise<Session> | null = null;
let generation = 0;

async function request(path: string, body?: unknown, token?: string, method = 'POST') {
  if (!url || !key) throw new Error('Attendance server is not configured. Contact your administrator.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${url}${path}`, {
      method, signal: controller.signal,
      headers: {apikey: key, 'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Server request failed.');
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Connection timed out. Your changes were not confirmed; refresh before retrying.');
    throw error;
  } finally { clearTimeout(timer); }
}

async function saveSession(data: {access_token: string; refresh_token: string; expires_in: number}) {
  session = {...data, expires_at: Date.now() + data.expires_in * 1000};
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function getToken() {
  if (!session) {
    const saved = await AsyncStorage.getItem(SESSION_KEY);
    if (saved) session = JSON.parse(saved);
  }
  if (!session) throw new Error('Please sign in to continue.');
  if (session.expires_at < Date.now() + 60000) {
    if (!refresh) {
      const currentGeneration = generation;
      refresh = request('/auth/v1/token?grant_type=refresh_token', {refresh_token: session.refresh_token})
        .then((data) => {
          if (generation !== currentGeneration) throw new Error('Session has ended.');
          return saveSession(data);
        }).finally(() => {refresh = null;});
    }
    await refresh;
  }
  return session!.access_token;
}

export async function signIn(email: string, password: string) {
  generation++;
  const data = await request('/auth/v1/token?grant_type=password', {email: email.trim().toLowerCase(), password});
  await saveSession(data);
}
export async function register(name: string, email: string, password: string) {
  if (!name.trim() || !email.includes('@') || password.length < 8) throw new Error('Enter your name, valid email and a password of at least 8 characters.');
  await request('/auth/v1/signup', {email: email.trim().toLowerCase(), password, data: {name: name.trim()}});
}
export async function signOut() {
  const token = session?.access_token;
  generation++;
  session = null;
  await AsyncStorage.removeItem(SESSION_KEY);
  if (token) await request('/auth/v1/logout', undefined, token).catch(() => undefined);
}
export async function hasSavedSession() {return Boolean(await AsyncStorage.getItem(SESSION_KEY));}
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  return request(`/rest/v1/rpc/${name}`, args, await getToken());
}
export async function rows<T>(query: string): Promise<T> {
  return request(`/rest/v1/${query}`, undefined, await getToken(), 'GET');
}
