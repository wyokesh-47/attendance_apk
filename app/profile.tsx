import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {useAuth} from '@/providers/AuthProvider';

import {
  AppCard,
  AppHeader,
  DetailRow,
  Page,
  colors,
} from '@/components/ui';

export default function ProfileScreen() {
  const {profile, logout} = useAuth();
  return (
    <View style={styles.screen}>
      <AppHeader title="Account profile" onBack={() => router.back()} />
      <Page scroll style={styles.page}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons
            name="account-outline"
            color={colors.green}
            size={40}
          />
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.role}>{profile?.role}</Text>
        <View style={styles.details}>
          <DetailRow
            icon="email-outline"
            title="Email"
            value={profile?.email ?? ''}
          />
          <DetailRow
            icon="shield-outline"
            title="Account mode"
            value={profile?.approved ? 'Approved' : 'Pending approval'}
          />
          <DetailRow
            icon="database-outline"
            title="Attendance storage"
            value="Shared securely through Supabase"
          />
        </View>
        <AppCard
          onPress={() => { void logout(); }}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
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
