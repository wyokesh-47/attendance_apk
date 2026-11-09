import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HourTile } from '@/components/tiles';
import { AppCard, AppHeader, Page, colors } from '@/components/ui';
import { getStudents, HOURS, getClassroomLabel } from '@/data/demoData';
import { resolveClassroom } from '@/navigation/routeParams';
import {
  getAttendance,
  getSubmission,
} from '@/services/attendanceRepository';
import type { SubmissionReceipt } from '@/types/attendance';

export default function HourSelectionScreen() {
  const params = useLocalSearchParams<{code: string; year: string}>();
  const classroom = resolveClassroom(params.code, params.year);
  if (!classroom) {
    return (
      <View style={styles.invalid}>
        <Text style={styles.subtitle}>Class not found.</Text>
      </View>
    );
  }
  const students = getStudents(classroom);

  return (
    <View style={styles.screen}>
      <AppHeader title="Select an hour" onBack={() => router.back()} />
      <Page scroll>
        <AppCard style={{padding: 16, marginTop: 12, marginBottom: 16, backgroundColor: colors.paleGreen}}>
          <Text style={styles.subtitle}>Device-only marking · These drafts and submissions are saved on this phone, not shared with Principal/HOD.</Text>
        </AppCard>
        <Text style={styles.title}>{getClassroomLabel(classroom)}</Text>
        <Text style={styles.subtitle}>
          {students.length} students · Choose one of five hours
        </Text>
        <View style={styles.tiles}>
          {HOURS.map((hour) => (
            <HourStatusTile
              key={hour}
              classroom={classroom}
              hour={hour}
              total={students.length}
              onPress={() =>
                router.push({
                  pathname: '/attendance/[code]/[year]/[hour]',
                  params: {
                    code: classroom.department.code,
                    year: String(classroom.year),
                  hour,
                },
                })
              }
            />
          ))}
        </View>
      </Page>
    </View>
  );
}

function HourStatusTile({
  classroom,
  hour,
  total,
  onPress,
}: {
  classroom: NonNullable<ReturnType<typeof resolveClassroom>>;
  hour: string;
  total: number;
  onPress: () => void;
}) {
  const [state, setState] = useState<{
    marked: number;
    receipt: SubmissionReceipt | null;
    error: string;
  }>({
    marked: 0,
    receipt: null,
    error: '',
  });
  useFocusEffect(
    useCallback(() => {
    let active = true;
    setState((current) => ({...current, error: ''}));
    void Promise.all([
      getAttendance(classroom, hour),
      getSubmission(classroom, hour),
    ]).then(([attendance, receipt]) => {
      if (active) {
        setState({marked: Object.keys(attendance).length, receipt, error: ''});
      }
    }).catch((reason: unknown) => {
      if (active) {
        setState((current) => ({
          ...current,
          error: reason instanceof Error ? reason.message : 'Could not load hour status.',
        }));
      }
    });
    return () => {
      active = false;
    };
  }, [classroom.department.code, classroom.year, hour]),
  );
  return (
    <View>
      <HourTile
        hour={hour}
        marked={state.marked}
        total={total}
        submitted={state.receipt !== null}
        onPress={onPress}
      />
      {state.error ? <Text style={styles.loadError}>{state.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  title: {fontSize: 24, fontWeight: '800', color: colors.ink},
  subtitle: {fontSize: 14, color: colors.muted, marginTop: 5},
  tiles: {gap: 12, marginTop: 20},
  loadError: {color: '#B42318', fontSize: 12, paddingHorizontal: 10, paddingBottom: 8},
  invalid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
