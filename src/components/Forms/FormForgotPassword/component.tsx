"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuKeyRound, LuMail } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import { forgotPasswordSchema } from "@/schemas/forgotPassword";

import { FormForgotPasswordProps, ForgotPasswordValues } from "./interface";

/**
 * Formulário de solicitação do link de redefinição de senha (Figma 2095-23125).
 * Só coleta e valida o e-mail — a chamada à API e a máquina de estados ficam
 * no ForgotPassword/useRequestPasswordReset.
 */
export function FormForgotPassword({
  defaultEmail = "",
  onSubmit,
}: FormForgotPasswordProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: yupResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: defaultEmail },
  });

  // Mensagens do schema são chaves de tradução — traduz no momento da exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const submit = handleSubmit(async ({ email }) => {
    await onSubmit(email);
  });

  return (
    <Stack w="full" gap={0}>
      {/* Selo com a chave */}
      <Flex
        align="center"
        justify="center"
        boxSize="48px"
        rounded="16px"
        flexShrink={0}
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
      >
        <Icon as={LuKeyRound} boxSize="22px" color="#1F5AFF" />
      </Flex>

      <Text
        pt="16px"
        fontSize="24px"
        fontWeight={800}
        lineHeight="36px"
        color="#0F1729"
      >
        {t("ForgotPassword.title")}
      </Text>

      <Text pt="4px" fontSize="14px" lineHeight="21px" color="#8A9AB5">
        {t("ForgotPassword.subtitle.text")}
        <Text as="span" fontWeight={700} color="#0F1729">
          {t("ForgotPassword.subtitle.highlight")}
        </Text>
        .
      </Text>

      <Stack as="form" onSubmit={submit} gap={4} pt="32px">
        <Input
          type="email"
          autoComplete="email"
          autoFocus
          label={t("ForgotPassword.fields.email.label")}
          placeholder={t("ForgotPassword.fields.email.placeholder")}
          error={tError(errors.email?.message)}
          _placeholder={{ color: "#0A0A0A80" }}
          h="49px"
          borderWidth="2px"
          startElement={<Icon as={LuMail} boxSize="15px" color="#A0ABB8" />}
          {...register("email")}
        />

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
          shadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          disabled={!isValid}
          loading={isSubmitting}
          _hover={{ bg: "brand.600" }}
          _disabled={{ bg: "#1646CC", opacity: 0.5, cursor: "not-allowed" }}
        >
          {t("ForgotPassword.submit")}
        </Button>

        <Flex align="center" justify="center" gap="6px">
          <Text fontSize="12px" lineHeight="18px" color="#A0ABB8">
            {t("ForgotPassword.rememberedPassword")}
          </Text>
          <Link href="/login">
            <Text
              fontSize="14px"
              fontWeight={600}
              lineHeight="24px"
              color="#1F5AFF"
            >
              {t("ForgotPassword.backToLogin")}
            </Text>
          </Link>
        </Flex>
      </Stack>
    </Stack>
  );
}
