import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { useColors } from '@/hooks/useColors';
import { IconButton, SectionTitle, StatusPill } from '@/components/PortalUi';
import { useResident } from '@/context/ResidentContext';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

type PerfilResidente = {
  perfil_id: string;
  condominio_id: string;
  unidades: string[];
  nombre: string;
};

type Pago = {
  id: string;
  monto: number;
  estado: string;
  fecha_vencimiento: string;
  concepto?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { announcements, requests, signOut } = useResident();

  const [perfil, setPerfil] = useState<PerfilResidente | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeRequest = requests[0];

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [perfilRes, pagosRes] = await Promise.all([
        supabase.rpc('validar_residente_jwt'),
        supabase.from('pagos').select('*').order('fecha_vencimiento', { ascending: false }),
      ]);

      if (perfilRes.error) throw new Error(perfilRes.error.message);
      if (pagosRes.error) throw new Error(pagosRes.error.message);

      // RPC may return single row or array depending on definition
      const rawPerfil = perfilRes.data;
      const resolvedPerfil: PerfilResidente | null = Array.isArray(rawPerfil)
        ? (rawPerfil[0] as PerfilResidente) ?? null
        : (rawPerfil as PerfilResidente | null);

      setPerfil(resolvedPerfil);
      setPagos((pagosRes.data as Pago[]) ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos cargar tu información.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchData();
  };

  // Derived values
  const firstName = perfil?.nombre?.split(' ')[0] ?? '—';
  const pagosPendientes = pagos.filter((p) => p.estado === 'pendiente');
  const saldoPendiente = pagosPendientes.reduce((sum, p) => sum + (p.monto ?? 0), 0);
  const proximoPago = pagosPendientes[pagosPendientes.length - 1]; // oldest pending
  const ultimosPagos = pagos.slice(0, 5);

  // ── Render: Loading ──
  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Cargando tu información…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Hola,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}.</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="bell" label="Notificaciones" onPress={() => {}} />
          <Pressable
            onPress={() => void signOut()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={[styles.avatar, { backgroundColor: colors.foreground }]}
          >
            <Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Error banner ── */}
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: '#fff1f0', borderColor: '#ffa39e' }]}>
          <Feather name="alert-circle" size={15} color="#cf1322" />
          <Text style={styles.errorBannerText}>
            No pudimos cargar tu información. Desliza hacia abajo para reintentar.
          </Text>
        </View>
      ) : null}

      {/* ── Balance card ── */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>TU CUENTA</Text>
          <Feather name="arrow-up-right" size={19} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.balance}>
          {saldoPendiente > 0 ? formatCurrency(saldoPendiente) : '$0.00'}
        </Text>
        <Text style={styles.balanceSub}>
          {saldoPendiente > 0 ? 'Saldo pendiente' : 'Saldo pendiente'}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.dueText}>
            {proximoPago
              ? `Vence ${formatDate(proximoPago.fecha_vencimiento)}`
              : 'Sin pagos pendientes'}
          </Text>
          {saldoPendiente === 0 ? (
            <View style={styles.upToDate}>
              <Feather name="check" size={12} color={colors.primary} />
              <Text style={[styles.upToDateText, { color: colors.primary }]}>Al corriente</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Quick actions ── */}
      <View style={styles.quickActions}>
        <Pressable
          onPress={() => router.push('/(tabs)/payments')}
          style={({ pressed }) => [
            styles.quickItem,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="credit-card" size={18} color={colors.foreground} />
          </View>
          <Text style={[styles.quickText, { color: colors.foreground }]}>Pagos</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/request/new')}
          style={({ pressed }) => [
            styles.quickItem,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
            <Feather name="tool" size={18} color={colors.accentForeground} />
          </View>
          <Text style={[styles.quickText, { color: colors.foreground }]}>Solicitar ayuda</Text>
        </Pressable>
      </View>

      {/* ── Últimos pagos ── */}
      {ultimosPagos.length > 0 ? (
        <>
          <SectionTitle
            title="Últimos pagos"
            action="Ver todos"
            onAction={() => router.push('/(tabs)/payments')}
          />
          <View style={[styles.pagosCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {saldoPendiente === 0 && pagosPendientes.length === 0 ? (
              <View style={styles.alCorrienteRow}>
                <Feather name="check-circle" size={20} color="#3e9471" />
                <Text style={[styles.alCorrienteText, { color: '#2d6f53' }]}>
                  Estás al corriente
                </Text>
              </View>
            ) : null}
            {ultimosPagos.map((pago, index) => {
              const isPendiente = pago.estado === 'pendiente';
              const isPagado = pago.estado === 'pagado';
              const dotColor = isPendiente ? '#e07b2a' : isPagado ? '#3e9471' : colors.mutedForeground;
              const amountColor = isPendiente ? '#c0580a' : isPagado ? '#2d6f53' : colors.foreground;
              const bgColor = isPendiente ? '#fff7f0' : isPagado ? '#f0faf4' : colors.background;

              return (
                <View
                  key={pago.id}
                  style={[
                    styles.pagoRow,
                    index < ultimosPagos.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                    { backgroundColor: bgColor },
                  ]}
                >
                  <View style={[styles.pagoDot, { backgroundColor: dotColor }]} />
                  <View style={styles.pagoCopy}>
                    <Text style={[styles.pagoConcepto, { color: colors.foreground }]} numberOfLines={1}>
                      {pago.concepto ?? 'Cuota de mantenimiento'}
                    </Text>
                    <Text style={[styles.pagoFecha, { color: colors.mutedForeground }]}>
                      {formatDate(pago.fecha_vencimiento)}
                    </Text>
                  </View>
                  <View style={styles.pagoRight}>
                    <Text style={[styles.pagoMonto, { color: amountColor }]}>
                      {formatCurrency(pago.monto)}
                    </Text>
                    <Text style={[styles.pagoEstado, { color: dotColor }]}>
                      {isPendiente ? 'Pendiente' : isPagado ? 'Pagado' : pago.estado}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : !error ? (
        <>
          <SectionTitle title="Últimos pagos" />
          <View style={[styles.pagosCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.alCorrienteRow}>
              <Feather name="check-circle" size={20} color="#3e9471" />
              <Text style={[styles.alCorrienteText, { color: '#2d6f53' }]}>
                Estás al corriente
              </Text>
            </View>
          </View>
        </>
      ) : null}

      {/* ── Building news ── */}
      <SectionTitle title="Noticias del edificio" action="Ver todo" onAction={() => {}} />
      <View style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {announcements.slice(0, 2).map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/announcement/${item.id}`)}
            style={({ pressed }) => [
              styles.newsRow,
              index === 0 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              { opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <View
              style={[
                styles.newsIcon,
                { backgroundColor: index === 0 ? colors.secondary : colors.accent },
              ]}
            >
              <Feather
                name={index === 0 ? 'sun' : 'users'}
                size={17}
                color={index === 0 ? colors.foreground : colors.accentForeground}
              />
            </View>
            <View style={styles.newsCopy}>
              <Text style={[styles.newsTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.newsExcerpt, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.excerpt}
              </Text>
              <Text style={[styles.newsDate, { color: colors.mutedForeground }]}>{item.date}</Text>
            </View>
            <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      {/* ── Maintenance ── */}
      <SectionTitle
        title="Mantenimiento"
        action="Ver todo"
        onAction={() => router.push('/(tabs)/requests')}
      />
      <Pressable
        onPress={() => router.push('/(tabs)/requests')}
        style={[
          styles.maintenanceCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.maintenanceIcon, { backgroundColor: colors.accent }]}>
          <Feather name="tool" size={18} color={colors.accentForeground} />
        </View>
        {activeRequest ? (
          <View style={styles.maintenanceCopy}>
            <Text style={[styles.maintenanceTitle, { color: colors.foreground }]} numberOfLines={1}>
              {activeRequest.title}
            </Text>
            <Text style={[styles.maintenanceDate, { color: colors.mutedForeground }]}>
              Enviado {activeRequest.createdAt}
            </Text>
          </View>
        ) : (
          <View style={styles.maintenanceCopy}>
            <Text style={[styles.maintenanceTitle, { color: colors.foreground }]}>
              Todo en orden
            </Text>
            <Text style={[styles.maintenanceDate, { color: colors.mutedForeground }]}>
              Sin solicitudes activas
            </Text>
          </View>
        )}
        {activeRequest ? (
          <StatusPill status={activeRequest.status} />
        ) : (
          <Feather name="check-circle" size={21} color="#3e9471" />
        )}
      </Pressable>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  content: { paddingHorizontal: 20 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.7, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fffdf9', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  // Error banner
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18 },
  errorBannerText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#cf1322', flex: 1, lineHeight: 18 },
  // Balance card
  balanceCard: { borderRadius: 22, padding: 20, minHeight: 185 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  balance: { color: '#fffdf9', fontFamily: 'Inter_700Bold', fontSize: 44, letterSpacing: -1.7, marginTop: 20 },
  balanceSub: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 23 },
  dueText: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_400Regular', fontSize: 12 },
  upToDate: { backgroundColor: '#fffdf9', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  upToDateText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  // Quick actions
  quickActions: { flexDirection: 'row', gap: 10, marginVertical: 25 },
  quickItem: { flex: 1, minHeight: 84, borderRadius: 18, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  quickIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  // Pagos
  pagosCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 27 },
  pagoRow: { paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  pagoDot: { width: 8, height: 8, borderRadius: 4 },
  pagoCopy: { flex: 1 },
  pagoConcepto: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  pagoFecha: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  pagoRight: { alignItems: 'flex-end' },
  pagoMonto: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: -0.3 },
  pagoEstado: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  alCorrienteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 18 },
  alCorrienteText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  // News
  newsCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 27 },
  newsRow: { minHeight: 92, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  newsIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  newsCopy: { flex: 1 },
  newsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  newsExcerpt: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  newsDate: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 6 },
  // Maintenance
  maintenanceCard: { borderRadius: 18, borderWidth: 1, minHeight: 75, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  maintenanceIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  maintenanceCopy: { flex: 1 },
  maintenanceTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  maintenanceDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5 },
});
