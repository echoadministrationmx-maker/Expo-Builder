export type ResidentProfile = {
  id: string;
  name: string;
  unit: string;
  email: string;
  phone: string;
  whatsapp: string;
};

type ResidentProfileRecord = Record<string, unknown>;

export type ResidentContactUpdate = {
  email: string;
  phone: string;
  whatsapp: string;
};

type ResidentContactErrors = Partial<
  Record<keyof ResidentContactUpdate, string>
>;

export type ResidentContactValidation =
  | { ok: true; value: ResidentContactUpdate }
  | { ok: false; errors: ResidentContactErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasCountryPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasCountryPrefix ? `+${digits}` : digits;
}

function isValidPhone(value: string, originalValue: string): boolean {
  if (!originalValue.trim()) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function normalizeResidentProfile(
  rawProfile: unknown,
): ResidentProfile | null {
  const candidate = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const profile = candidate as ResidentProfileRecord;
  const units = Array.isArray(profile.unidades) ? profile.unidades : [];

  return {
    id: String(profile.perfil_id ?? profile.id_residente ?? ""),
    name: text(profile.nombre) || text(profile.nombre_completo),
    unit: text(profile.unidad) || text(units[0]) || text(profile.departamento),
    email: (text(profile.email) || text(profile.correo)).toLowerCase(),
    phone: text(profile.telefono),
    whatsapp: text(profile.whatsapp),
  };
}

export function validateResidentContactUpdate(
  input: ResidentContactUpdate,
): ResidentContactValidation {
  const value = {
    email: input.email.trim().toLowerCase(),
    phone: normalizePhone(input.phone),
    whatsapp: normalizePhone(input.whatsapp),
  };
  const errors: ResidentContactErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
    errors.email = "Ingresa un correo válido.";
  }
  if (!isValidPhone(value.phone, input.phone)) {
    errors.phone = "Ingresa un teléfono válido.";
  }
  if (!isValidPhone(value.whatsapp, input.whatsapp)) {
    errors.whatsapp = "Ingresa un WhatsApp válido.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value,
  };
}
