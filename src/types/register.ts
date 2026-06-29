/**
 * Valores de domínio do cadastro de empresa (US-02 — KYC Básico).
 * Os rótulos são resolvidos via i18n no componente:
 *   - setor:  Register.sectors.<value>
 *   - país:   countries.<value>
 */

export const SECTOR_VALUES = [
  "telecom",
  "isp",
  "tech",
  "infra",
  "other",
] as const;
export type Sector = (typeof SECTOR_VALUES)[number];

/**
 * Países disponíveis. Apenas BR por enquanto.
 * TODO: carregar lista completa a partir da tabela country_tax_id_format
 * (define o formato de tax ID aceito por país: CNPJ, NIF, EIN, VAT...).
 */
export const COUNTRY_VALUES = ["BR"] as const;
export type Country = (typeof COUNTRY_VALUES)[number];
