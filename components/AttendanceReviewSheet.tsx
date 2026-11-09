import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppCard, PrimaryButton, colors, statusLabels} from './ui';
import {AttendanceTotals, SelectionChip} from './ManagementControls';
import type {ClassAttendanceData} from '@/types/management';

export function AttendanceReviewSheet({data, busy, onClose, onUnmarked, onSubmit}: {
  data: ClassAttendanceData | null; busy: boolean; onClose: () => void; onUnmarked: () => void; onSubmit: () => void;
}) {
  const counts = {total_students: data?.students.length ?? 0, present: 0, absent: 0, od: 0, informed_leave: 0, unmarked: 0};
  for (const student of data?.students ?? []) {
    if (student.record) counts[student.record.status]++; else counts.unmarked++;
  }
  return <Modal visible={Boolean(data)} animationType="slide" onRequestClose={() => {if (!busy) onClose();}}>
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Review attendance</Text>
        <Text style={styles.text}>{data?.classroom.departments.name} · Year {data?.classroom.study_year} · {data?.classroom.section}</Text>
        <Text style={styles.text}>{data?.session?.attendance_date} · Hour {data?.session?.hour}</Text>
        <AppCard><AttendanceTotals counts={counts} /></AppCard>
        <Text style={styles.text}>{counts.total_students - counts.unmarked} of {counts.total_students} students marked.</Text>
        {counts.unmarked > 0 ? <>
          <Text style={styles.warning} accessibilityRole="alert">Mark the remaining {counts.unmarked} students before submitting.</Text>
          <SelectionChip label="Show unmarked students" selected={false} disabled={busy} onPress={onUnmarked} />
        </> : null}
        <Text style={styles.heading}>Student review</Text>
        {data?.students.map((student) => <AppCard key={student.id} style={styles.row}>
          <View style={styles.info}><Text style={styles.name}>{student.students.name}</Text><Text style={styles.register}>{student.students.register_number}</Text></View>
          <Text style={styles.status}>{student.record ? statusLabels[student.record.status] : 'Unmarked'}</Text>
        </AppCard>)}
        <Text style={styles.text}>Submit to share this attendance with management. After submission, staff must request management corrections.</Text>
        <PrimaryButton label="Submit attendance" onPress={onSubmit} disabled={busy || counts.unmarked > 0 || !counts.total_students} loading={busy} />
        <SelectionChip label="Back to marking" selected={false} disabled={busy} onPress={onClose} />
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, content: {padding: 24, gap: 16},
  title: {fontSize: 24, lineHeight: 32, fontWeight: '800', color: colors.ink}, heading: {fontSize: 18, fontWeight: '700', color: colors.ink},
  text: {fontSize: 14, lineHeight: 21, color: colors.muted}, warning: {fontSize: 14, lineHeight: 21, color: '#B42318'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12}, info: {flex: 1, gap: 4}, name: {fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.ink},
  register: {fontSize: 11, lineHeight: 17, color: colors.muted}, status: {width: 90, textAlign: 'center', color: colors.green, fontSize: 12, lineHeight: 18, fontWeight: '700'},
});
