import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { YearTile } from '@/components/tiles';
import {
  AppHeader,
  Page,
  colors,
} from '@/components/ui';
import { DEPARTMENTS, STUDY_YEARS, getStudents } from '@/data/demoData';

export default function DepartmentScreen() {
  const {code: rawCode} = useLocalSearchParams<{code: string}>();
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const department = DEPARTMENTS.find((item) => item.code === code);
  if (!department) {
    return <InvalidDepartment />;
  }

  return (
    <View style={styles.screen}>
      <AppHeader title={department.name} onBack={() => router.back()} />
      <Page scroll style={styles.page}>
        <Text style={styles.title}>Choose a year</Text>
        <Text style={styles.subtitle}>
          Select an academic year to continue.
        </Text>
        <View style={styles.tiles}>
          {STUDY_YEARS.map((_, index) => {
            const year = index + 1;
            const classroom = {department, year};
            return (
              <YearTile
                key={year}
                classroom={classroom}
                count={getStudents(classroom).length}
                onPress={() =>
                  router.push({
                    pathname: '/class/[code]/[year]',
                    params: {code: department.code, year: String(year)},
                  })
                }
              />
            );
          })}
        </View>
      </Page>
    </View>
  );
}

function InvalidDepartment() {
  return (
    <View style={styles.invalid}>
      <Text style={styles.subtitle}>Department not found.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  page: {paddingTop: 40},
  title: {fontSize: 25, fontWeight: '800', color: colors.ink},
  subtitle: {fontSize: 14, color: colors.muted, marginTop: 6},
  tiles: {gap: 12, marginTop: 18, marginBottom: 18},
  invalid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
