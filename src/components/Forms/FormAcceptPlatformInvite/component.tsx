"use client";

import { Button, Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  LuCheck,
  LuEye,
  LuEyeOff,
  LuLock,
  LuPhone,
  LuUser,
  LuUserCheck,
} from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import { acceptPlatformInviteSchema } from "@/schemas/platformInvite";
import { MIN_PASSWORD_LENGTH, PASSWORD_PATTERNS } from "@/schemas/password";

import {
  AcceptPlatformInviteValues,
  FormAcceptPlatformInviteProps,
} from "./interface";

// Requisitos de senha com o predicado que os verifica em tempo real.
const REQUIREMENTS = [
  { key: "length", test: (v: string) => v.length >= MIN_PASSWORD_LENGTH },
  {
    key: "uppercase",
    test: (v: string) => PASSWORD_PATTERNS.uppercase.test(v),
  },
  { key: "number", test: (v: string) => PASSWORD_PATTERNS.digit.test(v) },
  { key: "symbol", test: (v: string) => PASSWORD_PATTERNS.symbol.test(v) },
] as const;

/**
 * Criação da conta do operador convidado: nome, telefone e senha. O e-mail e o
 * papel já vêm do convite (o token do link).
 *
 * TODO(design): construído no padrão visual das telas de auth — falta o node
 * do Figma desta tela.
 */
export function FormAcceptPlatformInvite({
  onSubmit,
  isSubmitting = false,
  formError,
  fieldError,
}: FormAcceptPlatformInviteProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AcceptPlatformInviteValues>({
    resolver: yupResolver(acceptPlatformInviteSchema),
    mode: "onBlur",
    defaultValues: {
      displayName: "",
      phone: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  // Erro do schema primeiro; senão, o que a API devolveu para o campo.
  const errorFor = (field: "displayName" | "phone" | "password") => {
    const message =
      errors[field]?.message ??
      (fieldError?.field === field ? fieldError.message : undefined);
    return message ? t(message) : undefined;
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
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
        <Icon as={LuUserCheck} boxSize="22px" color="#1F5AFF" />
      </Flex>

      <Text
        as="h1"
        pt="16px"
        fontSize="24px"
        fontWeight={800}
        lineHeight="36px"
        color="#0F1729"
      >
        {t("PlatformInvite.accept.title")}
      </Text>

      <Text pt="4px" fontSize="14px" lineHeight="21px" color="#8A9AB5">
        {t("PlatformInvite.accept.subtitle")}
      </Text>

      {/* noValidate: a validação é do yup, não a nativa do navegador. */}
      <Stack asChild gap={4} pt="32px">
        <form onSubmit={submit} noValidate>
          <Input
            label={t("PlatformInvite.fields.displayName.label")}
            required
            autoComplete="name"
            autoFocus
            placeholder={t("PlatformInvite.fields.displayName.placeholder")}
            error={errorFor("displayName")}
            h="49px"
            borderWidth="2px"
            startElement={<Icon as={LuUser} boxSize="15px" color="#A0ABB8" />}
            {...register("displayName")}
          />

          <Input
            label={t("PlatformInvite.fields.phone.label")}
            required
            type="tel"
            autoComplete="tel"
            placeholder={t("PlatformInvite.fields.phone.placeholder")}
            helperText={t("PlatformInvite.fields.phone.helper")}
            error={errorFor("phone")}
            h="49px"
            borderWidth="2px"
            startElement={<Icon as={LuPhone} boxSize="15px" color="#A0ABB8" />}
            {...register("phone")}
          />

          <Input
            label={t("PlatformInvite.fields.password.label")}
            required
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("PlatformInvite.fields.password.placeholder")}
            error={errorFor("password")}
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
                    ? "PlatformInvite.hidePassword"
                    : "PlatformInvite.showPassword",
                )}
                onClick={() => setShowPassword((v) => !v)}
                _hover={{ bg: "transparent", color: "#5A6478" }}
              >
                <Icon as={showPassword ? LuEyeOff : LuEye} boxSize="16px" />
              </IconButton>
            }
            {...register("password")}
          />

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
                    {t(`PlatformInvite.requirements.${requirement.key}`, {
                      count: MIN_PASSWORD_LENGTH,
                    })}
                  </Text>
                </Flex>
              );
            })}
          </Stack>

          <Input
            label={t("PlatformInvite.fields.confirmation.label")}
            required
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("PlatformInvite.fields.confirmation.placeholder")}
            error={
              errors.passwordConfirmation?.message
                ? t(errors.passwordConfirmation.message)
                : undefined
            }
            h="49px"
            borderWidth="2px"
            startElement={<Icon as={LuLock} boxSize="15px" color="#A0ABB8" />}
            {...register("passwordConfirmation")}
          />

          {formError && (
            <Text
              fontSize="13px"
              color="error.500"
              textAlign="center"
              role="alert"
            >
              {t(formError)}
            </Text>
          )}

          <Button
            type="submit"
            w="full"
            bg="#1F5AFF"
            color="white"
            rounded="14px"
            py="14px"
            h="auto"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
            loading={isSubmitting}
            _hover={{ bg: "brand.600" }}
          >
            {t("PlatformInvite.accept.submit")}
          </Button>
        </form>
      </Stack>
    </Stack>
  );
}
