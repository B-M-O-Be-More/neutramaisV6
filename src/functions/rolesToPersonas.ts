import type { SidebarPersona } from "@/components/AppSidebar";

/**
 * Papéis da identity-api → grupos da navegação. Os papéis seguem o padrão
 * `<persona>_<nível>` (ex.: "buyer_owner", "seller_admin"); o prefixo decide o
 * grupo.
 *
 * Sem nenhum papel reconhecido, cai em "buyer": toda organização compra no
 * marketplace, e uma sidebar vazia deixaria o usuário sem navegação.
 */
export function rolesToPersonas(roles: string[]): SidebarPersona[] {
  const personas = new Set<SidebarPersona>();
  for (const role of roles) {
    const prefix = role.toLowerCase().split("_")[0];
    if (prefix === "buyer" || prefix === "seller") personas.add(prefix);
  }
  if (personas.size === 0) return ["buyer"];
  // Ordem fixa: Buyer antes de Seller, como na sidebar.
  return (["buyer", "seller"] as const).filter((p) => personas.has(p));
}
