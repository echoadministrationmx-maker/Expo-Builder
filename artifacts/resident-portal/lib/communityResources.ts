export type CommunityResourceId =
  | "pool-rules"
  | "building-rules"
  | "emergency-contacts";

type ResourceBase = {
  id: CommunityResourceId;
  title: string;
  summary: string;
  eyebrow: string;
  icon: "droplet" | "home" | "phone-call";
};

export type RulesResource = ResourceBase & {
  kind: "rules";
  rules: readonly string[];
};

export type EmergencyContact = {
  name: string;
  number: string;
  phoneNumber: string;
  description: string;
};

export type EmergencyResource = ResourceBase & {
  kind: "emergency";
  contacts: readonly EmergencyContact[];
};

export type CommunityResource = RulesResource | EmergencyResource;

export const C2_TULUM = {
  name: "C2 Tulum",
  number: "984 240 5427",
  whatsappNumber: "529842405427",
} as const;

export const COMMUNITY_RESOURCES: readonly CommunityResource[] = [
  {
    id: "pool-rules",
    kind: "rules",
    title: "Reglamento de la alberca",
    summary: "Horarios y reglas para el uso seguro de la alberca.",
    eyebrow: "CONVIVENCIA",
    icon: "droplet",
    rules: [
      "El horario de uso de la alberca es de 10:00 a 22:00 horas.",
      "Cuando la alberca se encuentre en mantenimiento y exista señalización informativa, queda estrictamente prohibido su uso, ya que los productos utilizados pueden causar daños severos en la piel y los ojos.",
      "El uso de la alberca es exclusivo para propietarios, inquilinos y sus invitados, siempre y cuando respeten el presente reglamento.",
      "Antes de ingresar a la alberca, los usuarios deberán ducharse para retirar del cuerpo el exceso de bloqueadores, bronceadores, tierra u otras sustancias.",
      "Queda estrictamente prohibido utilizar la alberca con ropa no adecuada, como shorts, pantalones, playeras, ropa interior, sandalias, zapatos u otros similares.",
      "Los niños menores de 3 años deberán utilizar calzón especial para alberca (no pañal).",
      "Los menores de edad deberán permanecer siempre bajo la supervisión de un adulto.",
      "Dentro de la alberca y en el andador perimetral queda estrictamente prohibido consumir alimentos o bebidas.",
      "Se prohíbe instalar casas de campaña en las áreas comunes del condominio.",
    ],
  },
  {
    id: "building-rules",
    kind: "rules",
    title: "Reglamento de los edificios",
    summary: "Normas esenciales de convivencia para Manzana 80.",
    eyebrow: "COMUNIDAD",
    icon: "home",
    rules: [
      "No cambiar el color de la fachada, a no ser que sea un acuerdo de la asamblea.",
      "No construir, destruir o modificar las fachadas y paredes de tu edificio.",
      "Se prohíbe realizar construcciones no autorizadas por la A.C.",
      "Evitar utilizar los balcones o barandales para colgar ropa o cualquier otro objeto.",
      "Las mascotas deben permanecer dentro del departamento y, para sacarlas, deben portar correa. Es responsabilidad de cada persona recoger sus heces.",
      "Atiende a tu mascota para que sus ladridos sean moderados y no molesten a los vecinos en horas inadecuadas. Cuídala dentro de tu propiedad.",
      "Mantén limpio tu patio y evita acumular objetos que produzcan insectos. Si tienes mascota, limpia diariamente; puedes usar agua con cloro después de lavar para evitar aromas desagradables.",
      "Cumplir las reglas del área de alberca cuando disfrutes de esta amenidad.",
      "Dar a conocer el reglamento a los inquilinos y visitantes.",
      "Las áreas comunes son de todos: no se podrán obstruir con construcciones, invadir o modificar instalando puntos de venta, tendederos en áreas verdes u otros objetos.",
      "La basura de casa debe depositarse en los contenedores asignados y, de preferencia, separada en orgánica e inorgánica. Los botes del parque son solamente para la basura de esa área.",
      "El horario de ruido por reparación o construcción es de 8:00 a 17:00 horas.",
      "Las reuniones en los departamentos deben terminar a las 22:00 horas con música en volumen moderado. Después de esa hora se debe moderar el ruido; en caso contrario, se podrá llamar a las autoridades.",
      "Evita tirar colillas, latas o cualquier basura en pasillos, escaleras o jardines. Utiliza siempre los botes de basura.",
      "Ser un buen vecino implica mantener una actitud respetuosa y considerada hacia quienes viven cerca de ti.",
    ],
  },
  {
    id: "emergency-contacts",
    kind: "emergency",
    title: "Contactos de emergencia",
    summary: "Números de auxilio de Tulum y envío de ubicación a C2.",
    eyebrow: "SEGURIDAD",
    icon: "phone-call",
    contacts: [
      {
        name: "Emergencia general",
        number: "911",
        phoneNumber: "911",
        description: "Policía · Bomberos · Ambulancia",
      },
      {
        name: "Cruz Roja Tulum",
        number: "984 806 1349",
        phoneNumber: "+529848061349",
        description: "Atención prehospitalaria",
      },
      {
        name: "Protección Civil",
        number: "984 871 2688",
        phoneNumber: "+529848712688",
        description: "Emergencias y protección civil",
      },
      {
        name: "Bomberos Tulum",
        number: "984 133 6532",
        phoneNumber: "+529841336532",
        description: "Incendios y rescate",
      },
    ],
  },
];

export function getCommunityResource(
  id: string | undefined,
): CommunityResource | undefined {
  return COMMUNITY_RESOURCES.find((resource) => resource.id === id);
}

export function buildEmergencyPhoneUrl(phoneNumber: string): string {
  return `tel:${phoneNumber}`;
}

export function buildC2EmergencyWhatsAppUrl(): string {
  const message = "Hola, comparto mi ubicación porque tengo una emergencia.";
  return `https://wa.me/${C2_TULUM.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
