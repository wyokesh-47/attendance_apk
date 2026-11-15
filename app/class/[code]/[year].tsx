import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { HourTile } from '@/components/tiles';
import {resolveHourSubmission} from '@/components/hourStatus';
import { AppHeader, ErrorMessage, Page, PrimaryButton, colors } from '@/components/ui';
import {
  formatLiveDate,
  formatLiveTime,
  getCurrentActivePeriod,
  getHourTimingStatus,
  getStudents,
  HOURS,
  getClassroomLabel,
} from '@/data/demoData';
import { firstParam, resolveClassroom } from '@/navigation/routeParams';
import {
  getAttendance,
  getSubmission,
} from '@/services/attendanceRepository';
import {collegeToday, getClassHourSummaries, getClassRosterCount, getCloudHourProgress} from '@/services/managementRepository';
import type { SubmissionReceipt } from '@/types/attendance';
import type {CloudSummary} from '@/types/management';

export default function HourSelectionScreen() {
  const params = useLocalSearchParams<{code: string; year: string; classId?: string; date?: string}>();
  const classroom = resolveClassroom(params.code, params.year);
  const code = firstParam(params.code).toUpperCase();
  const year = Number(firstParam(params.year));
  const cloudBacked = code === 'BCA' && year === 2;
  const classId = firstParam(params.classId);
  const date = firstParam(params.date) || collegeToday();
  const [now, setNow] = useState(() => new Date());
  const [cloudHourData, setCloudHourData] = useState<{classId: string; date: string; rosterCount: number; summaries: CloudSummary[] } | null>(null);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [cloudRosterError, setCloudRosterError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!cloudBacked || !classId) return;
    let active = true;
    setCloudRosterError('');
    setCloudLoading(true);
    void Promise.all([getClassRosterCount(classId, date), getClassHourSummaries(classId, date)])
      .then(([rosterCount, summaries]) => {
        if (active) setCloudHourData({classId, date, rosterCount, summaries});
      })
      .catch((reason: unknown) => {
        if (active) setCloudRosterError(reason instanceof Error ? reason.message : 'Could not load the shared class roster.');
      })
      .finally(() => {if (active) setCloudLoading(false);});
    return () => {active = false;};
  }, [classId, cloudBacked, date]));

  if (!classroom) {
    return (
      <View style={styles.invalid}>
        <Text style={styles.subtitle}>Class not found.</Text>
      </View>
    );
  }
  if (cloudBacked && !classId) {
    return <View style={styles.invalid}>
      <Text style={styles.subtitle}>Open BCA Second Year from the department page after Staff approval.</Text>
      <PrimaryButton label="Back to BCA department" onPress={() => router.replace({pathname: '/department/[code]', params: {code: 'BCA'}})} />
    </View>;
  }
  const students = cloudBacked ? [] : getStudents(classroom);
  const currentCloudHourData = cloudHourData?.classId === classId && cloudHourData.date === date ? cloudHourData : null;
  const totalStudents = cloudBacked ? currentCloudHourData?.rosterCount ?? 0 : students.length;
  const activePeriod = getCurrentActivePeriod(now);

  return (
    <View style={styles.screen}>
      <AppHeader title="Select an hour" onBack={() => router.back()} />
      <Page scroll>
        {/* Live Clock and Period Card */}
        <View style={styles.liveClockCard}>
          <View style={styles.liveClockTop}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE TIME</Text>
            </View>
            <View style={styles.liveDateBadge}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={13}
                color={colors.green}
              />
              <Text style={styles.liveDateText}>{formatLiveDate(now)}</Text>
            </View>
          </View>
          <View style={styles.liveTimeRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={26}
              color={colors.green}
            />
            <Text style={styles.liveTimeDisplay}>{formatLiveTime(now)}</Text>
          </View>
          <View
            style={[
              styles.periodBanner,
              activePeriod.status === 'active'
                ? styles.periodBannerActive
                : activePeriod.status === 'break'
                  ? styles.periodBannerBreak
                  : styles.periodBannerNormal,
            ]}
          >
            <MaterialCommunityIcons
              name={
                activePeriod.status === 'active'
                  ? 'record-circle-outline'
                  : activePeriod.status === 'break'
                    ? 'coffee-outline'
                    : 'information-outline'
              }
              size={15}
              color={
                activePeriod.status === 'active'
                  ? '#027A48'
                  : activePeriod.status === 'break'
                    ? '#B54708'
                    : colors.muted
              }
            />
            <Text
              style={[
                styles.periodBannerText,
                activePeriod.status === 'active' && styles.periodBannerTextActive,
                activePeriod.status === 'break' && styles.periodBannerTextBreak,
              ]}
            >
              {activePeriod.label}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{getClassroomLabel(classroom)}</Text>
        <Text style={styles.subtitle}>{cloudBacked && !currentCloudHourData
          ? cloudLoading ? 'Loading shared roster…' : 'Shared roster unavailable'
          : `${totalStudents} students · Choose one of five hours`}</Text>
        {cloudRosterError ? <ErrorMessage>{cloudRosterError}</ErrorMessage> : null}
        {cloudBacked && cloudLoading ? <ActivityIndicator style={styles.loader} color={colors.green} /> : null}
        <View style={styles.tiles}>
          {(!cloudBacked || currentCloudHourData) ? HOURS.map((hour) => (
            <HourStatusTile
              key={hour}
              classroom={classroom}
              hour={hour}
              total={totalStudents}
              now={now}
              cloudBacked={cloudBacked}
              classId={classId}
              date={date}
              cloudSummaries={currentCloudHourData?.summaries}
            />
          )) : null}
        </View>
      </Page>
    </View>
  );
}

function HourStatusTile({
  classroom,
  hour,
  total,
  now,
  cloudBacked,
  classId,
  date,
  cloudSummaries,
}: {
  classroom: NonNullable<ReturnType<typeof resolveClassroom>>;
  hour: string;
  total: number;
  now: Date;
  cloudBacked: boolean;
  classId: string;
  date: string;
  cloudSummaries?: CloudSummary[];
}) {
  const [state, setState] = useState<{
    marked: number;
    receipt: SubmissionReceipt | null;
    submitted: boolean;
    error: string;
  }>({
    marked: 0,
    receipt: null,
    submitted: false,
    error: '',
  });

  const timing = getHourTimingStatus(hour, now);
  const isExpired = timing?.isExpired ?? false;
  const isActive = timing?.isActive ?? false;

  useFocusEffect(
    useCallback(() => {
      if (cloudBacked) return;
      let active = true;
      setState((current) => ({...current, error: ''}));
      void Promise.all([
        getAttendance(classroom, hour),
        getSubmission(classroom, hour),
      ]).then(([attendance, receipt]) => {
        if (active) {
          setState({marked: Object.keys(attendance).length, receipt, submitted: receipt !== null, error: ''});
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
    }, [classId, cloudBacked, date, classroom.department.code, classroom.year, hour]),
  );

  const cloudProgress = cloudBacked && cloudSummaries
    ? getCloudHourProgress(classId, date, Number(hour.replace('Hour ', '')), total, cloudSummaries)
    : null;
  const marked = cloudProgress?.marked ?? state.marked;
  const hourTotal = cloudProgress?.total ?? total;
  const submitted = resolveHourSubmission(cloudBacked, cloudProgress?.submitted ?? false, state.submitted);

  function handlePress() {
    if (isExpired && !submitted) {
      Alert.alert(
        'Attendance Window Closed',
        `${hour} (${timing?.timeLabel ?? ''}) time has ended. You cannot mark or modify attendance after the scheduled period has passed.`,
        [{text: 'OK'}],
      );
      return;
    }
    router.push({
      pathname: '/attendance/[code]/[year]/[hour]',
      params: {
        code: classroom.department.code,
        year: String(classroom.year),
        hour,
        ...(cloudBacked ? {classId, date} : {}),
      },
    });
  }

  return (
    <View>
      <HourTile
        hour={hour}
        timeRange={timing?.timeLabel}
        periodName={timing?.schedule.period}
        isExpired={isExpired}
        isActive={isActive}
        marked={marked}
        total={hourTotal}
        submitted={submitted}
        onPress={handlePress}
      />
      {state.error ? <Text style={styles.loadError}>{state.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  liveClockCard: {
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderColor: '#D8EBFA',
    borderWidth: 1,
    shadowColor: '#1769AA',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  liveClockTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#12B76A',
  },
  liveIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#027A48',
  },
  liveDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.paleGreen,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
  },
  liveTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  liveTimeDisplay: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  periodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  periodBannerActive: {
    backgroundColor: '#ECFDF3',
    borderColor: '#A6F4C5',
    borderWidth: 1,
  },
  periodBannerBreak: {
    backgroundColor: '#FFF6ED',
    borderColor: '#FEDF89',
    borderWidth: 1,
  },
  periodBannerNormal: {
    backgroundColor: '#F9FAFB',
    borderColor: '#EAECF0',
    borderWidth: 1,
  },
  periodBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  periodBannerTextActive: {
    color: '#027A48',
  },
  periodBannerTextBreak: {
    color: '#B54708',
  },
  title: {fontSize: 24, fontWeight: '800', color: colors.ink},
  subtitle: {fontSize: 14, color: colors.muted, marginTop: 5},
  tiles: {gap: 12, marginTop: 20},
  loadError: {color: '#B42318', fontSize: 12, paddingHorizontal: 10, paddingBottom: 8},
  loader: {marginVertical: 16},
  invalid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
