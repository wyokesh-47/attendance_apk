import {router, useLocalSearchParams} from 'expo-router';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppCard, AppHeader, AppTextInput, ErrorMessage, Page, PrimaryButton, colors} from '@/components/ui';
import {useAuth} from '@/providers/AuthProvider';
import {DEPARTMENTS, getStudents, searchStudents, STUDY_YEARS} from '@/data/demoData';
import {resolveClassroom, firstParam} from '@/navigation/routeParams';

export default function MembersPreview() {
  const {profile} = useAuth();
  const params = useLocalSearchParams<{code: string; year: string}>();
  const code = firstParam(params.code).trim().toUpperCase();
  const yearParam = firstParam(params.year);
  const classroom = resolveClassroom(code, yearParam);
  const year = Number(yearParam);
  const cloudAttendanceRequired = code === 'BCA' && year === 2;
  const [query, setQuery] = useState('');
  const students = classroom ? getStudents(classroom) : [];
  const visible = searchStudents(students, query);
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else if (DEPARTMENTS.some((department) => department.code === code)) {
      router.replace({pathname: '/department/[code]', params: {code}});
    } else {
      router.replace(profile?.role === 'staff' ? '/home' : '/management');
    }
  }
  return <View style={styles.screen}>
    <AppHeader title="Student members" onBack={goBack} />
    <Page scroll safeAreaEdges={['left','right','bottom']} style={styles.content}>
      {classroom && cloudAttendanceRequired ? <>
        <Text style={styles.title}>{`${classroom.department.name} · ${STUDY_YEARS[year - 1]}`}</Text>
        <ErrorMessage>BCA Second Year · Section A must use shared cloud attendance. Open it from the department page after the Principal approves your Staff account.</ErrorMessage>
        <PrimaryButton label="Open shared BCA class" onPress={() => router.replace({pathname: '/department/[code]', params: {code}})} />
      </> : classroom ? <>
        <Text style={styles.title}>{`${classroom.department.name} · ${STUDY_YEARS[year - 1]}`}</Text>
        <Text style={styles.subtitle}>{students.length} students · Saved app roster</Text>
        <AppCard style={styles.preview}>
          <Text style={styles.previewTitle}>Saved app roster</Text>
          <Text style={styles.subtitle}>This roster is not linked to shared attendance for this account. Staff can try marking on this device below. Those marks and receipts stay on this phone and do not appear on Principal or HOD dashboards.</Text>
          {students.some((student) => student.name.startsWith('Demo ')) ? <Text style={styles.subtitle}>This class contains generated sample student records.</Text> : null}
        </AppCard>
        {profile?.role === 'staff' ? <PrimaryButton label="Mark attendance (device only)" icon="clipboard-check-outline"
          onPress={() => router.push({pathname: '/class/[code]/[year]', params: {code: classroom.department.code, year: String(year)}})} /> : null}
        <AppTextInput value={query} onChangeText={setQuery} placeholder="Search name or register number" accessibilityLabel="Search student members" />
        {!visible.length ? <Text style={styles.subtitle}>No students found.</Text> : null}
        {visible.map((student, index) => <AppCard key={student.registerNumber} style={styles.row}>
          <View style={styles.badge}><Text style={styles.number}>{index + 1}</Text></View>
          <View style={styles.student}><Text style={styles.name}>{student.name}</Text><Text style={styles.register}>{student.registerNumber}</Text></View>
        </AppCard>)}
      </> : <>
        <Text style={styles.title}>Class details unavailable</Text>
        <ErrorMessage>The selected class could not be identified. Go back and choose the department and year again.</ErrorMessage>
        <PrimaryButton label="Back to departments" onPress={goBack} />
      </>}
    </Page>
  </View>;
}
const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, content: {gap: 14, paddingTop: 20, paddingBottom: 32},
  title: {fontSize: 23, lineHeight: 31, fontWeight: '800', color: colors.ink}, subtitle: {fontSize: 14, lineHeight: 21, color: colors.muted},
  preview: {backgroundColor: colors.paleGreen, padding: 18, gap: 10}, previewTitle: {fontSize: 16, lineHeight: 23, fontWeight: '700', color: colors.green},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14}, badge: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleGreen},
  number: {fontWeight: '700', color: colors.green}, student: {flex: 1, gap: 5}, name: {fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.ink}, register: {fontSize: 12, lineHeight: 18, color: colors.muted},
});
