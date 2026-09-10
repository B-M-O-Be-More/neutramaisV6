"use client";

import { Button, Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuCheck, LuEye, LuEyeOff, LuLock } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import {
  MIN_PASSWORD_LENGTH,
  resetPasswordSchema,
} from "@/schemas/resetPassword";

import { FormResetPasswordProps, ResetPasswordValues } from "./interface";

// Requisitos exibidos ao usuário, com o predicado que os verifica em tempo real.
const REQUIREMENTS = [
  { key: "length", test: (v: string) => v.length >= MIN_PASSWORD_LENGTH },
  { key: "uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { key: "number", test: (v: string) => /\d/.test(v) },
  { key: "symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

/**
 * Formulário de nova senha. A política mínima é de 12 caracteres (RN-528) e os
 * requisitos são mostrados com feedback ao vivo para o usuário não descobrir a
 * regra só no erro do submit.
 *
 * TODO(design): construído no padrão visual das demais telas de auth — falta o
 * node do Figma desta tela.
 */
export function FormResetPassword({
  onSubmit,
  formError,
  isSubmitting: isRequesting = false,
}: FormResetPasswordProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: yupResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  // useWatch (e não watch()) para o feedback ao vivo dos requisitos: watch()
  // devolve uma função não-memoizável e o React Compiler desiste do componente.
  const password = useWatch({ control, name: "password" }) ?? "";

  // Mensagens do schema são chaves de tradução — traduz no momento da exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.password);
  });

  return (
    <Stack w="full" maxW="420px" gap={0}>
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
        <Icon as={LuLock} boxSize="22px" color="#1F5AFF" />
      </Flex>

      <Text
        pt="16px"
        fontSize="24px"
        fontWeight={800}
        lineHeight="36px"
        color="#0F1729"
      >
        {t("ResetPassword.title")}
      </Text>

      <Text pt="4px" fontSize="14px" lineHeight="21px" color="#8A9AB5">
        {t("ResetPassword.subtitle")}
      </Text>

      <Stack as="form" onSubmit={submit} gap={4} pt="32px">
        <Input
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          autoFocus
          label={t("ResetPassword.fields.password.label")}
          placeholder={t("ResetPassword.fields.password.placeholder")}
          error={tError(errors.password?.message)}
          _placeholder={{ color: "#0A0A0A80" }}
          h="49px"
          borderWidth="2px"
          startElement={<Icon as={LuLock} boxSize="15px" color="#A0ABB8" />}
          endElement={
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              color="#A0ABB8"
              aria-label={t(
                showPassword
                  ? "ResetPassword.hidePassword"
                  : "ResetPassword.showPassword",
              )}
              onClick={() => setShowPassword((v) => !v)}
              _hover={{ bg: "transparent", color: "#5A6478" }}
            >
              <Icon as={showPassword ? LuEyeOff : LuEye} boxSize="16px" />
            </IconButton>
          }
          {...register("password")}
        />

        {/* Requisitos com feedback ao vivo */}
        <Stack gap="6px">
          {REQUIREMENTS.map((requirement) => {
            const met = requirement.test(password);
            return (
              <Flex key={requirement.key} align="center" gap="8px">
                <Flex
                  align="center"
                  justify="center"
                  boxSize="14px"
                  rounded="full"
                  flexShrink={0}
                  bg={met ? "#10B981" : "#E5E8EE"}
                >
                  <Icon as={LuCheck} boxSize="9px" color="white" />
                </Flex>
                <Text
                  fontSize="12px"
                  lineHeight="18px"
                  color={met ? "#0F1729" : "#8A9AB5"}
                >
                  {t(`ResetPassword.requirements.${requirement.key}`, {
                    count: MIN_PASSWORD_LENGTH,
                  })}
                </Text>
              </Flex>
            );
          })}
        </Stack>

        <Input
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          label={t("ResetPassword.fields.confirmation.label")}
          placeholder={t("ResetPassword.fields.confirmation.placeholder")}
          error={tError(errors.passwordConfirmation?.message)}
          _placeholder={{ color: "#0A0A0A80" }}
          h="49px"
          borderWidth="2px"
          startElement={<Icon as={LuLock} boxSize="15px" color="#A0ABB8" />}
          {...register("passwordConfirmation")}
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
          loading={isSubmitting || isRequesting}
          _hover={{ bg: "brand.600" }}
        >
          {t("ResetPassword.submit")}
        </Button>
      </Stack>
    </Stack>
  );
}
