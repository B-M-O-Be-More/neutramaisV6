"use client";

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff, LuLock, LuMail } from "react-icons/lu";

import Captcha, { HAS_CAPTCHA_SITE_KEY } from "@/components/Captcha";
import Input from "@/components/FormControl/Input";
import { loginSchema } from "@/schemas/login";

import { FormLoginProps, LoginValues } from "./interface";

/**
 * Formulário de credenciais do login. Apresentacional: a chamada à API, a
 * contagem de tentativas e o desafio de MFA ficam no useLogin (via Login).
 */
export function FormLogin({
  onSubmit,
  formError,
  isSubmitting: isRequesting = false,
  captchaRequired = false,
}: FormLoginProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | undefined>();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const tError = (message?: string) => (message ? t(message) : undefined);

  const blockedByCaptcha =
    captchaRequired && HAS_CAPTCHA_SITE_KEY && !captchaToken;

  const submit = handleSubmit(async (values) => {
    await onSubmit({ ...values, captchaToken });
    setCaptchaToken(undefined);
  });

  return (
    <Stack w="full" maxW="420px" gap={0}>
      <Stack gap={1}>
        <Text
          fontSize="26px"
          fontWeight={800}
          lineHeight="39px"
          color="#0F1729"
        >
          {t("Login.title")}
        </Text>
        <Text fontSize="14px" lineHeight="21px" color="#8A9AB5">
          {t("Login.subtitle")}
        </Text>
      </Stack>

      <Flex align="center" gap={3} pt={6}>
        <Box flex="1" h="1px" bg="border.default" />
        <Text fontSize="12px" color="#A0ABB8" whiteSpace="nowrap">
          {t("Login.credentialsDivider")}
        </Text>
        <Box flex="1" h="1px" bg="border.default" />
      </Flex>

      <Stack as="form" onSubmit={submit} gap={4} pt={6}>
        <Input
          _placeholder={{ color: "#0A0A0A80" }}
          type="email"
          autoComplete="email"
          label={t("Login.fields.email.label")}
          placeholder={t("Login.fields.email.placeholder")}
          error={tError(errors.email?.message)}
          startElement={<Icon as={LuMail} boxSize="16px" color="#A0ABB8" />}
          {...register("email")}
        />

        <Input
          _placeholder={{ color: "#0A0A0A80" }}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          label={t("Login.fields.password.label")}
          placeholder={t("Login.fields.password.placeholder")}
          error={tError(errors.password?.message)}
          labelEnd={
            <Link href="/forgot-password" style={{ color: "#1F5AFF" }}>
              <Text fontSize="12px" fontWeight={500} color="#1F5AFF">
                {t("Login.forgotPassword")}
              </Text>
            </Link>
          }
          startElement={<Icon as={LuLock} boxSize="16px" color="#A0ABB8" />}
          endElement={
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              color="#A0ABB8"
              aria-label={t(
                showPassword ? "Login.hidePassword" : "Login.showPassword",
              )}
              onClick={() => setShowPassword((v) => !v)}
              _hover={{ bg: "transparent", color: "#5A6478" }}
            >
              <Icon as={showPassword ? LuEyeOff : LuEye} boxSize="16px" />
            </IconButton>
          }
          {...register("password")}
        />

        {/* Manter conectado */}
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(e) => field.onChange(e.checked === true)}
            >
              <Checkbox.HiddenInput onBlur={field.onBlur} />
              <Checkbox.Control />
              <Checkbox.Label fontSize="13px" fontWeight={500} color="#5A6478">
                {t("Login.rememberMe")}
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />

        {/* Desafio exigido a partir da 3ª tentativa falha */}
        {captchaRequired && (
          <Stack gap={2}>
            <Text fontSize="12px" color="#5A6478">
              {t("Login.captcha.prompt")}
            </Text>
            <Captcha
              onVerify={setCaptchaToken}
              unavailableLabel={t("Login.captcha.unavailable")}
            />
          </Stack>
        )}

        {/* Erro genérico (credenciais inválidas / falha de login) */}
        {formError && (
          <Text fontSize="13px" color="error.500" textAlign="center">
            {formError}
          </Text>
        )}

        {/* Entrar */}
        <Button
          type="submit"
          w="full"
          h="50px"
          bg="#1F5AFF"
          color="white"
          rounded="14px"
          fontSize="15px"
          fontWeight={700}
          shadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          loading={isSubmitting || isRequesting}
          disabled={blockedByCaptcha}
          _hover={{ bg: "brand.600" }}
          _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          {t("Login.submit")}
        </Button>
      </Stack>

      {/* Criar conta */}
      <Stack
        gap={2}
        mt={6}
        pt={6}
        borderTopWidth="1px"
        borderColor="border.default"
        textAlign="center"
      >
        <Text fontSize="13px" color="#5A6478">
          {t("Login.noAccount")}{" "}
          <Link
            href="/register"
            style={{
              color: "#1F5AFF",
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            {t("Login.createAccount")}
          </Link>
        </Text>
        <Text fontSize="11px" color="#A0ABB8">
          {t("Login.pjOnly")}
        </Text>
      </Stack>
    </Stack>
  );
}
