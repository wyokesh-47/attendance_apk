import {router, useFocusEffect, useLocalSearchParams} from 'expo-router';
import {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppCard, AppHeader, AppTextInput, ErrorMessage, FieldLabel, Page, PrimaryButton, colors, statusLabels} from '@/components/ui';
import {AttendanceTotals, DateHourControls, SelectionChip} from '@/components/ManagementControls';
import {AttendanceReviewSheet} from '@/components/AttendanceReviewSheet';
import {useAuth} from '@/providers/AuthProvider';
import {collegeToday, getClassAttendance, saveAttendanceChange} from '@/services/managementRepository';
import {rpc} from '@/services/cloud';
import type {AttendanceStatus} from '@/types/attendance';
import type {ClassAttendanceData, CloudStudent} from '@/types/management';

const statuses: AttendanceStatus[] = ['present','absent','od','informed_leave'];
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export default function ClassAttendanceScreen() {
  const params = useLocalSearchParams<{classId: string; date: string; hour: string}>();
  const classId = first(params.classId) ?? '';
  const {profile} = useAuth();
  const manager = profile?.role === 'principal' || profile?.role === 'hod';
  const [selection, setSelection] = useState({date: first(params.date) ?? collegeToday(), hour: Number(first(params.hour) ?? 1)});
  const [data, setData] = useState<ClassAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unmarked' | AttendanceStatus>('all');
  const [editor, setEditor] = useState<{student: CloudStudent; snapshot: ClassAttendanceData} | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [reason, setReason] = useState('');
  const [editError, setEditError] = useState('');
  const [historyLimit, setHistoryLimit] = useState(20);
  const [review, setReview] = useState<ClassAttendanceData | null>(null);
  const sequence = useRef(0);
  const loadedSelection = useRef('');
  const load = useCallback(async (silent = false) => {
    const request = ++sequence.current;
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await getClassAttendance(classId, selection.date, selection.hour);
      if (sequence.current === request) {loadedSelection.current = `${classId}:${selection.date}:${selection.hour}`; setData(result);}
    } catch (failure) {if (sequence.current === request) setError(failure instanceof Error ? failure.message : 'Could not load this class.');}
    finally {if (sequence.current === request) setLoading(false);}
  }, [classId, selection.date, selection.hour, profile?.id]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => {sequence.current++;};
  }, [load]));
  useFocusEffect(useCallback(() => {
    if (busy || editor || review) return;
    const timer = setInterval(() => {void load(true);}, 20000);
    return () => clearInterval(timer);
  }, [load, busy, editor, review]));
  async function mutate(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {await action(); setNotice(success); await load();}
    catch (failure) {
      await load();
      setError(failure instanceof Error ? failure.message : 'Save could not be confirmed. Refresh before retrying.');
    } finally {setBusy(false);}
  }
  function edit(student: CloudStudent) {
    if (!data || busy || !data.session || (manager && data.session.status !== 'submitted')) return;
    setEditor({student, snapshot: data}); setStatus(student.record?.status ?? null); setReason(''); setEditError(''); setNotice('');
  }
  async function save() {
    if (!editor || !status || busy) return;
    setBusy(true); setEditError('');
    try {
      await saveAttendanceChange(editor.snapshot, editor.student.id, status, reason, manager);
      setEditor(null);
      setNotice(manager ? 'Attendance corrected. Totals and edit history have been updated.' : editor.snapshot.session?.status === 'submitted' ? 'Correction request sent to management.' : 'Attendance saved.');
      await load();
    } catch (failure) {
      // Retain the editor's original version. Never silently retry a conflicting correction.
      setEditError(failure instanceof Error ? failure.message : 'Could not confirm the save. Close and refresh before retrying.');
    } finally {setBusy(false);}
  }
  const counts = {total_students: data?.students.length ?? 0, present: 0, absent: 0, od: 0, informed_leave: 0, unmarked: 0};
  for (const student of data?.students ?? []) {
    if (student.record) counts[student.record.status]++; else counts.unmarked++;
  }
  const visible = data?.students.filter((item) =>
    `${item.students.name} ${item.students.register_number}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filter === 'all' || (filter === 'unmarked' ? !item.record : item.record?.status === filter))) ?? [];
  const submitted = data?.session?.status === 'submitted';
  const canEdit = Boolean(data?.session && (!manager || submitted));
  const needsReason = manager || editor?.snapshot.session?.status === 'submitted';
  const changes = data?.changes ?? [];
  const recordNames = new Map(data?.students.filter((item) => item.record).map((item) => [item.record!.id, item.students.name]));
  return <View style={styles.screen}>
    <AppHeader title="Class attendance" onBack={() => router.back()} onProfile={() => router.push('/profile')} />
    <Page scroll safeAreaEdges={['left','right','bottom']} style={styles.content}>
      <AppCard><DateHourControls date={selection.date} hour={selection.hour} disabled={busy}
        onChange={(date, hour) => {setSelection({date, hour}); setNotice(''); setFilter('all'); setEditor(null);}} /></AppCard>
      <PrimaryButton label="Refresh class" onPress={() => void load()} loading={loading} disabled={busy} />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {notice ? <Text accessibilityRole="alert" style={styles.success}>{notice}</Text> : null}
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {!loading && !error && data && loadedSelection.current === `${classId}:${selection.date}:${selection.hour}` ? <>
        <View style={styles.intro}>
          <Text style={styles.title}>{data.classroom.departments.name}</Text>
          <Text style={styles.subtitle}>Year {data.classroom.study_year} · Section {data.classroom.section}</Text>
          <Text style={styles.subtitle}>{selection.date} · Hour {selection.hour} · {submitted ? 'Submitted' : data.session ? 'Draft' : 'Not started'}</Text>
        </View>
        <AppCard><AttendanceTotals counts={counts} /></AppCard>
        {!manager && !data.session ? <>
          <PrimaryButton label="Mark attendance" disabled={busy || !counts.total_students || selection.date !== collegeToday()} onPress={() => void mutate(() => rpc('open_attendance_session', {
            p_class: classId, p_date: selection.date, p_hour: selection.hour}), 'Attendance draft started.')} />
          {selection.date !== collegeToday() ? <Text style={styles.subtitle}>New attendance can only be started for today. Existing drafts can be resumed.</Text> : null}
        </> : null}
        {manager && !submitted ? <Text style={styles.subtitle}>Staff must mark and submit this session before management can correct it.</Text> : null}
        {!manager && data.session && !submitted ? <>
          <SelectionChip label="Mark all Present" selected={false} disabled={busy} onPress={() => Alert.alert('Mark all Present?',
            'This replaces all current draft statuses with Present.', [{text: 'Cancel', style: 'cancel'}, {text: 'Mark all Present', onPress: () => void mutate(() => rpc('mark_all_present', {
              p_session: data.session!.id, p_expected_version: data.session!.version}), 'All students marked Present.')}])} />
          <Text style={styles.subtitle}>{counts.total_students - counts.unmarked} of {counts.total_students} students marked. {counts.unmarked ? 'Mark every student before submitting.' : 'Ready for submission.'}</Text>
          {counts.unmarked ? <SelectionChip label={`Show ${counts.unmarked} unmarked students`} selected={filter === 'unmarked'} disabled={busy} onPress={() => {setFilter('unmarked'); setQuery('');}} /> : null}
          <PrimaryButton label="Review attendance" disabled={busy || !counts.total_students} onPress={() => setReview(data)} />
        </> : null}
        {submitted ? <Text style={styles.subtitle}>{manager ? 'Tap a student to correct their attendance. Every correction requires a reason.' : 'Attendance is locked. Tap a student to request a correction.'}</Text> : null}
        {!manager && data.session && !submitted ? <Text style={styles.subtitle}>Tap a student below to choose Present, Absent, OD or Informed Leave.</Text> : null}
        <Text style={styles.heading}>Student members · {counts.total_students}</Text>
        <AppTextInput value={query} onChangeText={setQuery} placeholder="Search student name or register number" accessibilityLabel="Search students" />
        <View style={styles.wrap}>{(['all','unmarked',...statuses] as const).map((value) => <SelectionChip key={value}
          label={value === 'all' ? 'All students' : value === 'unmarked' ? 'Unmarked' : statusLabels[value]} selected={filter === value} disabled={busy} onPress={() => setFilter(value)} />)}</View>
        {!visible.length ? <Text style={styles.subtitle}>No students match this search or filter.</Text> : null}
        {visible.map((student) => <AppCard key={student.id} style={styles.studentCard} onPress={canEdit && !busy ? () => edit(student) : undefined}>
          <View style={styles.studentInfo}><Text style={styles.studentName}>{student.students.name}</Text><Text style={styles.register}>{student.students.register_number}</Text></View>
          <Text style={[styles.status, student.record?.status === 'absent' && styles.absent]}>{student.record ? statusLabels[student.record.status] : 'Unmarked'}</Text>
        </AppCard>)}
        <Text style={styles.heading}>Correction history · {changes.length}</Text>
        {!changes.length ? <Text style={styles.subtitle}>No management corrections for this session.</Text> : null}
        {changes.slice(0, historyLimit).map((change) => <AppCard key={change.id} style={styles.historyCard}>
          <Text style={styles.studentName}>{recordNames.get(change.record_id) ?? 'Student'}</Text>
          <Text style={styles.subtitle}>{statusLabels[change.old_status]} → {statusLabels[change.new_status]}</Text>
          <Text style={styles.subtitle}>{change.reason}</Text>
          <Text style={styles.register}>{new Date(change.changed_at).toLocaleString()} · Editor {change.changed_by}</Text>
        </AppCard>)}
        {changes.length > historyLimit ? <SelectionChip label="Show older corrections" selected={false} onPress={() => setHistoryLimit((value) => value + 20)} /> : null}
      </> : null}
    </Page>
    <AttendanceReviewSheet data={review} busy={busy} onClose={() => setReview(null)}
      onUnmarked={() => {setReview(null); setFilter('unmarked'); setQuery('');}}
      onSubmit={() => {
        if (!review?.session) return;
        const session = review.session;
        setReview(null);
        void mutate(() => rpc('submit_attendance', {p_session: session.id, p_expected_version: session.version}), 'Attendance submitted to management.');
      }} />
    <Modal visible={Boolean(editor)} animationType="slide" onRequestClose={() => {if (!busy) setEditor(null);}}>
      <SafeAreaView style={styles.screen}><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.editor}>
          <Text style={styles.title}>{manager ? 'Correct attendance' : needsReason ? 'Request correction' : 'Mark attendance'}</Text>
          <Text style={styles.studentName}>{editor?.student.students.name}</Text>
          <Text style={styles.subtitle}>{editor?.student.students.register_number}</Text>
          <Text style={styles.subtitle}>Current: {editor?.student.record ? statusLabels[editor.student.record.status] : 'Unmarked'}</Text>
          <FieldLabel>New attendance status</FieldLabel>
          <View style={styles.wrap}>{statuses.map((value) => <SelectionChip key={value} label={statusLabels[value]} selected={status === value} disabled={busy} onPress={() => setStatus(value)} />)}</View>
          {needsReason ? <>
            <FieldLabel>Reason for correction (required)</FieldLabel>
            <AppTextInput value={reason} onChangeText={setReason} editable={!busy} multiline maxLength={1000} style={styles.reason}
              accessibilityLabel="Correction reason" placeholder="Explain why this attendance needs changing" />
          </> : null}
          {editError ? <ErrorMessage>{editError}</ErrorMessage> : null}
          <PrimaryButton label={manager ? 'Save correction' : needsReason ? 'Send correction request' : 'Save attendance'} onPress={() => void save()} loading={busy}
            disabled={!status || busy || (Boolean(needsReason) && (reason.trim().length < 3 || status === editor?.student.record?.status))} />
          <SelectionChip label="Close" selected={false} onPress={() => setEditor(null)} disabled={busy} />
        </ScrollView>
      </KeyboardAvoidingView></SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, content: {gap: 16, paddingTop: 16, paddingBottom: 36},
  intro: {gap: 5}, title: {fontSize: 24, lineHeight: 32, fontWeight: '800', color: colors.ink}, heading: {fontSize: 19, lineHeight: 26, fontWeight: '700', color: colors.ink, marginTop: 12},
  subtitle: {fontSize: 14, lineHeight: 21, color: colors.muted}, success: {fontSize: 14, lineHeight: 21, color: colors.green}, loader: {marginVertical: 20},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8}, studentCard: {flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12}, studentInfo: {flex: 1, minWidth: 0, gap: 5},
  studentName: {fontSize: 14, lineHeight: 21, fontWeight: '700', color: colors.ink}, register: {fontSize: 11, lineHeight: 17, color: colors.muted},
  status: {width: 88, textAlign: 'center', fontSize: 12, lineHeight: 18, fontWeight: '700', padding: 8, borderRadius: 10, backgroundColor: colors.paleGreen, color: colors.green}, absent: {color: '#B42318', backgroundColor: '#FFF1F0'},
  historyCard: {gap: 8}, editor: {padding: 24, gap: 18}, reason: {minHeight: 110, textAlignVertical: 'top'},
});
