import {router, useFocusEffect, useLocalSearchParams} from 'expo-router';
import {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {AppCard, AppHeader, ErrorMessage, Page, PrimaryButton, colors} from '@/components/ui';
import {YearTile} from '@/components/tiles';
import {DEPARTMENTS, STUDY_YEARS, getStudents} from '@/data/demoData';
import {collegeToday, getDashboard} from '@/services/managementRepository';
import {useAuth} from '@/providers/AuthProvider';
import type {DashboardData} from '@/types/management';
import {getVisibleStudyYears, isStaffBcaDemo} from '@/navigation/routeParams';

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default function DepartmentMembersScreen() {
  const params = useLocalSearchParams<{code: string; date?: string; hour?: string}>();
  const {profile} = useAuth();
  const code = first(params.code);
  const selectedDate = first(params.date) ?? collegeToday();
  const selectedHour = Number(first(params.hour) ?? 1);
  const department = DEPARTMENTS.find((item) => item.code === code);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {const result = await getDashboard(selectedDate, selectedHour, false); if (sequence.current === request) setData(result);}
    catch (failure) {if (sequence.current === request) {setData(null); setError(failure instanceof Error ? failure.message : 'Could not load shared classes.');}}
    finally {if (sequence.current === request) setLoading(false);}
  }, [code, selectedDate, selectedHour]);
  useFocusEffect(useCallback(() => {void load(); return () => {sequence.current++;};}, [load]));
  const cloudDepartment = data?.departments.find((item) => item.code === code);
  const resolved = department ?? (cloudDepartment ? {...cloudDepartment, abbreviation: cloudDepartment.code} : null);
  const classes = data?.classes.filter((item) => item.departments.code === code) ?? [];
  const staffBcaDemo = isStaffBcaDemo(code, profile?.role);
  const years = getVisibleStudyYears(classes.map((item) => item.study_year));
  const staffBcaClass = classes.find((item) => item.study_year === 2 && item.section === 'A');
  return <View style={styles.screen}>
    <AppHeader title={resolved?.name ?? code ?? 'Department'} onBack={() => router.back()} />
    <Page scroll safeAreaEdges={['left','right','bottom']} style={styles.content}>
      <Text style={styles.title}>Choose a year</Text>
      <Text style={styles.text}>Open a class to see its student members and attendance.</Text>
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {!loading && resolved ? years.map((year) => {
        const linked = classes.filter((item) => item.study_year === year);
        if (staffBcaDemo && year === 2) return staffBcaClass && department ? <YearTile key={year}
          classroom={{department, year: 2}}
          count={data?.enrollmentCounts[staffBcaClass.id] ?? 0}
          onPress={() => router.push({pathname: '/class/[code]/[year]', params: {
            code: 'BCA', year: '2', classId: staffBcaClass.id, date: selectedDate,
          }})}
        /> : <AppCard key={year} style={styles.classCard}>
          <Text style={styles.heading}>Second Year</Text>
          <Text style={styles.text}>The shared Second Year class is unavailable. Ask the Principal to approve your Staff account.</Text>
        </AppCard>;
        if (linked.length) return <View key={year} style={styles.group}>
          <Text style={styles.heading}>{STUDY_YEARS[year - 1] ?? `Year ${year}`}</Text>
          {linked.map((classroom) => <AppCard key={classroom.id} style={styles.classCard} onPress={() => code === 'BCA' && year === 2 && profile?.role === 'staff'
            ? router.push({pathname: '/class/[code]/[year]', params: {code: 'BCA', year: '2', classId: classroom.id, date: selectedDate}})
            : router.push({pathname: '/class-attendance' as any, params: {classId: classroom.id, date: selectedDate, hour: String(selectedHour)}})}>
            <Text style={styles.heading}>Section {classroom.section}</Text>
            <Text style={styles.text}>{data?.enrollmentCounts[classroom.id] ?? 0} student members</Text>
            {code === 'BCA' && year === 2 && !data?.enrollmentCounts[classroom.id] ?
              <Text style={styles.preview}>The shared student roster is unavailable, so attendance cannot be submitted.</Text> : null}
            <Text style={styles.link}>Open {selectedDate} · Hour {selectedHour} attendance</Text>
          </AppCard>)}
          {(code !== 'BCA' || year !== 2) && department && year <= 3 &&
            linked.every((item) => !data?.enrollmentCounts[item.id]) ?
              <PrimaryButton label="View saved roster preview" onPress={() => router.push({pathname: '/members' as any, params: {code: department.code, year: String(year)}})} /> : null}
        </View>;
        if (!department || year > 3) return null;
        if (code === 'BCA' && year === 2) return <AppCard key={year} style={styles.classCard}>
          <Text style={styles.heading}>Shared class not available</Text>
          <Text style={styles.text}>BCA Second Year · Section A attendance is available only through the shared cloud class. Ask the Principal to approve your Staff account; access is granted automatically.</Text>
        </AppCard>;
        const classroom = {department, year};
        return <View key={year} style={styles.group}>
          <YearTile classroom={classroom} count={getStudents(classroom).length} onPress={() => router.push({pathname: '/members' as any, params: {code: department.code, year: String(year)}})} />
          <Text style={styles.preview}>Saved roster preview · No shared class linked to this account</Text>
        </View>;
      }) : null}
      {!loading && !resolved ? <Text style={styles.text}>Department not found.</Text> : null}
      <PrimaryButton label="Refresh shared classes" onPress={() => void load()} loading={loading} />
    </Page>
  </View>;
}
const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, content: {gap: 16, paddingTop: 24, paddingBottom: 32},
  title: {fontSize: 25, lineHeight: 33, fontWeight: '800', color: colors.ink}, text: {fontSize: 14, lineHeight: 21, color: colors.muted},
  heading: {fontSize: 17, lineHeight: 24, fontWeight: '700', color: colors.ink}, group: {gap: 10, marginTop: 4},
  classCard: {padding: 18, gap: 10}, link: {color: colors.green, fontWeight: '700', fontSize: 14}, preview: {fontSize: 12, lineHeight: 18, color: colors.muted, paddingHorizontal: 8}, loader: {marginVertical: 16},
});
