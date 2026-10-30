// URLs das APIs da Neutra+ consumidas pelos proxies BFF (server-only).
//
// Todas ficam no mesmo host: `API_BASE_URL` (ex.: https://hom-api.neutramais.com)
// mais o caminho e a versão de cada serviço, definidos aqui. Cada serviço
// aceita uma URL própria (`GEO_API_URL` etc.), que vence a base — útil para
// apontar um serviço para o localhost e o resto para a homologação.
//
// Variáveis só de servidor, lidas em tempo de execução: a mesma imagem serve
// homologação e produção, e o endereço das APIs não vai para o navegador
// (ADR-002). Por isso não é `NEXT_PUBLIC_*`.

import "server-only";

export type ApiService =
  | "identity"
  | "marketplace"
  | "compliance"
  | "geo"
  | "wallet";

/** Caminho (com a versão) de cada serviço no host da `API_BASE_URL`. */
export const API_SERVICE_PATHS: Record<ApiService, string> = {
  identity: "/identity/api/v1",
  marketplace: "/marketplace/api/v2",
  compliance: "/compliance/api/v1",
  geo: "/geo/api/v2",
  wallet: "/wallet/api/v2",
};

/** Variável que sobrescreve a URL de cada serviço (opcional). */
export const API_SERVICE_OVERRIDES: Record<ApiService, string> = {
  identity: "IDENTITY_API_URL",
  marketplace: "MARKETPLACE_API_URL",
  compliance: "COMPLIANCE_API_URL",
  geo: "GEO_API_URL",
  wallet: "WALLET_API_URL",
};

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * URL base de um serviço: a própria (`GEO_API_URL`...) ou `API_BASE_URL` +
 * o caminho do serviço. `undefined` sem nenhuma das duas configurada.
 */
export function apiBaseUrl(service: ApiService): string | undefined {
  const override = process.env[API_SERVICE_OVERRIDES[service]]?.trim();
  if (override) return withoutTrailingSlash(override);
  const base = process.env.API_BASE_URL?.trim();
  return base
    ? `${withoutTrailingSlash(base)}${API_SERVICE_PATHS[service]}`
    : undefined;
}

/** Mensagem do erro de configuração, com as variáveis que resolvem. */
export function missingApiUrlMessage(service: ApiService): string {
  return `Configure API_BASE_URL (ou ${API_SERVICE_OVERRIDES[service]}) no ambiente.`;
}
