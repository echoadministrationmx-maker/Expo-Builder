import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { SectionTitle, StatusPill } from "@/components/PortalUi";
import { useResident } from "@/context/ResidentContext";
import { supabase } from "@/lib/supabase";
import {
  formatResidentDate,
  getNextPendingPayment,
  normalizeRequestStatus,
  paymentDataState,
  RESIDENT_PAYMENT_SELECT,
} from "@/lib/residentData";
import {
  normalizeResidentProfile,
  type ResidentProfile,
} from "@/lib/residentProfile";

// ── Types ────────────────────────────────────────────────────────────────────

type Pago = {
  id_pago: number;
  monto: number;
  estado: string;
  fecha_vencimiento: string;
  concepto?: string;
};

type IncidenciaResumen = {
  id: string;
  categoria: string | null;
  estado: string | null;
  created_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useResident();

  const [perfil, setPerfil] = useState<ResidentProfile | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [activeRequest, setActiveRequest] = useState<IncidenciaResumen | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    setPaymentsError(null);
    try {
      const [perfilRes, pagosRes, incidenciaRes] = await Promise.all([
        supabase.rpc("obtener_perfil_residente"),
        supabase
          .from("pagos")
          .select(RESIDENT_PAYMENT_SELECT)
          .order("fecha_vencimiento", { ascending: false })
          .limit(250),
        supabase
          .from("incidencias")
          .select("id,categoria,estado,created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const failedSections: string[] = [];

      if (perfilRes.error) {
        failedSections.push("perfil");
      } else {
        const resolvedProfile = normalizeResidentProfile(perfilRes.data);
        if (resolvedProfile) setPerfil(resolvedProfile);
        else failedSections.push("perfil");
      }

      if (pagosRes.error) {
        failedSections.push("pagos");
        setPaymentsError(pagosRes.error.message);
      } else {
        setPagos((pagosRes.data as Pago[]) ?? []);
      }

      if (incidenciaRes.error) {
        failedSections.push("solicitudes");
      } else {
        setActiveRequest(
          (incidenciaRes.data as IncidenciaResumen | null) ?? null,
        );
      }

      if (failedSections.length > 0) {
        if (__DEV__) {
          console.warn("Resident data sections failed", {
            sections: failedSections,
            profile: perfilRes.error?.message,
            payments: pagosRes.error?.message,
            requests: incidenciaRes.error?.message,
          });
        }
        setError(`No pudimos cargar: ${failedSections.join(", ")}.`);
      }
    } catch (e) {
      setPaymentsError(
        e instanceof Error ? e.message : "No pudimos cargar tus pagos.",
      );
      setError(
        e instanceof Error ? e.message : "No pudimos cargar tu información.",
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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  // Derived values
  const firstName = perfil?.name?.split(" ")[0] ?? "Residente";
  const pagosPendientes = pagos.filter((p) => p.estado === "pendiente");
  const saldoPendiente = pagosPendientes.reduce(
    (sum, p) => sum + (p.monto ?? 0),
    0,
  );
  const proximoPago = getNextPendingPayment(pagos);
  const ultimosPagos = pagos.slice(0, 5);
  const paymentsReady =
    paymentDataState({ loading, error: paymentsError }) === "ready";

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
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Hola,
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {firstName}.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/(tabs)/account")}
            accessibilityRole="button"
            accessibilityLabel="Abrir mi cuenta"
            style={[styles.avatar, { backgroundColor: colors.foreground }]}
          >
            <Text style={styles.avatarText}>
              {firstName.slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSignOut()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Feather name="log-out" size={15} color={colors.foreground} />
            <Text style={[styles.logoutText, { color: colors.foreground }]}>
              Salir
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Error banner ── */}
      {error ? (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: "#fff1f0", borderColor: "#ffa39e" },
          ]}
        >
          <Feather name="alert-circle" size={15} color="#cf1322" />
          <Text style={styles.errorBannerText}>
            No pudimos cargar tu información. Desliza hacia abajo para
            reintentar.
          </Text>
        </View>
      ) : null}

      {/* ── Balance card ── */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>TU CUENTA</Text>
          <Feather
            name="arrow-up-right"
            size={19}
            color="rgba(255,255,255,0.8)"
          />
        </View>
        <Text style={styles.balance}>
          {paymentsReady
            ? saldoPendiente > 0
              ? formatCurrency(saldoPendiente)
              : "$0.00"
            : "—"}
        </Text>
        <Text style={styles.balanceSub}>
          {paymentsReady
            ? saldoPendiente > 0
              ? "Saldo pendiente"
              : "Sin saldo pendiente"
            : "Saldo no disponible"}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.dueText}>
            {!paymentsReady
              ? "Desliza hacia abajo para reintentar"
              : proximoPago
                ? `Vence ${formatResidentDate(proximoPago.fecha_vencimiento)}`
                : "Sin pagos pendientes"}
          </Text>
          {paymentsReady && saldoPendiente === 0 ? (
            <View style={styles.upToDate}>
              <Feather name="check" size={12} color={colors.primary} />
              <Text style={[styles.upToDateText, { color: colors.primary }]}>
                Al corriente
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Quick actions ── */}
      <View style={styles.quickActions}>
        <Pressable
          onPress={() => router.push("/(tabs)/payments")}
          style={({ pressed }) => [
            styles.quickItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View
            style={[styles.quickIcon, { backgroundColor: colors.secondary }]}
          >
            <Feather name="credit-card" size={18} color={colors.foreground} />
          </View>
          <Text style={[styles.quickText, { color: colors.foreground }]}>
            Pagos
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/request/new")}
          style={({ pressed }) => [
            styles.quickItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
            <Feather name="tool" size={18} color={colors.accentForeground} />
          </View>
          <Text style={[styles.quickText, { color: colors.foreground }]}>
            Solicitar ayuda
          </Text>
        </Pressable>
      </View>

      {/* ── Últimos pagos ── */}
      {ultimosPagos.length > 0 ? (
        <>
          <SectionTitle
            title="Últimos pagos"
            action="Ver todos"
            onAction={() => router.push("/(tabs)/payments")}
          />
          <View
            style={[
              styles.pagosCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {saldoPendiente === 0 && pagosPendientes.length === 0 ? (
              <View style={styles.alCorrienteRow}>
                <Feather name="check-circle" size={20} color="#3e9471" />
                <Text style={[styles.alCorrienteText, { color: "#2d6f53" }]}>
                  Estás al corriente
                </Text>
              </View>
            ) : null}
            {ultimosPagos.map((pago, index) => {
              const isPendiente = pago.estado === "pendiente";
              const isPagado = pago.estado === "pagado";
              const dotColor = isPendiente
                ? "#e07b2a"
                : isPagado
                  ? "#3e9471"
                  : colors.mutedForeground;
              const amountColor = isPendiente
                ? "#c0580a"
                : isPagado
                  ? "#2d6f53"
                  : colors.foreground;
              const bgColor = isPendiente
                ? "#fff7f0"
                : isPagado
                  ? "#f0faf4"
                  : colors.background;

              return (
                <View
                  key={`${pago.id_pago}-${pago.fecha_vencimiento}-${index}`}
                  style={[
                    styles.pagoRow,
                    index < ultimosPagos.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                    { backgroundColor: bgColor },
                  ]}
                >
                  <View
                    style={[styles.pagoDot, { backgroundColor: dotColor }]}
                  />
                  <View style={styles.pagoCopy}>
                    <Text
                      style={[
                        styles.pagoConcepto,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {pago.concepto ?? "Cuota de mantenimiento"}
                    </Text>
                    <Text
                      style={[
                        styles.pagoFecha,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {formatResidentDate(pago.fecha_vencimiento)}
                    </Text>
                  </View>
                  <View style={styles.pagoRight}>
                    <Text style={[styles.pagoMonto, { color: amountColor }]}>
                      {formatCurrency(pago.monto)}
                    </Text>
                    <Text style={[styles.pagoEstado, { color: dotColor }]}>
                      {isPendiente
                        ? "Pendiente"
                        : isPagado
                          ? "Pagado"
                          : pago.estado}
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
          <View
            style={[
              styles.pagosCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.alCorrienteRow}>
              <Feather name="check-circle" size={20} color="#3e9471" />
              <Text style={[styles.alCorrienteText, { color: "#2d6f53" }]}>
                Estás al corriente
              </Text>
            </View>
          </View>
        </>
      ) : null}

      {/* ── Maintenance ── */}
      <SectionTitle
        title="Mantenimiento"
        action="Ver todo"
        onAction={() => router.push("/(tabs)/requests")}
      />
      <Pressable
        onPress={() => router.push("/(tabs)/requests")}
        style={[
          styles.maintenanceCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.maintenanceIcon, { backgroundColor: colors.accent }]}
        >
          <Feather name="tool" size={18} color={colors.accentForeground} />
        </View>
        {activeRequest ? (
          <View style={styles.maintenanceCopy}>
            <Text
              style={[styles.maintenanceTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {activeRequest.categoria
                ? activeRequest.categoria.charAt(0).toUpperCase() +
                  activeRequest.categoria.slice(1)
                : "Solicitud de mantenimiento"}
            </Text>
            <Text
              style={[
                styles.maintenanceDate,
                { color: colors.mutedForeground },
              ]}
            >
              Enviado {formatResidentDate(activeRequest.created_at)}
            </Text>
          </View>
        ) : (
          <View style={styles.maintenanceCopy}>
            <Text
              style={[styles.maintenanceTitle, { color: colors.foreground }]}
            >
              Todo en orden
            </Text>
            <Text
              style={[
                styles.maintenanceDate,
                { color: colors.mutedForeground },
              ]}
            >
              Sin solicitudes activas
            </Text>
          </View>
        )}
        {activeRequest ? (
          <StatusPill status={normalizeRequestStatus(activeRequest.estado)} />
        ) : (
          <Feather name="check-circle" size={21} color="#3e9471" />
        )}
      </Pressable>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  content: { paddingHorizontal: 20 },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14 },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 27,
    letterSpacing: -0.7,
    marginTop: 3,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fffdf9",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  logoutButton: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  errorBannerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#cf1322",
    flex: 1,
    lineHeight: 18,
  },
  // Balance card
  balanceCard: { borderRadius: 22, padding: 20, minHeight: 185 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
  },
  balance: {
    color: "#fffdf9",
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    letterSpacing: -1.7,
    marginTop: 20,
  },
  balanceSub: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 23,
  },
  dueText: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  upToDate: {
    backgroundColor: "#fffdf9",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upToDateText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  // Quick actions
  quickActions: { flexDirection: "row", gap: 10, marginVertical: 25 },
  quickItem: {
    flex: 1,
    minHeight: 84,
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    justifyContent: "space-between",
  },
  quickIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  // Pagos
  pagosCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 27,
  },
  pagoRow: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  pagoDot: { width: 8, height: 8, borderRadius: 4 },
  pagoCopy: { flex: 1 },
  pagoConcepto: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pagoFecha: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 },
  pagoRight: { alignItems: "flex-end" },
  pagoMonto: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: -0.3 },
  pagoEstado: { fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 2 },
  alCorrienteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  alCorrienteText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  // Maintenance
  maintenanceCard: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 75,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  maintenanceIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  maintenanceCopy: { flex: 1 },
  maintenanceTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  maintenanceDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 5,
  },
});
