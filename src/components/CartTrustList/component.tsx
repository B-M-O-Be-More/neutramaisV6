"use client";

import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuBox, LuCreditCard, LuShieldCheck } from "react-icons/lu";

const ITEMS = [
  { key: "escrow", icon: LuShieldCheck },
  { key: "payment", icon: LuCreditCard },
  { key: "tracking", icon: LuBox },
] as const;

/** Garantias da compra no fim da coluna do carrinho (Figma 3053-41753). */
export function CartTrustList() {
  const { t } = useTranslation();

  return (
    <Box
      as="ul"
      listStyleType="none"
      px="16px"
      py="6px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
    >
      {ITEMS.map(({ key, icon }, index) => (
        <Flex
          as="li"
          key={key}
          align="center"
          gap="10px"
          py="10px"
          borderBottomWidth={index < ITEMS.length - 1 ? "1px" : 0}
          borderColor="#F0F2F7"
        >
          <Icon as={icon} boxSize="14px" color="#1F5AFF" aria-hidden />
          <Text color="#5A6478" fontSize="12px" lineHeight="18px">
            {t(`Cart.trust.${key}`)}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}
