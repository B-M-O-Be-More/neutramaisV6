// Service da cota de armazenamento de cobertura (geo-api).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/geo/*`), que anexa o Bearer do cookie.

import { api } from "./api.client";

/**
 * Armazenamento da organização, em MB (1 MB = 1.000.000 bytes). Originais,
 * geometrias e metadados retidos contam — inclusive versões históricas e
 * arquivos arquivados.
 */
export interface OrganizationStorage {
  organizationId: string;
  quotaMb: number;
  usedMb: number;
  /** Zero quando o consumo passa da cota. */
  availableMb: number;
  /** A cota ficou abaixo do consumo: os dados ficam, novos envios não. */
  overQuota: boolean;
  originalsMb: number;
  geometriesMb: number;
  metadataMb: number;
  /** Cota de quem nunca teve ajuste (200 MB). */
  defaultQuotaMb: number;
  /** Maior cota que o admin pode definir (1000 MB). */
  maxQuotaMb: number;
}

export interface UpdateQuotaInput {
  quotaMb: number;
  /** Motivo registrado na auditoria da geo-api. */
  reason: string;
}

export const geoStorageService = {
  /** Cota e consumo. 403 para outra organização (exceto `super_admin`). */
  getStorage: (
    organizationId: string,
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<OrganizationStorage>(
      `/geo/organizations/${encodeURIComponent(organizationId)}/storage`,
      { signal: options.signal },
    ),

  /** Altera a cota. Só `super_admin` (403); 422 fora de 0–1000 MB. */
  updateQuota: (organizationId: string, input: UpdateQuotaInput) =>
    api.patch<OrganizationStorage>(
      `/geo/organizations/${encodeURIComponent(organizationId)}/storage/quota`,
      input,
    ),
};
