import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeResidentProfile,
  validateResidentContactUpdate,
} from "./residentProfile.ts";

test("normalizes the established web resident fields for the mobile account screen", () => {
  const profile = normalizeResidentProfile({
    id_residente: 42,
    nombre_completo: "María López",
    departamento: "301D2",
    correo: "MARIA@EXAMPLE.COM ",
    telefono: " 998 123 4567 ",
    whatsapp: "+52 998 123 4567",
  });

  assert.deepEqual(profile, {
    id: "42",
    name: "María López",
    unit: "301D2",
    email: "maria@example.com",
    phone: "998 123 4567",
    whatsapp: "+52 998 123 4567",
  });
});

test("never exposes the synthetic authenticated email as a resident contact email", () => {
  const profile = normalizeResidentProfile([
    {
      perfil_id: "profile-7",
      nombre: "José Pérez",
      unidades: ["204A"],
      telefono: null,
      whatsapp: null,
    },
  ]);

  assert.deepEqual(profile, {
    id: "profile-7",
    name: "José Pérez",
    unit: "204A",
    email: "",
    phone: "",
    whatsapp: "",
  });
});

test("normalizes the additive resident profile RPC response", () => {
  const profile = normalizeResidentProfile({
    perfil_id: "profile-8",
    nombre: "Ana Gómez",
    unidad: "101O1",
    email: "ana@example.com",
    telefono: "9981234567",
    whatsapp: "+529981234567",
  });

  assert.equal(profile?.unit, "101O1");
  assert.equal(profile?.email, "ana@example.com");
});

test("validates and normalizes editable resident contact details", () => {
  assert.deepEqual(
    validateResidentContactUpdate({
      email: " RESIDENT@EXAMPLE.COM ",
      phone: "998-123-4567",
      whatsapp: "+52 998 123 4567",
    }),
    {
      ok: true,
      value: {
        email: "resident@example.com",
        phone: "9981234567",
        whatsapp: "+529981234567",
      },
    },
  );
});

test("rejects malformed contact details before sending them to Supabase", () => {
  assert.deepEqual(
    validateResidentContactUpdate({
      email: "not-an-email",
      phone: "123",
      whatsapp: "hello",
    }),
    {
      ok: false,
      errors: {
        email: "Ingresa un correo válido.",
        phone: "Ingresa un teléfono válido.",
        whatsapp: "Ingresa un WhatsApp válido.",
      },
    },
  );
});
