"use client";

import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";

import { ApiError, RateLimitError, upstreamErrorCode } from "@/services/errors";
import { myMfaService } from "@/services/myMfa.service";

import { MfaStepUpDialogProps } from "./interface";

const CODE_LENGTH = 6;

/** Erro do step-up → chave de tradução. */
function stepUpErrorKey(error: unknown): string {
  const code = upstreamErrorCode(error);
  if (code === "INVALID_MFA_CODE") return "MfaStepUp.errors.invalidCode";
  if (code === "MFA_ENROLLMENT_REQUIRED") {
    return "MfaStepUp.errors.enrollmentRequired";
  }
  if (error instanceof RateLimitError) return "MfaStepUp.errors.rateLimited";
  // 401 sem o código de MFA: a sessão acabou.
  if (error instanceof ApiError && error.status === 401) {
    return "MfaStepUp.errors.sessionExpired";
  }
  return "MfaStepUp.errors.failed";
}

/**
 * Pede o código do app autenticador quando uma ação exige sessão com MFA
 * (403 `mfa_required`). O step-up eleva a sessão atual, sem novo login; ao
 * confirmar, quem abriu repete a ação.
 */
export function MfaStepUpDialog({
  open,
  reason,
  onSuccess,
  onClose,
}: MfaStepUpDialogProps) {
  const { t } = useTranslation();
  const [code, setCode] = React.useState("");
  const [errorKey, setErrorKey] = React.useState<string>();
  const [isPending, setIsPending] = React.useState(false);
  const inputId = React.useId();

  // A próxima abertura começa limpa.
  const reset = () => {
    setCode("");
    setErrorKey(undefined);
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length !== CODE_LENGTH || isPending) return;
    setIsPending(true);
    setErrorKey(undefined);
    try {
      await myMfaService.stepUp(code);
      reset();
      onSuccess();
    } catch (error) {
      setErrorKey(stepUpErrorKey(error));
      // Código usado não vale de novo: o campo volta vazio.
      setCode("");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isPending) close();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="400px" w="calc(100% - 32px)" rounded="14px">
            <form onSubmit={submit} noValidate>
              <Dialog.Header>
                <Dialog.Title fontSize="15px" fontWeight={700} color="#0F1729">
                  {t("MfaStepUp.title")}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <Stack gap="14px">
                  <Text color="#5A6478" fontSize="13px" lineHeight="20px">
                    {reason}
                  </Text>
                  <Field.Root invalid={!!errorKey}>
                    <Field.Label
                      htmlFor={inputId}
                      color="#0F1729"
                      fontSize="13px"
                      fontWeight={600}
                    >
                      {t("MfaStepUp.codeLabel")}
                    </Field.Label>
                    <Input
                      id={inputId}
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, CODE_LENGTH),
                        )
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      autoFocus
                      h="44px"
                      rounded="10px"
                      fontSize="18px"
                      letterSpacing="0.3em"
                      textAlign="center"
                      fontVariantNumeric="tabular-nums"
                    />
                    {errorKey && (
                      <Field.ErrorText fontSize="12px">
                        {t(errorKey)}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer gap="8px">
                <Button
                  type="button"
                  variant="outline"
                  h="36px"
                  rounded="10px"
                  borderColor="#E5E8EE"
                  color="#5A6478"
                  fontSize="13px"
                  disabled={isPending}
                  onClick={close}
                >
                  {t("MfaStepUp.cancel")}
                </Button>
                <Button
                  type="submit"
                  h="36px"
                  rounded="10px"
                  bg="#1F5AFF"
                  color="white"
                  fontSize="13px"
                  fontWeight={600}
                  disabled={code.length !== CODE_LENGTH}
                  loading={isPending}
                  _hover={{ bg: "#1646CC" }}
                >
                  {t("MfaStepUp.confirm")}
                </Button>
              </Dialog.Footer>
            </form>

            <Dialog.CloseTrigger asChild disabled={isPending}>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
