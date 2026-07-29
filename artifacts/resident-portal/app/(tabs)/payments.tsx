import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { SectionTitle } from "@/components/PortalUi";
import { paymentDataState, RESIDENT_PAYMENT_SELECT } from "@/lib/residentData";
import {
  BANK_TRANSFER_DETAILS,
  buildBankTransferReceiptEmailUrl,
  buildPaymentSupportUrl,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/paymentSupport";
import {
  isMercadoPagoCheckout,
  mercadoPagoErrorMessage,
} from "@/lib/mercadoPago";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Pago = {
  id_pago: number;
  monto: number;
  estado: "pendiente" | "pagado";
  fecha_vencimiento: string; // ISO date string
  concepto: string | null;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatFecha(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMonto(n: number): string {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function PaymentDetailRow({
  label,
  value,
  colors,
  selectable = false,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  selectable?: boolean;
}) {
  return (
    <View style={styles.paymentDetailRow}>
      <Text
        style={[styles.paymentDetailLabel, { color: colors.mutedForeground }]}
      >
        {label}
      </Text>
      <Text
        selectable={selectable}
        style={[styles.paymentDetailValue, { color: colors.foreground }]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodId>("bank_transfer");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchPagos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("pagos")
      .select(RESIDENT_PAYMENT_SELECT)
      .order("fecha_vencimiento", { ascending: false })
      .limit(250);

    if (err) {
      setError(
        "No pudimos cargar tus pagos. Verifica tu conexión e intenta de nuevo.",
      );
    } else {
      setPagos((data ?? []) as Pago[]);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPagos();
  }, [fetchPagos]);

  useEffect(() => {
    const paymentResultUrl = Linking.createURL("/payment-result");
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (!url.startsWith(paymentResultUrl)) return;

      // Expo Router handles the route itself. Explicitly close the browser
      // sheet/custom tab so the resident returns cleanly to the app.
      void WebBrowser.dismissBrowser().catch(() => undefined);
      void fetchPagos(true);
    });

    return () => subscription.remove();
  }, [fetchPagos]);

  // ── resumen de pendientes ──────────────────────────────────────────────────
  const pendientes = pagos.filter((p) => p.estado === "pendiente");
  const totalPendiente = pendientes.reduce((acc, p) => acc + (p.monto ?? 0), 0);
  const alCorriente = pendientes.length === 0;
  const paymentsReady = paymentDataState({ loading, error }) === "ready";

  // ── agrupación por año ────────────────────────────────────────────────────
  const grupos = groupByAnio(pagos);
  const selectedMethodLabel =
    PAYMENT_METHODS.find(({ id }) => id === selectedMethod)?.label ??
    "método seleccionado";

  const openPaymentSupport = (url: string, fallbackEmail: string) => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        "No pudimos abrir el enlace",
        `Puedes escribir a ${fallbackEmail}.`,
      );
    });
  };

  const requestPaymentInstructions = async () => {
    if (selectedMethod === "bank_transfer") {
      openPaymentSupport(
        buildBankTransferReceiptEmailUrl(totalPendiente),
        BANK_TRANSFER_DETAILS.receiptEmail,
      );
      return;
    }

    if (totalPendiente <= 0) {
      Alert.alert(
        "Sin saldo pendiente",
        "No tienes pagos pendientes por cubrir.",
      );
      return;
    }

    if (checkoutLoading) return;
    setCheckoutLoading(true);

    try {
      const returnUrl = Linking.createURL("/payment-result");
      const { data, error: invokeError } = await supabase.functions.invoke(
        "crear-preferencia",
        { body: { return_url: returnUrl } },
      );

      if (invokeError || !isMercadoPagoCheckout(data)) {
        const code =
          typeof data?.error === "string" ? data.error : invokeError?.message;
        throw new Error(code ?? "respuesta_invalida");
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(
        data.checkout_url,
        returnUrl,
        {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          controlsColor: colors.primary,
          preferEphemeralSession: true,
        },
      );

      if (browserResult.type === "success") {
        const callback = Linking.parse(browserResult.url);
        const callbackReference = callback.queryParams?.external_reference;
        const externalReference =
          typeof callbackReference === "string"
            ? callbackReference
            : data.intencion_id;

        router.push({
          pathname: "/payment-result",
          params: { external_reference: externalReference },
        });
      }
      await fetchPagos(true);
    } catch (checkoutError) {
      const code =
        checkoutError instanceof Error ? checkoutError.message : undefined;
      Alert.alert("No pudimos iniciar el pago", mercadoPagoErrorMessage(code), [
        { text: "Cerrar", style: "cancel" },
        {
          text: "Pedir ayuda",
          onPress: () =>
            openPaymentSupport(
              buildPaymentSupportUrl(selectedMethod, totalPendiente),
              "echoadministrationmx@gmail.com",
            ),
        },
      ]);
    } finally {
      setCheckoutLoading(false);
    }
  };

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
      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        RESUMEN FINANCIERO
      </Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Pagos</Text>

      {/* ── tarjeta de resumen ─────────────────────────────────────────── */}
      <View
        style={[styles.balanceCard, { backgroundColor: colors.foreground }]}
      >
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>SALDO PENDIENTE</Text>
          {paymentsReady && alCorriente ? (
            <View style={styles.paidBadge}>
              <Feather name="check" size={12} color="#dceee4" />
              <Text style={styles.paidBadgeText}>Al corriente</Text>
            </View>
          ) : paymentsReady ? (
            <View
              style={[
                styles.paidBadge,
                { backgroundColor: "rgba(255,180,130,0.18)" },
              ]}
            >
              <Feather name="alert-circle" size={12} color="#ffb482" />
              <Text style={[styles.paidBadgeText, { color: "#ffb482" }]}>
                {pendientes.length}{" "}
                {pendientes.length === 1 ? "periodo" : "periodos"}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.balance}>
          {paymentsReady ? formatMonto(totalPendiente) : "—"}
        </Text>

        {!paymentsReady ? (
          <Text style={styles.balanceNote}>
            Saldo no disponible. Intenta cargar tus pagos nuevamente.
          </Text>
        ) : alCorriente ? (
          <Text style={styles.balanceNote}>
            No tienes pagos pendientes. ¡Sigue así!
          </Text>
        ) : (
          <Text style={styles.balanceNote}>
            {pendientes.length === 1
              ? `Tienes 1 pago pendiente por ${formatMonto(totalPendiente)}.`
              : `Tienes ${pendientes.length} pagos pendientes que suman ${formatMonto(totalPendiente)}.`}
          </Text>
        )}
      </View>

      {!loading && !error ? (
        <View
          style={[
            styles.payCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.payCardHeader}>
            <View
              style={[
                styles.payCardIcon,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Feather name="credit-card" size={19} color={colors.foreground} />
            </View>
            <View style={styles.payCardHeading}>
              <Text style={[styles.payCardTitle, { color: colors.foreground }]}>
                Cómo realizar tu pago
              </Text>
              <Text
                style={[
                  styles.payCardSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                {alCorriente
                  ? "No tienes saldo pendiente. Consulta aquí las formas de pago disponibles."
                  : "Elige cómo prefieres pagar y solicita las instrucciones."}
              </Text>
            </View>
          </View>

          <View
            style={[styles.totalRow, { backgroundColor: colors.background }]}
          >
            <Text
              style={[styles.totalLabel, { color: colors.mutedForeground }]}
            >
              Total a pagar
            </Text>
            <Text style={[styles.totalAmount, { color: colors.foreground }]}>
              {formatMonto(totalPendiente)}
            </Text>
          </View>

          <Text style={[styles.methodLabel, { color: colors.mutedForeground }]}>
            MÉTODO DE PAGO
          </Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((method) => {
              const selected = method.id === selectedMethod;
              return (
                <Pressable
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Pagar con ${method.label}`}
                  style={({ pressed }) => [
                    styles.methodButton,
                    {
                      backgroundColor: selected
                        ? colors.secondary
                        : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={method.icon}
                    size={17}
                    color={
                      selected ? colors.foreground : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      {
                        color: selected
                          ? colors.foreground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {method.label}
                  </Text>
                  {selected ? (
                    <View
                      style={[
                        styles.selectedDot,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Feather
                        name="check"
                        size={9}
                        color={colors.primaryForeground}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {selectedMethod === "bank_transfer" ? (
            <View
              style={[
                styles.transferPanel,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.transferHeading}>
                <View
                  style={[
                    styles.bankMark,
                    { backgroundColor: colors.foreground },
                  ]}
                >
                  <Text style={styles.bankMarkText}>BBVA</Text>
                </View>
                <View style={styles.transferHeadingCopy}>
                  <Text
                    style={[styles.transferTitle, { color: colors.foreground }]}
                  >
                    Transferencia bancaria
                  </Text>
                  <Text
                    style={[
                      styles.transferBeneficiary,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {BANK_TRANSFER_DETAILS.beneficiary}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.transferDivider,
                  { backgroundColor: colors.border },
                ]}
              />

              <PaymentDetailRow
                label="Banco"
                value={BANK_TRANSFER_DETAILS.bank}
                colors={colors}
              />
              <PaymentDetailRow
                label="Cuenta"
                value={BANK_TRANSFER_DETAILS.account}
                colors={colors}
                selectable
              />

              <View
                style={[
                  styles.clabeBlock,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[styles.clabeLabel, { color: colors.mutedForeground }]}
                >
                  CLABE INTERBANCARIA
                </Text>
                <Text
                  selectable
                  style={[styles.clabeValue, { color: colors.foreground }]}
                >
                  {BANK_TRANSFER_DETAILS.formattedClabe}
                </Text>
                <Text
                  style={[styles.selectHint, { color: colors.mutedForeground }]}
                >
                  Mantén presionado el número para copiarlo.
                </Text>
              </View>

              <View
                style={[
                  styles.conceptBlock,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Feather name="edit-3" size={16} color={colors.foreground} />
                <View style={styles.conceptCopy}>
                  <Text
                    style={[
                      styles.conceptLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    ESCRIBE ESTE CONCEPTO
                  </Text>
                  <Text
                    style={[styles.conceptValue, { color: colors.foreground }]}
                  >
                    {BANK_TRANSFER_DETAILS.concept}
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.receiptNote, { color: colors.mutedForeground }]}
              >
                Después de transferir, envía el comprobante a{" "}
                <Text
                  selectable
                  style={[styles.receiptEmail, { color: colors.foreground }]}
                >
                  {BANK_TRANSFER_DETAILS.receiptEmail}
                </Text>
                .
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.mercadoPagoPanel,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.mercadoPagoIcon}>
                <Feather name="link" size={18} color="#007EB5" />
              </View>
              <View style={styles.mercadoPagoCopy}>
                <Text
                  style={[
                    styles.mercadoPagoTitle,
                    { color: colors.foreground },
                  ]}
                >
                  Pago seguro con Mercado Pago
                </Text>
                <Text
                  style={[
                    styles.mercadoPagoText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Paga con tarjeta o con los métodos disponibles en Mercado
                  Pago. La aplicación no guarda los datos de tu tarjeta.
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={() => void requestPaymentInstructions()}
            disabled={checkoutLoading}
            accessibilityRole="button"
            accessibilityState={{
              busy: checkoutLoading,
              disabled: checkoutLoading,
            }}
            accessibilityLabel={
              selectedMethod === "bank_transfer"
                ? "Enviar comprobante de transferencia"
                : `Pagar con ${selectedMethodLabel}`
            }
            style={({ pressed }) => [
              styles.instructionsButton,
              {
                backgroundColor: colors.primary,
                opacity: checkoutLoading ? 0.55 : pressed ? 0.78 : 1,
              },
            ]}
          >
            {checkoutLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primaryForeground}
              />
            ) : (
              <Feather
                name={selectedMethod === "bank_transfer" ? "mail" : "lock"}
                size={17}
                color={colors.primaryForeground}
              />
            )}
            <Text
              style={[
                styles.instructionsButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              {selectedMethod === "bank_transfer"
                ? "Enviar comprobante"
                : checkoutLoading
                  ? "Abriendo Mercado Pago…"
                  : "Pagar con Mercado Pago"}
            </Text>
            <Feather
              name="arrow-right"
              size={17}
              color={colors.primaryForeground}
            />
          </Pressable>

          <View style={styles.safetyNote}>
            <Feather name="shield" size={13} color={colors.mutedForeground} />
            <Text
              style={[styles.safetyNoteText, { color: colors.mutedForeground }]}
            >
              Verifica que la cuenta, CLABE y beneficiario coincidan antes de
              transferir. No envíes contraseñas ni datos de tarjeta.
            </Text>
          </View>
        </View>
      ) : null}

      {/* ── estado de carga ────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Cargando pagos…
          </Text>
        </View>
      )}

      {/* ── error ─────────────────────────────────────────────────────── */}
      {!loading && error && (
        <View
          style={[
            styles.errorCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="wifi-off" size={24} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            {error}
          </Text>
          <Pressable
            onPress={() => fetchPagos()}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text
              style={[styles.retryText, { color: colors.primaryForeground }]}
            >
              Reintentar
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── lista vacía (sin error, sin carga) ────────────────────────── */}
      {!loading && !error && pagos.length === 0 && (
        <View style={styles.centered}>
          <Feather name="check-circle" size={32} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Estás al corriente
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No tienes pagos registrados aún.
          </Text>
        </View>
      )}

      {/* ── historial agrupado por año ─────────────────────────────────── */}
      {!loading &&
        !error &&
        grupos.length > 0 &&
        grupos.map(([anio, lista]) => (
          <View key={anio}>
            <SectionTitle title={String(anio)} />
            <View
              style={[
                styles.historyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {lista.map((pago, index) => {
                const esPendiente = pago.estado === "pendiente";
                const iconName: "alert-circle" | "check" = esPendiente
                  ? "alert-circle"
                  : "check";
                const iconBg = esPendiente
                  ? "rgba(255,140,80,0.18)"
                  : colors.secondary;
                const iconColor = esPendiente ? "#ff8c50" : colors.foreground;
                const statusColor = esPendiente ? "#ff8c50" : "#3e9471";
                const statusLabel = esPendiente ? "Pendiente" : "Pagado";

                return (
                  <View
                    key={`${pago.id_pago}-${pago.fecha_vencimiento}-${index}`}
                    style={[
                      styles.paymentRow,
                      index < lista.length - 1 && {
                        borderBottomColor: colors.border,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <View
                      style={[styles.paymentIcon, { backgroundColor: iconBg }]}
                    >
                      <Feather name={iconName} size={16} color={iconColor} />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text
                        style={[
                          styles.paymentLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        {pago.concepto ?? "Cuota mensual"}
                      </Text>
                      <Text
                        style={[
                          styles.paymentDate,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatFecha(pago.fecha_vencimiento)}
                      </Text>
                    </View>
                    <View style={styles.paymentAmount}>
                      <Text
                        style={[styles.amount, { color: colors.foreground }]}
                      >
                        {formatMonto(pago.monto)}
                      </Text>
                      <Text
                        style={[styles.statusLabel, { color: statusColor }]}
                      >
                        {statusLabel}
                      </Text>
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

  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 39,
    marginBottom: 26,
  },

  // balance card
  balanceCard: { borderRadius: 22, padding: 22, marginBottom: 28 },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    color: "#b9c4ca",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.3,
  },
  paidBadge: {
    backgroundColor: "rgba(220,238,228,0.16)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paidBadgeText: {
    color: "#dceee4",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  balance: {
    color: "#fffdf9",
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    letterSpacing: -1.5,
    marginTop: 20,
  },
  balanceNote: {
    color: "#b9c4ca",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 280,
  },

  // payment instructions
  payCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },
  payCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  payCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payCardHeading: { flex: 1 },
  payCardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: -0.35,
  },
  payCardSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  totalRow: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  totalAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.4,
  },
  methodLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 9,
  },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  methodButton: {
    width: "48.5%",
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingRight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  methodButtonText: {
    flexShrink: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  selectedDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 8,
  },
  transferPanel: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    marginTop: 14,
  },
  transferHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  bankMark: {
    width: 53,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bankMarkText: {
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.7,
  },
  transferHeadingCopy: { flex: 1 },
  transferTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  transferBeneficiary: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  transferDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  paymentDetailRow: {
    minHeight: 29,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paymentDetailLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  paymentDetailValue: {
    flexShrink: 1,
    textAlign: "right",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  clabeBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  clabeLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1.1,
  },
  clabeValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 0.4,
    marginTop: 7,
  },
  selectHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 6,
  },
  conceptBlock: {
    borderRadius: 14,
    padding: 13,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  conceptCopy: { flex: 1 },
  conceptLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1,
  },
  conceptValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    marginTop: 3,
  },
  receiptNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  receiptEmail: {
    fontFamily: "Inter_600SemiBold",
  },
  mercadoPagoPanel: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mercadoPagoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#e5f5fb",
    alignItems: "center",
    justifyContent: "center",
  },
  mercadoPagoCopy: { flex: 1 },
  mercadoPagoTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  mercadoPagoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  instructionsButton: {
    minHeight: 52,
    borderRadius: 15,
    marginTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  instructionsButtonText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  safetyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 5,
    marginTop: 12,
  },
  safetyNoteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 10.5,
    lineHeight: 15,
  },

  // loading / error / empty
  centered: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 20,
    gap: 12,
  },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 4 },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 280,
  },

  // historial
  historyCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  paymentRow: {
    minHeight: 82,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  paymentDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 5 },
  paymentAmount: { alignItems: "flex-end" },
  amount: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  statusLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 5 },
});
