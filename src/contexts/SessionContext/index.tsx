"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { rolesToPersonas } from "@/functions/rolesToPersonas";
import { authService, MeProfile } from "@/services/auth.service";
import { AuthError, ForbiddenError } from "@/services/errors";

import {
  SessionContextProps,
  SessionProviderProps,
  SessionStatus,
} from "./interface";

const LOGIN_ROUTE = "/login";

const SessionContext = React.createContext<SessionContextProps | null>(null);

// 401/403 do /me = token ausente, expirado ou inválido.
function isSessionError(error: unknown) {
  return error instanceof AuthError || error instanceof ForbiddenError;
}

/**
 * Sessão da área autenticada. Ao montar, consulta `GET /me` com o token do
 * cookie httpOnly. Se o token expirou, tenta uma vez `POST /auth/refresh` e
 * repete o /me; se a sessão não puder ser recuperada, manda para o login.
 */
const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const router = useRouter();
  const [status, setStatus] = React.useState<SessionStatus>("loading");
  const [profile, setProfile] = React.useState<MeProfile | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  // Evento, não dependência: trocar a identidade do router não deve refazer
  // a consulta ao /me.
  const redirectToLogin = React.useEffectEvent(() =>
    router.replace(LOGIN_ROUTE),
  );

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        return await authService.me({ signal });
      } catch (error) {
        if (!isSessionError(error)) throw error;
        // Access token vencido: renova pelo refresh_token e tenta de novo. Se o
        // refresh falhar, o BFF já limpou os cookies.
        await authService.refresh();
        return authService.me({ signal });
      }
    }

    load()
      .then((data) => {
        setProfile(data);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (signal.aborted) return;
        if (isSessionError(error)) {
          redirectToLogin();
          return;
        }
        setStatus("error");
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = React.useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const personas = React.useMemo(
    () => rolesToPersonas(profile?.roles ?? []),
    [profile],
  );

  const value = React.useMemo(
    () => ({ status, profile, personas, reload }),
    [status, profile, personas, reload],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export { SessionProvider, useSession };
