"use client";

import { Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuCircleAlert } from "react-icons/lu";

import { Tooltip } from "@/components/ui/tooltip";

import { SellerDebtBannerProps } from "./interface";

/**
 * Aviso de dívida da carteira do seller (Figma 3084-45182): as dívidas de
 * frete registradas na payment-api. Ainda não há rota para quitá-las pela
 * plataforma — o "normalizar agora" explica isso no tooltip.
 */
export function SellerDebtBanner({ amount }: SellerDebtBannerProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="alert"
      direction={{ base: "column", sm: "row" }}
      align={{ base: "flex-start", sm: "center" }}
      justify="space-between"
      gap="12px"
      px="20px"
      py="16px"
      bg="#FEF2F2"
      borderWidth="1px"
      borderColor="#FECACA"
      rounded="14px"
    >
      <Flex align="center" gap="12px">
        <Icon
          as={LuCircleAlert}
          boxSize="16px"
          color="#EF4444"
          flexShrink={0}
        />
        <Text
          color="#EF4444"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {t("Wallet.seller.debt.message", { amount })}
        </Text>
      </Flex>
      <Tooltip content={t("Wallet.seller.debt.soon")} showArrow>
        <Flex
          as="span"
          tabIndex={0}
          align="center"
          gap="6px"
          flexShrink={0}
          color="#EF4444"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
          textDecoration="underline"
          textUnderlineOffset="3px"
          cursor="not-allowed"
          aria-disabled="true"
        >
          {t("Wallet.seller.debt.action")}
          <Icon as={LuArrowRight} boxSize="14px" />
        </Flex>
      </Tooltip>
    </Flex>
  );
}
