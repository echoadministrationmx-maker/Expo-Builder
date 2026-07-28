import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/hooks/useColors';
import { normalizeRequestStatus } from '@/lib/residentData';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Incidencia = {
  id: string;
  categoria: string | null;
  descripcion: string | null;
  estado: string | null;
  created_at: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatFechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type StatusConfig = {
  label: string;
  bg: string;
  text: string;
  icon: 'clock' | 'refresh-cw' | 'check-circle' | 'help-circle';
};

function statusConfig(estado: string | null): StatusConfig {
  switch (normalizeRequestStatus(estado)) {
    case 'pendiente':
      return {
        label: 'Pendiente',
        bg: 'rgba(255,140,80,0.15)',
        text: '#d4640a',
        icon: 'clock',
      };
    case 'en_proceso':
      return {
        label: 'En proceso',
        bg: 'rgba(24,71,204,0.12)',
        text: '#1847CC',
        icon: 'refresh-cw',
      };
    case 'resuelto':
      return {
        label: 'Resuelto',
        bg: 'rgba(62,148,113,0.15)',
        text: '#2e7a57',
        icon: 'check-circle',
      };
    default:
      return {
        label: estado ?? 'Sin estado',
        bg: 'rgba(90,106,133,0.12)',
        text: '#5A6A85',
        icon: 'help-circle',
      };
  }
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function RequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidencias = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('incidencias')
      .select('id,categoria,descripcion,estado,created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (err) {
      setError('No pudimos cargar tus solicitudes. Verifica tu conexión e intenta de nuevo.');
    } else {
      setIncidencias((data ?? []) as Incidencia[]);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    void fetchIncidencias();
  }, [fetchIncidencias]);

  // ─── header ──────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>MANTENIMIENTO</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Solicitudes</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Mantén tu hogar en perfectas condiciones.
      </Text>
      <Pressable
        onPress={() => router.push('/request/new')}
        accessibilityRole="button"
        accessibilityLabel="Crear solicitud de mantenimiento"
        style={({ pressed }) => [styles.newButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
      >
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text style={[styles.newButtonText, { color: colors.primaryForeground }]}>Nueva solicitud</Text>
      </Pressable>
      <Text style={[styles.listTitle, { color: colors.foreground }]}>Tus solicitudes</Text>

      {/* estado de carga */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Cargando solicitudes…</Text>
        </View>
      )}

      {/* error */}
      {!loading && error && (
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="wifi-off" size={24} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
          <Pressable
            onPress={() => fetchIncidencias()}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Reintentar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  // ─── vacío ────────────────────────────────────────────────────────────────
  const ListEmpty =
    !loading && !error ? (
      <View style={styles.empty}>
        <Feather name="check-circle" size={28} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Todo en orden</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aún no has enviado ninguna solicitud.</Text>
      </View>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <FlatList
      data={!loading && !error ? incidencias : []}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 106 }]}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchIncidencias(true)} tintColor={colors.primary} />
      }
      renderItem={({ item }) => {
        const st = statusConfig(item.estado);
        return (
          <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.requestTop}>
              <View style={[styles.requestIcon, { backgroundColor: colors.accent }]}>
                <Feather name="tool" size={17} color={colors.accentForeground} />
              </View>
              {/* badge de estado inline */}
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <Feather name={st.icon} size={11} color={st.text} />
                <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
              </View>
            </View>
            {item.categoria ? (
              <Text style={[styles.requestTitle, { color: colors.foreground }]}>
                {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
              </Text>
            ) : null}
            {item.descripcion ? (
              <Text style={[styles.requestDetail, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.descripcion}
              </Text>
            ) : null}
            <Text style={[styles.requestDate, { color: colors.mutedForeground }]}>
              Enviado {formatFechaLarga(item.created_at)}
            </Text>
          </View>
        );
      }}
    />
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 39,
  },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 5 },
  newButton: {
    height: 50,
    borderRadius: 15,
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  newButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  listTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginTop: 30,
    marginBottom: 12,
  },

  // loading / error
  centered: { alignItems: 'center', paddingTop: 32, gap: 12 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // tarjetas
  requestCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  requestTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  requestDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  requestDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 12 },

  // vacío
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 25 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 12 },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
});
