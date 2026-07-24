import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/hooks/useColors';
import { SectionTitle } from '@/components/PortalUi';

// ─── tipos ───────────────────────────────────────────────────────────────────

type Pago = {
  id: string;
  monto: number;
  estado: 'pendiente' | 'pagado';
  fecha_vencimiento: string;   // ISO date string
  concepto: string | null;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatFecha(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMonto(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function anioDeISO(iso: string): number {
  return new Date(`${iso}T12:00:00`).getFullYear();
}

function groupByAnio(pagos: Pago[]): [number, Pago[]][] {
  const map = new Map<number, Pago[]>();
  for (const p of pagos) {
    const y = anioDeISO(p.fecha_vencimiento);
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  // más reciente arriba
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPagos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('pagos')
      .select('*')
      .order('fecha_vencimiento', { ascending: false });

    if (err) {
      setError('No pudimos cargar tus pagos. Verifica tu conexión e intenta de nuevo.');
    } else {
      setPagos((data ?? []) as Pago[]);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => { void fetchPagos(); }, [fetchPagos]);

  // ── resumen de pendientes ──────────────────────────────────────────────────
  const pendientes = pagos.filter((p) => p.estado === 'pendiente');
  const totalPendiente = pendientes.reduce((acc, p) => acc + (p.monto ?? 0), 0);
  const alCorriente = pendientes.length === 0;

  // ── agrupación por año ────────────────────────────────────────────────────
  const grupos = groupByAnio(pagos);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchPagos(true)}
          tintColor={colors.primary}
        />
      }
    >
      {/* ── encabezado ─────────────────────────────────────────────────── */}
      <Text style={[styles.eyebrow, { color: colors.primary }]}>RESUMEN FINANCIERO</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Pagos</Text>

      {/* ── tarjeta de resumen ─────────────────────────────────────────── */}
      <View style={[styles.balanceCard, { backgroundColor: colors.foreground }]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>SALDO PENDIENTE</Text>
          {alCorriente ? (
            <View style={styles.paidBadge}>
              <Feather name="check" size={12} color="#dceee4" />
              <Text style={styles.paidBadgeText}>Al corriente</Text>
            </View>
          ) : (
            <View style={[styles.paidBadge, { backgroundColor: 'rgba(255,180,130,0.18)' }]}>
              <Feather name="alert-circle" size={12} color="#ffb482" />
              <Text style={[styles.paidBadgeText, { color: '#ffb482' }]}>
                {pendientes.length} {pendientes.length === 1 ? 'periodo' : 'periodos'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.balance}>{formatMonto(totalPendiente)}</Text>

        {alCorriente ? (
          <Text style={styles.balanceNote}>No tienes pagos pendientes. ¡Sigue así!</Text>
        ) : (
          <Text style={styles.balanceNote}>
            {pendientes.length === 1
              ? `Tienes 1 pago pendiente por ${formatMonto(totalPendiente)}.`
              : `Tienes ${pendientes.length} pagos pendientes que suman ${formatMonto(totalPendiente)}.`}
          </Text>
        )}
      </View>

      {/* ── estado de carga ────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Cargando pagos…</Text>
        </View>
      )}

      {/* ── error ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="wifi-off" size={24} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
          <Pressable
            onPress={() => fetchPagos()}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {/* ── lista vacía (sin error, sin carga) ────────────────────────── */}
      {!loading && !error && pagos.length === 0 && (
        <View style={styles.centered}>
          <Feather name="check-circle" size={32} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Estás al corriente</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No tienes pagos registrados aún.
          </Text>
        </View>
      )}

      {/* ── historial agrupado por año ─────────────────────────────────── */}
      {!loading && !error && grupos.length > 0 && grupos.map(([anio, lista]) => (
        <View key={anio}>
          <SectionTitle title={String(anio)} />
          <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {lista.map((pago, index) => {
              const esPendiente = pago.estado === 'pendiente';
              const iconName: 'alert-circle' | 'check' = esPendiente ? 'alert-circle' : 'check';
              const iconBg = esPendiente ? 'rgba(255,140,80,0.18)' : colors.secondary;
              const iconColor = esPendiente ? '#ff8c50' : colors.foreground;
              const statusColor = esPendiente ? '#ff8c50' : '#3e9471';
              const statusLabel = esPendiente ? 'Pendiente' : 'Pagado';

              return (
                <View
                  key={pago.id}
                  style={[
                    styles.paymentRow,
                    index < lista.length - 1 && {
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: iconBg }]}>
                    <Feather name={iconName} size={16} color={iconColor} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentLabel, { color: colors.foreground }]}>
                      {pago.concepto ?? 'Cuota mensual'}
                    </Text>
                    <Text style={[styles.paymentDate, { color: colors.mutedForeground }]}>
                      {formatFecha(pago.fecha_vencimiento)}
                    </Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={[styles.amount, { color: colors.foreground }]}>
                      {formatMonto(pago.monto)}
                    </Text>
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },

  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1, lineHeight: 39, marginBottom: 26 },

  // balance card
  balanceCard: { borderRadius: 22, padding: 22, marginBottom: 28 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: '#b9c4ca', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3 },
  paidBadge: {
    backgroundColor: 'rgba(220,238,228,0.16)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidBadgeText: { color: '#dceee4', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  balance: { color: '#fffdf9', fontFamily: 'Inter_700Bold', fontSize: 42, letterSpacing: -1.5, marginTop: 20 },
  balanceNote: { color: '#b9c4ca', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 280 },

  // loading / error / empty
  centered: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 20, gap: 12 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4 },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280 },

  // historial
  historyCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  paymentRow: { minHeight: 82, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  paymentDate: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  paymentAmount: { alignItems: 'flex-end' },
  amount: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  statusLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 5 },
});
