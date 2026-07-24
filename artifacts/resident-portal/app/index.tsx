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
  const [clave, setClave] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isSignedIn]);

  const handleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(clave, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al ingresar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Clave de acceso */}
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.input }]}>
          <Feather name="hash" size={18} color={colors.mutedForeground} />
          <TextInput
            value={clave}
            onChangeText={setClave}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Ej: 101A"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel="Clave de acceso"
            returnKeyType="next"
          />
        </View>

        {/* Contraseña */}
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.input }]}>
          <Feather name="lock" size={18} color={colors.mutedForeground} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Contraseña"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel="Contraseña"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '40' }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSignIn}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Ingresar al portal"
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed || isSubmitting ? 0.8 : 1 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Ingresar</Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>

        <Text style={[styles.helper, { color: colors.mutedForeground }]}>
          Tu administrador te proporcionó tu clave de acceso.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Feather name="shield" size={15} color={colors.mutedForeground} />
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Acceso privado para residentes</Text>
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
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1, lineHeight: 18 },
  primaryButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  helper: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  footerText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
});
