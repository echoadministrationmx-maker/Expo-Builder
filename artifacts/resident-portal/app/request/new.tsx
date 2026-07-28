import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/hooks/useColors';
import { IconButton } from '@/components/PortalUi';

// ─── tipos ────────────────────────────────────────────────────────────────────

type RpcResult = { ok: boolean; id?: string; error?: string };

// ─── constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: 'plomería', label: 'Plomería', icon: 'droplet' as const },
  { value: 'electricidad', label: 'Electricidad', icon: 'zap' as const },
  { value: 'gas', label: 'Gas', icon: 'wind' as const },
  { value: 'carpintería', label: 'Carpintería', icon: 'package' as const },
  { value: 'limpieza', label: 'Limpieza', icon: 'trash-2' as const },
  { value: 'otro', label: 'Otro', icon: 'more-horizontal' as const },
];

const ERROR_MAP: Record<string, string> = {
  descripcion_requerida: 'Por favor describe el problema.',
  categoria_requerida: 'Selecciona una categoría.',
  sin_unidad: 'No encontramos tu unidad. Contacta a tu administrador.',
  no_autorizado: 'Tu sesión expiró. Vuelve a iniciar sesión.',
};

function mapError(code: string | undefined): string {
  if (!code) return 'Ocurrió un error al enviar tu solicitud. Intenta de nuevo.';
  return ERROR_MAP[code] ?? 'Ocurrió un error al enviar tu solicitud. Intenta de nuevo.';
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function NewRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [categoria, setCategoria] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!enviado) return undefined;

    const timer = setTimeout(() => router.replace('/(tabs)/requests'), 1800);
    return () => clearTimeout(timer);
  }, [enviado]);

  const submit = async () => {
    setError('');
    if (!categoria) {
      setError('Selecciona una categoría.');
      return;
    }
    if (descripcion.trim().length < 8) {
      setError('Por favor describe el problema con un poco más de detalle.');
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('crear_solicitud_mantenimiento', {
      p_categoria: categoria,
      p_descripcion: descripcion.trim(),
      p_foto: null,
    });
    setLoading(false);

    if (rpcError) {
      setError('No pudimos conectar con el servidor. Intenta de nuevo.');
      return;
    }

    const result = data as RpcResult;
    if (result?.ok) {
      setEnviado(true);
    } else {
      setError(mapError(result?.error));
    }
  };

  // ─── pantalla de éxito ───────────────────────────────────────────────────
  if (enviado) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.successIcon, { backgroundColor: 'rgba(62,148,113,0.15)' }]}>
          <Feather name="check-circle" size={32} color="#2e7a57" />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Tu solicitud fue enviada</Text>
        <Text style={[styles.successText, { color: colors.mutedForeground }]}>
          El equipo del edificio la revisará pronto. Podrás consultar su estado en Solicitudes.
        </Text>
      </View>
    );
  }

  // ─── formulario ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom, 18) + 80,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* encabezado */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" label="Regresar" onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nueva solicitud</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* intro */}
        <View style={[styles.introIcon, { backgroundColor: colors.accent }]}>
          <Feather name="tool" size={22} color={colors.accentForeground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>¿En qué podemos ayudarte?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Cuéntale al equipo del edificio qué está pasando en tu departamento.
        </Text>

        {/* selector de categoría */}
        <Text style={[styles.label, { color: colors.foreground }]}>Categoría</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIAS.map((cat) => {
            const selected = categoria === cat.value;
            return (
              <Pressable
                key={cat.value}
                onPress={() => setCategoria(cat.value)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={cat.icon}
                  size={15}
                  color={selected ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: selected ? colors.primaryForeground : colors.foreground,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* descripción */}
        <Text style={[styles.label, { color: colors.foreground }]}>Descripción</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          maxLength={2000}
          textAlignVertical="top"
          placeholder="Describe el problema con el mayor detalle posible..."
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Descripción del problema"
          style={[
            styles.textarea,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.input,
            },
          ]}
        />

        {/* error */}
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </ScrollView>

      {/* botón fijo en la parte inferior */}
      <View
        style={[
          styles.bottom,
          {
            paddingBottom: Math.max(insets.bottom, 18),
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={submit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Enviar solicitud de mantenimiento"
          style={({ pressed }) => [
            styles.submit,
            {
              backgroundColor: colors.primary,
              opacity: loading || pressed ? 0.75 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Enviar solicitud</Text>
              <Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  headerSpacer: { width: 42 },

  introIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 28,
    maxWidth: 325,
  },

  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 10 },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  categoryLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },

  textarea: {
    height: 140,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 10 },

  bottom: { paddingHorizontal: 20, paddingTop: 10 },
  submit: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },

  // éxito
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 300,
  },
});
