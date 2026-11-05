"use client";

import React from "react";

import type { ContractStatus } from "@/types/contracts";

// provider_pending é curto: a doc manda aguardar e ler de novo.
const POLL_MS = 5_000;
const FINAL_STATUSES: ContractStatus[] = ["signed", "cancelled"];

/**
 * Releitura dos contratos sem o usuário pedir: ao voltar para a aba (ele
 * assina na aba da Autentique) enquanto há contrato em aberto, e a cada
 * poucos segundos enquanto o envio à Autentique está começando.
 */
export function useContractAutoRefresh(
  statuses: ContractStatus[],
  refresh: () => void,
): void {
  const hasOpen = statuses.some((status) => !FINAL_STATUSES.includes(status));
  const hasPending = statuses.includes("provider_pending");
  const onRefresh = React.useEffectEvent(refresh);

  React.useEffect(() => {
    if (!hasOpen) return;
    const handleFocus = () => onRefresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [hasOpen]);

  React.useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") onRefresh();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [hasPending]);
}
