"use client";

import { Button, Spinner, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  ApiError,
  AuthError,
  ForbiddenError,
  ServerError,
} from "@/services/errors";
import {
  profileSessionService,
  type ProfileContext,
} from "@/services/profileSession.service";

import {
  SellerSessionContextProps,
  SellerSessionProviderProps,
  SellerSessionStatus,
} from "./interface";

const LOGIN_ROUTE = "/login";
const SELLER_PROFILE = "seller";
// Permissão que a geo-api exige para ler as coberturas.
const COVERAGE_READ_PERMISSION = "geo:coverage:read";

const SellerSessionContext =
  React.createContext<SellerSessionContextProps | null>(null);

// Renovação recusada (refresh vencido, revogado ou ausente).
function isRejected(error: unknown) {
  return error instanceof ApiError && error.status < 500;
}

/**
 * Contexto Seller pronto para a geo-api. Reaproveita a sessão de perfil que
 * já existir (outra página, outra aba); com o token vencido, renova uma vez;
 * sem sessão Seller, seleciona o perfil com a sessão do login.
 */
async function establishSellerContext(
  signal: AbortSignal,
): Promise<ProfileContext> {
  let current: ProfileContext | null = null;
  try {
    current = await profileSessionService.current({ signal });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    try {
      await profileSessionService.refresh();
      current = await profileSessionService.current({ signal });
    } catch (refreshError) {
      if (!isRejected(refreshError)) throw refreshError;
    }
  }

  if (current?.profile === SELLER_PROFILE) return current;

  // Sessão de outro perfil: encerra antes de abrir a Seller (best-effort).
  if (current) await profileSessionService.end().catch(() => undefined);
  await profileSessionService.select(SELLER_PROFILE);
  return profileSessionService.current({ signal });
}

function statusFromError(error: unknown): SellerSessionStatus {
  if (error instanceof ForbiddenError) return "forbidden";
  if (error instanceof ServerError && error.status === 503) {
    return "unavailable";
  }
  return "error";
}

/** Ocupa o lugar da página enquanto o contexto Seller não está pronto. */
function SellerSessionGate({
  status,
  reload,
}: {
  status: SellerSessionStatus;
  reload: () => void;
}) {
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <Stack align="center" justify="center" py="96px">
        <Spinner
          color="#8B5CF6"
          size="lg"
          aria-label={t("SellerSession.loading")}
        />
      </Stack>
    );
  }

  return (
    <Stack
      align="center"
      justify="center"
      gap="12px"
      py="96px"
      px={6}
      textAlign="center"
    >
      <Text role="alert" color="#0F1729" fontSize="14px" fontWeight={600}>
        {t(`SellerSession.${status}`)}
      </Text>
      {status !== "forbidden" && (
        <Button
          variant="plain"
          h="36px"
          px="14px"
          rounded="10px"
          borderWidth="1px"
          borderColor="#E5E8EE"
          color="#8B5CF6"
          fontSize="13px"
          fontWeight={600}
          onClick={reload}
        >
          {t("SellerSession.retry")}
        </Button>
      )}
    </Stack>
  );
}

/**
 * Sessão de perfil Seller da área do seller (identity-api `/auth/context`).
 * Só renderiza os filhos com o contexto validado — `profile=seller` e
 * `geo:coverage:read` —, e a organização deles vem desse contexto. Se a
 * sessão de perfil não puder mais ser renovada, manda para o login.
 * Precisa estar dentro do AuthenticatedLayout (a seleção usa o login).
 */
const SellerSessionProvider: React.FC<SellerSessionProviderProps> = ({
  children,
}) => {
  const router = useRouter();
  const [status, setStatus] = React.useState<SellerSessionStatus>("loading");
  const [context, setContext] = React.useState<ProfileContext | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  const redirectToLogin = React.useEffectEvent(() =>
    router.replace(LOGIN_ROUTE),
  );

  // Renovação recusada no meio do uso (withProfileSession): novo login.
  React.useEffect(
    () => profileSessionService.onExpired(() => redirectToLogin()),
    [],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    establishSellerContext(signal)
      .then((current) => {
        const allowed =
          current.profile === SELLER_PROFILE &&
          current.permissions.includes(COVERAGE_READ_PERMISSION);
        setContext(allowed ? current : null);
        setStatus(allowed ? "ready" : "forbidden");
      })
      .catch((error) => {
        if (signal.aborted) return;
        // A seleção usa o login: 401 aqui é o login que acabou.
        if (error instanceof AuthError) {
          redirectToLogin();
          return;
        }
        setStatus(statusFromError(error));
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = React.useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const value = React.useMemo(
    () => ({
      status,
      context,
      organizationId: context?.organization_id ?? null,
      reload,
    }),
    [status, context, reload],
  );

  return (
    <SellerSessionContext.Provider value={value}>
      {status === "ready" ? (
        children
      ) : (
        <SellerSessionGate status={status} reload={reload} />
      )}
    </SellerSessionContext.Provider>
  );
};

function useSellerSession() {
  const context = React.useContext(SellerSessionContext);
  if (!context) {
    throw new Error(
      "useSellerSession must be used within a SellerSessionProvider",
    );
  }
  return context;
}

export { SellerSessionProvider, useSellerSession };
