import type { MeOrganization, MeProfile } from "@/services/auth.service";

/**
 * Tela de KYC de cada cenário da organização:
 * - `submit`   — cadastrou e ainda não enviou documentos
 * - `review`   — enviou e aguarda a análise do admin
 * - `resubmit` — o admin pediu mais documentos
 * - `approved` — documentação aprovada (nível verificado)
 * - `complete` — KYC completo (sanções e endereço)
 * - `rejected` — documentação recusada; pode reenviar
 */
export type KycScreen =
  | "submit"
  | "review"
  | "resubmit"
  | "approved"
  | "complete"
  | "rejected";

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
 * Cenário de KYC a partir de `organization.status` + `kyc_state` do `/me`.
 * Não existe um estado "em análise": ele é deduzido de `status = pending` com
 * `kyc_state = basic`.
 */
export function resolveKycScreen(
  organization: Pick<MeOrganization, "status" | "kyc_state">,
): KycScreen {
  switch (organization.kyc_state) {
    // Conta suspensa nem chega aqui (o login recusa); se chegar, segue o mesmo
    // caminho da recusa: revisar e reenviar.
    case "rejected":
    case "suspended":
      return "rejected";
    case "pending_documents":
      return "resubmit";
    case "complete":
      return "complete";
    case "verified":
      return "approved";
    case "basic":
    case "under_review":
      // Buyer de nível básico é autoaprovado (status active): ainda pode
      // enviar documentos para subir de nível.
      return organization.status === "pending" ? "review" : "submit";
    default:
      return "submit";
  }
}
