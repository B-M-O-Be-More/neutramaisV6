import type { SidebarPersona } from "@/components/AppSidebar";

/** Papel de plataforma do admin da Neutra+ (equipe interna). */
export const ADMIN_ROLE = "admin_neutra";

/** Acesso total: todos os grupos da navegação e nenhuma exigência de KYC. */
export const SUPER_ADMIN_ROLE = "super_admin";

function hasRole(roles: string[], target: string): boolean {
  return roles.some((role) => role.toLowerCase() === target);
}

export function isSuperAdmin(roles: string[]): boolean {
  return hasRole(roles, SUPER_ADMIN_ROLE);
}

/** Admin da plataforma: `admin_neutra` ou `super_admin`. */
export function isAdminRole(roles: string[]): boolean {
  return hasRole(roles, ADMIN_ROLE) || isSuperAdmin(roles);
}

/**
 * Pode subir KMZ: só o Dono da organização (`org_owner` ou `seller_owner`,
 * como exige a geo-api) — e o `super_admin`.
 */
export function canUploadCoverage(roles: string[]): boolean {
  return (
    hasRole(roles, "org_owner") ||
    hasRole(roles, "seller_owner") ||
    isSuperAdmin(roles)
  );
}

const ALL_PERSONAS: SidebarPersona[] = ["admin", "buyer", "seller"];

/**
 * Papéis da identity-api → grupos da navegação. Os papéis de organização seguem
 * o padrão `<persona>_<nível>` (ex.: "buyer_owner", "seller_admin"); o prefixo
 * decide o grupo. O admin da plataforma tem um papel próprio (`admin_neutra`), e
 * o `super_admin` vê todos os grupos.
 *
 * Sem nenhum papel reconhecido, cai em "buyer": toda organização compra no
 * marketplace, e uma sidebar vazia deixaria o usuário sem navegação.
 */
export function rolesToPersonas(roles: string[]): SidebarPersona[] {
  if (isSuperAdmin(roles)) return ALL_PERSONAS;

  const personas = new Set<SidebarPersona>();
  if (isAdminRole(roles)) personas.add("admin");
  for (const role of roles) {
    const prefix = role.toLowerCase().split("_")[0];
    if (prefix === "buyer" || prefix === "seller") personas.add(prefix);
  }
  if (personas.size === 0) return ["buyer"];
  // Ordem fixa da sidebar: Admin, depois Buyer e Seller.
  return ALL_PERSONAS.filter((p) => personas.has(p));
}
