import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/providers/AuthProvider';
import { colors } from '@/components/ui';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {backgroundColor: colors.background},
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />
          <Stack.Screen name="home" />
          <Stack.Screen name="class/[code]/[year]" />
          <Stack.Screen name="attendance/[code]/[year]/[hour]" />
          <Stack.Screen name="review/[code]/[year]/[hour]" />
          <Stack.Screen name="receipt/[code]/[year]/[hour]" />
          <Stack.Screen name="management" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="class-attendance" />
          <Stack.Screen name="department/[code]" />
          <Stack.Screen name="members" />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
