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
} from '@/components/ui';
import { HOURS, getClassroomLabel, getStudents } from '@/data/demoData';
import { resolveClassroom } from '@/navigation/routeParams';
import { getSubmission } from '@/services/attendanceRepository';
import type { SubmissionReceipt } from '@/types/attendance';

export default function ReceiptScreen() {
  const params = useLocalSearchParams<{
    code: string;
    year: string;
    hour: string;
  }>();
  const classroom = resolveClassroom(params.code, params.year);
  const hour = Array.isArray(params.hour) ? params.hour[0] : params.hour;
  const validHour = hour && HOURS.includes(hour) ? hour : '';
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!classroom || !validHour) {
      setError('This receipt could not be found.');
      setLoading(false);
      return () => {
        active = false;
      };
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
  }, [classroom?.department.code, classroom?.year, validHour]);

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
  if (!receipt) {
    return <Problem message={error || 'This receipt could not be found.'} />;
  }

  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(receipt.submittedAt));
  const total = getStudents(classroom).length;

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
        <Text style={styles.time}>Receipt saved at {time}</Text>
        <View style={styles.summary}>
          <StatusSummary
            counts={{
              present: receipt.present,
              absent: receipt.absent,
              od: receipt.od,
              informed_leave: receipt.informedLeave,
            }}
          />
        </View>
        <SummaryLine label="Class size" value={String(total)} />
        <SummaryLine label="Not marked" value={String(receipt.unmarked)} />
        <Text style={styles.note}>
          This confirmation is stored only on this device. It is not a college
          report.
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
