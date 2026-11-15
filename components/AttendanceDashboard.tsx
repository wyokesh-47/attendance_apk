import {router, useFocusEffect, type Href} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, View, type ScrollViewInstance} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {DepartmentTile} from './tiles';
import {DEPARTMENTS, formatLiveDate} from '@/data/demoData';
import {AppCard, AppHeader, AppTextInput, ErrorMessage, Page, PrimaryButton, colors} from './ui';
import {SelectionChip} from './ManagementControls';
import {ApprovalSheet} from './ApprovalSheet';
import {useAuth} from '@/providers/AuthProvider';
import {collegeAttendanceCounts, collegeToday, departmentAttendanceCounts, getDashboard, rejectPendingAccount} from '@/services/managementRepository';
import type {DashboardData, ManagedAccount} from '@/types/management';

function roleLabel(role: string) {return role === 'hod' ? 'HOD' : role === 'principal' ? 'Principal' : 'Staff';}
export default function AttendanceDashboard() {
  const {profile} = useAuth();
  const principal = profile?.role === 'principal';
  const staff = profile?.role === 'staff';
  const [liveDate, setLiveDate] = useState(() => new Date());
  const [today, setToday] = useState(() => collegeToday());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(new Date());
      setToday(collegeToday());
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [account, setAccount] = useState<ManagedAccount | null>(null);
  const [rejectingAccountId, setRejectingAccountId] = useState<string | null>(null);
  const [accountActionError, setAccountActionError] = useState('');
  const sequence = useRef(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const loadedDate = useRef('');
  const load = useCallback(async (silent = false) => {
    const request = ++sequence.current;
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await getDashboard(today, 1, principal);
      if (sequence.current === request) {loadedDate.current = today; setData(result);}
    } catch (reason) {
      if (sequence.current === request) setError(reason instanceof Error ? reason.message : 'Could not load attendance.');
    } finally {if (sequence.current === request) setLoading(false);}
  }, [today, principal, profile?.id]);
  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => {void load(true);}, principal ? 10000 : 30000);
    return () => {sequence.current++; clearInterval(timer);};
  }, [load, principal]));
  const pending = data?.accounts.filter((item) => item.approval_status === 'pending') ?? [];
  const directory = data?.departments.length ? data.departments.map((item) => ({...item,
    abbreviation: DEPARTMENTS.find((known) => known.code === item.code)?.abbreviation ?? item.code})) : DEPARTMENTS;
  const departments = directory.filter((item) => (item.name + ' ' + item.code).toLowerCase().includes(query.trim().toLowerCase()));
  const hasCurrentData = Boolean(data && loadedDate.current === today);
  const collegeCounts = data ? collegeAttendanceCounts(data) : null;
  const reviewed = data?.accounts.filter((item) => item.approval_status !== 'pending' && item.approval_status !== 'rejected' &&
    `${item.name} ${item.email} ${roleLabel(item.role)}`.toLowerCase().includes(accountSearch.trim().toLowerCase())) ?? [];
  const submittedToday = data?.dailySummaries.filter((item) => item.status === 'submitted' && data.classes.some((c) => c.id === item.class_id)).length ?? 0;
  const submittedThisHour = data?.summaries.filter((item) => item.status === 'submitted' && data.classes.some((c) => c.id === item.class_id)).length ?? 0;
  async function rejectAccount(user: ManagedAccount) {
    if (rejectingAccountId) return;
    setRejectingAccountId(user.id);
    setAccountActionError('');
    try {
      await rejectPendingAccount(user.id);
      setNotice(`${user.name}'s account was rejected.`);
      void load(true);
    } catch (reason) {
      setAccountActionError(reason instanceof Error ? reason.message : 'Could not reject this account.');
    } finally {
      setRejectingAccountId(null);
    }
  }
  function confirmRejectAccount(user: ManagedAccount) {
    Alert.alert('Reject account?', `Reject ${user.name}'s account? This marks it as rejected and deactivates its access.`, [
      {text: 'Keep account', style: 'cancel'},
      {text: 'Reject account', style: 'destructive', onPress: () => {void rejectAccount(user);}},
    ]);
  }
  return <View style={styles.screen}>
    <AppHeader dashboard title="" onProfile={() => router.push('/profile')} />
    <Page scroll scrollRef={scrollRef} safeAreaEdges={['left','right','bottom']} style={styles.content}>
      <LinearGradient colors={['#064D9D','#0879D8','#079EF0']} start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}} style={styles.banner}>
        <View style={styles.bannerLabel}><MaterialCommunityIcons name="school-outline" size={20} color={colors.white} />
          <Text style={styles.bannerLabelText}>ACADEMIC EXCELLENCE</Text></View>
        <Text style={styles.bannerTitle}>Smarter Academics. Seamless Attendance.</Text>
        <Text style={styles.bannerSubtitle}>{roleLabel(profile?.role ?? 'staff')} dashboard · Welcome, {profile?.name}</Text>
      </LinearGradient>
      {principal ? <View style={styles.overview}>
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Today's attendance</Text>
          <View style={styles.liveDateBadge}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={colors.green} />
            <Text style={styles.liveDateText}>{formatLiveDate(liveDate)}</Text>
          </View>
        </View>
        {loading ? <ActivityIndicator style={styles.loader} color={colors.green} /> : null}
        {hasCurrentData && collegeCounts ? <>
          <View style={styles.totalStudentsCard}>
            <View style={styles.totalStudentsIcon}>
              <MaterialCommunityIcons name="account-group-outline" size={21} color={colors.green} />
            </View>
            <Text style={styles.totalStudentsLabel}>Total students</Text>
            <Text style={styles.totalStudentsValue}>{collegeCounts.total_students}</Text>
          </View>
          <View style={styles.metricGrid}>{[
            {label: 'Present', value: collegeCounts.present, color: '#1769AA', background: '#E8F3FA'},
            {label: 'Absent', value: collegeCounts.absent, color: '#B42318', background: '#FCE8E8'},
            {label: 'OD', value: collegeCounts.od, color: '#A64B08', background: '#F9EEE5'},
            {label: 'Informed Leave', value: collegeCounts.informed_leave, color: '#6941C6', background: '#F0EAFB'},
          ].map((item) => <View key={item.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, {color: item.color, backgroundColor: item.background}]}>{item.value}</Text>
            <Text style={[styles.metricLabel, {color: item.color}]}>{item.label}</Text>
          </View>)}</View>
          <View style={styles.submittedRecords}>
            <Text style={styles.submittedRecordsLabel}>Total submitted records</Text>
            <Text style={styles.submittedRecordsValue}>{submittedToday}</Text>
          </View>
          <Text style={styles.hint}>Attendance totals include each submitted hour. Student count is the active enrollment count.</Text>
        </> : null}
      </View> : null}
      <View style={styles.titleRow}>
        <View style={styles.departmentsHeaderLeft}>
          <Text style={styles.heading}>Departments</Text>
          {!principal ? <View style={styles.liveDateBadge}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={colors.green} />
            <Text style={styles.liveDateText}>{formatLiveDate(liveDate)}</Text>
          </View> : null}
        </View>
        <Text style={styles.hint}>{directory.length} available</Text>
      </View>
      <AppTextInput value={query} onChangeText={setQuery} placeholder="Search department" accessibilityLabel="Search departments" />
      <View style={styles.departmentGrid}>{departments.map((department) => <DepartmentTile key={department.code} department={department}
        attendanceCounts={principal && hasCurrentData && data ? departmentAttendanceCounts(department.code, data) : undefined}
        onPress={() => router.push({pathname: '/department/[code]', params: {
          code: department.code, date: today, hour: '1',
        }} as Href)} />)}</View>
      {!departments.length ? <Text style={styles.text}>No matching departments.</Text> : null}
      <Text style={styles.hint}>{staff ? 'Choose any department. Your teaching assignments can include classes from different departments.' : 'Choose a department to view its classes and attendance.'}</Text>
      <PrimaryButton label="Refresh attendance" loading={loading} onPress={() => void load()} />
      {notice ? <Text accessibilityRole="alert" style={styles.success}>{notice}</Text> : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {loading && !principal ? <ActivityIndicator style={styles.loader} color={colors.green} /> : null}
      {!loading && !error && data && loadedDate.current === today ? <>
        {!principal ? <Text style={styles.text}>Hour 1: {submittedThisHour} classes submitted · {Math.max(0, data.classes.length - submittedThisHour)} pending</Text> : null}
        {principal ? <Text style={styles.hint}>Department totals include every submitted hour for today. Open a class to review another hour.</Text> : null}
        {principal ? <>
          <View style={styles.section}>
            <Text style={styles.heading}>Account approvals · {pending.length}</Text>
            {data.accountsError ? <ErrorMessage>{data.accountsError}</ErrorMessage> : null}
            <Text style={styles.text}>Choose Staff or HOD and assign access before approving.</Text>
            {!data.accountsError && !pending.length ? <AppCard><Text style={styles.text}>No accounts awaiting approval.</Text></AppCard> : null}
            {accountActionError ? <ErrorMessage>{accountActionError}</ErrorMessage> : null}
            {pending.map((user) => <AppCard key={user.id} style={styles.accountCard}>
              <View style={styles.titleRow}><Text style={styles.cardTitle}>{user.name}</Text><Text style={styles.roleBadge}>{roleLabel(user.role)}</Text></View>
              <Text style={styles.text}>{user.email}</Text><Text style={styles.hint}>Pending approval</Text>
              <PrimaryButton label="Choose role and approve" onPress={() => setAccount(user)} disabled={Boolean(rejectingAccountId)} />
              <SelectionChip label={rejectingAccountId === user.id ? 'Rejecting…' : 'Reject account'} selected={false}
                onPress={() => confirmRejectAccount(user)} disabled={Boolean(rejectingAccountId)} />
            </AppCard>)}
          </View>
          <View style={styles.section}>
            <Text style={styles.heading}>Account roles</Text>
            <AppTextInput value={accountSearch} onChangeText={setAccountSearch} placeholder="Search name, email, Staff or HOD" accessibilityLabel="Search accounts" />
            {reviewed.map((user) => <AppCard key={user.id} style={styles.accountCard}>
              <View style={styles.titleRow}><Text style={styles.cardTitle}>{user.name}</Text><Text style={styles.roleBadge}>{roleLabel(user.role)}</Text></View>
              <Text style={styles.text}>{user.email}</Text><Text style={styles.hint}>Account: {user.approval_status}</Text>
              {user.approval_status === 'approved' && user.role === 'hod' ? <PrimaryButton label="Assign department" onPress={() => setAccount(user)} /> : null}
            </AppCard>)}
          </View>
        </> : null}
      </> : null}
    </Page>
    {data && principal ? <ApprovalSheet account={account} departments={data.departments}
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
  departmentsHeaderLeft: {flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap'},
  liveDateBadge: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.paleGreen, borderWidth: 1, borderColor: '#D8EBFA'},
  liveDateText: {fontSize: 12, fontWeight: '700', color: colors.green},
  action: {fontSize: 13, lineHeight: 20, fontWeight: '700', color: colors.green}, sessionState: {fontSize: 12, lineHeight: 18, color: colors.muted},
  accountCard: {padding: 20, gap: 12}, roleBadge: {fontSize: 12, lineHeight: 18, fontWeight: '700', color: colors.green, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.paleGreen},
  success: {color: colors.green, fontSize: 14, lineHeight: 21}, loader: {marginVertical: 20},
  overview: {gap: 12}, totalStudentsCard: {minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: '#EAF6FF'},
  totalStudentsIcon: {width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCEFFA'},
  totalStudentsLabel: {flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink},
  totalStudentsValue: {fontSize: 25, lineHeight: 32, fontWeight: '800', color: colors.green},
  metricGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12},
  metricCard: {width: '48%', minHeight: 112, padding: 14, gap: 10, borderRadius: 20, borderWidth: 1, borderColor: '#EAECF0', backgroundColor: colors.white},
  metricValue: {width: 48, height: 50, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', fontSize: 24, lineHeight: 50, fontWeight: '800', overflow: 'hidden'},
  metricLabel: {fontSize: 13, lineHeight: 18, fontWeight: '700'},
  submittedRecords: {minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: '#EAF6FF'},
  submittedRecordsLabel: {fontSize: 13, fontWeight: '600', color: colors.muted},
  submittedRecordsValue: {fontSize: 18, fontWeight: '800', color: colors.green},
});
