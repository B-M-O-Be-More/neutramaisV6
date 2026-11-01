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
  type SelectableProfile,
} from "@/services/profileSession.service";

import {
  ProfileSessionContextProps,
  ProfileSessionProviderProps,
  ProfileSessionStatus,
} from "./interface";

const LOGIN_ROUTE = "/login";

// Textos do aviso, por perfil.
const MESSAGES: Record<SelectableProfile, string> = {
  buyer: "BuyerSession",
  seller: "SellerSession",
};

const ProfileSessionContext =
  React.createContext<ProfileSessionContextProps | null>(null);

// Renovação recusada (refresh vencido, revogado ou ausente).
function isRejected(error: unknown) {
  return error instanceof ApiError && error.status < 500;
}

/**
 * Contexto do perfil pronto para as APIs. Reaproveita a sessão de perfil que
 * já existir (outra página, outra aba); com o token vencido, renova uma vez;
 * sem sessão do perfil, seleciona-o com a sessão do login. Só `profile` vai na
 * seleção: papel, organização e permissões vêm da identity-api.
 */
async function establishProfileContext(
  profile: SelectableProfile,
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

  if (current?.profile === profile) return current;

  // Sessão de outro perfil: encerra antes de abrir esta (best-effort).
  if (current) await profileSessionService.end().catch(() => undefined);
  await profileSessionService.select(profile);
  return profileSessionService.current({ signal });
}

function statusFromError(error: unknown): ProfileSessionStatus {
  if (error instanceof ForbiddenError) return "forbidden";
  if (error instanceof ServerError && error.status === 503) {
    return "unavailable";
  }
  return "error";
}

/** Ocupa o lugar da página enquanto o contexto do perfil não está pronto. */
function ProfileSessionGate({
  profile,
  status,
  reload,
}: {
  profile: SelectableProfile;
  status: ProfileSessionStatus;
  reload: () => void;
}) {
  const { t } = useTranslation();
  const messages = MESSAGES[profile];

  if (status === "loading") {
    return (
      <Stack align="center" justify="center" py="96px">
        <Spinner
          color="#8B5CF6"
          size="lg"
          aria-label={t(`${messages}.loading`)}
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
        {t(`${messages}.${status}`)}
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
          {t(`${messages}.retry`)}
        </Button>
      )}
    </Stack>
  );
}

/**
 * Sessão de perfil da área (identity-api `/auth/context`): só renderiza os
 * filhos com o contexto validado — o `profile` pedido e, se informada, a
 * `requiredPermission` —, e a organização deles vem desse contexto. Se a
 * sessão de perfil não puder mais ser renovada, manda para o login.
 * Precisa estar dentro do AuthenticatedLayout (a seleção usa o login).
 */
const ProfileSessionProvider: React.FC<ProfileSessionProviderProps> = ({
  profile,
  requiredPermission = null,
  children,
}) => {
  const router = useRouter();
  const [status, setStatus] = React.useState<ProfileSessionStatus>("loading");
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

    establishProfileContext(profile, signal)
      .then((current) => {
        const allowed =
          current.profile === profile &&
          (!requiredPermission ||
            current.permissions.includes(requiredPermission));
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
  }, [profile, requiredPermission, attempt]);

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
    <ProfileSessionContext.Provider value={value}>
      {status === "ready" ? (
        children
      ) : (
        <ProfileSessionGate profile={profile} status={status} reload={reload} />
      )}
    </ProfileSessionContext.Provider>
  );
};

function useProfileSession() {
  const context = React.useContext(ProfileSessionContext);
  if (!context) {
    throw new Error(
      "useProfileSession must be used within a ProfileSessionProvider",
    );
  }
  return context;
}

export { ProfileSessionProvider, useProfileSession };
