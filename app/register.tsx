import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  AppTextInput,
  AppHeader,
  ErrorMessage,
  FieldLabel,
  Page,
  PrimaryButton,
  colors,
} from '@/components/ui';
import {register as registerAccount} from '@/services/cloud';

export default function RegistrationScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function register() {
    setError('');
    if (!name.trim() || !email.includes('@')) {
      setError('Enter your display name and a valid email.');
      return;
    }
    setLoading(true);
    try {
      await registerAccount(name, email, password);
      Alert.alert(
        'Registration submitted',
        'Confirm your email if requested, then wait for Principal approval before signing in.',
        [{text: 'Return to sign in', onPress: () => router.replace('/')}],
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page scroll>
      <AppHeader title="Create staff account" onBack={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.title}>Create staff account</Text>
        <Text style={styles.subtitle}>
          Register your staff account for Principal approval.
        </Text>
        <View style={styles.field}>
          <FieldLabel>Full name</FieldLabel>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons
              name="account-outline"
              size={20}
              color={colors.muted}
            />
            <AppTextInput
              accessibilityLabel="Full name"
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Your full name"
              value={name}
              style={styles.inlineInput}
            />
          </View>
        </View>
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
          <AppTextInput accessibilityLabel="Password" secureTextEntry autoCapitalize="none"
            placeholder="At least 8 characters" value={password} onChangeText={setPassword} />
        </View>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        <View style={styles.action}>
          <PrimaryButton
            label="Create account"
            onPress={register}
            loading={loading}
          />
        </View>
        <Text style={styles.note}>
          New staff registrations stay pending until Principal approval. You will receive access after approval and class assignment.
        </Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {padding: 20},
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 20,
  },
  subtitle: {color: colors.muted, fontSize: 14, marginTop: 6, marginBottom: 20},
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
  action: {marginTop: 24},
  note: {color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 16},
});
