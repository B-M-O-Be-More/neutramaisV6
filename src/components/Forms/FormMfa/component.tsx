"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuArrowLeft, LuKeyRound, LuShieldCheck } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import { mfaRecoverySchema, mfaTotpSchema } from "@/schemas/mfa";

import {
  FormMfaProps,
  MfaMode,
  MfaRecoveryValues,
  MfaTotpValues,
} from "./interface";

/**
 * Desafio de segundo fator do login (US-01). O artefato aceita EXATAMENTE UM de
 * `totp_code` | `recovery_code`, então mantemos dois formulários independentes e
 * renderizamos só o do modo ativo — assim é impossível montar um payload com os
 * dois campos preenchidos.
 *
 * TODO(design): tela construída no padrão visual das demais telas de auth. Falta
 * o node do Figma para ajuste de fidelidade.
 */
export function FormMfa({
  onSubmit,
  onBack,
  formError,
  isSubmitting: isRequesting = false,
}: FormMfaProps) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<MfaMode>("totp");

  const totpForm = useForm<MfaTotpValues>({
    resolver: yupResolver(mfaTotpSchema),
    mode: "onSubmit",
    defaultValues: { totpCode: "" },
  });

  const recoveryForm = useForm<MfaRecoveryValues>({
    resolver: yupResolver(mfaRecoverySchema),
    mode: "onSubmit",
    defaultValues: { recoveryCode: "" },
  });

  // Mensagens do schema são chaves de tradução — traduz no momento da exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const submitTotp = totpForm.handleSubmit(({ totpCode }) =>
    onSubmit({ totpCode }),
  );

  const submitRecovery = recoveryForm.handleSubmit(({ recoveryCode }) =>
    onSubmit({ recoveryCode }),
  );

  const isTotp = mode === "totp";

  // Alterna o fator e descarta o que havia sido digitado no modo anterior.
  const switchMode = () => {
    totpForm.reset();
    recoveryForm.reset();
    setMode(isTotp ? "recovery" : "totp");
  };

  const busy =
    isRequesting ||
    totpForm.formState.isSubmitting ||
    recoveryForm.formState.isSubmitting;

  return (
    <Stack w="full" maxW="420px" gap={0}>
      <Button
        type="button"
        variant="plain"
        onClick={onBack}
        alignSelf="flex-start"
        h="24px"
        px={0}
        gap="6px"
        fontWeight={500}
      >
        <Icon as={LuArrowLeft} boxSize="16px" color="#8A9AB5" />
        <Text
          fontSize="16px"
          fontWeight={500}
          lineHeight="24px"
          color="#8A9AB5"
        >
          {t("Mfa.back")}
        </Text>
      </Button>

      <Flex
        align="center"
        justify="center"
        boxSize="48px"
        rounded="16px"
        flexShrink={0}
        mt="24px"
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
      >
        <Icon
          as={isTotp ? LuShieldCheck : LuKeyRound}
          boxSize="22px"
          color="#1F5AFF"
        />
      </Flex>

      <Text
        pt="16px"
        fontSize="24px"
        fontWeight={800}
        lineHeight="36px"
        color="#0F1729"
      >
        {t("Mfa.title")}
      </Text>

      <Text pt="4px" fontSize="14px" lineHeight="21px" color="#8A9AB5">
        {t(isTotp ? "Mfa.subtitle.totp" : "Mfa.subtitle.recovery")}
      </Text>

      {isTotp ? (
        <Stack as="form" onSubmit={submitTotp} gap={4} pt="32px">
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            label={t("Mfa.fields.totp.label")}
            placeholder={t("Mfa.fields.totp.placeholder")}
            error={tError(totpForm.formState.errors.totpCode?.message)}
            _placeholder={{ color: "#0A0A0A80" }}
            h="49px"
            borderWidth="2px"
            letterSpacing="6px"
            fontSize="18px"
            fontWeight={700}
            textAlign="center"
            {...totpForm.register("totpCode")}
          />

          {formError && (
            <Text fontSize="13px" color="error.500" textAlign="center">
              {formError}
            </Text>
          )}

          <Button
            type="submit"
            w="full"
            bgImage="none"
            bg="#1F5AFF"
            color="white"
            rounded="14px"
            py="14px"
            h="auto"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
            loading={busy}
            _hover={{ bg: "brand.600" }}
          >
            {t("Mfa.submit")}
          </Button>
        </Stack>
      ) : (
        <Stack as="form" onSubmit={submitRecovery} gap={4} pt="32px">
          <Input
            type="text"
            autoComplete="one-time-code"
            autoFocus
            label={t("Mfa.fields.recovery.label")}
            placeholder={t("Mfa.fields.recovery.placeholder")}
            error={tError(recoveryForm.formState.errors.recoveryCode?.message)}
            _placeholder={{ color: "#0A0A0A80" }}
            h="49px"
            borderWidth="2px"
            {...recoveryForm.register("recoveryCode")}
          />

          {formError && (
            <Text fontSize="13px" color="error.500" textAlign="center">
              {formError}
            </Text>
          )}

          <Button
            type="submit"
            w="full"
            bgImage="none"
            bg="#1F5AFF"
            color="white"
            rounded="14px"
            py="14px"
            h="auto"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
            loading={busy}
            _hover={{ bg: "brand.600" }}
          >
            {t("Mfa.submit")}
          </Button>
        </Stack>
      )}

      <Flex justify="center" pt={4}>
        <Button
          type="button"
          variant="plain"
          onClick={switchMode}
          h="auto"
          px={0}
          fontSize="13px"
          fontWeight={600}
          color="#1F5AFF"
        >
          {t(isTotp ? "Mfa.useRecovery" : "Mfa.useTotp")}
        </Button>
      </Flex>

      <Text
        pt={6}
        mt={6}
        borderTopWidth="1px"
        borderColor="border.default"
        fontSize="11px"
        color="#A0ABB8"
        textAlign="center"
      >
        {t("Mfa.hint")}
      </Text>
    </Stack>
  );
}
