"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCircleCheckBig, LuShield } from "react-icons/lu";

import WithdrawStepActions from "@/components/WithdrawStepActions";
import WithdrawStepHeading from "@/components/WithdrawStepHeading";
import { formatMinorAmount } from "@/functions/walletTransactions";
import { formatRate, WITHDRAWAL_MODES } from "@/functions/withdrawal";
import type { WalletCurrency } from "@/services/wallet.service";

import { WithdrawReviewStepProps } from "./interface";

/**
 * Etapa "Revisão" do saque (Figma 2215-27152): bruto, taxa, líquido, destino
 * e prazo antes do PIN. Depois do PIN o saque não pode ser cancelado.
 */
export function WithdrawReviewStep({
  breakdown,
  mode,
  account,
  currency,
  locale,
  onBack,
  onConfirm,
}: WithdrawReviewStepProps) {
  const { t } = useTranslation();
  const money = (minor: number) =>
    formatMinorAmount(minor, currency as WalletCurrency, locale);

  const rows = [
    { key: "gross", value: money(breakdown.grossMinor) },
    {
      key: "fee",
      value: `${formatRate(WITHDRAWAL_MODES[mode].rateBps, locale)} · ${money(
        breakdown.feeMinor,
      )}`,
    },
    { key: "net", value: money(breakdown.netMinor), highlight: true },
    { key: "destination", value: account.title },
    { key: "account", value: account.detail },
    { key: "mode", value: t(`Wallet.withdraw.modes.${mode}.review`) },
    { key: "processing", value: t(`Wallet.withdraw.modes.${mode}.processing`) },
  ];

  return (
    <Stack gap="24px">
      <WithdrawStepHeading
        icon={LuCircleCheckBig}
        title={t("Wallet.withdraw.review.title")}
        subtitle={t("Wallet.withdraw.review.subtitle")}
      />

      <Stack
        as="dl"
        gap="0"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="16px"
        overflow="hidden"
      >
        {rows.map((row) => (
          <Flex
            key={row.key}
            justify="space-between"
            gap="16px"
            px="20px"
            py="14px"
            borderBottomWidth="1px"
            borderColor="#F4F6F9"
          >
            <Text as="dt" color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
              {t(`Wallet.withdraw.review.rows.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color={row.highlight ? "#10B981" : "#0F1729"}
              fontSize="13px"
              fontWeight={row.highlight ? 800 : 600}
              lineHeight="19.5px"
              textAlign="right"
              wordBreak="break-word"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
        <Flex
          align="center"
          justify="space-between"
          gap="16px"
          px="20px"
          py="16px"
          bg="#F8F9FB"
        >
          <Text as="dt" color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("Wallet.withdraw.review.youReceive")}
          </Text>
          <Text
            as="dd"
            color="#10B981"
            fontSize="22px"
            fontWeight={900}
            lineHeight="33px"
          >
            {money(breakdown.netMinor)}
          </Text>
        </Flex>
      </Stack>

      <Flex
        align="flex-start"
        gap="10px"
        px="16px"
        py="12px"
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="14px"
      >
        <Icon
          as={LuShield}
          boxSize="14px"
          mt="2px"
          color="#1F5AFF"
          flexShrink={0}
        />
        <Text color="#1E3A8A" fontSize="12px" lineHeight="18px">
          {t("Wallet.withdraw.review.hint")}
        </Text>
      </Flex>

      <WithdrawStepActions
        onBack={onBack}
        nextLabel={t("Wallet.withdraw.review.confirm")}
        onNext={onConfirm}
      />
    </Stack>
  );
}
