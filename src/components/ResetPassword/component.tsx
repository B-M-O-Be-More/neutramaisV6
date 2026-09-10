"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";

import FormResetPassword from "@/components/Forms/FormResetPassword";
import { useResetPassword } from "@/hooks/useResetPassword";

/**
 * Tela aberta pelo link de redefinição enviado por e-mail (`?token=...`).
 * Fecha o fluxo iniciado em /forgot-password: coleta a nova senha e a efetiva
 * via `POST /auth/password-reset/execute`.
 */
export function ResetPassword() {
  const { t } = useTranslation();
  const { status, formError, isSubmitting, submit } = useResetPassword();

  if (status === "form") {
    return (
      <FormResetPassword
        onSubmit={submit}
        formError={formError}
        isSubmitting={isSubmitting}
      />
    );
  }

  const isSuccess = status === "success";

  return (
    <Stack w="full" maxW="420px" align="center" textAlign="center" gap={5}>
      <Flex
        align="center"
        justify="center"
        boxSize="64px"
        rounded="full"
        flexShrink={0}
        bg={isSuccess ? "#EDFBF5" : "#FEF2F2"}
        borderWidth="2px"
        borderColor={isSuccess ? "#10B981" : "#FECACA"}
      >
        <Icon
          as={isSuccess ? LuCircleCheck : LuCircleX}
          boxSize="28px"
          color={isSuccess ? "#10B981" : "#EF4444"}
        />
      </Flex>

      <Stack gap={1}>
        <Text
          fontSize="22px"
          fontWeight={800}
          lineHeight="33px"
          color="#0F1729"
        >
          {t(
            isSuccess
              ? "ResetPassword.success.title"
              : "ResetPassword.error.title",
          )}
        </Text>
        <Text fontSize="14px" lineHeight="21px" color="#8A9AB5">
          {t(
            isSuccess
              ? "ResetPassword.success.subtitle"
              : status === "missing"
                ? "ResetPassword.error.missing"
                : "ResetPassword.error.subtitle",
          )}
        </Text>
      </Stack>

      <Button
        asChild
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
        _hover={{ bg: "brand.600" }}
      >
        <Link href={isSuccess ? "/login" : "/forgot-password"}>
          {t(
            isSuccess ? "ResetPassword.success.cta" : "ResetPassword.error.cta",
          )}
        </Link>
      </Button>
    </Stack>
  );
}
