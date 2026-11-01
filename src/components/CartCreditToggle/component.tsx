"use client";

import { Flex, Icon, Stack, Switch, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuWallet } from "react-icons/lu";

import { CartCreditToggleProps } from "./interface";

/**
 * "Usar crédito Neutra+" (Figma 3053-41740): abate o saldo da carteira, na
 * moeda do carrinho, do total a pagar. Sem saldo, fica desligado.
 */
export function CartCreditToggle({
  availableMinor,
  currency,
  locale,
  checked,
  onCheckedChange,
}: CartCreditToggleProps) {
  const { t } = useTranslation();
  const hasCredit = !!availableMinor && availableMinor > 0;

  return (
    <Switch.Root
      checked={checked && hasCredit}
      disabled={!hasCredit}
      onCheckedChange={(details) => onCheckedChange(details.checked)}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap="16px"
      p="16px"
      bg="#EDFBF5"
      borderWidth="1px"
      borderColor="#AAECD5"
      rounded="16px"
      cursor={hasCredit ? "pointer" : "not-allowed"}
    >
      <Switch.HiddenInput />
      <Switch.Label flex="1" minW={0} cursor="inherit">
        <Flex align="center" gap="10px">
          <Flex
            align="center"
            justify="center"
            boxSize="32px"
            flexShrink={0}
            bg="white"
            rounded="8px"
          >
            <Icon as={LuWallet} boxSize="14px" color="#10B981" />
          </Flex>
          <Stack gap="2px" minW={0}>
            <Text
              color="#0F1729"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {t("Cart.credit.title")}
            </Text>
            <Text
              color={hasCredit ? "#10B981" : "#8A9AB5"}
              fontSize="11px"
              fontWeight={400}
              lineHeight="16.5px"
            >
              {hasCredit
                ? t("Cart.credit.available", {
                    value: new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency,
                    }).format(availableMinor / 100),
                  })
                : t("Cart.credit.none")}
            </Text>
          </Stack>
        </Flex>
      </Switch.Label>
      <Switch.Control
        flexShrink={0}
        w="36px"
        h="20px"
        bg={checked && hasCredit ? "#10B981" : "#D5DBE5"}
      >
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  );
}
