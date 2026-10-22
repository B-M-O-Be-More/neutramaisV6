import {
  KYC_SETTLED_SCREENS,
  meOrganization,
  resolveKycScreen,
} from "@/functions/kycScreen";
import { isAdminRole } from "@/functions/rolesToPersonas";
import { authService } from "@/services/auth.service";

// Destino pós-login: início da área autenticada.
const POST_LOGIN_ROUTE = "/dashboard";
const KYC_ROUTE = "/kyc";
const ADMIN_ROUTE = "/admin";

/**
 * Destino depois que a sessão nasce (login, MFA ou aceite de convite). O login
 * só devolve tokens, e o token fica desatualizado até ser renovado — por isso a
 * decisão vem do `GET /me`, que lê a organização do banco.
 *
 * O admin da plataforma (`admin_neutra` ou `super_admin`) vai para o painel
 * administrativo, sem passar pelo KYC.
 * Organização aprovada (KYC verificado ou completo) vai para o dashboard; os
 * demais cenários (enviar, em análise, reenviar, recusada) caem na tela de KYC.
 * Qualquer falha na consulta leva ao dashboard: a sessão já existe e não deve
 * travar aqui.
 */
export async function resolvePostLoginRoute(): Promise<string> {
  try {
    const profile = await authService.me();
    if (isAdminRole(profile.roles ?? [])) return ADMIN_ROUTE;

    const organization = meOrganization(profile);
    if (!organization) return POST_LOGIN_ROUTE;

    return KYC_SETTLED_SCREENS.includes(resolveKycScreen(organization))
      ? POST_LOGIN_ROUTE
      : KYC_ROUTE;
  } catch {
    return POST_LOGIN_ROUTE;
  }
}
