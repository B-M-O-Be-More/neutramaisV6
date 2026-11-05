// Service das configurações de venda do Seller (marketplace-api): prazos de
// SLA da organização (`/slaConfig`) e aceite automático dos produtos físicos
// (`/productOffering/account/shippingPolicy`).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF, que anexa o Bearer da sessão de perfil Seller —
// em 401, renova o perfil uma vez e repete.

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

/** `GET /slaConfig`. Sem configuração, a API cria a padrão (4 h e 48 h). */
export interface SlaConfig {
  id: string;
  organizationId: string;
  /** Prazo da primeira resposta, em horas (≥ 1). */
  maxFirstResponseHours: number;
  /** Prazo da resolução, em horas (≥ a primeira resposta). */
  maxResolutionHours: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Corpo de `PATCH /slaConfig`: só o que muda. */
export interface UpdateSlaConfigInput {
  maxFirstResponseHours?: number;
  maxResolutionHours?: number;
}

/** Aceite automático da organização (todos os produtos físicos). */
export interface AutoAcceptPolicy {
  autoAccept: boolean;
  /** Versão gravada; `0` antes da primeira gravação. */
  version: number;
}

export const salesSettingsService = {
  getSlaConfig: (options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<SlaConfig>("/productCatalog/slaConfig", {
        signal: options.signal,
      }),
    ),

  /**
   * Altera os prazos. 400 quando a resolução fica menor que a primeira
   * resposta; 403 `MKT_PERMISSION_REQUIRED` sem `sla:change`.
   */
  updateSlaConfig: (input: UpdateSlaConfigInput) =>
    withProfileSession(() =>
      api.patch<SlaConfig>("/productCatalog/slaConfig", input),
    ),

  /** Aceite automático. 403 `MKT_PERMISSION_REQUIRED` sem `order:accept`. */
  getAutoAccept: (options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<AutoAcceptPolicy>(
        "/productCatalog/productOffering/account/shippingPolicy",
        { signal: options.signal },
      ),
    ),

  /**
   * Liga ou desliga o aceite automático. `expectedVersion` é a versão lida:
   * se outra tela gravou antes, 409.
   */
  setAutoAccept: (autoAccept: boolean, expectedVersion: number) =>
    withProfileSession(() =>
      api.put<AutoAcceptPolicy>(
        "/productCatalog/productOffering/account/shippingPolicy",
        { autoAccept, expectedVersion },
      ),
    ),
};
