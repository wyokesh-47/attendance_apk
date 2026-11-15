import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusOption, StudentTile } from '@/components/tiles';
import {
  AppHeader,
  AppTextInput,
  DemoBanner,
  PrimaryButton,
  StatusSummary,
  colors,
  statusCounts,
} from '@/components/ui';
import {
  ATTENDANCE_STATUSES,
  HOURS,
  getClassroomLabel,
  getHourTimingStatus,
  getStudents,
  searchStudents,
} from '@/data/demoData';
import {firstParam, resolveClassroom} from '@/navigation/routeParams';
import {
  getAttendance,
  getSubmission,
  markAllPresent,
  setStudentStatus,
} from '@/services/attendanceRepository';
import {cloudAttendanceMap, cloudStudents, collegeToday, getClassAttendance, markAllCloudPresent, openAttendanceSession, saveAttendanceChange} from '@/services/managementRepository';
import type {
  AttendanceMap,
  AttendanceStatus,
  DemoStudent,
  SubmissionReceipt,
} from '@/types/attendance';
import type {ClassAttendanceData} from '@/types/management';

export default function AttendanceScreen() {
  const params = useLocalSearchParams<{
    code: string;
    year: string;
    hour: string;
    unmarked?: string;
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
  const [selectedStudent, setSelectedStudent] = useState<DemoStudent | null>(null);
  const [query, setQuery] = useState('');
  const [onlyUnmarked, setOnlyUnmarked] = useState(params.unmarked === '1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function refreshCloudAttendance(): Promise<ClassAttendanceData> {
    if (!classId || !cloudBacked) throw new Error('Shared cloud class is unavailable.');
    const result = await getClassAttendance(classId, attendanceDate, Number(validHour.replace('Hour ', '')));
    setCloudData(result);
    setAttendance(cloudAttendanceMap(result));
    return result;
  }

  const filteredStudents = useMemo(
    () => searchStudents(students, query).filter(
      (student) => !onlyUnmarked || !attendance[student.registerNumber],
    ),
    [students, query, onlyUnmarked, attendance],
  );
  const counts = statusCounts(attendance);
  const timing = getHourTimingStatus(validHour);
  const isExpired = timing?.isExpired ?? false;

  async function saveStatus(status: AttendanceStatus) {
    if (!classroom || !selectedStudent || attendanceSubmitted || isExpired) return;
    setSaving(true);
    setError('');
    try {
      if (cloudBacked) {
        let current = cloudData;
        if (!current) throw new Error('Cloud attendance is not loaded. Refresh before retrying.');
        if (!current.session) {
          await openAttendanceSession(classId, attendanceDate, Number(validHour.replace('Hour ', '')));
          current = await refreshCloudAttendance();
        }
        if (!current.session) throw new Error('Could not open the shared attendance session.');
        const enrollment = current.students.find((item) => item.students.register_number === selectedStudent.registerNumber);
        if (!enrollment) throw new Error('Student is not enrolled in this shared class.');
        await saveAttendanceChange(current, enrollment.id, status, '', false);
        setSelectedStudent(null);
        try {
          await refreshCloudAttendance();
        } catch {
          setError('Attendance was saved to the cloud, but updated totals could not be loaded. Reopen this hour to refresh.');
        }
      } else {
        setAttendance(await setStudentStatus(classroom, validHour, selectedStudent.registerNumber, status));
        setSelectedStudent(null);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save status.');
    } finally {
      setSaving(false);
    }
  }

  async function setEveryonePresent() {
    if (!classroom || attendanceSubmitted || isExpired) return;
    setSaving(true);
    setError('');
    try {
      if (cloudBacked) {
        let current = cloudData;
        if (!current) throw new Error('Cloud attendance is not loaded. Refresh before retrying.');
        if (!current.session) {
          await openAttendanceSession(classId, attendanceDate, Number(validHour.replace('Hour ', '')));
          current = await refreshCloudAttendance();
        }
        if (!current.session) throw new Error('Could not open the shared attendance session.');
        await markAllCloudPresent(current.session);
        try {
          await refreshCloudAttendance();
        } catch {
          setError('All students were marked in the cloud, but updated totals could not be loaded. Reopen this hour to refresh.');
        }
      } else {
        setAttendance(await markAllPresent(classroom, validHour));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not mark all present.');
    } finally {
      setSaving(false);
    }
  }

  if (!classroom || !validHour) {
    return (
      <SafeAreaView style={styles.invalid}>
        <Text style={styles.errorText}>{error || 'Class or hour not found.'}</Text>
      </SafeAreaView>
    );
  }

  const selectedClassroom = classroom;

  function openReview() {
    router.push({
      pathname: '/review/[code]/[year]/[hour]',
      params: {
        code: selectedClassroom.department.code,
        year: String(selectedClassroom.year),
        hour: validHour,
        ...(cloudBacked ? {classId, date: attendanceDate} : {}),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <AppHeader
        title={timing ? `${validHour} · ${timing.timeLabel}` : validHour}
        onBack={() => router.back()}
        onProfile={() => router.push('/profile')}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.classLine}>
              <Text numberOfLines={1} style={styles.className}>
                {getClassroomLabel(classroom)}
              </Text>
              <Text style={styles.markedCount}>
                {Object.keys(attendance).length}/{students.length} marked
              </Text>
            </View>
            <StatusSummary counts={counts} />
            {receipt ? (
              <DemoBanner text="SUBMITTED · Attendance is locked for editing" />
            ) : attendanceSubmitted ? (
              <DemoBanner text="SUBMITTED · Attendance is locked for editing" />
            ) : isExpired ? (
              <DemoBanner text={`TIME ENDED · Attendance for ${validHour} closed at ${timing?.schedule.time}. Marking is locked.`} />
            ) : null}
            <Pressable accessibilityRole="button" accessibilityState={{selected: onlyUnmarked}}
              onPress={() => setOnlyUnmarked((value) => !value)}>
              <Text style={styles.allPresentText}>
                {onlyUnmarked ? 'Show all students' : 'Show unmarked students'}
              </Text>
            </Pressable>
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.muted}
                />
                <AppTextInput
                  accessibilityLabel="Search students"
                  onChangeText={setQuery}
                  placeholder="Search name, register or roll no."
                  value={query}
                  style={styles.searchInput}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mark All Present"
                disabled={saving || attendanceSubmitted || isExpired}
                onPress={setEveryonePresent}
                style={({pressed}) => [
                  styles.allPresentButton,
                  (saving || attendanceSubmitted || isExpired) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="playlist-check"
                  size={17}
                  color={colors.green}
                />
                <Text style={styles.allPresentText}>All present</Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredStudents.length === 0 ? (
              <Text style={styles.empty}>
                {students.length === 0
                  ? 'No students found.'
                  : `No students match “${query}”.`}
              </Text>
            ) : (
              filteredStudents.map((student) => (
                <StudentTile
                  key={student.registerNumber}
                  student={student}
                  status={attendance[student.registerNumber]}
                  onPress={
                    attendanceSubmitted || isExpired ? undefined : () => setSelectedStudent(student)
                  }
                />
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            {attendanceSubmitted ? (
              <PrimaryButton
                icon="receipt-text-outline"
                label="View submission receipt"
                onPress={openReview}
              />
            ) : isExpired ? (
              <PrimaryButton
                icon="lock-outline"
                label="Attendance closed · View summary"
                onPress={openReview}
              />
            ) : (
              <PrimaryButton
                icon="clipboard-check-outline"
                label="Review attendance"
                onPress={openReview}
                disabled={saving}
              />
            )}
          </View>
        </View>
      )}

      <Modal
        visible={selectedStudent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close status selector"
            style={styles.modalScrim}
            onPress={() => setSelectedStudent(null)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetRegister}>
              {selectedStudent?.registerNumber}
            </Text>
            <Text style={styles.sheetName}>{selectedStudent?.name}</Text>
            <View style={styles.options}>
              {ATTENDANCE_STATUSES.map(({value}) => (
                <StatusOption
                  key={value}
                  status={value}
                  selected={
                    selectedStudent
                      ? attendance[selectedStudent.registerNumber] === value
                      : false
                  }
                  onPress={() => void saveStatus(value)}
                />
              ))}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {saving ? <ActivityIndicator color={colors.green} /> : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  body: {flex: 1},
  top: {paddingHorizontal: 20, paddingTop: 2, paddingBottom: 10, gap: 12},
  classLine: {flexDirection: 'row', alignItems: 'center', gap: 8},
  className: {flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700'},
  markedCount: {color: colors.muted, fontSize: 12},
  searchRow: {flexDirection: 'row', alignItems: 'center', gap: 9},
  searchWrap: {
    flex: 1,
    minHeight: 49,
    paddingLeft: 13,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderColor: colors.line,
    borderWidth: 1,
  },
  searchInput: {flex: 1, minHeight: 45, paddingHorizontal: 8, fontSize: 13, borderWidth: 0},
  allPresentButton: {
    minHeight: 49,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 13,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  allPresentText: {color: colors.green, fontWeight: '600', fontSize: 12},
  disabled: {opacity: 0.5},
  pressed: {opacity: 0.75},
  list: {flex: 1},
  listContent: {paddingHorizontal: 20, paddingBottom: 12},
  empty: {color: colors.muted, textAlign: 'center', marginTop: 60},
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  loading: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  errorText: {color: '#B42318', fontSize: 13, lineHeight: 19},
  invalid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalScrim: {...StyleSheet.absoluteFill, backgroundColor: '#00000066'},
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.white,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 18,
  },
  sheetName: {color: colors.ink, fontSize: 19, fontWeight: '700', marginTop: 4},
  sheetRegister: {color: colors.ink, fontSize: 14, fontWeight: '800'},
  options: {marginTop: 12},
});
