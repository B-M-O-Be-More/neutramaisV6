// Service de organizações — cadastro (público) e criação do usuário-raiz.
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/*`); os route handlers fazem proxy pra identity-api.

import { api } from "./api.client";

export type OrganizationType = "buyer" | "seller";
export type OrganizationStatus = "active" | "pending";
export type KycLevel = "pending" | "basic" | "verified" | "complete";

/**
 * Payload de `POST /organizations/register`.
 *
 * ATENÇÃO: `password` é OBRIGATÓRIO, apesar de o artefato e a coleção do
 * Insomnia omitirem o campo. Verificado contra a API de homologação — corpo
 * vazio devolve `body.password -> missing | Field required` junto dos demais
 * obrigatórios. O registro cria a organização e a credencial do usuário-raiz na
 * mesma chamada.
 *
 * O endpoint recusa campos desconhecidos (`extra_forbidden`): `display_name`,
 * por exemplo, NÃO é aceito aqui.
 */
export interface RegisterOrganizationDto {
  organization_type: OrganizationType;
  /** ISO-3166 alpha-2, maiúsculo (ex.: "BR"). */
  country_code: string;
  /** CNPJ ou tax-id internacional, apenas dígitos/alfanumérico (sem pontuação). */
  tax_id: string;
  legal_name?: string;
  trade_name?: string;
  contact_email: string;
  /** E.164 (ex.: "+5511999998888"). */
  contact_phone: string;
  /** Mínimo 12, com maiúscula, dígito e símbolo (RN-528, ver schemas/password). */
  password: string;
}

/** Resposta de `POST /organizations/register` (data do envelope). */
export interface Organization {
  id: string;
  organization_type: OrganizationType;
  status: OrganizationStatus;
  kyc_level: KycLevel;
  legal_name?: string;
  country_code: string;
  tax_id_masked: string;
  created_at: string;
}

/**
 * Payload de `POST /organizations/{org_id}/users`.
 *
 * ATENÇÃO: este endpoint exige Bearer (`{"detail":"Bearer token required"}`),
 * logo NÃO serve para o cadastro público — no onboarding ainda não há sessão.
 * Serve para um admin já autenticado adicionar membros a uma organização
 * existente. O usuário-raiz nasce junto do `register`.
 */
export interface CreateUserDto {
  email: string;
  /** E.164. */
  phone: string;
  /** Mínimo 12, com maiúscula/minúscula/dígito/símbolo (validado no backend). */
  password: string;
  display_name?: string;
}

/** Resposta de `POST /organizations/{org_id}/users` (data do envelope). */
export interface OrganizationUser {
  id: string;
  organization_id: string;
  email: string;
  phone: string;
  email_confirmed: boolean;
  phone_confirmed: boolean;
  status: string;
  created_at: string;
}

export const organizationsService = {
  /** Registra a organização (buyer ou seller). Ponto de entrada do onboarding. */
  register: (data: RegisterOrganizationDto) =>
    api.post<Organization>("/organizations/register", data),

  /** Cria o usuário-raiz dentro da organização recém-criada. */
  createUser: (orgId: string, data: CreateUserDto) =>
    api.post<OrganizationUser>(`/organizations/${orgId}/users`, data),
};
