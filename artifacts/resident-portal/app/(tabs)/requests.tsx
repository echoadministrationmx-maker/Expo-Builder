import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { normalizeRequestStatus } from "@/lib/residentData";
import { COMMUNITY_RESOURCES } from "@/lib/communityResources";
import {
  ActiveSurvey,
  normalizeActiveSurveys,
  surveyPercentage,
} from "@/lib/surveys";

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
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type StatusConfig = {
  label: string;
  bg: string;
  text: string;
  icon: "clock" | "refresh-cw" | "check-circle" | "help-circle";
};

function statusConfig(estado: string | null): StatusConfig {
  switch (normalizeRequestStatus(estado)) {
    case "pendiente":
      return {
        label: "Pendiente",
        bg: "rgba(255,140,80,0.15)",
        text: "#d4640a",
        icon: "clock",
      };
    case "en_proceso":
      return {
        label: "En proceso",
        bg: "rgba(24,71,204,0.12)",
        text: "#1847CC",
        icon: "refresh-cw",
      };
    case "resuelto":
      return {
        label: "Resuelto",
        bg: "rgba(62,148,113,0.15)",
        text: "#2e7a57",
        icon: "check-circle",
      };
    default:
      return {
        label: estado ?? "Sin estado",
        bg: "rgba(90,106,133,0.12)",
        text: "#5A6A85",
        icon: "help-circle",
      };
  }
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function RequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [surveys, setSurveys] = useState<ActiveSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [votingSurveyId, setVotingSurveyId] = useState<number | null>(null);

  const fetchContent = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSurveyError(null);

    const [requestsResult, surveysResult] = await Promise.all([
      supabase
        .from("incidencias")
        .select("id,categoria,descripcion,estado,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.rpc("obtener_encuestas_activas"),
    ]);

    if (requestsResult.error) {
      setError(
        "No pudimos cargar tus solicitudes. Verifica tu conexión e intenta de nuevo.",
      );
    } else {
      setIncidencias((requestsResult.data ?? []) as Incidencia[]);
    }

    if (surveysResult.error) {
      setSurveyError("No pudimos cargar las encuestas activas.");
    } else {
      setSurveys(normalizeActiveSurveys(surveysResult.data));
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  const vote = useCallback(async (surveyId: number, optionIndex: number) => {
    setVotingSurveyId(surveyId);
    const { data, error: voteError } = await supabase.rpc("votar_encuesta_jwt", {
      p_encuesta_id: surveyId,
      p_opcion: optionIndex,
    });

    if (voteError) {
      Alert.alert(
        "No pudimos registrar tu voto",
        "Intenta de nuevo en unos momentos.",
      );
    } else {
      const result = data as {
        total?: unknown;
        conteos?: unknown;
        mi_voto?: unknown;
      };
      setSurveys((current) =>
        current.map((survey) =>
          survey.id === surveyId
            ? {
                ...survey,
                total: Math.max(0, Number(result.total) || 0),
                conteos:
                  result.conteos && typeof result.conteos === "object"
                    ? Object.fromEntries(
                        Object.entries(
                          result.conteos as Record<string, unknown>,
                        ).map(([key, count]) => [
                          key,
                          Math.max(0, Number(count) || 0),
                        ]),
                      )
                    : survey.conteos,
                mi_voto: Number(result.mi_voto),
              }
            : survey,
        ),
      );
    }
    setVotingSurveyId(null);
  }, []);

  // ─── header ──────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        MANTENIMIENTO
      </Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Solicitudes
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Mantén tu hogar en perfectas condiciones.
      </Text>
      <Pressable
        onPress={() => router.push("/request/new")}
        accessibilityRole="button"
        accessibilityLabel="Crear solicitud de mantenimiento"
        style={({ pressed }) => [
          styles.newButton,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Feather name="plus" size={18} color={colors.primaryForeground} />
        <Text
          style={[styles.newButtonText, { color: colors.primaryForeground }]}
        >
          Nueva solicitud
        </Text>
      </Pressable>
      <View style={styles.activeSectionHeader}>
        <View>
          <Text style={[styles.activeEyebrow, { color: colors.primary }]}>
            PARTICIPA
          </Text>
          <Text style={[styles.activeTitle, { color: colors.foreground }]}>
            Encuestas activas
          </Text>
        </View>
        <View style={[styles.activeCount, { backgroundColor: colors.accent }]}>
          <Text style={[styles.activeCountText, { color: colors.primary }]}>
            {surveys.length}
          </Text>
        </View>
      </View>
      {loading ? (
        <View
          style={[
            styles.pollEmpty,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[styles.pollEmptyText, { color: colors.mutedForeground }]}
          >
            Cargando encuestas…
          </Text>
        </View>
      ) : surveyError ? (
        <View
          style={[
            styles.pollEmpty,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="wifi-off" size={20} color={colors.primary} />
          <Text style={[styles.pollEmptyText, { color: colors.foreground }]}>
            {surveyError}
          </Text>
          <Pressable
            onPress={() => fetchContent()}
            accessibilityRole="button"
          >
            <Text style={[styles.pollRetry, { color: colors.primary }]}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : surveys.length === 0 ? (
        <View
          style={[
            styles.pollEmpty,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="bar-chart-2" size={21} color={colors.primary} />
          <View style={styles.pollEmptyCopy}>
            <Text style={[styles.pollEmptyTitle, { color: colors.foreground }]}>
              No hay encuestas activas
            </Text>
            <Text
              style={[
                styles.pollEmptyText,
                { color: colors.mutedForeground },
              ]}
            >
              Te avisaremos cuando la administración publique una nueva.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.pollList}>
          {surveys.map((survey) => (
            <View
              key={survey.id}
              style={[
                styles.pollCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.pollQuestion, { color: colors.foreground }]}>
                {survey.pregunta}
              </Text>
              <Text
                style={[styles.pollMeta, { color: colors.mutedForeground }]}
              >
                {survey.total === 1
                  ? "1 respuesta"
                  : `${survey.total} respuestas`}
              </Text>
              <View style={styles.pollOptions}>
                {survey.opciones.map((option, index) => {
                  const selected = survey.mi_voto === index;
                  const count = survey.conteos[String(index)] ?? 0;
                  const percent = surveyPercentage(count, survey.total);
                  const isVoting = votingSurveyId === survey.id;
                  return (
                    <Pressable
                      key={`${survey.id}-${index}`}
                      onPress={() => vote(survey.id, index)}
                      disabled={isVoting}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: selected,
                        disabled: isVoting,
                      }}
                      accessibilityLabel={`${option}, ${percent}%`}
                      style={({ pressed }) => [
                        styles.pollOption,
                        {
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          backgroundColor: selected
                            ? colors.accent
                            : colors.background,
                          opacity: pressed || isVoting ? 0.72 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.pollRadio,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.mutedForeground,
                          },
                        ]}
                      >
                        {selected ? (
                          <View
                            style={[
                              styles.pollRadioDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.pollOptionText,
                          { color: colors.foreground },
                        ]}
                      >
                        {option}
                      </Text>
                      {survey.mi_voto !== null ? (
                        <Text
                          style={[
                            styles.pollPercent,
                            { color: colors.primary },
                          ]}
                        >
                          {percent}%
                        </Text>
                      ) : null}
                      {isVoting ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <Text
                style={[styles.pollHint, { color: colors.mutedForeground }]}
              >
                {survey.mi_voto === null
                  ? "Selecciona una opción para votar."
                  : "Tu voto está registrado. Puedes cambiarlo."}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.activeSectionHeader}>
        <View>
          <Text style={[styles.activeEyebrow, { color: colors.primary }]}>
            INFORMACIÓN ACTIVA
          </Text>
          <Text style={[styles.activeTitle, { color: colors.foreground }]}>
            Avisos y comunidad
          </Text>
        </View>
        <View style={[styles.activeCount, { backgroundColor: colors.accent }]}>
          <Text style={[styles.activeCountText, { color: colors.primary }]}>
            {COMMUNITY_RESOURCES.length}
          </Text>
        </View>
      </View>
      <View style={styles.resourceList}>
        {COMMUNITY_RESOURCES.map((resource) => {
          const emergency = resource.kind === "emergency";
          return (
            <Pressable
              key={resource.id}
              onPress={() =>
                router.push({
                  pathname: "/community/[slug]",
                  params: { slug: resource.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${resource.title}`}
              style={({ pressed }) => [
                styles.resourceCard,
                {
                  backgroundColor: colors.card,
                  borderColor: emergency ? "#F3C4C4" : colors.border,
                  opacity: pressed ? 0.74 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.resourceIcon,
                  { backgroundColor: emergency ? "#FCE4E4" : colors.accent },
                ]}
              >
                <Feather
                  name={resource.icon}
                  size={19}
                  color={emergency ? "#C84D4D" : colors.primary}
                />
              </View>
              <View style={styles.resourceCopy}>
                <View style={styles.resourceMeta}>
                  <Text
                    style={[
                      styles.resourceEyebrow,
                      { color: emergency ? "#C84D4D" : colors.primary },
                    ]}
                  >
                    {resource.eyebrow}
                  </Text>
                  <View
                    style={[
                      styles.activeBadge,
                      {
                        backgroundColor: emergency
                          ? "#FCE4E4"
                          : colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activeBadgeText,
                        { color: emergency ? "#A53D3D" : colors.primary },
                      ]}
                    >
                      {emergency ? "IMPORTANTE" : "ACTIVO"}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.resourceTitle, { color: colors.foreground }]}
                >
                  {resource.title}
                </Text>
                <Text
                  style={[
                    styles.resourceSummary,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={2}
                >
                  {resource.summary}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={19}
                color={colors.mutedForeground}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.listTitle, { color: colors.foreground }]}>
        Tus solicitudes
      </Text>

      {/* estado de carga */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Cargando solicitudes…
          </Text>
        </View>
      )}

      {/* error */}
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
            onPress={() => fetchContent()}
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
    </View>
  );

  // ─── vacío ────────────────────────────────────────────────────────────────
  const ListEmpty =
    !loading && !error ? (
      <View style={styles.empty}>
        <Feather name="check-circle" size={28} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Todo en orden
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Aún no has enviado ninguna solicitud.
        </Text>
      </View>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <FlatList
      data={!loading && !error ? incidencias : []}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 106 },
      ]}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchContent(true)}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => {
        const st = statusConfig(item.estado);
        return (
          <View
            style={[
              styles.requestCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.requestTop}>
              <View
                style={[styles.requestIcon, { backgroundColor: colors.accent }]}
              >
                <Feather
                  name="tool"
                  size={17}
                  color={colors.accentForeground}
                />
              </View>
              {/* badge de estado inline */}
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <Feather name={st.icon} size={11} color={st.text} />
                <Text style={[styles.statusText, { color: st.text }]}>
                  {st.label}
                </Text>
              </View>
            </View>
            {item.categoria ? (
              <Text style={[styles.requestTitle, { color: colors.foreground }]}>
                {item.categoria.charAt(0).toUpperCase() +
                  item.categoria.slice(1)}
              </Text>
            ) : null}
            {item.descripcion ? (
              <Text
                style={[
                  styles.requestDetail,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={2}
              >
                {item.descripcion}
              </Text>
            ) : null}
            <Text
              style={[styles.requestDate, { color: colors.mutedForeground }]}
            >
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
  },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 5 },
  newButton: {
    height: 50,
    borderRadius: 15,
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  newButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  activeSectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  activeEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  activeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  activeCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCountText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  resourceList: { gap: 10 },
  pollList: { gap: 12 },
  pollCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  pollQuestion: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
  },
  pollMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 5,
  },
  pollOptions: { gap: 9, marginTop: 14 },
  pollOption: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pollRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  pollRadioDot: { width: 9, height: 9, borderRadius: 5 },
  pollOptionText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  pollPercent: { fontFamily: "Inter_700Bold", fontSize: 12 },
  pollHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 11,
  },
  pollEmpty: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pollEmptyCopy: { flex: 1 },
  pollEmptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 3,
  },
  pollEmptyText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  pollRetry: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  resourceCard: {
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceCopy: { flex: 1 },
  resourceMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  resourceEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1,
  },
  activeBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    letterSpacing: 0.6,
  },
  resourceTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 19,
  },
  resourceSummary: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  listTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginTop: 30,
    marginBottom: 12,
  },

  // loading / error
  centered: { alignItems: "center", paddingTop: 32, gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },

  // tarjetas
  requestCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  requestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  requestTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  requestDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  requestDate: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 12 },

  // vacío
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 25 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginTop: 12 },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
});
