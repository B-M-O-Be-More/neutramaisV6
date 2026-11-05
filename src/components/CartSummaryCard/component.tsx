"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuArrowRight } from "react-icons/lu";

import { CartSummaryCardProps } from "./interface";

function Row({
  label,
  value,
  color = "#0F1729",
  labelColor = "#6F7B90",
}: {
  label: string;
  value: string;
  color?: string;
  labelColor?: string;
}) {
  return (
    <Flex justify="space-between" gap="12px">
      <Text as="dt" color={labelColor} fontSize="13px" lineHeight="19.5px">
        {label}
      </Text>
      <Text
        as="dd"
        color={color}
        fontSize="13px"
        fontWeight={700}
        lineHeight="19.5px"
        textAlign="right"
      >
        {value}
      </Text>
    </Flex>
  );
}

/**
 * "Resumo da compra" (Figma 2879-94537). O checkout aceita uma moeda por vez:
 * com moedas diferentes, mostra o subtotal de cada uma e não soma.
 */
export function CartSummaryCard({
  subtotals,
  creditMinor,
  hasPhysical,
  locale,
  notice,
  canCheckout,
  onCheckout,
}: CartSummaryCardProps) {
  const { t } = useTranslation();
  const money = (minor: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      minor / 100,
    );

  const currencies = [...subtotals.keys()];
  const single = currencies.length === 1 ? currencies[0] : null;

  return (
    <Stack
      as="section"
      aria-label={t("Cart.summary.title")}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
    >
      <Text
        as="h2"
        color="#0F1729"
        fontSize="14px"
        fontWeight={800}
        lineHeight="21px"
      >
        {t("Cart.summary.title")}
      </Text>

      <Stack
        as="dl"
        gap="12px"
        pb="16px"
        borderBottomWidth="1px"
        borderColor="#E5E8EE"
      >
        {currencies.length === 0 && (
          <Row label={t("Cart.summary.subtotal")} value="—" />
        )}
        {currencies.map((currency) => (
          <Row
            key={currency}
            label={
              single
                ? t("Cart.summary.subtotal")
                : t("Cart.summary.subtotalIn", { currency })
            }
            value={money(subtotals.get(currency) ?? 0, currency)}
          />
        ))}
        {hasPhysical && (
          <Row
            label={t("Cart.summary.shipping")}
            value={t("Cart.summary.atPayment")}
          />
        )}
        {single && creditMinor > 0 && (
          <Row
            label={t("Cart.summary.credit")}
            value={`− ${money(creditMinor, single)}`}
            color="#10B981"
            labelColor="#10B981"
          />
        )}
      </Stack>

      <Flex align="flex-end" justify="space-between" gap="12px">
        <Text
          color="#6F7B90"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("Cart.summary.total")}
        </Text>
        <Text
          color="#0F1729"
          fontSize="21px"
          fontWeight={700}
          lineHeight="21px"
          textAlign="right"
        >
          {single
            ? money((subtotals.get(single) ?? 0) - creditMinor, single)
            : "—"}
        </Text>
      </Flex>

      {notice && (
        <Text role="alert" color="#DC2626" fontSize="12px" lineHeight="18px">
          {notice}
        </Text>
      )}

      <Stack gap="12px">
        <Button
          h="40px"
          gap="8px"
          rounded="12px"
          bg="#1F5AFF"
          color="white"
          fontSize="13px"
          fontWeight={700}
          boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          _hover={{ bg: "#1646CC" }}
          _disabled={{ bg: "#E6ECFF", color: "white", opacity: 1 }}
          disabled={!canCheckout}
          onClick={onCheckout}
        >
          {t("Cart.summary.checkout")}
          <Icon as={LuArrowRight} boxSize="14px" />
        </Button>
        <Text
          color="#8A9AB5"
          fontSize="11px"
          lineHeight="16.5px"
          textAlign="center"
        >
          {t("Cart.summary.disclaimer")}
        </Text>
      </Stack>
    </Stack>
  );
}
