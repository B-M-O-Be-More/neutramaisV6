"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuPenLine, LuRefreshCw } from "react-icons/lu";

import ContractDetailPanel from "@/components/ContractDetailPanel";
import ContractSignButton from "@/components/ContractSignButton";
import ContractStatusBadge from "@/components/ContractStatusBadge";

import { ContractSignaturePanelProps } from "./interface";

/** Linha "rótulo: valor" do signatário. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <Flex
      justify="space-between"
      gap="12px"
      py="10px"
      borderTopWidth="1px"
      borderColor="#F4F6F9"
      fontSize="12px"
      lineHeight="18px"
    >
      <Text as="dt" color="#A0ABB8">
        {label}
      </Text>
      <Text as="dd" color="#0F1729" fontWeight={600} textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

/**
 * Assinatura do contrato: o que o status significa para o Buyer, quem está
 * vinculado como signatário e a ação de assinar. O status só vira `signed`
 * depois que a contracts-api confere a assinatura na Autentique; "Atualizar
 * status" lê de novo.
 */
export function ContractSignaturePanel({
  contract,
  currentUserId,
  signAction,
  isSigning,
  onSign,
  onRefresh,
}: ContractSignaturePanelProps) {
  const { t } = useTranslation();
  const [signer] = contract.signatures;

  const signerValue = !signer
    ? t("Contracts.signature.noSigner")
    : signer.subject === currentUserId
      ? t("Contracts.signature.you")
      : t("Contracts.signature.otherUser");
  const signedValue = signer?.signed
    ? t("Contracts.signature.verified")
    : t("Contracts.signature.notVerified");

  return (
    <ContractDetailPanel
      title={t("Contracts.signature.title")}
      icon={LuPenLine}
      iconColor="#8B5CF6"
      headerAction={
        <Button
          variant="plain"
          h="auto"
          px="10px"
          py="5px"
          gap="6px"
          rounded="10px"
          borderWidth="1px"
          borderColor="#E5E8EE"
          color="#5A6478"
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
          _hover={{ bg: "#F8F9FB" }}
          onClick={onRefresh}
        >
          <Icon as={LuRefreshCw} boxSize="12px" />
          {t("Contracts.signature.refresh")}
        </Button>
      }
    >
      <Stack gap="16px" p="20px">
        <Flex align="flex-start" gap="12px" wrap="wrap">
          <ContractStatusBadge status={contract.status} />
          <Text
            flex="1"
            minW="200px"
            color="#5A6478"
            fontSize="13px"
            lineHeight="19.5px"
          >
            {t(`Contracts.statusDescriptions.${contract.status}`)}
          </Text>
        </Flex>

        <dl>
          <Row label={t("Contracts.signature.signer")} value={signerValue} />
          {signer && (
            <Row label={t("Contracts.signature.signed")} value={signedValue} />
          )}
        </dl>

        {signAction !== "none" && (
          <Flex>
            <ContractSignButton
              signAction={signAction}
              isSigning={isSigning}
              onSign={onSign}
            />
          </Flex>
        )}
      </Stack>
    </ContractDetailPanel>
  );
}
