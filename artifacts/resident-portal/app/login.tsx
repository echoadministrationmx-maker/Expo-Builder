import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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

const PRIVACY_URL = 'https://www.echoadministration.com/privacidad';
const SUPPORT_URL = 'mailto:echoadministrationmx@gmail.com?subject=Soporte%20app%20Echo';

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
        <Text style={[styles.brandName, { color: colors.foreground }]}>Echo</Text>
      </View>

      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>TU HOGAR, CONECTADO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Bienvenido a casa.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Todo lo que necesitas para sentirte en casa, en la palma de tu mano.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.formLabel, { color: colors.foreground }]}>Iniciar sesión</Text>

        {/* Clave de acceso */}
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.input }]}>
          <Feather name="hash" size={18} color={colors.mutedForeground} />
          <TextInput
            value={clave}
            onChangeText={setClave}
            maxLength={64}
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
            maxLength={256}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
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
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + '18',
                borderColor: colors.destructive + '40',
              },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSignIn}
          disabled={isSubmitting || !clave.trim() || !password}
          accessibilityRole="button"
          accessibilityLabel="Ingresar al portal"
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isSubmitting || !clave.trim() || !password ? 0.6 : 1,
            },
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
        <View style={styles.footerSecurity}>
          <Feather name="shield" size={15} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Acceso privado para residentes</Text>
        </View>
        <View style={styles.footerLinks}>
          <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Privacidad</Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: colors.mutedForeground }]}>•</Text>
          <Pressable onPress={() => void Linking.openURL(SUPPORT_URL)} hitSlop={8}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Soporte</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 18,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  hero: { marginTop: 30 },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    letterSpacing: -1.5,
    lineHeight: 47,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 320,
  },
  form: { gap: 12 },
  formLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginBottom: 3 },
  inputWrap: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    height: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  helper: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  footer: { alignItems: 'center', gap: 8 },
  footerSecurity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  footerLink: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  footerDot: { fontFamily: 'Inter_400Regular', fontSize: 11 },
});
