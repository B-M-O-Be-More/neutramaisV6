"use client";

import React from "react";

import { myMfaService, type MyMfaStatus } from "@/services/myMfa.service";

import type { UseMyMfaReturn } from "./interface";

/** 2FA do usuário da sessão (`GET /users/me/mfa/status`). */
export function useMyMfa(): UseMyMfaReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<{
    key: number;
    status: MyMfaStatus | null;
    error: string | null;
  } | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    myMfaService
      .status({ signal: controller.signal })
      .then((status) =>
        setResult({ key: attempt, status: status ?? null, error: null }),
      )
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          key: attempt,
          status: null,
          error: "Profile.security.twoFactor.errors.statusFailed",
        });
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);
  const current = result?.key === attempt ? result : null;

  return {
    status: current?.status ?? null,
    isLoading: !current,
    error: current?.error ?? null,
    reload,
  };
}
