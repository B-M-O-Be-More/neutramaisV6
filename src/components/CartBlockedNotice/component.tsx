"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuBan, LuUserCheck } from "react-icons/lu";

import type { CheckoutBlockReason } from "@/functions/checkoutBlock";

import { CartBlockedNoticeProps } from "./interface";

// Só recusa e KYC não iniciado têm o que fazer na tela de KYC; em análise,
// suspensão e conta inelegível dependem da plataforma.
const ACTIONS: Partial<Record<CheckoutBlockReason, string>> = {
  rejected: "/kyc",
  notStarted: "/kyc",
};

/** "Checkout bloqueado" no topo do carrinho (Figma 3053-42808). */
export function CartBlockedNotice({ reason }: CartBlockedNoticeProps) {
  const { t } = useTranslation();
  const href = ACTIONS[reason];

  return (
    <Flex
      role="alert"
      gap="16px"
      align="flex-start"
      px="21px"
      py="15px"
      bg="#FEF2F2"
      borderWidth="1px"
      borderColor="#FECACA"
      rounded="16px"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="40px"
        flexShrink={0}
        bg="white"
        borderWidth="1px"
        borderColor="#FECACA"
        rounded="14px"
      >
        <Icon as={LuBan} boxSize="18px" color="#EF4444" aria-hidden />
      </Flex>
      <Stack gap="12px" flex="1" minW={0}>
        <Stack gap="4px">
          <Text
            color="#B91C1C"
            fontSize="14px"
            fontWeight={800}
            lineHeight="21px"
          >
            {t(`Cart.blocked.${reason}.title`)}
          </Text>
          <Text color="#991B1B" fontSize="12px" lineHeight="18px">
            {t(`Cart.blocked.${reason}.description`)}
          </Text>
        </Stack>
        {href && (
          <Button
            asChild
            alignSelf="flex-end"
            h="34px"
            px="16px"
            gap="8px"
            rounded="10px"
            bg="#EF4444"
            color="white"
            fontSize="12px"
            fontWeight={700}
            _hover={{ bg: "#DC2626" }}
          >
            <NextLink href={href}>
              <Icon as={LuUserCheck} boxSize="13px" />
              {t(`Cart.blocked.${reason}.action`)}
            </NextLink>
          </Button>
        )}
      </Stack>
    </Flex>
  );
}
