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
import { HOURS, getClassroomLabel, getHourTimingStatus, getStudents } from '@/data/demoData';
import {firstParam, resolveClassroom} from '@/navigation/routeParams';
import {
  getAttendance,
  getSubmission,
  submitAttendance,
} from '@/services/attendanceRepository';
import {cloudAttendanceMap, cloudStudents, collegeToday, getClassAttendance, submitAttendanceSession} from '@/services/managementRepository';
import type {
  AttendanceMap,
  SubmissionReceipt,
} from '@/types/attendance';
import type {ClassAttendanceData} from '@/types/management';

export default function ReviewScreen() {
  const params = useLocalSearchParams<{
    code: string;
    year: string;
    hour: string;
    classId?: string;
    date?: string;
  }>();
  const classroom = resolveClassroom(params.code, params.year);
  const hour = firstParam(params.hour);
  const validHour = hour && HOURS.includes(hour) ? hour : '';
  const cloudBacked = classroom?.department.code === 'BCA' && classroom.year === 2;
  const classId = firstParam(params.classId);
  const attendanceDate = firstParam(params.date) || collegeToday();
  const localStudents = useMemo(
    () => (classroom ? getStudents(classroom) : []),
    [classroom?.department.code, classroom?.year],
  );
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [cloudData, setCloudData] = useState<ClassAttendanceData | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const students = cloudBacked ? (cloudData ? cloudStudents(cloudData) : []) : localStudents;
  const attendanceSubmitted = cloudBacked
    ? cloudData?.session?.status === 'submitted'
    : receipt !== null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setCloudData(null);
    setAttendance({});
    setReceipt(null);
    async function load() {
      if (!classroom || !validHour) {
        setError('Class or hour not found.');
        setLoading(false);
        return;
      }
      if (cloudBacked) {
        if (!classId) {
          setError('Open this class from the BCA Second Year department page after Staff approval.');
          setLoading(false);
          return;
        }
        try {
          const result = await getClassAttendance(classId, attendanceDate, Number(validHour.replace('Hour ', '')));
          if (active) {
            setCloudData(result);
            setAttendance(cloudAttendanceMap(result));
          }
        } catch (reason) {
          if (active) setError(reason instanceof Error ? reason.message : 'Could not load cloud attendance.');
        } finally {
          if (active) setLoading(false);
        }
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
  }, [attendanceDate, classId, classroom?.department.code, classroom?.year, cloudBacked, validHour]);

  if (!classroom || !validHour) {
    return (
      <View style={styles.invalid}>
        <Text style={styles.errorText}>{error || 'Class or hour not found.'}</Text>
      </View>
    );
  }

  const counts = statusCounts(attendance);
  const unmarked = students.length - Object.keys(attendance).length;
  const timing = getHourTimingStatus(validHour);
  const isExpired = timing?.isExpired ?? false;

  function confirmSubmission() {
    if (!attendanceSubmitted && (unmarked > 0 || error || isExpired)) return;
    Alert.alert(
      attendanceSubmitted ? 'Already submitted' : 'Submit attendance?',
      attendanceSubmitted
        ? 'This class hour has already been submitted and is locked.'
        : cloudBacked ? 'Submit this attendance to the shared Principal dashboard?' : 'This saves the attendance receipt on this device.',
      attendanceSubmitted
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
        ...(cloudBacked ? {classId, date: attendanceDate} : {}),
      },
    });
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      if (cloudBacked) {
        if (!cloudData?.session) throw new Error('Start attendance by marking a student before submitting.');
        const submittedSession = await submitAttendanceSession(cloudData.session);
        setCloudData({...cloudData, session: submittedSession});
      } else {
        setReceipt(await submitAttendance(classroom!, validHour));
      }
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
        {!attendanceSubmitted && unmarked > 0 ? (
          <View style={styles.button}>
            <Text style={styles.errorText} accessibilityRole="alert">
              {students.length - unmarked} of {students.length} students marked.
              Please mark the remaining {unmarked} before submitting.
            </Text>
            <PrimaryButton
              label="Show unmarked students"
              onPress={() => router.replace({
                pathname: '/attendance/[code]/[year]/[hour]',
                params: {code: classroom.department.code, year: String(classroom.year), hour: validHour, unmarked: '1',
                  ...(cloudBacked ? {classId, date: attendanceDate} : {})},
              })}
            />
          </View>
        ) : null}
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
          {attendanceSubmitted
            ? 'This attendance has already been submitted. Staff editing is locked.'
            : isExpired
              ? 'Attendance window has ended. Attendance can no longer be submitted.'
              : cloudBacked ? 'Mark every student before submitting. Draft marks are saved to the shared cloud session.' : 'Mark every student before submitting. Your draft is saved on this device.'}
        </Text>
        {isExpired && !attendanceSubmitted ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            Attendance time for {validHour} has ended. Submissions are closed.
          </Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.button}>
          <PrimaryButton
            icon={attendanceSubmitted ? 'receipt-text-outline' : isExpired ? 'lock-outline' : 'cloud-check-outline'}
            label={attendanceSubmitted ? 'View submission receipt' : isExpired ? 'Attendance time ended' : 'Submit attendance'}
            onPress={attendanceSubmitted ? openReceipt : confirmSubmission}
            disabled={submitting || (!attendanceSubmitted && (unmarked > 0 || Boolean(error) || isExpired))}
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
