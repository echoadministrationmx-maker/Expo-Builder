import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  buildC2EmergencyWhatsAppUrl,
  buildEmergencyPhoneUrl,
  C2_TULUM,
  getCommunityResource,
  type EmergencyResource,
  type RulesResource,
} from "@/lib/communityResources";

const EMERGENCY_COLOR = "#C84D4D";
const WHATSAPP_COLOR = "#168A45";

function openExternalUrl(url: string, fallback: string) {
  void Linking.openURL(url).catch(() => {
    Alert.alert("No pudimos abrir el enlace", fallback);
  });
}

function RulesContent({ resource }: { resource: RulesResource }) {
  const colors = useColors();

  return (
    <View style={styles.ruleList}>
      {resource.rules.map((rule, index) => (
        <View
          key={`${resource.id}-${index}`}
          style={[
            styles.ruleCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.ruleNumber, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.ruleNumberText, { color: colors.primary }]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[styles.ruleText, { color: colors.foreground }]}>
            {rule}
          </Text>
        </View>
      ))}
      <Text style={[styles.contactNote, { color: colors.mutedForeground }]}>
        Si tienes dudas sobre el reglamento, escribe a aldeamz80@gmail.com.
      </Text>
    </View>
  );
}

function EmergencyContent({ resource }: { resource: EmergencyResource }) {
  const colors = useColors();

  return (
    <View style={styles.emergencyContent}>
      <View style={[styles.emergencyHero, { borderColor: "#F3C4C4" }]}>
        <Text style={styles.emergencyLabel}>EMERGENCIA GENERAL</Text>
        <Text style={styles.emergencyNumber}>911</Text>
        <Text style={styles.emergencyDescription}>
          Policía · Bomberos · Ambulancia
        </Text>
        <Pressable
          onPress={() =>
            openExternalUrl(
              buildEmergencyPhoneUrl("911"),
              "Marca 911 desde la aplicación Teléfono.",
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Marcar al 911"
          style={({ pressed }) => [
            styles.emergencyButton,
            { opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <Feather name="phone" size={18} color="#FFFFFF" />
          <Text style={styles.emergencyButtonText}>Marcar 911</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Números locales
      </Text>
      {resource.contacts.slice(1).map((contact) => (
        <Pressable
          key={contact.phoneNumber}
          onPress={() =>
            openExternalUrl(
              buildEmergencyPhoneUrl(contact.phoneNumber),
              `Marca ${contact.number} desde la aplicación Teléfono.`,
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`Llamar a ${contact.name}, ${contact.number}`}
          style={({ pressed }) => [
            styles.contactCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.76 : 1,
            },
          ]}
        >
          <View
            style={[styles.contactIcon, { backgroundColor: colors.accent }]}
          >
            <Feather name="phone-call" size={18} color={colors.primary} />
          </View>
          <View style={styles.contactCopy}>
            <Text style={[styles.contactName, { color: colors.foreground }]}>
              {contact.name}
            </Text>
            <Text
              style={[
                styles.contactDescription,
                { color: colors.mutedForeground },
              ]}
            >
              {contact.description}
            </Text>
            <Text style={[styles.contactNumber, { color: colors.primary }]}>
              {contact.number}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={19}
            color={colors.mutedForeground}
          />
        </Pressable>
      ))}

      <View
        style={[
          styles.c2Card,
          { backgroundColor: colors.card, borderColor: "#BFE5CD" },
        ]}
      >
        <View style={styles.c2Heading}>
          <View style={styles.whatsappIcon}>
            <Feather name="map-pin" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.contactCopy}>
            <Text style={[styles.c2Eyebrow, { color: WHATSAPP_COLOR }]}>
              CENTRAL DE MONITOREO
            </Text>
            <Text style={[styles.c2Title, { color: colors.foreground }]}>
              {C2_TULUM.name}
            </Text>
            <Text style={[styles.c2Number, { color: colors.foreground }]}>
              {C2_TULUM.number}
            </Text>
          </View>
        </View>
        <Text style={[styles.c2Description, { color: colors.mutedForeground }]}>
          En caso de emergencia, abre WhatsApp y comparte tu ubicación con C2
          Tulum.
        </Text>
        <Pressable
          onPress={() =>
            openExternalUrl(
              buildC2EmergencyWhatsAppUrl(),
              `Envía tu ubicación por WhatsApp al ${C2_TULUM.number}.`,
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`Enviar ubicación por WhatsApp a ${C2_TULUM.name}`}
          style={({ pressed }) => [
            styles.whatsappButton,
            { opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <Feather name="message-circle" size={18} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>
            Enviar ubicación por WhatsApp
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CommunityResourceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const resource = getCommunityResource(Array.isArray(slug) ? slug[0] : slug);

  if (!resource) {
    return (
      <View
        style={[
          styles.notFound,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <Feather name="file-text" size={32} color={colors.mutedForeground} />
        <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>
          Información no disponible
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>
            Volver a Solicitudes
          </Text>
        </Pressable>
      </View>
    );
  }

  const isEmergency = resource.kind === "emergency";

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 34,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Volver a Solicitudes"
        hitSlop={10}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Feather name="arrow-left" size={18} color={colors.foreground} />
        <Text style={[styles.backButtonText, { color: colors.foreground }]}>
          Solicitudes
        </Text>
      </Pressable>

      <View
        style={[
          styles.headerIcon,
          {
            backgroundColor: isEmergency ? "#FCE4E4" : colors.accent,
          },
        ]}
      >
        <Feather
          name={resource.icon}
          size={24}
          color={isEmergency ? EMERGENCY_COLOR : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.eyebrow,
          { color: isEmergency ? EMERGENCY_COLOR : colors.primary },
        ]}
      >
        {resource.eyebrow}
      </Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {resource.title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {resource.summary}
      </Text>

      {resource.kind === "rules" ? (
        <RulesContent resource={resource} />
      ) : (
        <EmergencyContent resource={resource} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 28,
  },
  backButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 9,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  ruleList: { gap: 10, marginTop: 26 },
  ruleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
  },
  ruleNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleNumberText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  ruleText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  contactNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 18,
    marginTop: 10,
  },
  emergencyContent: { marginTop: 26, gap: 12 },
  emergencyHero: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  emergencyLabel: {
    color: EMERGENCY_COLOR,
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  emergencyNumber: {
    color: EMERGENCY_COLOR,
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: -2,
    marginTop: 2,
  },
  emergencyDescription: {
    color: "#7D4B4B",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  emergencyButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: EMERGENCY_COLOR,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emergencyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 2,
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCopy: { flex: 1 },
  contactName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  contactDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  contactNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginTop: 5,
  },
  c2Card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginTop: 8,
  },
  c2Heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  whatsappIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: WHATSAPP_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  c2Eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.9,
  },
  c2Title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 2,
  },
  c2Number: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginTop: 2,
  },
  c2Description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  whatsappButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: WHATSAPP_COLOR,
    marginTop: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  whatsappButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  notFound: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    textAlign: "center",
  },
  backLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
