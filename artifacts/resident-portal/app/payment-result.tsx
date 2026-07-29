import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { type MercadoPagoIntentStatus } from "@/lib/mercadoPago";
import { supabase } from "@/lib/supabase";

type VerificationState =
  | { kind: "checking" }
  | { kind: "paid" }
  | { kind: "pending" }
  | { kind: "failed" };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PaymentResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    external_reference?: string | string[];
  }>();
  const externalReference = Array.isArray(params.external_reference)
    ? params.external_reference[0]
    : params.external_reference;
  const [verification, setVerification] = useState<VerificationState>({
    kind: "checking",
  });

  const verifyPayment = useCallback(async () => {
    if (!externalReference || !UUID_PATTERN.test(externalReference)) {
      setVerification({ kind: "pending" });
      return;
    }

    const { data, error } = await supabase
      .from("mp_intenciones")
      .select("estado")
      .eq("id", externalReference)
      .maybeSingle();

    if (error || !data) {
      setVerification({ kind: "pending" });
      return;
    }

    const status = data.estado as MercadoPagoIntentStatus;
    if (status === "pagada" || status === "pagada_prueba") {
      setVerification({ kind: "paid" });
    } else if (
      status === "fallida" ||
      status === "expirada" ||
      status === "reembolsada"
    ) {
      setVerification({ kind: "failed" });
    } else {
      setVerification({ kind: "pending" });
    }
  }, [externalReference]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      attempts += 1;
      await verifyPayment();
      if (!cancelled && attempts < 4) {
        timer = setTimeout(() => void poll(), 1500);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [verifyPayment]);

  const content = {
    checking: {
      icon: "clock" as const,
      title: "Verificando tu pago",
      body: "Estamos esperando la confirmación segura de Mercado Pago.",
    },
    paid: {
      icon: "check-circle" as const,
      title: "Pago confirmado",
      body: "Tu pago fue confirmado y tu estado de cuenta se actualizará automáticamente.",
    },
    pending: {
      icon: "clock" as const,
      title: "Pago en verificación",
      body: "Mercado Pago todavía está procesando la operación. Puedes volver a consultar tus pagos en unos minutos.",
    },
    failed: {
      icon: "alert-circle" as const,
      title: "Pago no completado",
      body: "La operación no se completó. No se actualizará tu saldo hasta que Mercado Pago confirme el cobro.",
    },
  }[verification.kind];

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          {verification.kind === "checking" ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Feather name={content.icon} size={32} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {content.title}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {content.body}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a pagos"
          onPress={() => router.replace("/(tabs)/payments")}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={[styles.buttonText, { color: colors.primaryForeground }]}
          >
            Volver a pagos
          </Text>
          <Feather
            name="arrow-right"
            size={17}
            color={colors.primaryForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 24,
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});
