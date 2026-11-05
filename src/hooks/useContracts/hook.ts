"use client";

import React from "react";

import {
  sortContractEntries,
  summarizeContracts,
} from "@/functions/contractFormat";
import { useContractAutoRefresh } from "@/hooks/useContractAutoRefresh";
import { contractsService } from "@/services/contracts.service";
import {
  ForbiddenError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
  ValidationError,
} from "@/services/errors";
import { ordersService, type ProductOrder } from "@/services/orders.service";
import type { ContractEntry, OrderContract } from "@/types/contracts";

import type { UseContractsReturn } from "./interface";

const PAGE_SIZE = 100;
// Limite de segurança: 5000 contratos.
const MAX_PAGES = 50;

/** Chave i18n da falha de leitura de contratos. */
export function contractsErrorKey(error: unknown): string {
  if (error instanceof ForbiddenError) return "Contracts.errors.forbidden";
  // 422: o contractId da URL não é UUID — nenhum contrato tem esse ID.
  if (error instanceof NotFoundError || error instanceof ValidationError) {
    return "Contracts.errors.notFound";
  }
  if (
    error instanceof ServerError ||
    error instanceof NetworkError ||
    error instanceof TimeoutError
  ) {
    return "Contracts.errors.unavailable";
  }
  return "Contracts.errors.failed";
}

/** Lê todas as páginas da lista de contratos da organização. */
async function fetchAllContracts(
  signal: AbortSignal,
): Promise<OrderContract[]> {
  const contracts: OrderContract[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await contractsService.list(
      { page, size: PAGE_SIZE },
      { signal },
    );
    contracts.push(...result.items);
    if (result.items.length < PAGE_SIZE || contracts.length >= result.total) {
      break;
    }
  }
  return contracts;
}

/**
 * Junta a cada contrato o pedido que o originou (produto, valor, data). Os
 * pedidos lidos ficam no `cache`; um pedido que falha fica null e o contrato
 * aparece sem esses dados.
 */
export async function attachOrders(
  contracts: OrderContract[],
  cache: Map<string, ProductOrder>,
  signal: AbortSignal,
): Promise<ContractEntry[]> {
  const missing = [
    ...new Set(
      contracts
        .map((contract) => contract.orderId)
        .filter((id) => !cache.has(id)),
    ),
  ];
  const results = await Promise.allSettled(
    missing.map((id) => ordersService.getOrder(id, { signal })),
  );
  results.forEach((result, index) => {
    if (result.status === "fulfilled") cache.set(missing[index], result.value);
  });
  return contracts.map((contract) => ({
    contract,
    order: cache.get(contract.orderId) ?? null,
  }));
}

/**
 * Contratos de pedido do Buyer (contracts-api, perfil Buyer com
 * `contract:read`), com o pedido de cada um, do mais novo ao mais antigo.
 * Volta a ler sozinho ao retomar a aba e enquanto um envio à Autentique está
 * em andamento.
 */
export function useContracts(): UseContractsReturn {
  const [entries, setEntries] = React.useState<ContractEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const orders = React.useRef(new Map<string, ProductOrder>());
  // Releitura em segundo plano: uma falha mantém a lista que já está na tela.
  const isSilent = React.useRef(false);

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetchAllContracts(signal)
      .then((list) => attachOrders(list, orders.current, signal))
      .then((list) => {
        if (signal.aborted) return;
        setEntries(sortContractEntries(list));
        setErrorKey(null);
      })
      .catch((error) => {
        if (signal.aborted || isSilent.current) return;
        setEntries([]);
        setErrorKey(contractsErrorKey(error));
      })
      .finally(() => {
        if (signal.aborted) return;
        isSilent.current = false;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = React.useCallback(() => {
    isSilent.current = false;
    setIsLoading(true);
    setErrorKey(null);
    setAttempt((n) => n + 1);
  }, []);

  const refresh = React.useCallback(() => {
    isSilent.current = true;
    setAttempt((n) => n + 1);
  }, []);

  useContractAutoRefresh(
    entries.map(({ contract }) => contract.status),
    refresh,
  );

  const summary = React.useMemo(() => summarizeContracts(entries), [entries]);

  return { entries, summary, isLoading, errorKey, reload, refresh };
}
