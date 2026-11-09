import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DepartmentTile } from '@/components/tiles';
import {
  AppHeader,
  Page,
  SectionTitle,
  colors,
} from '@/components/ui';
import { DEPARTMENTS, STUDY_YEARS } from '@/data/demoData';

export default function HomeScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  useFocusEffect(
    useCallback(() => {
      const frame = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({y: 0, animated: false});
      });
      return () => cancelAnimationFrame(frame);
    }, []),
  );

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['right', 'bottom', 'left']}
    >
      <AppHeader
        title=""
        dashboard
        onProfile={() => router.push('/profile')}
      />
      <Page
        scroll
        scrollRef={scrollRef}
        safeAreaEdges={[]}
        style={styles.content}
      >
        <LinearGradient
          colors={['#064D9D', '#0879D8', '#079EF0']}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.banner}
        >
          <View style={styles.bannerLabelPill}>
            <MaterialCommunityIcons
              name="school-outline"
              size={20}
              color={colors.white}
            />
            <Text style={styles.bannerLabel}>ACADEMIC EXCELLENCE</Text>
          </View>
          <Text style={styles.bannerTitle}>
            Smarter Academics. Seamless Attendance.
          </Text>
          <Text style={styles.bannerSubtitle}>
            One platform to manage classes, monitor attendance, and simplify
            academic operations.
          </Text>
        </LinearGradient>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={26}
              color={colors.skyBlue}
            />
            <SectionTitle>Departments</SectionTitle>
          </View>
          <Text style={styles.departmentCount}>7 available</Text>
        </View>
        <View style={styles.departmentGrid}>
          {DEPARTMENTS.map((department) => (
            <DepartmentTile
              key={department.code}
              department={department}
              onPress={() =>
                router.push({
                  pathname: '/department/[code]',
                  params: {code: department.code},
                })
              }
            />
          ))}
        </View>
        <Text style={styles.years}>
          {STUDY_YEARS.join(' · ')}
        </Text>
      </Page>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {paddingTop: 6, paddingBottom: 18},
  banner: {
    padding: 18,
    borderRadius: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  bannerLabelPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: '#FFFFFF33',
  },
  bannerLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 14,
  },
  bannerSubtitle: {
    color: '#E7F5FF',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  sectionTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 13,
  },
  departmentCount: {fontSize: 13, color: colors.muted},
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  years: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});
