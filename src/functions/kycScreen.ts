import type { MeOrganization, MeProfile } from "@/services/auth.service";

/**
 * Tela de KYC de cada cenário da organização:
 * - `submit`    — cadastrou e ainda não enviou documentos
 * - `upgrade`   — tem o nível básico aprovado e pode pedir um nível acima
 * - `review`    — enviou e aguarda a análise (ou uma correção pedida nela)
 * - `approved`  — nível verificado aprovado
 * - `complete`  — KYC completo
 * - `rejected`  — solicitação recusada; sem reenvio pela tela
 * - `suspended` — KYC suspenso; a recuperação é administrativa
 */
export type KycScreen =
  | "submit"
  | "upgrade"
  | "review"
  | "approved"
  | "complete"
  | "rejected"
  | "suspended";

/** Cenários em que não há nada a enviar: o login segue para o dashboard. */
export const KYC_SETTLED_SCREENS: KycScreen[] = ["approved", "complete"];

/**
 * Organização do `/me`. Prefere o objeto `organization` e cai nos campos
 * soltos (obsoletos, mas ainda devolvidos) se uma versão antiga da API não o
 * trouxer.
 */
export function meOrganization(profile: MeProfile): MeOrganization | null {
  if (profile.organization) return profile.organization;

  const legacy = profile as MeProfile & {
    org_status?: MeOrganization["status"];
    kyc_level?: MeOrganization["kyc_level"];
    kyc_state?: MeOrganization["kyc_state"];
  };
  if (!legacy.organization_id || !legacy.org_status || !legacy.kyc_state) {
    return null;
  }
  return {
    id: legacy.organization_id,
    status: legacy.org_status,
    kyc_level: legacy.kyc_level ?? "pending",
    kyc_state: legacy.kyc_state,
  };
}

/**
 * Cenário de KYC a partir do `kyc_state` do `/me`.
 *
 * Depois do `/kyc/submit`, o estado fica `pending_documents` até a decisão ser
 * aplicada — inclusive quando a análise pede correção (o Identity só registra
 * o pedido no histórico). Por isso "em análise" e "correção pedida" caem na
 * mesma tela. `basic`, `verified` e `complete` são níveis já aprovados: o
 * `status` da conta não entra (um seller com básico aprovado segue `pending`).
 */
export function resolveKycScreen(
  organization: Pick<MeOrganization, "status" | "kyc_state">,
): KycScreen {
  switch (organization.kyc_state) {
    // Recusa e suspensão não reabrem pelo `/kyc/submit`: a recuperação é
    // administrativa.
    case "rejected":
      return "rejected";
    case "suspended":
      return "suspended";
    case "pending_documents":
    case "under_review":
      return "review";
    case "complete":
      return "complete";
    case "verified":
      return "approved";
    case "basic":
      return "upgrade";
    default:
      return "submit";
  }
}
