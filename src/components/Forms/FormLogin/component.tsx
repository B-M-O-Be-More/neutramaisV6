"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Icon,
  IconButton,
  Image,
  Input as ChakraInput,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuEye, LuEyeOff, LuLock, LuMail } from "react-icons/lu";

import { loginSchema } from "@/schemas/login";

import { FormLoginProps, LoginValues } from "./interface";

// Estilo compartilhado pelos inputs (Email/Senha) conforme o design.
const inputStyle = {
  h: "50px",
  bg: "#0A0E1A",
  borderWidth: "1px",
  borderColor: "#1F2937",
  rounded: "12px",
  color: "#F9FAFB",
  fontSize: "16px",
  _placeholder: { color: "rgba(249,250,251,0.5)" },
} as const;

export function FormLogin({ onSubmit }: FormLoginProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

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

  // Mensagens do schema são chaves de tradução — traduz no momento da exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const submit = handleSubmit(async (values) => {
    // TODO: autenticar via API V5 (POST /auth/login), persistir tokens em cookie
    // (respeitando rememberMe) e redirecionar para o dashboard. Tratar 401 com
    // mensagem inline genérica ("Email ou senha inválidos").
    await onSubmit?.(values);
  });

  return (
    <Stack gap={6} w="full" maxW="450px" align="center">
      {/* Card principal */}
      <Stack
        w="full"
        gap={0}
        bg="#151B2D"
        borderWidth="1px"
        borderColor="#1F2937"
        rounded="16px"
        overflow="hidden"
        shadow="0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
      >
        {/* Cabeçalho com a logo */}
        <Flex
          align="center"
          justify="center"
          h="63px"
          px="16px"
          borderBottomWidth="1px"
          borderColor="#30363D"
        >
          <Image
            src="/assets/logo.png"
            alt={t("Login.logoAlt")}
            h="31px"
            w="auto"
            objectFit="contain"
          />
        </Flex>

        {/* Conteúdo */}
        <Stack gap={6} p="32px">
          <Stack gap={1}>
            <Text
              fontSize="24px"
              lineHeight="32px"
              fontWeight={700}
              color="#F9FAFB"
            >
              {t("Login.title")}
            </Text>
            <Text fontSize="14px" lineHeight="20px" color="#9CA3AF">
              {t("Login.subtitle")}
            </Text>
          </Stack>

          <Stack as="form" onSubmit={submit} gap={4}>
            {/* Email */}
            <Field.Root invalid={!!errors.email}>
              <Field.Label fontSize="14px" fontWeight={400} color="#F9FAFB">
                {t("Login.fields.email.label")}
              </Field.Label>
              <InputGroup
                startElement={
                  <Icon as={LuMail} boxSize="20px" color="#9CA3AF" />
                }
              >
                <ChakraInput
                  type="email"
                  autoComplete="email"
                  placeholder={t("Login.fields.email.placeholder")}
                  {...inputStyle}
                  {...register("email")}
                />
              </InputGroup>
              <Field.ErrorText>{tError(errors.email?.message)}</Field.ErrorText>
            </Field.Root>

            {/* Senha */}
            <Field.Root invalid={!!errors.password}>
              <Field.Label fontSize="14px" fontWeight={400} color="#F9FAFB">
                {t("Login.fields.password.label")}
              </Field.Label>
              <InputGroup
                startElement={
                  <Icon as={LuLock} boxSize="20px" color="#9CA3AF" />
                }
                endElement={
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    color="#9CA3AF"
                    aria-label={t(
                      showPassword
                        ? "Login.hidePassword"
                        : "Login.showPassword",
                    )}
                    onClick={() => setShowPassword((v) => !v)}
                    _hover={{ bg: "transparent", color: "#F9FAFB" }}
                  >
                    <Icon as={showPassword ? LuEyeOff : LuEye} boxSize="20px" />
                  </IconButton>
                }
                endElementProps={{ pointerEvents: "auto" }}
              >
                <ChakraInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("Login.fields.password.placeholder")}
                  {...inputStyle}
                  {...register("password")}
                />
              </InputGroup>
              <Field.ErrorText>
                {tError(errors.password?.message)}
              </Field.ErrorText>
            </Field.Root>

            {/* Manter conectado + Esqueceu a senha */}
            <Flex align="center" justify="space-between" gap={2}>
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
                    <Checkbox.Label
                      fontSize="14px"
                      fontWeight={400}
                      color="#9CA3AF"
                    >
                      {t("Login.rememberMe")}
                    </Checkbox.Label>
                  </Checkbox.Root>
                )}
              />

              <Link href="/recovery" style={{ color: "#1F5AFF" }}>
                <Text fontSize="12px" lineHeight="16px" color="#1F5AFF">
                  {t("Login.forgotPassword")}
                </Text>
              </Link>
            </Flex>

            {/* Entrar */}
            <Button
              type="submit"
              variant="solid"
              w="full"
              h="46px"
              bg="#1F5AFF"
              color="white"
              rounded="12px"
              loading={isSubmitting}
              _hover={{ bg: "#1A4FE0" }}
            >
              {t("Login.submit")}
              <Icon as={LuArrowRight} boxSize="20px" />
            </Button>
          </Stack>

          {/* Divisor "ou" */}
          <Box position="relative" w="full" textAlign="center">
            <Box
              position="absolute"
              top="50%"
              left={0}
              right={0}
              h="1px"
              bg="#1F2937"
            />
            <Text
              position="relative"
              display="inline-block"
              px={2}
              bg="#151B2D"
              fontSize="12px"
              color="#9CA3AF"
            >
              {t("Login.or")}
            </Text>
          </Box>

          {/* Criar conta */}
          <Stack gap={2} textAlign="center">
            <Text fontSize="14px" lineHeight="20px" color="#9CA3AF">
              {t("Login.noAccount")}
            </Text>
            <Button
              asChild
              variant="outline"
              w="full"
              h="50px"
              bg="#0A0E1A"
              borderColor="#1F2937"
              color="#F9FAFB"
              rounded="12px"
              _hover={{ borderColor: "#1F5AFF" }}
            >
              <Link href="/register">{t("Login.createAccount")}</Link>
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Rodapé */}
      <Stack gap={2} w="full">
        <Text
          fontSize="12px"
          lineHeight="16px"
          color="#9CA3AF"
          textAlign="center"
        >
          {t("Login.footer.copyright", { year: new Date().getFullYear() })}
        </Text>
        <Flex justify="center" align="center" gap={4} flexWrap="wrap">
          <Link href="/terms" style={{ fontSize: "12px", color: "#9CA3AF" }}>
            {t("Login.footer.terms")}
          </Link>
          <Text fontSize="12px" color="#9CA3AF" aria-hidden>
            •
          </Text>
          <Link href="/privacy" style={{ fontSize: "12px", color: "#9CA3AF" }}>
            {t("Login.footer.privacy")}
          </Link>
          <Text fontSize="12px" color="#9CA3AF" aria-hidden>
            •
          </Text>
          <Link href="/help" style={{ fontSize: "12px", color: "#9CA3AF" }}>
            {t("Login.footer.help")}
          </Link>
        </Flex>
      </Stack>
    </Stack>
  );
}
