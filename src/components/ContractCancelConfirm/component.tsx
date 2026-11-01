"use client";

import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { ContractCancelConfirmProps } from "./interface";

/**
 * Confirmação do pedido de cancelamento, com a multa que se aplica hoje
 * (Figma 2191-15331).
 */
export function ContractCancelConfirm({
  exitFee,
  isSubmitting,
  onBack,
  onConfirm,
}: ContractCancelConfirmProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="8px" role="alertdialog" aria-labelledby="contract-cancel-title">
      <Text
        id="contract-cancel-title"
        color="#EF4444"
        fontSize="12px"
        fontWeight={700}
        lineHeight="18px"
      >
        {t("Contracts.cancel.title")}
      </Text>
      <Text color="#991B1B" fontSize="11px" lineHeight="16.5px">
        {exitFee
          ? t("Contracts.cancel.fee", { value: exitFee })
          : t("Contracts.cancel.noFee")}
      </Text>
      <Flex gap="8px" pt="4px">
        <Button
          variant="plain"
          flex="1"
          h="36px"
          px="12px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="10px"
          color="#5A6478"
          fontSize="12px"
          fontWeight={500}
          lineHeight="18px"
          disabled={isSubmitting}
          onClick={onBack}
        >
          {t("Contracts.cancel.back")}
        </Button>
        <Button
          flex="1"
          h="36px"
          px="12px"
          bg="#EF4444"
          rounded="10px"
          color="white"
          fontSize="12px"
          fontWeight={700}
          lineHeight="18px"
          _hover={{ bg: "#DC2626" }}
          loading={isSubmitting}
          onClick={onConfirm}
        >
          {t("Contracts.cancel.confirm")}
        </Button>
      </Flex>
    </Stack>
  );
}
