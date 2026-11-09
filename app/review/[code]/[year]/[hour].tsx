import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StudentTile } from '@/components/tiles';
import {
  AppHeader,
  Page,
  PrimaryButton,
  StatusSummary,
  SummaryLine,
  colors,
  statusCounts,
} from '@/components/ui';
import { HOURS, getClassroomLabel, getStudents } from '@/data/demoData';
import { resolveClassroom } from '@/navigation/routeParams';
import {
  getAttendance,
  getSubmission,
  submitAttendance,
} from '@/services/attendanceRepository';
import type {
  AttendanceMap,
  SubmissionReceipt,
} from '@/types/attendance';

export default function ReviewScreen() {
  const params = useLocalSearchParams<{
    code: string;
    year: string;
    hour: string;
  }>();
  const classroom = resolveClassroom(params.code, params.year);
  const hour = Array.isArray(params.hour) ? params.hour[0] : params.hour;
  const validHour = hour && HOURS.includes(hour) ? hour : '';
  const students = useMemo(
    () => (classroom ? getStudents(classroom) : []),
    [classroom?.department.code, classroom?.year],
  );
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!classroom || !validHour) {
        setError('Class or hour not found.');
        setLoading(false);
        return;
      }
      try {
        const [savedAttendance, savedReceipt] = await Promise.all([
          getAttendance(classroom, validHour),
          getSubmission(classroom, validHour),
        ]);
        if (active) {
          setAttendance(savedAttendance);
          setReceipt(savedReceipt);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not load attendance.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [classroom?.department.code, classroom?.year, validHour]);

  if (!classroom || !validHour) {
    return (
      <View style={styles.invalid}>
        <Text style={styles.errorText}>{error || 'Class or hour not found.'}</Text>
      </View>
    );
  }

  const counts = statusCounts(attendance);
  const unmarked = students.length - Object.keys(attendance).length;

  function confirmSubmission() {
    Alert.alert(
      receipt ? 'Already submitted' : 'Submit attendance?',
      receipt
        ? 'This class hour has already been submitted and is locked.'
        : 'This saves the attendance receipt on this device.',
      receipt
        ? [{text: 'View receipt', onPress: () => openReceipt()}]
        : [
            {text: 'Go back', style: 'cancel'},
            {text: 'Submit', onPress: () => void submit()},
          ],
    );
  }

  function openReceipt() {
    router.replace({
      pathname: '/receipt/[code]/[year]/[hour]',
      params: {
        code: classroom!.department.code,
        year: String(classroom!.year),
        hour: validHour,
      },
    });
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const saved = await submitAttendance(classroom!, validHour);
      setReceipt(saved);
      openReceipt();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not submit attendance.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Review attendance" onBack={() => router.back()} />
      <Page scroll style={styles.content}>
        <Text style={styles.title}>{getClassroomLabel(classroom)}</Text>
        <Text style={styles.subtitle}>
          {validHour} · {students.length} students
        </Text>
        <View style={styles.summary}>
          <StatusSummary counts={counts} />
        </View>
        <SummaryLine
          label="Students with a status"
          value={String(Object.keys(attendance).length)}
        />
        <SummaryLine
          label="Not marked"
          value={String(unmarked)}
          valueColor={unmarked === 0 ? colors.green : '#B54708'}
        />
        <Text style={styles.reviewHeading}>Student review</Text>
        <View style={styles.studentList}>
          {students.map((student) => (
            <StudentTile
              key={student.registerNumber}
              student={student}
              status={attendance[student.registerNumber]}
              compact
            />
          ))}
        </View>
        <Text style={styles.note}>
          {receipt
            ? 'This attendance has already been submitted. Staff editing is locked.'
            : 'Submitting saves a receipt on this device. Unmarked students remain unmarked.'}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.button}>
          <PrimaryButton
            icon={receipt ? 'receipt-text-outline' : 'cloud-check-outline'}
            label={receipt ? 'View submission receipt' : 'Submit attendance'}
            onPress={receipt ? openReceipt : confirmSubmission}
            disabled={submitting}
            loading={submitting}
          />
        </View>
      </Page>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {paddingTop: 10},
  title: {fontSize: 23, fontWeight: '800', color: colors.ink, marginTop: 16},
  subtitle: {fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 18},
  summary: {marginBottom: 10},
  reviewHeading: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 9,
  },
  studentList: {gap: 0},
  note: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10},
  errorText: {color: '#B42318', fontSize: 13, marginTop: 8},
  button: {marginTop: 16},
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  invalid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
});
