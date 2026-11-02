import { RESUME_PARAM } from "@/contexts/RegisterFlowContext";
import { REGISTER_STEPS } from "@/contexts/RegisterFlowContext/interface";
import {
  KYC_SETTLED_SCREENS,
  meOrganization,
  resolveKycScreen,
} from "@/functions/kycScreen";
import { saveRegisterHandoff } from "@/functions/registerHandoff";
import { isAdminRole } from "@/functions/rolesToPersonas";
import { authService, type MeProfile } from "@/services/auth.service";

// Destino pós-login: início da área autenticada.
const POST_LOGIN_ROUTE = "/dashboard";
const KYC_ROUTE = "/kyc";
const ADMIN_ROUTE = "/admin";
// Etapa de Verificação do cadastro, que aguarda o link do e-mail.
const VERIFY_ROUTE = `/register?${RESUME_PARAM}=verify`;
const VERIFY_STEP = REGISTER_STEPS.findIndex((step) => step.id === "verify");

/**
 * Destino depois que a sessão nasce (login, MFA ou aceite de convite). O login
 * só devolve tokens, e o token fica desatualizado até ser renovado — por isso a
 * decisão vem do `GET /me`, que lê a organização do banco.
 *
 * O admin da plataforma (`admin_neutra` ou `super_admin`) vai para o painel
 * administrativo, sem passar pelo KYC.
 * Conta pré-cadastrada (e-mail ainda não confirmado) volta para a Verificação do
 * cadastro — ver `resumeEmailConfirmation`.
 * Organização aprovada (KYC verificado ou completo) vai para o dashboard; os
 * demais cenários (enviar, em análise, reenviar, recusada) caem na tela de KYC.
 * Qualquer falha na consulta leva ao dashboard: a sessão já existe e não deve
 * travar aqui.
 */
export async function resolvePostLoginRoute(): Promise<string> {
  try {
    const profile = await authService.me();
    if (isAdminRole(profile.roles ?? [])) return ADMIN_ROUTE;

    if (profile.email_confirmed === false) {
      return await resumeEmailConfirmation(profile);
    }

    const organization = meOrganization(profile);
    if (!organization) return POST_LOGIN_ROUTE;

    return KYC_SETTLED_SCREENS.includes(resolveKycScreen(organization))
      ? POST_LOGIN_ROUTE
      : KYC_ROUTE;
  } catch {
    return POST_LOGIN_ROUTE;
  }
}

/**
 * O register já cria a conta (pré-cadastro) e dispara o e-mail; se o usuário sai
 * da Verificação antes de abrir o link, só o login o traz de volta. Aqui o
 * handoff é regravado com o que o `/me` sabe — a aba original (e o formulário)
 * já não existe — e um link novo é pedido, porque o anterior vale só 15 minutos.
 *
 * O reenvio fica no login, e não na montagem da Verificação, para um refresh da
 * tela não consumir o limite de 3 reenvios por hora. Se ele falhar (ex.: 429), o
 * usuário segue para a Verificação do mesmo jeito: o último link enviado pode
 * ainda valer.
 */
async function resumeEmailConfirmation(profile: MeProfile): Promise<string> {
  saveRegisterHandoff({
    organizationId: meOrganization(profile)?.id ?? profile.organization_id ?? "",
    email: profile.email,
    phone: profile.phone ?? undefined,
    step: VERIFY_STEP,
    emailConfirmed: false,
    userId: profile.id,
    phoneConfirmed: profile.phone_confirmed,
  });

  try {
    await authService.resendEmailConfirmation(profile.id);
  } catch {
    // Ver acima: a Verificação abre mesmo sem o reenvio.
  }

  return VERIFY_ROUTE;
}
