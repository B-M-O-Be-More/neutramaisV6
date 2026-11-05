"use client";

import React from "react";

import {
  ApiError,
  ConflictError,
  ForbiddenError,
  upstreamErrorCode,
} from "@/services/errors";
import {
  salesSettingsService,
  type AutoAcceptPolicy,
  type SlaConfig,
  type UpdateSlaConfigInput,
} from "@/services/salesSettings.service";

import type { UseSalesSettingsReturn } from "./interface";

/** Última leitura, marcada com a tentativa que a originou. */
interface Loaded<T> {
  key: number;
  data: T | null;
  errorKey?: string;
}

/** Falha ao gravar → chave de tradução. */
function saveErrorKey(error: unknown): string {
  if (
    upstreamErrorCode(error) === "MKT_PERMISSION_REQUIRED" ||
    error instanceof ForbiddenError
  ) {
    return "SellerSalesSettings.errors.permission";
  }
  // SLA: resolução menor que a primeira resposta.
  if (
    error instanceof ApiError &&
    (error.status === 400 || error.status === 422)
  ) {
    return "SellerSalesSettings.errors.slaOrder";
  }
  return "SellerSalesSettings.errors.saveFailed";
}

/** Lê uma configuração na montagem e a cada `reload`. */
function useLoaded<T>(
  enabled: boolean,
  load: (signal: AbortSignal) => Promise<T | undefined>,
) {
  const [attempt, setAttempt] = React.useState(0);
  const [loaded, setLoaded] = React.useState<Loaded<T> | null>(null);
  const loadRef = React.useRef(load);
  React.useEffect(() => {
    loadRef.current = load;
  });

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    loadRef
      .current(controller.signal)
      .then((data) => setLoaded({ key: attempt, data: data ?? null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setLoaded({
          key: attempt,
          data: null,
          errorKey:
            error instanceof ForbiddenError
              ? "SellerSalesSettings.errors.permission"
              : "SellerSalesSettings.errors.loadFailed",
        });
      });
    return () => controller.abort();
  }, [enabled, attempt]);

  const current = loaded?.key === attempt ? loaded : null;
  return {
    current,
    // Mantém o valor anterior enquanto relê (ex.: depois de gravar).
    data: loaded?.data ?? null,
    isLoading: enabled && !current,
    reload: () => setAttempt((n) => n + 1),
    /** Troca o valor lido pelo que a gravação devolveu. */
    replace: (data: T) => setLoaded({ key: attempt, data }),
  };
}

/**
 * Configurações de venda do Seller (D-11): prazos de SLA da organização e
 * aceite automático dos produtos físicos. O aceite automático só é lido com
 * `order:accept` — sem ela, a API responderia 403.
 */
export function useSalesSettings({
  canReadAutoAccept,
}: {
  canReadAutoAccept: boolean;
}): UseSalesSettingsReturn {
  const sla = useLoaded<SlaConfig>(true, (signal) =>
    salesSettingsService.getSlaConfig({ signal }),
  );
  const policy = useLoaded<AutoAcceptPolicy>(canReadAutoAccept, (signal) =>
    salesSettingsService.getAutoAccept({ signal }),
  );

  const [slaSaving, setSlaSaving] = React.useState(false);
  const [slaError, setSlaError] = React.useState<string>();
  const [slaSaved, setSlaSaved] = React.useState(false);
  const [policySaving, setPolicySaving] = React.useState(false);
  const [policyError, setPolicyError] = React.useState<string>();
  const [policySaved, setPolicySaved] = React.useState(false);

  const saveSla = async (input: UpdateSlaConfigInput) => {
    setSlaSaving(true);
    setSlaError(undefined);
    setSlaSaved(false);
    try {
      const updated = await salesSettingsService.updateSlaConfig(input);
      if (updated) sla.replace(updated);
      setSlaSaved(true);
    } catch (error) {
      setSlaError(saveErrorKey(error));
    } finally {
      setSlaSaving(false);
    }
  };

  const saveAutoAccept = async (autoAccept: boolean) => {
    if (!policy.data) return;
    setPolicySaving(true);
    setPolicyError(undefined);
    setPolicySaved(false);
    try {
      const updated = await salesSettingsService.setAutoAccept(
        autoAccept,
        policy.data.version,
      );
      if (updated) policy.replace(updated);
      setPolicySaved(true);
    } catch (error) {
      if (error instanceof ConflictError) {
        // Outra tela gravou antes: relê para o seller decidir de novo.
        setPolicyError("SellerSalesSettings.errors.conflict");
        policy.reload();
      } else {
        setPolicyError(saveErrorKey(error));
      }
    } finally {
      setPolicySaving(false);
    }
  };

  return {
    sla: {
      data: sla.data,
      isLoading: sla.isLoading,
      loadErrorKey: sla.current?.errorKey,
      reload: sla.reload,
      isSaving: slaSaving,
      saveErrorKey: slaError,
      saved: slaSaved,
      save: saveSla,
    },
    autoAccept: {
      data: policy.data,
      isLoading: policy.isLoading,
      loadErrorKey: policy.current?.errorKey,
      reload: policy.reload,
      isSaving: policySaving,
      saveErrorKey: policyError,
      saved: policySaved,
      save: saveAutoAccept,
    },
  };
}
