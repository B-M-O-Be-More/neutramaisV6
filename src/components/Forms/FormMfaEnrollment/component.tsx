"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuLock } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import { mfaTotpSchema } from "@/schemas/mfa";

import { FormMfaEnrollmentProps, MfaEnrollmentValues } from "./interface";

/** Só dígitos, no máximo 6 — aceita colar "123 456" ou "123-456". */
const sanitizeTotp = (value: string) => value.replace(/\D/g, "").slice(0, 6);

/**
 * Última tela da configuração do autenticador (NEU-479): o primeiro TOTP
 * confirma o cadastro e libera o acesso. O envio só é habilitado com os seis
 * dígitos. Apresentacional — a troca com o backend fica no useMfaEnrollment.
 *
 * Figma: Neutra+ MP · "TOTP Card" (2541:63660).
 */
export function FormMfaEnrollment({
  onSubmit,
  onBack,
  formError,
  isSubmitting: isRequesting = false,
}: FormMfaEnrollmentProps) {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MfaEnrollmentValues>({
    resolver: yupResolver(mfaTotpSchema),
    mode: "onSubmit",
    defaultValues: { totpCode: "" },
  });

  const totpCode = useWatch({ control, name: "totpCode" });
  const isComplete = totpCode.length === 6;

  const tError = (message?: string) => (message ? t(message) : undefined);

  const submit = handleSubmit(({ totpCode }) => onSubmit(totpCode));

  const busy = isRequesting || isSubmitting;

  return (
    <Stack w="full" maxW="700px" gap={0}>
      <Button
        type="button"
        variant="plain"
        onClick={onBack}
        alignSelf="flex-start"
        h="24px"
        px={0}
        gap="6px"
      >
        <Icon as={LuChevronLeft} boxSize="16px" color="#8A9AB5" />
        <Text
          fontSize="16px"
          fontWeight={500}
          lineHeight="24px"
          color="#8A9AB5"
        >
          {t("MfaEnrollment.back")}
        </Text>
      </Button>

      <Stack as="form" onSubmit={submit} gap="31px" align="center" pt="48px">
        <Text
          as="h1"
          fontSize="30px"
          fontWeight={700}
          lineHeight="40px"
          color="#0F1729"
          textAlign="center"
        >
          {t("MfaEnrollment.totp.title")}
        </Text>

        <Text
          maxW="420px"
          fontSize="16px"
          lineHeight="24px"
          color="#5A7CAD"
          textAlign="center"
        >
          {t("MfaEnrollment.totp.subtitle")}
        </Text>

        <Controller
          control={control}
          name="totpCode"
          render={({ field }) => (
            <Flex w="full" maxW="420px" direction="column">
              <Input
                ref={field.ref}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(sanitizeTotp(e.target.value))}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                aria-label={t("MfaEnrollment.totp.label")}
                placeholder={t("MfaEnrollment.totp.placeholder")}
                error={tError(errors.totpCode?.message) ?? formError}
                h="78px"
                px="18px"
                bg="white"
                borderWidth="2px"
                borderColor="#E5E8EE"
                rounded="14px"
                color="#0F1729"
                fontSize="28px"
                fontWeight={700}
                letterSpacing="14px"
                textAlign="center"
                _placeholder={{ color: "rgba(10,10,10,0.5)" }}
              />
            </Flex>
          )}
        />

        <Flex
          w="full"
          gap="16px"
          align="center"
          minH="64px"
          px="18px"
          py="18px"
          rounded="10px"
          bg="#EEF3FF"
        >
          <Flex
            align="center"
            justify="center"
            boxSize="28px"
            flexShrink={0}
            rounded="full"
            bg="#1F5AFF"
            aria-hidden
          >
            <Text
              fontSize="17px"
              fontWeight={700}
              lineHeight="28px"
              color="white"
            >
              i
            </Text>
          </Flex>
          <Text fontSize="14px" lineHeight="20px" color="#4A5568">
            {t("MfaEnrollment.totp.info")}
          </Text>
        </Flex>

        <Button
          type="submit"
          w="full"
          maxW="420px"
          h="50px"
          gap="8px"
          px="12px"
          bg="#1F5AFF"
          color="white"
          rounded="14px"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
          shadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          loading={busy}
          disabled={!isComplete}
          _hover={{ bg: "brand.600" }}
          _disabled={{ bg: "#C4CDD8", opacity: 1, cursor: "not-allowed" }}
        >
          <Icon as={LuLock} boxSize="16px" />
          {t("MfaEnrollment.totp.submit")}
        </Button>
      </Stack>
    </Stack>
  );
}
