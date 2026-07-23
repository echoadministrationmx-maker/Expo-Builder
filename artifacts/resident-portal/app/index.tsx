import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useResident } from '@/context/ResidentContext';

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLoading, isSignedIn, signIn } = useResident();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isSignedIn]);

  const handleSignIn = async () => {
    if (!email.includes('@') || accessCode.trim().length < 4) {
      setError('Enter your email and a 4-character access code.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    await signIn(email, accessCode);
    setIsSubmitting(false);
    router.replace('/(tabs)');
  };

  if (isLoading || isSignedIn) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBrand}>
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <Feather name="home" size={20} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>Haven</Text>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR HOME, CONNECTED</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome home.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Everything you need to feel at home, right at your fingertips.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Resident sign in</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.input }]}>
          <Feather name="mail" size={18} color={colors.mutedForeground} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel="Email address"
          />
        </View>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.input }]}>
          <Feather name="key" size={18} color={colors.mutedForeground} />
          <TextInput
            value={accessCode}
            onChangeText={setAccessCode}
            secureTextEntry
            placeholder="Access code"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel="Access code"
          />
        </View>
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable
          onPress={handleSignIn}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Continue to resident portal"
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed || isSubmitting ? 0.8 : 1 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Continue</Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>
          Your building manager provided your access code.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Feather name="shield" size={15} color={colors.mutedForeground} />
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Private resident access</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 18 },
  brandMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  hero: { marginTop: 30 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5, lineHeight: 47 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, marginTop: 12, maxWidth: 320 },
  form: { gap: 12 },
  formLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginBottom: 3 },
  inputWrap: { height: 56, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, height: '100%' },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: -2 },
  primaryButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  helper: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  footerText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
});