import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResident } from "@/context/ResidentContext";
import { useColors } from "@/hooks/useColors";
import {
  normalizeResidentProfile,
  validateResidentContactUpdate,
  type ResidentContactUpdate,
  type ResidentProfile,
} from "@/lib/residentProfile";
import { supabase } from "@/lib/supabase";

type FieldErrors = Partial<Record<keyof ResidentContactUpdate, string>>;

const EMPTY_CONTACTS: ResidentContactUpdate = {
  email: "",
  phone: "",
  whatsapp: "",
};

function profileContacts(profile: ResidentProfile): ResidentContactUpdate {
  return {
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
  };
}

function updateErrorMessage(message: string): string {
  if (message.includes("email_ya_registrado")) {
    return "Ese correo ya está registrado en otra cuenta.";
  }
  if (message.includes("email_invalido")) return "Ingresa un correo válido.";
  if (message.includes("telefono_invalido"))
    return "Ingresa un teléfono válido.";
  if (message.includes("whatsapp_invalido"))
    return "Ingresa un WhatsApp válido.";
  return "No pudimos guardar tus cambios. Intenta nuevamente.";
}

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useResident();

  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [contacts, setContacts] =
    useState<ResidentContactUpdate>(EMPTY_CONTACTS);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const { data: profileData, error: profileError } = await supabase.rpc(
      "obtener_perfil_residente",
    );

    if (profileError) {
      if (__DEV__)
        console.warn("Resident profile failed", profileError.message);
      setError("No pudimos cargar tus datos de contacto.");
    } else {
      const nextProfile = normalizeResidentProfile(profileData);
      if (nextProfile) {
        setProfile(nextProfile);
        setContacts(profileContacts(nextProfile));
      } else {
        setError("No encontramos tu perfil de residente.");
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const cancelEditing = () => {
    if (profile) setContacts(profileContacts(profile));
    setFieldErrors({});
    setError("");
    setSuccess("");
    setEditing(false);
  };

  const saveContacts = async () => {
    setError("");
    setSuccess("");
    setFieldErrors({});

    const validation = validateResidentContactUpdate(contacts);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }

    setSaving(true);
    const { data, error: updateError } = await supabase.rpc(
      "actualizar_contacto_residente",
      {
        p_email: validation.value.email,
        p_telefono: validation.value.phone,
        p_whatsapp: validation.value.whatsapp,
      },
    );
    setSaving(false);

    if (updateError) {
      if (__DEV__)
        console.warn("Resident contact update failed", updateError.message);
      setError(updateErrorMessage(updateError.message));
      return;
    }

    const nextProfile = normalizeResidentProfile(data);
    if (!nextProfile) {
      setError("Guardamos los cambios, pero no pudimos recargar tu perfil.");
      return;
    }

    setProfile(nextProfile);
    setContacts(profileContacts(nextProfile));
    setEditing(false);
    setSuccess("Tus datos de contacto fueron actualizados.");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Cargando tu cuenta…
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 112,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProfile(true)}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          MI PERFIL
        </Text>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Cuenta
          </Text>
          {!editing && profile ? (
            <Pressable
              onPress={() => {
                setSuccess("");
                setEditing(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Editar datos de contacto"
              style={({ pressed }) => [
                styles.editButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Feather name="edit-2" size={14} color={colors.foreground} />
              <Text
                style={[styles.editButtonText, { color: colors.foreground }]}
              >
                Editar
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Revisa tus datos y mantenlos actualizados para que podamos
          contactarte.
        </Text>

        {error ? (
          <View
            style={[
              styles.message,
              { backgroundColor: "#fff1f0", borderColor: "#ffa39e" },
            ]}
          >
            <Feather name="alert-circle" size={16} color="#cf1322" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View
            style={[
              styles.message,
              { backgroundColor: "#f0faf4", borderColor: "#b7e4c7" },
            ]}
          >
            <Feather name="check-circle" size={16} color="#2d6f53" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {profile ? (
          <>
            <View
              style={[
                styles.identityCard,
                { backgroundColor: colors.foreground },
              ]}
            >
              <View style={styles.identityIcon}>
                <Feather name="user" size={21} color={colors.foreground} />
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.identityName}>
                  {profile.name || "Residente"}
                </Text>
                <Text style={styles.identityUnit}>
                  {profile.unit
                    ? `Departamento ${profile.unit}`
                    : "Unidad por confirmar"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ContactField
                label="Correo electrónico"
                icon="mail"
                value={contacts.email}
                onChangeText={(email) =>
                  setContacts((current) => ({ ...current, email }))
                }
                editable={editing}
                keyboardType="email-address"
                autoCapitalize="none"
                error={fieldErrors.email}
              />
              <ContactField
                label="Teléfono"
                icon="phone"
                value={contacts.phone}
                onChangeText={(phone) =>
                  setContacts((current) => ({ ...current, phone }))
                }
                editable={editing}
                keyboardType="phone-pad"
                error={fieldErrors.phone}
              />
              <ContactField
                label="WhatsApp"
                icon="message-circle"
                value={contacts.whatsapp}
                onChangeText={(whatsapp) =>
                  setContacts((current) => ({ ...current, whatsapp }))
                }
                editable={editing}
                keyboardType="phone-pad"
                error={fieldErrors.whatsapp}
                isLast
              />
            </View>

            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              Tu correo de contacto puede cambiar sin modificar tu clave de
              acceso ni tu contraseña.
            </Text>

            {editing ? (
              <View style={styles.editActions}>
                <Pressable
                  onPress={cancelEditing}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar edición"
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      borderColor: colors.border,
                      opacity: pressed || saving ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.foreground },
                    ]}
                  >
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void saveContacts()}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar datos de contacto"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed || saving ? 0.7 : 1,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator
                      color={colors.primaryForeground}
                      size="small"
                    />
                  ) : (
                    <>
                      <Feather
                        name="save"
                        size={16}
                        color={colors.primaryForeground}
                      />
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { color: colors.primaryForeground },
                        ]}
                      >
                        Guardar
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}

        <Pressable
          onPress={() => void handleSignOut()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={({ pressed }) => [
            styles.signOutButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.destructive + "55",
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={17} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type ContactFieldProps = {
  label: string;
  icon: "mail" | "phone" | "message-circle";
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  keyboardType: "email-address" | "phone-pad";
  autoCapitalize?: "none";
  error?: string;
  isLast?: boolean;
};

function ContactField({
  label,
  icon,
  value,
  onChangeText,
  editable,
  keyboardType,
  autoCapitalize,
  error,
  isLast = false,
}: ContactFieldProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.field,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
      ]}
    >
      <View style={styles.fieldLabelRow}>
        <Feather name={icon} size={15} color={colors.mutedForeground} />
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        placeholder={
          editable ? `Ingresa tu ${label.toLowerCase()}` : "Sin registrar"
        }
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel={label}
        style={[
          styles.fieldInput,
          {
            color: colors.foreground,
            backgroundColor: editable ? colors.background : "transparent",
            borderColor: error
              ? colors.destructive
              : editable
                ? colors.input
                : "transparent",
          },
        ]}
      />
      {error ? (
        <Text style={[styles.fieldError, { color: colors.destructive }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  content: { paddingHorizontal: 20 },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 39,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 340,
  },
  editButton: {
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  editButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  message: {
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  errorText: {
    color: "#cf1322",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  successText: {
    color: "#2d6f53",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  identityCard: {
    borderRadius: 20,
    padding: 18,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  identityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf9",
  },
  identityCopy: { flex: 1 },
  identityName: {
    color: "#fffdf9",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  identityUnit: {
    color: "#b9c4ca",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  field: { paddingVertical: 15 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  fieldError: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 6,
  },
  helper: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  signOutButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  signOutText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
