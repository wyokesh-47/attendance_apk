import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
import { firstParam, resolveClassroom } from '@/navigation/routeParams';
import { getSubmission } from '@/services/attendanceRepository';
import {cloudAttendanceMap, cloudStudents, collegeToday, getClassAttendance} from '@/services/managementRepository';
import type { SubmissionReceipt } from '@/types/attendance';
import type {ClassAttendanceData} from '@/types/management';

export default function ReceiptScreen() {
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
  const [cloudData, setCloudData] = useState<ClassAttendanceData | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setCloudData(null);
    setReceipt(null);
    if (!classroom || !validHour) {
      setError('This receipt could not be found.');
      setLoading(false);
      return () => {
        active = false;
      };
    }
    if (cloudBacked) {
      if (!classId) {
        setError('Open this class from the BCA Second Year department page after Staff approval.');
        setLoading(false);
        return () => {active = false;};
      }
      void getClassAttendance(classId, attendanceDate, Number(validHour.replace('Hour ', '')))
        .then((result) => {
          if (active) {
            if (result.session?.status === 'submitted') setCloudData(result);
            else setError('This cloud attendance session has not been submitted.');
          }
        })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'Could not load cloud submission.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {active = false;};
    }
    void getSubmission(classroom, validHour)
      .then((saved) => {
        if (active) {
          if (saved) setReceipt(saved);
          else setError('This receipt could not be found.');
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not load receipt.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attendanceDate, classId, classroom?.department.code, classroom?.year, cloudBacked, validHour]);

  if (!classroom || !validHour) {
    return <Problem message={error || 'This receipt could not be found.'} />;
  }
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }
  if (!receipt && !cloudData) {
    return <Problem message={error || 'This receipt could not be found.'} />;
  }

  const cloudAttendance = cloudData ? cloudAttendanceMap(cloudData) : null;
  const students = cloudData ? cloudStudents(cloudData) : getStudents(classroom);
  const total = students.length;
  const counts = cloudAttendance
    ? statusCounts(cloudAttendance)
    : {present: receipt!.present, absent: receipt!.absent, od: receipt!.od, informed_leave: receipt!.informedLeave};
  const submittedTime = cloudData?.session?.submitted_at
    ? new Intl.DateTimeFormat('en-IN', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'}).format(new Date(cloudData.session.submitted_at))
    : receipt ? new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'}).format(new Date(receipt.submittedAt)) : null;

  return (
    <View style={styles.screen}>
      <Page scroll style={styles.content}>
        <View style={styles.successCircle}>
          <MaterialCommunityIcons
            name="check"
            color={colors.green}
            size={42}
          />
        </View>
        <Text style={styles.title}>Attendance submitted</Text>
        <Text style={styles.subtitle}>{getClassroomLabel(classroom)} · {validHour}</Text>
        {submittedTime ? <Text style={styles.time}>{cloudBacked ? 'Submitted' : 'Receipt saved at'} {submittedTime}</Text> : null}
        <View style={styles.summary}>
          <StatusSummary
            counts={counts}
          />
        </View>
        <SummaryLine label="Class size" value={String(total)} />
        <SummaryLine label="Not marked" value={cloudAttendance ? String(total - Object.keys(cloudAttendance).length) : String(receipt!.unmarked)} />
        <Text style={styles.note}>
          {cloudBacked ? 'This submission is saved in the shared cloud attendance system and is available to the Principal.' : 'This confirmation is stored only on this device. It is not a college report.'}
        </Text>
        <View style={styles.button}>
          <PrimaryButton
            label="Back to dashboard"
            onPress={() => {
              router.dismissAll();
              router.replace('/home');
            }}
          />
        </View>
      </Page>
    </View>
  );
}

function Problem({message}: {message: string}) {
  return (
    <View style={styles.loading}>
      <Text style={styles.error}>{message}</Text>
      <PrimaryButton label="Back" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {flexGrow: 1, justifyContent: 'center', padding: 24},
  successCircle: {
    alignSelf: 'center',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 7},
  time: {color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 5},
  summary: {marginTop: 22, marginBottom: 10},
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 15,
  },
  button: {marginTop: 22},
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    padding: 24,
    backgroundColor: colors.background,
  },
  error: {color: '#B42318', fontSize: 14},
});
