"use client";

import { Button, Flex, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCircleAlert } from "react-icons/lu";

import { RESUME_PARAM } from "@/contexts/RegisterFlowContext";
import { REGISTER_STEPS } from "@/contexts/RegisterFlowContext/interface";
import { resetRegisterHandoff } from "@/functions/registerHandoff";
import useFetch from "@/hooks/useFetch/hook";
import type { ConfirmEmailResult } from "@/services/auth.service";

import { ConfirmEmailStatus } from "./interface";

// Etapa em que o cadastro é retomado após a confirmação: a própria Verificação,
// onde a confirmação do telefone é liberada assim que o e-mail é validado.
const VERIFY_STEP = REGISTER_STEPS.findIndex((step) => step.id === "verify");

/**
 * Landing de confirmação de e-mail. O link enviado por e-mail aponta para
 * `/confirm-email?token=...&user_id=...`; ao montar, chamamos
 * GET /auth/confirm-email e exibimos o resultado. Página pública — o usuário
 * abre o link fora da sessão do cadastro.
 *
 * Confirmado o e-mail, o estado do navegador é zerado e regravado com o que veio
 * no link (localStorage aqui; cookies no BFF, na resposta da própria request), e
 * o fluxo sempre segue para a etapa de Verificação — agora com o telefone
 * liberado. Vale inclusive quando não havia cadastro em andamento neste
 * navegador (link aberto em outro dispositivo): ali o handoff nasce só com o
 * `user_id` e o `token`, que é o bastante para confirmar o telefone.
 */
export function ConfirmEmail() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();

  const [confirmRequest] = useFetch<ConfirmEmailResult>();
  const [resendRequest] = useFetch();

  const token = params.get("token") ?? "";
  const userId = params.get("user_id") ?? "";
  const hasParams = Boolean(token && userId);

  // Sem token/user_id o link é inválido — já inicia em "error" (sem setState
  // dentro do efeito). Com os parâmetros, começa em "loading" e o efeito confirma.
  const [status, setStatus] = React.useState<ConfirmEmailStatus>(
    hasParams ? "loading" : "error",
  );
  const [resent, setResent] = React.useState(false);

  // Evita a chamada dupla do efeito no StrictMode (dev).
  const requested = React.useRef(false);

  React.useEffect(() => {
    if (requested.current || !hasParams) return;
    requested.current = true;

    confirmRequest("/auth/confirm-email", {
      method: "GET",
      params: { token, user_id: userId },
    })
      .then(() => {
        // Estado do navegador zerado e regravado com o que veio no link: o
        // `user_id` identifica o usuário na confirmação do telefone (feita sem
        // sessão) e o `token` fica guardado para o restante do fluxo. Os cookies
        // são resetados pelo BFF na resposta desta mesma request.
        resetRegisterHandoff({ userId, token, step: VERIFY_STEP });

        setStatus("resuming");
        // A etapa vai na URL (e não só no handoff) para o stepper já montar
        // posicionado, sem sincronizar estado num efeito.
        router.replace(`/register?${RESUME_PARAM}=verify`);
      })
      .catch(() => setStatus("error"));
  }, [hasParams, token, userId, confirmRequest, router]);

  const handleResend = async () => {
    if (!userId) return;
    try {
      await resendRequest(`/users/${userId}/resend-email-confirmation`, {
        method: "POST",
      });
      setResent(true);
    } catch {
      setResent(false);
    }
  };

  return (
    <Stack w="full" maxW="440px" align="center" textAlign="center" gap={5}>
      {(status === "loading" || status === "resuming") && (
        <>
          <Spinner size="xl" color="brand.500" borderWidth="3px" />
          <Stack gap={1}>
            <Text fontSize="20px" fontWeight={800} color="fg.default">
              {t(
                status === "resuming"
                  ? "ConfirmEmail.resuming.title"
                  : "ConfirmEmail.loading.title",
              )}
            </Text>
            <Text fontSize="14px" color="fg.muted">
              {t(
                status === "resuming"
                  ? "ConfirmEmail.resuming.subtitle"
                  : "ConfirmEmail.loading.subtitle",
              )}
            </Text>
          </Stack>
        </>
      )}

      {status === "error" && (
        <>
          <Flex
            align="center"
            justify="center"
            boxSize="56px"
            rounded="16px"
            bg="#FEF2F2"
          >
            <Icon as={LuCircleAlert} boxSize="28px" color="#EF4444" />
          </Flex>
          <Stack gap={1}>
            <Text fontSize="20px" fontWeight={800} color="fg.default">
              {t("ConfirmEmail.error.title")}
            </Text>
            <Text fontSize="14px" color="fg.muted">
              {token && userId
                ? t("ConfirmEmail.error.subtitle")
                : t("ConfirmEmail.missing")}
            </Text>
          </Stack>

          {resent ? (
            <Text fontSize="13px" fontWeight={600} color="#10B981">
              {t("ConfirmEmail.error.resent")}
            </Text>
          ) : (
            userId && (
              <Button
                onClick={handleResend}
                w="full"
                h="50px"
                rounded="14px"
                bg="brand.500"
                color="white"
                fontSize="15px"
                fontWeight={700}
                _hover={{ bg: "brand.600" }}
              >
                {t("ConfirmEmail.error.resend")}
              </Button>
            )
          )}

          <Link href="/login" style={{ color: "#1F5AFF", fontSize: "13px" }}>
            {t("ConfirmEmail.error.backToLogin")}
          </Link>
        </>
      )}
    </Stack>
  );
}
