// Service dos contratos de pedido (contracts-api `/order-contracts`).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/contracts/*`), que anexa o Bearer da sessão
// de perfil Buyer — em 401, renova o perfil uma vez e repete.

import type {
  ContractSigning,
  OrderContract,
  OrderContractPage,
} from "@/types/contracts";

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

export interface ListContractsParams {
  /** Filtra pelo pedido (no máximo 1 contrato por pedido). */
  orderId?: string;
  /** Página, a partir de 1. */
  page?: number;
  /** Itens por página (1 a 100; padrão 20 no upstream). */
  size?: number;
}

export const contractsService = {
  /**
   * Contratos em que a organização do perfil é Buyer ou Seller, ordenados
   * pelo contractId (não pela data). 403 sem `contract:read`.
   */
  list: (
    { orderId, page, size }: ListContractsParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<OrderContractPage>("/contracts", {
        params: { orderId, page, size },
        signal: options.signal,
      }),
    ),

  /** Um contrato. 403 de outra organização; 404 quando não existe. */
  get: (contractId: string, options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<OrderContract>(`/contracts/${encodeURIComponent(contractId)}`, {
        signal: options.signal,
      }),
    ),

  /** PDF do contrato. 409 quando o pedido foi cancelado antes dele. */
  downloadDocument: (contractId: string) =>
    withProfileSession(() =>
      api.getBlob(`/contracts/${encodeURIComponent(contractId)}/document`),
    ),

  /**
   * Vincula o usuário como signatário e devolve o link da Autentique.
   * Repetir com o mesmo usuário devolve o mesmo link (recupera o link).
   */
  sign: (contractId: string) =>
    withProfileSession(() =>
      api.post<ContractSigning>(
        `/contracts/${encodeURIComponent(contractId)}/sign`,
      ),
    ),
};
