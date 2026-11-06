"use client";

import {
  Button,
  Field,
  Flex,
  Grid,
  Icon,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuInfo, LuLock } from "react-icons/lu";

import { CheckoutVerificationStepProps } from "./interface";

const CODE_LENGTH = 6;

/**
 * Passo 3 (Figma "Verificação"): código do app autenticador. A orders-api
 * exige sessão com MFA para criar o checkout e autorizar o pagamento
 * (RN-HIS-04 H29-01); o step-up eleva a sessão atual sem novo login.
 */
export function CheckoutVerificationStep({
  isPending,
  error,
  needsEnrollment,
  onSubmit,
  onCancel,
}: CheckoutVerificationStepProps) {
  const { t } = useTranslation();
  const [code, setCode] = React.useState("");
  const inputId = React.useId();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length !== CODE_LENGTH || isPending) return;
    onSubmit(code);
    // Código usado não vale de novo: se der erro, o campo já está vazio.
    setCode("");
  };

  return (
    <Stack as="form" onSubmit={submit} gap="20px" align="stretch">
      <Stack align="center" gap="8px" textAlign="center" pt="8px">
        <Flex
          align="center"
          justify="center"
          boxSize="56px"
          rounded="14px"
          bg="#EEF3FF"
        >
          <Icon as={LuLock} boxSize="22px" color="#1F5AFF" />
        </Flex>
        <Text as="h2" color="#0F1729" fontSize="18px" fontWeight={800}>
          {t("Checkout.verification.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="13px" maxW="520px">
          {t("Checkout.verification.description")}
        </Text>
      </Stack>

      <Flex
        gap="8px"
        p="12px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="12px"
        color="#92400E"
        fontSize="12px"
      >
        <Icon as={LuInfo} boxSize="14px" mt="2px" flexShrink={0} />
        <Text>{t("Checkout.verification.notice")}</Text>
      </Flex>

      <Field.Root invalid={!!error}>
        <Field.Label
          htmlFor={inputId}
          fontSize="13px"
          fontWeight={700}
          color="#0F1729"
        >
          {t("Checkout.verification.codeLabel")}
        </Field.Label>
        <Input
          id={inputId}
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={CODE_LENGTH}
          h="52px"
          textAlign="center"
          fontSize="22px"
          letterSpacing="0.5em"
          bg="#F8F9FB"
          borderColor="#E5E8EE"
          rounded="12px"
          autoFocus
        />
        {error && (
          <Field.ErrorText fontSize="12px" role="alert">
            {error}{" "}
            {needsEnrollment && (
              <Link asChild color="#1F5AFF" fontWeight={700}>
                <NextLink href="/profile">
                  {t("Checkout.verification.enroll")}
                </NextLink>
              </Link>
            )}
          </Field.ErrorText>
        )}
      </Field.Root>

      <Grid templateColumns="1fr 1fr" gap="12px">
        <Button
          variant="outline"
          h="44px"
          rounded="12px"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("Checkout.actions.cancel")}
        </Button>
        <Button
          type="submit"
          h="44px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          _hover={{ bg: "#1646CC" }}
          loading={isPending}
          loadingText={t("Checkout.verification.processing")}
          disabled={code.length !== CODE_LENGTH}
        >
          {t("Checkout.verification.submit")}
          <Icon as={LuArrowRight} boxSize="14px" />
        </Button>
      </Grid>
    </Stack>
  );
}
