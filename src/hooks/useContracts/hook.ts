"use client";

import React from "react";

import { placeholderContracts } from "@/data/contractsPlaceholder";
import type {
  Contract,
  ContractChangeRequest,
  ContractsSummary,
} from "@/types/contracts";

import type { UseContractsReturn } from "./interface";

const DAY = 24 * 60 * 60 * 1000;

/** Dias inteiros até a data (arredondados para cima); 0 se já passou. */
export function daysUntil(iso: string, now: number): number {
  const diff = new Date(iso).getTime() - now;
  return Number.isFinite(diff) && diff > 0 ? Math.ceil(diff / DAY) : 0;
}

/** Próximo ID sequencial do ano: CR-2026-015. */
function buildChangeRequestId(contracts: Contract[]): string {
  const prefix = `CR-${new Date().getFullYear()}-`;
  const last = contracts
    .flatMap((contract) => contract.changeRequests)
    .reduce((max, request) => {
      if (!request.id.startsWith(prefix)) return max;
      const sequence = Number(request.id.slice(prefix.length));
      return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
    }, 0);
  return `${prefix}${String(last + 1).padStart(3, "0")}`;
}

/** Aplica `patch` ao contrato `id` da lista. */
function patchContract(
  list: Contract[],
  id: string,
  patch: (contract: Contract) => Contract,
): Contract[] {
  return list.map((contract) =>
    contract.id === id ? patch(contract) : contract,
  );
}

/**
 * Contratos do buyer. A API de contratos ainda não existe: a lista nasce dos
 * dados do design e as ações alteram o estado local, com a mesma assinatura
 * assíncrona que as chamadas à API terão.
 */
export function useContracts(): UseContractsReturn {
  const [now] = React.useState(() => Date.now());
  const [contracts, setContracts] = React.useState<Contract[]>(() =>
    placeholderContracts(now),
  );
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const summary = React.useMemo<ContractsSummary>(
    () => ({
      active: contracts.filter((contract) => contract.status !== "suspended")
        .length,
      renewing: contracts.filter((contract) => contract.status === "renewing")
        .length,
      suspended: contracts.filter((contract) => contract.status === "suspended")
        .length,
      changeRequests: contracts.reduce(
        (total, contract) =>
          total +
          contract.changeRequests.filter(
            (request) => request.status === "pending",
          ).length,
        0,
      ),
    }),
    [contracts],
  );

  const toggleAutoRenew = React.useCallback(async (id: string) => {
    setPendingId(id);
    setContracts((list) =>
      patchContract(list, id, (contract) => ({
        ...contract,
        autoRenew: !contract.autoRenew,
      })),
    );
    setPendingId(null);
    return true;
  }, []);

  // O seller avalia e responde com a proposta de aditivo (ou recusa).
  const requestAmendment = React.useCallback(
    async (id: string, description: string) => {
      if (!contracts.some((contract) => contract.id === id)) return null;

      setPendingId(id);
      const request: ContractChangeRequest = {
        id: buildChangeRequestId(contracts),
        description,
        requestedAt: new Date().toISOString(),
        status: "pending",
      };
      setContracts((list) =>
        patchContract(list, id, (contract) => ({
          ...contract,
          changeRequests: [request, ...contract.changeRequests],
        })),
      );
      setPendingId(null);
      return request;
    },
    [contracts],
  );

  // O contrato segue ativo até o seller processar o pedido.
  const requestCancellation = React.useCallback(
    async (id: string) => {
      const current = contracts.find((contract) => contract.id === id);
      if (!current || current.cancellationRequested) return false;

      setPendingId(id);
      setContracts((list) =>
        patchContract(list, id, (contract) => ({
          ...contract,
          cancellationRequested: true,
        })),
      );
      setPendingId(null);
      return true;
    },
    [contracts],
  );

  return {
    contracts,
    summary,
    now,
    pendingId,
    toggleAutoRenew,
    requestAmendment,
    requestCancellation,
  };
}
