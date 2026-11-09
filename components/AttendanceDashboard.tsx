import {router, useFocusEffect} from 'expo-router';
import {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View, type ScrollViewInstance} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {DepartmentTile} from './tiles';
import {DEPARTMENTS} from '@/data/demoData';
import {AppCard, AppHeader, AppTextInput, ErrorMessage, Page, PrimaryButton, colors} from './ui';
import {ApprovalSheet} from './ApprovalSheet';
import {useAuth} from '@/providers/AuthProvider';
import {collegeToday, getDashboard} from '@/services/managementRepository';
import type {DashboardData, ManagedAccount} from '@/types/management';

function roleLabel(role: string) {return role === 'hod' ? 'HOD' : role === 'principal' ? 'Principal' : 'Staff';}
export default function AttendanceDashboard() {
  const {profile} = useAuth();
  const principal = profile?.role === 'principal';
  const staff = profile?.role === 'staff';
  const [selection, setSelection] = useState({date: collegeToday(), hour: 1});
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [account, setAccount] = useState<ManagedAccount | null>(null);
  const sequence = useRef(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const loadedSelection = useRef('');
  const load = useCallback(async (silent = false) => {
    const request = ++sequence.current;
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await getDashboard(selection.date, selection.hour, principal);
      if (sequence.current === request) {loadedSelection.current = `${selection.date}:${selection.hour}`; setData(result);}
    } catch (reason) {
      if (sequence.current === request) setError(reason instanceof Error ? reason.message : 'Could not load attendance.');
    } finally {if (sequence.current === request) setLoading(false);}
  }, [selection.date, selection.hour, principal, profile?.id]);
  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => {void load(true);}, 30000);
    return () => {sequence.current++; clearInterval(timer);};
  }, [load]));
  const pending = data?.accounts.filter((item) => item.approval_status === 'pending') ?? [];
  const directory = data?.departments.length ? data.departments.map((item) => ({...item,
    abbreviation: DEPARTMENTS.find((known) => known.code === item.code)?.abbreviation ?? item.code})) : DEPARTMENTS;
  const departments = directory.filter((item) => (item.name + ' ' + item.code).toLowerCase().includes(query.trim().toLowerCase()));
  const reviewed = data?.accounts.filter((item) => item.approval_status !== 'pending' &&
    `${item.name} ${item.email} ${roleLabel(item.role)}`.toLowerCase().includes(accountSearch.trim().toLowerCase())) ?? [];
  const submitted = data?.summaries.filter((item) => item.status === 'submitted' && data.classes.some((c) => c.id === item.class_id)).length ?? 0;
  return <View style={styles.screen}>
    <AppHeader dashboard title="" onProfile={() => router.push('/profile')} />
    <Page scroll scrollRef={scrollRef} safeAreaEdges={['left','right','bottom']} style={styles.content}>
      <LinearGradient colors={['#064D9D','#0879D8','#079EF0']} start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}} style={styles.banner}>
        <View style={styles.bannerLabel}><MaterialCommunityIcons name="school-outline" size={20} color={colors.white} />
          <Text style={styles.bannerLabelText}>ACADEMIC EXCELLENCE</Text></View>
        <Text style={styles.bannerTitle}>Smarter Academics. Seamless Attendance.</Text>
        <Text style={styles.bannerSubtitle}>{roleLabel(profile?.role ?? 'staff')} dashboard · Welcome, {profile?.name}</Text>
      </LinearGradient>
      <View style={styles.titleRow}><Text style={styles.heading}>Departments</Text><Text style={styles.hint}>{directory.length} available</Text></View>
      <AppTextInput value={query} onChangeText={setQuery} placeholder="Search department" accessibilityLabel="Search departments" />
      <View style={styles.departmentGrid}>{departments.map((department) => <DepartmentTile key={department.code} department={department}
        onPress={() => router.push({pathname: '/department/[code]', params: {code: department.code}})} />)}</View>
      {!departments.length ? <Text style={styles.text}>No matching departments.</Text> : null}
      <Text style={styles.hint}>{staff ? 'Choose any department. Your teaching assignments can include classes from different departments.' : 'Choose a department to view its classes and attendance.'}</Text>
      <PrimaryButton label="Refresh attendance" loading={loading} onPress={() => void load()} />
      {notice ? <Text accessibilityRole="alert" style={styles.success}>{notice}</Text> : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {loading ? <ActivityIndicator style={styles.loader} color={colors.green} /> : null}
      {!loading && !error && data && loadedSelection.current === `${selection.date}:${selection.hour}` ? <>
        <Text style={styles.text}>Hour {selection.hour}: {submitted} classes submitted · {Math.max(0, data.classes.length - submitted)} pending</Text>
        <Text style={styles.hint}>Counts below are for the selected date and hour.</Text>
        {principal ? <>
          <View style={styles.section}>
            <Text style={styles.heading}>Account approvals · {pending.length}</Text>
            {data.accountsError ? <ErrorMessage>{data.accountsError}</ErrorMessage> : null}
            <Text style={styles.text}>Choose Staff or HOD and assign access before approving.</Text>
            {!data.accountsError && !pending.length ? <AppCard><Text style={styles.text}>No accounts awaiting approval.</Text></AppCard> : null}
            {pending.map((user) => <AppCard key={user.id} style={styles.accountCard}>
              <View style={styles.titleRow}><Text style={styles.cardTitle}>{user.name}</Text><Text style={styles.roleBadge}>{roleLabel(user.role)}</Text></View>
              <Text style={styles.text}>{user.email}</Text><Text style={styles.hint}>Pending approval</Text>
              <PrimaryButton label="Choose role and approve" onPress={() => setAccount(user)} />
            </AppCard>)}
          </View>
          <View style={styles.section}>
            <Text style={styles.heading}>Account roles</Text>
            <AppTextInput value={accountSearch} onChangeText={setAccountSearch} placeholder="Search name, email, Staff or HOD" accessibilityLabel="Search accounts" />
            {reviewed.map((user) => <AppCard key={user.id} style={styles.accountCard}>
              <View style={styles.titleRow}><Text style={styles.cardTitle}>{user.name}</Text><Text style={styles.roleBadge}>{roleLabel(user.role)}</Text></View>
              <Text style={styles.text}>{user.email}</Text><Text style={styles.hint}>Account: {user.approval_status}</Text>
              {user.approval_status === 'approved' && user.role !== 'principal' ? <PrimaryButton label={user.role === 'hod' ? 'Assign department' : 'Assign class'} onPress={() => setAccount(user)} /> : null}
            </AppCard>)}
          </View>
        </> : null}
      </> : null}
    </Page>
    {data && principal ? <ApprovalSheet account={account} departments={data.departments} classes={data.assignmentClasses}
      onClose={() => setAccount(null)} onApproved={() => {setAccount(null); setNotice('Account access saved.'); void load();}} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  banner: {padding: 20, borderRadius: 22, marginTop: 8, gap: 12},
  bannerLabel: {alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 22, backgroundColor: '#FFFFFF33'},
  bannerLabelText: {fontSize: 11, fontWeight: '700', letterSpacing: 0.4, color: colors.white},
  bannerTitle: {fontSize: 26, lineHeight: 33, fontWeight: '800', color: colors.white},
  bannerSubtitle: {fontSize: 14, lineHeight: 21, color: '#E7F5FF'},
  departmentGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14},screen: {flex: 1, backgroundColor: colors.background}, content: {gap: 16, paddingTop: 6, paddingBottom: 36},
  intro: {gap: 6, marginBottom: 4}, title: {fontSize: 24, lineHeight: 32, fontWeight: '800', color: colors.ink},
  heading: {fontSize: 20, lineHeight: 27, fontWeight: '800', color: colors.ink}, text: {fontSize: 14, lineHeight: 21, color: colors.muted},
  hint: {fontSize: 12, lineHeight: 18, color: colors.muted}, filterCard: {padding: 18, gap: 16}, section: {gap: 14, marginTop: 8},
  departmentGroup: {gap: 12}, departmentCard: {padding: 20, gap: 16}, classList: {gap: 12, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: colors.paleGreen},
  classCard: {padding: 18, gap: 14}, cardTitle: {flexShrink: 1, fontSize: 17, lineHeight: 24, fontWeight: '700', color: colors.ink},
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap'},
  action: {fontSize: 13, lineHeight: 20, fontWeight: '700', color: colors.green}, sessionState: {fontSize: 12, lineHeight: 18, color: colors.muted},
  accountCard: {padding: 20, gap: 12}, roleBadge: {fontSize: 12, lineHeight: 18, fontWeight: '700', color: colors.green, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.paleGreen},
  success: {color: colors.green, fontSize: 14, lineHeight: 21}, loader: {marginVertical: 20},
});
