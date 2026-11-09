import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppTextInput,
  ErrorMessage,
  FieldLabel,
  Page,
  PrimaryButton,
  BrandMark,
  colors,
} from '@/components/ui';
import { signInDemoStaff } from '@/services/demoAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setError('');
    setLoading(true);
    try {
      await signInDemoStaff(email, password);
      router.replace('/home');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Page
        scroll
        style={styles.page}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
      >
        <View style={styles.content}>
          <BrandMark large />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to manage today’s class attendance.
          </Text>
          <View style={styles.field}>
            <FieldLabel>Staff email</FieldLabel>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={colors.muted}
              />
              <AppTextInput
                accessibilityLabel="Staff email"
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="name@example.com"
                value={email}
                style={styles.inlineInput}
              />
            </View>
          </View>

          <View style={styles.field}>
            <FieldLabel>Password</FieldLabel>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={colors.muted}
              />
              <AppTextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                style={styles.inlineInput}
              />
            </View>
          </View>

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <PrimaryButton
            label="Sign in"
            onPress={signIn}
            loading={loading}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/register')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              New staff member? Create an account
            </Text>
          </Pressable>
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {flex: 1},
  page: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24},
  content: {width: '100%', maxWidth: 430, alignSelf: 'center', gap: 0},
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 28,
  },
  subtitle: {color: colors.muted, fontSize: 15, marginTop: 8, marginBottom: 24},
  field: {marginTop: 19},
  inputWrap: {
    minHeight: 54,
    paddingLeft: 15,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
  },
  inlineInput: {flex: 1, minHeight: 50, borderWidth: 0, backgroundColor: 'transparent'},
  linkButton: {alignItems: 'center', paddingVertical: 14, marginTop: 4},
  linkText: {color: colors.green, fontSize: 14, fontWeight: '600'},
});
