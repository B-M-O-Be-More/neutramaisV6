"use client";

import { Button, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuDownload, LuReceipt } from "react-icons/lu";

import ContractActionButton from "@/components/ContractActionButton";
import ContractDetailPanel from "@/components/ContractDetailPanel";
import ContractSignButton from "@/components/ContractSignButton";

import { ContractDetailActionsProps } from "./interface";

/** "Ações" da coluna lateral do detalhe: assinar, baixar o PDF, ver o pedido. */
export function ContractDetailActions({
  orderId,
  signAction,
  isSigning,
  isDownloading,
  canDownload,
  onSign,
  onDownload,
}: ContractDetailActionsProps) {
  const { t } = useTranslation();

  return (
    <ContractDetailPanel title={t("Contracts.actions.title")} size="sm">
      <Stack gap="8px" p="16px">
        <ContractSignButton
          block
          signAction={signAction}
          isSigning={isSigning}
          onSign={onSign}
        />
        {canDownload && (
          <ContractActionButton
            block
            tone="neutral"
            icon={LuDownload}
            loading={isDownloading}
            onClick={onDownload}
          >
            {t("Contracts.actions.downloadPdf")}
          </ContractActionButton>
        )}
        <ContractActionButton
          block
          tone="neutral"
          icon={LuReceipt}
          href={`/orders/${encodeURIComponent(orderId)}`}
        >
          {t("Contracts.actions.viewOrder")}
        </ContractActionButton>
        <Button
          variant="plain"
          mt="4px"
          w="full"
          h="40.5px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="13px"
          color="#8A9AB5"
          fontSize="12px"
          fontWeight={500}
          lineHeight="18px"
          _hover={{ bg: "#F8F9FB" }}
          asChild
        >
          <NextLink href="/contracts">{t("Contracts.actions.back")}</NextLink>
        </Button>
      </Stack>
    </ContractDetailPanel>
  );
}
