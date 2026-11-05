"use client";

import React from "react";

import { useObjectUrl } from "@/hooks/useObjectUrl";
import { contractsService } from "@/services/contracts.service";
import { ConflictError } from "@/services/errors";

import type { UseContractDocumentReturn } from "./interface";

/** SHA-256 em hexadecimal; null sem Web Crypto (contexto não seguro). */
async function sha256Hex(blob: Blob): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await blob.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * PDF do contrato para a prévia do detalhe, conferido contra o
 * `documentHash` da contracts-api (o ETag do arquivo é o mesmo SHA-256).
 * Sem hash (pedido cancelado antes do contrato) não há documento a ler.
 */
export function useContractDocument(
  contractId: string,
  documentHash: string | null,
): UseContractDocumentReturn {
  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [isVerified, setIsVerified] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(!!documentHash);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const url = useObjectUrl(blob);

  React.useEffect(() => {
    if (!documentHash) return;
    let isCurrent = true;

    (async () => {
      try {
        const file = await contractsService.downloadDocument(contractId);
        const hash = await sha256Hex(file).catch(() => null);
        if (!isCurrent) return;
        setBlob(file);
        setIsVerified(hash === null ? null : hash === documentHash);
        setErrorKey(null);
      } catch (error) {
        if (!isCurrent) return;
        setBlob(null);
        setIsVerified(null);
        setErrorKey(
          error instanceof ConflictError
            ? "Contracts.errors.noDocument"
            : "Contracts.errors.documentFailed",
        );
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [contractId, documentHash, attempt]);

  const reload = React.useCallback(() => {
    setIsLoading(true);
    setErrorKey(null);
    setAttempt((n) => n + 1);
  }, []);

  return { blob, url, isVerified, isLoading, errorKey, reload };
}
