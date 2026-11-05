"use client";

import React from "react";

import { useContractAutoRefresh } from "@/hooks/useContractAutoRefresh";
import { attachOrders, contractsErrorKey } from "@/hooks/useContracts";
import { contractsService } from "@/services/contracts.service";
import type { ProductOrder } from "@/services/orders.service";
import type { ContractEntry } from "@/types/contracts";

import type { UseContractReturn } from "./interface";

/**
 * Um contrato de pedido (contracts-api) com o pedido que o originou. Volta a
 * ler sozinho como a lista (useContractAutoRefresh).
 */
export function useContract(contractId: string): UseContractReturn {
  const [entry, setEntry] = React.useState<ContractEntry | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const orders = React.useRef(new Map<string, ProductOrder>());
  // Releitura em segundo plano: uma falha mantém o contrato na tela.
  const isSilent = React.useRef(false);

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    contractsService
      .get(contractId, { signal })
      .then((contract) => attachOrders([contract], orders.current, signal))
      .then(([current]) => {
        if (signal.aborted) return;
        setEntry(current);
        setErrorKey(null);
      })
      .catch((error) => {
        if (signal.aborted || isSilent.current) return;
        setEntry(null);
        setErrorKey(contractsErrorKey(error));
      })
      .finally(() => {
        if (signal.aborted) return;
        isSilent.current = false;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [contractId, attempt]);

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

  useContractAutoRefresh(entry ? [entry.contract.status] : [], refresh);

  return { entry, isLoading, errorKey, reload, refresh };
}
