import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {ActivityIndicator, View} from 'react-native';
import {AuthProvider, useAuth} from '@/providers/AuthProvider';

import { colors } from '@/components/ui';

export default function RootLayout() {
  return <AuthProvider><Navigation /></AuthProvider>;
}

function Navigation() {
  const {profile, loading} = useAuth();
  if (loading) return <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}><ActivityIndicator /></View>;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: colors.background},
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={!profile}>
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(profile?.approved && profile.role === 'staff')}>
          <Stack.Screen name="home" />
          <Stack.Screen name="class/[code]/[year]" />
          <Stack.Screen name="attendance/[code]/[year]/[hour]" />
          <Stack.Screen name="review/[code]/[year]/[hour]" />
          <Stack.Screen name="receipt/[code]/[year]/[hour]" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(profile?.approved && (profile.role === 'principal' || profile.role === 'hod'))}>
          <Stack.Screen name="management" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(profile?.approved)}>
          <Stack.Screen name="profile" />
          <Stack.Screen name="class-attendance" />
          <Stack.Screen name="department/[code]" />
          <Stack.Screen name="members" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
