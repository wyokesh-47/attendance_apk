import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  AppCard,
  AppHeader,
  DemoBanner,
  DetailRow,
  Page,
  colors,
} from '@/components/ui';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader title="Staff profile" onBack={() => router.back()} />
      <Page scroll style={styles.page}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name="account-outline"
            color={colors.green}
            size={40}
          />
        </View>
        <Text style={styles.name}>Demo Staff</Text>
        <Text style={styles.role}>Staff account · Prototype</Text>
        <View style={styles.details}>
          <DetailRow
            icon="email-outline"
            title="Email"
            value="staff@demo.edu"
          />
          <DetailRow
            icon="shield-outline"
            title="Account mode"
            value="Demo only · No authentication"
          />
          <DetailRow
            icon="database-outline"
            title="Attendance storage"
            value="Saved locally on this device"
          />
        </View>
        <DemoBanner text="All displayed identities and records are fictional" />
        <AppCard
          onPress={() => {
            router.dismissAll();
            router.replace('/');
          }}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>↪   Return to demo sign in</Text>
        </AppCard>
      </Page>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  page: {paddingTop: 26},
  avatar: {
    alignSelf: 'center',
    marginTop: 15,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.ink,
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 14,
  },
  role: {color: colors.muted, textAlign: 'center', fontSize: 14, marginTop: 4},
  details: {gap: 10, marginTop: 22, marginBottom: 18},
  signOut: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  signOutText: {color: colors.green, fontSize: 14, fontWeight: '600'},
});
