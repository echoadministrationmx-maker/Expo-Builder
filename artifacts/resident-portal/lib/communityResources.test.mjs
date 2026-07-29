import assert from "node:assert/strict";
import test from "node:test";
import {
  buildC2EmergencyWhatsAppUrl,
  buildEmergencyPhoneUrl,
  C2_TULUM,
  COMMUNITY_RESOURCES,
  getCommunityResource,
} from "./communityResources.ts";

test("publishes both supplied reglamentos as active resources", () => {
  const rules = COMMUNITY_RESOURCES.filter(
    (resource) => resource.kind === "rules",
  );

  assert.deepEqual(
    rules.map(({ id }) => id),
    ["pool-rules", "building-rules"],
  );
  assert.equal(getCommunityResource("pool-rules")?.kind, "rules");
  assert.equal(getCommunityResource("building-rules")?.kind, "rules");
});

test("preserves the emergency contacts used by the web portal", () => {
  const resource = getCommunityResource("emergency-contacts");
  assert.equal(resource?.kind, "emergency");
  if (resource?.kind !== "emergency") return;

  assert.deepEqual(
    resource.contacts.map(({ name, number }) => ({ name, number })),
    [
      { name: "Emergencia general", number: "911" },
      { name: "Cruz Roja Tulum", number: "984 806 1349" },
      { name: "Protección Civil", number: "984 871 2688" },
      { name: "Bomberos Tulum", number: "984 133 6532" },
    ],
  );
});

test("builds callable emergency links and the C2 WhatsApp link", () => {
  assert.equal(buildEmergencyPhoneUrl("+529848061349"), "tel:+529848061349");

  const url = new URL(buildC2EmergencyWhatsAppUrl());
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, `/${C2_TULUM.whatsappNumber}`);
  assert.match(url.searchParams.get("text") ?? "", /ubicación/);
});
