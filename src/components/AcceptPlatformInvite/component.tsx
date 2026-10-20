"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";

import FormAcceptPlatformInvite from "@/components/Forms/FormAcceptPlatformInvite";
import { useAcceptPlatformInvite } from "@/hooks/useAcceptPlatformInvite";

/**
 * Tela aberta pelo link do convite de operador (`?token=...`): coleta nome,
 * telefone e senha e cria a conta via `POST /platform-invites/accept`.
 */
export function AcceptPlatformInvite() {
  const { t } = useTranslation();
  const { status, isSubmitting, formError, fieldError, submit } =
    useAcceptPlatformInvite();

  if (status === "form") {
    return (
      <FormAcceptPlatformInvite
        onSubmit={submit}
        isSubmitting={isSubmitting}
        formError={formError}
        fieldError={fieldError}
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
          as="h1"
          fontSize="22px"
          fontWeight={800}
          lineHeight="33px"
          color="#0F1729"
        >
          {t(
            isSuccess
              ? "PlatformInvite.accept.success.title"
              : "PlatformInvite.accept.error.title",
          )}
        </Text>
        <Text fontSize="14px" lineHeight="21px" color="#8A9AB5">
          {t(
            isSuccess
              ? "PlatformInvite.accept.success.subtitle"
              : status === "missing"
                ? "PlatformInvite.accept.error.missing"
                : "PlatformInvite.accept.error.subtitle",
          )}
        </Text>
      </Stack>

      {isSuccess && (
        <Button
          asChild
          w="full"
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
          <Link href="/login">{t("PlatformInvite.accept.success.cta")}</Link>
        </Button>
      )}
    </Stack>
  );
}
