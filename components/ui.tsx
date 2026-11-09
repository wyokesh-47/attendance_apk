import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode, RefObject } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type ScrollViewProps,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import type { AttendanceStatus } from '@/types/attendance';

export const colors = {
  ink: '#18324A',
  muted: '#607487',
  green: '#1769AA',
  skyBlue: '#38A9E8',
  background: '#FFFFFF',
  line: '#EAECF0',
  white: '#FFFFFF',
  paleGreen: '#EAF6FF',
  avatar: '#EAF6FF',
  warning: '#805B13',
  warningBackground: '#FFF6E5',
  warningBorder: '#F2D49A',
};

export const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  od: 'OD',
  informed_leave: 'Informed Leave',
};

export const statusColors: Record<AttendanceStatus, string> = {
  present: colors.green,
  absent: '#B42318',
  od: '#B54708',
  informed_leave: '#6941C6',
};

export function Page({
  children,
  scroll = false,
  scrollRef,
  safeAreaEdges = ['top', 'left', 'right'],
  style,
  ...scrollProps
}: {
  children: ReactNode;
  scroll?: boolean;
  scrollRef?: RefObject<ScrollViewInstance | null>;
  safeAreaEdges?: Edge[];
  style?: ViewStyle;
} & ScrollViewProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.pageContent, style]}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.pageContent, styles.flex, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function BrandMark({large = false}: {large?: boolean}) {
  return (
    <View style={styles.brandRow}>
      <Image
        accessibilityLabel="ATTENDANCE graduation-cap logo"
        source={require('../assets/acadence-mark.png')}
        resizeMode="contain"
        style={[styles.brandIcon, large && styles.brandIconLarge]}
      />
      <View style={styles.brandText}>
        <Text style={[styles.brandTitle, large && styles.brandTitleLarge]}>
          ATTENDANCE
        </Text>
        {large && (
          <Text style={styles.brandSubtitle}>Smart academic attendance</Text>
        )}
      </View>
    </View>
  );
}

export function AppHeader({
  title,
  onBack,
  onProfile,
  dashboard = false,
}: {
  title: string;
  onBack?: () => void;
  onProfile?: () => void;
  dashboard?: boolean;
}) {
  return (
    <SafeAreaView style={styles.appHeaderSafeArea} edges={['top']}>
      <View style={styles.appHeader}>
        {dashboard ? (
          <BrandMark />
        ) : (
          <View style={styles.headerTitleRow}>
            {onBack && (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={10}
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  color={colors.ink}
                  size={23}
                />
              </Pressable>
            )}
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
        )}
        {onProfile ? (
          <Pressable
            onPress={onProfile}
            accessibilityRole="button"
            accessibilityLabel="Staff profile"
            style={styles.profileButton}
          >
            <MaterialCommunityIcons
              name="account-outline"
              color={colors.green}
              size={21}
            />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
    </SafeAreaView>
  );
}

export function DemoBanner({text}: {text: string}) {
  return (
    <View style={styles.demoBanner}>
      <MaterialCommunityIcons
        name="flask-outline"
        size={17}
        color={colors.green}
      />
      <Text style={styles.demoBannerText}>{text}</Text>
    </View>
  );
}

export function AppCard({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({pressed}) => [
          styles.card,
          style,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.primaryButton,
        (disabled || loading) && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon && !loading && (
        <MaterialCommunityIcons name={icon} size={19} color={colors.white} />
      )}
      <Text style={styles.primaryButtonText}>
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

export function FieldLabel({children}: {children: string}) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function AppTextInput({
  style,
  ...props
}: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#8A958F"
      selectionColor={colors.green}
      style={[styles.textInput, style]}
      {...props}
    />
  );
}

export function SectionTitle({children}: {children: string}) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function StatusSummary({
  counts,
}: {
  counts: Record<AttendanceStatus, number>;
}) {
  const statuses: AttendanceStatus[] = [
    'present',
    'absent',
    'od',
    'informed_leave',
  ];
  return (
    <View style={styles.summaryRow}>
      {statuses.map((status) => (
        <View
          key={status}
          style={[
            styles.summaryChip,
            {backgroundColor: `${statusColors[status]}14`},
          ]}
        >
          <Text style={[styles.summaryNumber, {color: statusColors[status]}]}>
            {counts[status]}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summaryLabel, {color: statusColors[status]}]}
          >
            {statusLabels[status]}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SummaryLine({
  label,
  value,
  valueColor = colors.ink,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLineLabel}>{label}</Text>
      <Text style={[styles.summaryLineValue, {color: valueColor}]}>
        {value}
      </Text>
    </View>
  );
}

export function statusCounts(
  attendance: Partial<Record<string, AttendanceStatus>>,
): Record<AttendanceStatus, number> {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    od: 0,
    informed_leave: 0,
  };
  for (const status of Object.values(attendance)) {
    if (status) counts[status] += 1;
  }
  return counts;
}

export function ErrorMessage({children}: {children: string}) {
  return (
    <Text accessibilityRole="alert" style={styles.errorText}>
      {children}
    </Text>
  );
}

export function DetailRow({
  icon,
  title,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  value: string;
}) {
  return (
    <AppCard style={styles.detailCard}>
      <MaterialCommunityIcons name={icon} color={colors.green} size={22} />
      <View style={styles.detailText}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  pageContent: {paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28},
  brandRow: {flexDirection: 'row', alignItems: 'center'},
  brandText: {flexShrink: 1},
  brandIcon: {
    width: 54,
    height: 42,
    borderRadius: 10,
    marginRight: 9,
  },
  brandIconLarge: {width: 78, height: 78, borderRadius: 17, marginRight: 12},
  brandTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandTitleLarge: {fontSize: 20},
  brandSubtitle: {color: colors.muted, fontSize: 13},
  appHeader: {
    minHeight: 62,
    paddingTop: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appHeaderSafeArea: {backgroundColor: colors.background},
  headerTitleRow: {flexDirection: 'row', alignItems: 'center', flex: 1},
  backButton: {padding: 4, marginRight: 15},
  headerTitle: {flex: 1, fontSize: 19, lineHeight: 25, fontWeight: '600', color: colors.ink},
  headerSpacer: {width: 36},
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9E0F8',
    backgroundColor: '#E4F4FF',
    gap: 8,
  },
  demoBannerText: {
    flex: 1,
    color: colors.green,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderColor: colors.line,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {opacity: 0.78},
  primaryButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
  },
  disabledButton: {opacity: 0.55},
  primaryButtonText: {flexShrink: 1, textAlign: 'center', color: colors.white, fontSize: 15, lineHeight: 22, fontWeight: '700'},
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  textInput: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryRow: {flexDirection: 'row', gap: 6},
  summaryChip: {
    flex: 1,
    minHeight: 76,
    paddingHorizontal: 3,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  summaryNumber: {fontSize: 16, fontWeight: '800'},
  summaryLabel: {fontSize: 10, lineHeight: 14, minHeight: 28, textAlign: 'center', marginTop: 4},
  summaryLine: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLineLabel: {flex: 1, paddingRight: 12, color: colors.muted, fontSize: 14, lineHeight: 20},
  summaryLineValue: {flexShrink: 1, textAlign: 'right', fontWeight: '700', fontSize: 14, lineHeight: 20},
  errorText: {
    color: '#B42318',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },
  detailCard: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  detailText: {flex: 1},
  detailTitle: {color: colors.muted, fontSize: 12},
  detailValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
});
