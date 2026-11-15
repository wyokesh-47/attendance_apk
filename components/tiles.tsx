import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, colors, statusColors, statusLabels } from '@/components/ui';
import type {
  AttendanceStatus,
  Classroom,
  DemoStudent,
  Department,
} from '@/types/attendance';
import { getClassroomLabel, STUDY_YEARS } from '@/data/demoData';
import {getHourPresentation} from './hourStatus';

const departmentIcons: Record<
  Department['code'],
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  BCA: 'laptop',
  BSCCS: 'code-tags',
  BSCAIML: 'memory',
  BBA: 'calculator',
  MBA: 'chart-bar',
  BCOM: 'account-group',
  BCOMCA: 'certificate-outline',
};

export function DepartmentTile({
  department,
  attendanceCounts,
  onPress,
}: {
  department: Department;
  attendanceCounts?: {
    total_students: number;
    present: number;
    absent: number;
    od: number;
    informed_leave: number;
  };
  onPress: () => void;
}) {
  return (
    <AppCard style={styles.departmentCard} onPress={onPress}>
      <View style={styles.departmentMeta}>
        <View style={styles.departmentIcon}>
          <MaterialCommunityIcons
            name={departmentIcons[department.code] ?? 'school-outline'}
            size={22}
            color={colors.green}
          />
        </View>
        <View style={styles.departmentTag}>
          <Text style={styles.departmentTagText}>{department.abbreviation}</Text>
        </View>
      </View>
      <View style={styles.tileTitleRow}>
        <Text numberOfLines={2} style={styles.departmentName}>
          {department.name}
        </Text>
        <View style={styles.departmentArrow}>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={colors.green}
          />
        </View>
      </View>
      {attendanceCounts ? (
        <View style={styles.attendanceCounts}>
          <Text style={styles.attendanceStudentCount}>{attendanceCounts.total_students} students</Text>
          <View style={styles.attendanceStatuses}>
            <Text style={styles.presentCount}>Present {attendanceCounts.present}</Text>
            <Text style={styles.absentCount}>Absent {attendanceCounts.absent}</Text>
            <Text style={styles.odCount}>OD {attendanceCounts.od}</Text>
            <Text style={styles.leaveCount}>Informed Leave {attendanceCounts.informed_leave}</Text>
          </View>
        </View>
      ) : null}
    </AppCard>
  );
}

export function YearTile({
  classroom,
  count,
  onPress,
}: {
  classroom: Classroom;
  count: number;
  onPress: () => void;
}) {
  return (
    <AppCard onPress={onPress} style={styles.selectionTile}>
      <View style={styles.yearBadge}>
        <Text style={styles.yearBadgeText}>0{classroom.year}</Text>
      </View>
      <View style={styles.selectionText}>
        <Text style={styles.selectionTitle}>
          {STUDY_YEARS[classroom.year - 1]}
        </Text>
        <Text style={styles.selectionSubtitle}>{count} students</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={21}
        color={colors.muted}
      />
    </AppCard>
  );
}

export function HourTile({
  hour,
  timeRange,
  periodName,
  isExpired = false,
  isActive = false,
  marked,
  total,
  submitted,
  onPress,
}: {
  hour: string;
  timeRange?: string;
  periodName?: string;
  isExpired?: boolean;
  isActive?: boolean;
  marked: number;
  total: number;
  submitted: boolean;
  onPress: () => void;
}) {
  const {complete, submitted: hasSubmittedCheck} = getHourPresentation(marked, total, submitted);

  return (
    <AppCard
      onPress={onPress}
      style={[
        styles.selectionTile,
        isActive && styles.activeCard,
        isExpired && !submitted && styles.expiredCard,
      ]}
    >
      <View
        style={[
          styles.hourBadge,
          submitted
            ? styles.hourSubmittedBadge
            : isExpired
              ? styles.hourExpiredBadge
              : isActive
                ? styles.hourActiveBadge
                : null,
        ]}
      >
        <MaterialCommunityIcons
          name={
            hasSubmittedCheck
              ? 'check-circle'
              : isExpired
                ? 'lock-outline'
                : isActive
                  ? 'clock-fast'
                  : 'clock-outline'
          }
          color={
            submitted
              ? '#027A48'
              : isExpired
                ? '#667085'
                : isActive
                  ? colors.green
                  : colors.green
          }
          size={22}
        />
      </View>
      <View style={styles.selectionText}>
        <View style={styles.hourTitleRow}>
          <Text style={styles.selectionTitle}>{hour}</Text>
          {timeRange ? (
            <View
              style={[
                styles.timeChip,
                isActive && styles.timeChipActive,
                isExpired && styles.timeChipExpired,
              ]}
            >
              <Text
                style={[
                  styles.timeChipText,
                  isActive && styles.timeChipTextActive,
                ]}
              >
                {timeRange}
              </Text>
            </View>
          ) : null}
          {isActive ? (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>LIVE</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.selectionSubtitle}>
          {submitted ? (
            'Attendance submitted'
          ) : isExpired ? (
            <Text style={styles.expiredText}>Time ended · {marked}/{total} marked</Text>
          ) : isActive ? (
            <Text style={styles.activeText}>
              {complete ? 'All students marked' : `Active now · ${marked}/${total} marked`}
            </Text>
          ) : complete ? (
            'All students marked'
          ) : (
            `${marked}/${total} marked`
          )}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={
          submitted
            ? 'check-circle'
            : isExpired
              ? 'lock-outline'
              : isActive
                ? 'arrow-right-circle'
                : 'chevron-right'
        }
        size={21}
        color={
          hasSubmittedCheck
            ? '#027A48'
            : isExpired
              ? '#98A2B3'
              : isActive
                ? colors.green
                : colors.muted
        }
      />
    </AppCard>
  );
}

export function StudentTile({
  student,
  status,
  onPress,
  compact = false,
}: {
  student: DemoStudent;
  status: AttendanceStatus | undefined;
  onPress?: () => void;
  compact?: boolean;
}) {
  const statusColor = status ? statusColors[status] : colors.muted;
  const content = (
    <View style={[styles.studentRow, compact && styles.compactStudentRow]}>
      <View style={[styles.studentAvatar, compact && styles.compactAvatar]}>
        <Text style={styles.studentAvatarText}>
          {student.name.startsWith('Demo ')
            ? student.name.split(' ')[1]?.[0] ?? 'D'
            : student.name[0] ?? 'D'}
        </Text>
      </View>
      <View style={styles.studentInfo}>
        <Text numberOfLines={1} style={styles.studentIdentifier}>
          {student.registerNumber}
        </Text>
        <Text numberOfLines={2} style={styles.studentName}>
          {student.name}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          {backgroundColor: `${statusColor}1A`},
        ]}
      >
        <Text numberOfLines={2} style={[styles.statusBadgeText, {color: statusColor}]}>
          {status ? statusLabels[status] : 'Unmarked'}
        </Text>
      </View>
      {onPress && (
        <MaterialCommunityIcons
          name="dots-vertical"
          size={18}
          color={colors.muted}
        />
      )}
    </View>
  );

  return (
    <AppCard
      style={compact ? styles.compactStudentCard : styles.studentCard}
      onPress={onPress}
      accessibilityLabel={`${student.registerNumber}, ${student.name}, ${status ? statusLabels[status] : 'Unmarked'}`}
    >
      {content}
    </AppCard>
  );
}

export function StatusOption({
  status,
  selected,
  onPress,
}: {
  status: AttendanceStatus;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={styles.statusOption}
    >
      <View
        style={[
          styles.statusOptionIcon,
          {backgroundColor: `${statusColors[status]}1C`},
        ]}
      >
        <MaterialCommunityIcons
          name={
            status === 'present'
              ? 'check-circle-outline'
              : status === 'absent'
                ? 'close-circle-outline'
                : status === 'od'
                  ? 'clock-alert-outline'
                  : 'calendar-check-outline'
          }
          color={statusColors[status]}
          size={20}
        />
      </View>
      <Text style={styles.statusOptionLabel}>{statusLabels[status]}</Text>
      {selected && (
        <MaterialCommunityIcons
          name="check-circle"
          color={colors.green}
          size={21}
        />
      )}
    </Pressable>
  );
}

export function ClassSubtitle({classroom}: {classroom: Classroom}) {
  return (
    <Text style={styles.classSubtitle}>{getClassroomLabel(classroom)}</Text>
  );
}

const styles = StyleSheet.create({
  departmentCard: {
    width: '48%',
    minHeight: 116,
    padding: 13,
    justifyContent: 'space-between',
    borderRadius: 20,
    borderColor: '#D8EBFA',
    shadowColor: '#1769AA',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  departmentMeta: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8},
  departmentArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departmentIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departmentTag: {
    alignSelf: 'center',
    backgroundColor: colors.paleGreen,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  departmentTagText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
  },
  tileTitleRow: {minHeight: 40, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8},
  departmentName: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  attendanceCounts: {marginTop: 9, gap: 6},
  attendanceStudentCount: {fontSize: 11, lineHeight: 16, fontWeight: '700', color: colors.ink},
  attendanceStatuses: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  presentCount: {fontSize: 9, lineHeight: 13, fontWeight: '700', color: colors.green},
  absentCount: {fontSize: 9, lineHeight: 13, fontWeight: '700', color: '#B42318'},
  odCount: {fontSize: 9, lineHeight: 13, fontWeight: '700', color: '#805B13'},
  leaveCount: {fontSize: 9, lineHeight: 13, fontWeight: '700', color: '#6941C6'},
  selectionTile: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearBadge: {
    width: 46,
    height: 46,
    backgroundColor: colors.paleGreen,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBadgeText: {color: colors.green, fontWeight: '800', fontSize: 14},
  hourBadge: {
    width: 46,
    height: 46,
    backgroundColor: colors.paleGreen,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionText: {flex: 1, minWidth: 0},
  selectionTitle: {color: colors.ink, fontSize: 15, fontWeight: '700'},
  selectionSubtitle: {color: colors.muted, fontSize: 12, marginTop: 3},
  hourTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F2F4F7',
  },
  timeChipActive: {
    backgroundColor: '#EAF6FF',
    borderColor: '#B9E0F8',
    borderWidth: 1,
  },
  timeChipExpired: {
    backgroundColor: '#FEE4E2',
  },
  timeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
  },
  timeChipTextActive: {
    color: colors.green,
  },
  activePill: {
    backgroundColor: '#ECFDF3',
    borderColor: '#A6F4C5',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  activePillText: {
    color: '#027A48',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeCard: {
    borderColor: '#38A9E8',
    borderWidth: 1.5,
    shadowColor: '#1769AA',
    shadowOpacity: 0.12,
  },
  expiredCard: {
    backgroundColor: '#FCFCFD',
    borderColor: '#EAECF0',
    opacity: 0.88,
  },
  hourSubmittedBadge: {
    backgroundColor: '#ECFDF3',
  },
  hourExpiredBadge: {
    backgroundColor: '#F2F4F7',
  },
  hourActiveBadge: {
    backgroundColor: '#EAF6FF',
  },
  expiredText: {
    color: '#D92D20',
    fontWeight: '600',
  },
  activeText: {
    color: '#027A48',
    fontWeight: '700',
  },
  studentCard: {paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16},
  compactStudentCard: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 8,
  },
  studentRow: {flexDirection: 'row', alignItems: 'center', gap: 9},
  compactStudentRow: {gap: 8},
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatar: {width: 34, height: 34, borderRadius: 17},
  studentAvatarText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
  },
  studentInfo: {flex: 1, minWidth: 0},
  studentName: {color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 4},
  studentIdentifier: {color: colors.ink, fontSize: 10, fontWeight: '800'},
  statusBadge: {width: 84, minHeight: 34, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 10},
  statusBadgeText: {fontSize: 10, lineHeight: 14, textAlign: 'center', fontWeight: '700'},
  statusOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionLabel: {flex: 1, color: colors.ink, fontSize: 15},
  classSubtitle: {fontSize: 14, color: colors.muted},
});
