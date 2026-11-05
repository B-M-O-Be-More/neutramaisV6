"use client";

import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuCircleAlert,
  LuFileText,
  LuRefreshCw,
  LuShieldCheck,
} from "react-icons/lu";

import ContractDetailPanel from "@/components/ContractDetailPanel";

import { ContractDocumentPreviewProps } from "./interface";

/** Selo da conferência do SHA-256 do PDF com o `documentHash`. */
function Integrity({ isVerified }: { isVerified: boolean }) {
  const { t } = useTranslation();

  return (
    <Flex
      align="center"
      gap="4px"
      px="8px"
      py="2px"
      bg={isVerified ? "#EDFBF5" : "#FEF2F2"}
      rounded="8px"
      color={isVerified ? "#10B981" : "#EF4444"}
    >
      <Icon
        as={isVerified ? LuShieldCheck : LuCircleAlert}
        boxSize="11px"
        aria-hidden
      />
      <Text fontSize="10px" fontWeight={700} lineHeight="15px">
        {t(
          isVerified
            ? "Contracts.document.verified"
            : "Contracts.document.mismatch",
        )}
      </Text>
    </Flex>
  );
}

/**
 * PDF do contrato no detalhe: o mesmo arquivo que vai para a Autentique, com
 * o SHA-256 conferido contra o `documentHash` da contracts-api.
 */
export function ContractDocumentPreview({
  documentHash,
  url,
  isVerified,
  isLoading,
  errorKey,
  onRetry,
}: ContractDocumentPreviewProps) {
  const { t } = useTranslation();

  return (
    <ContractDetailPanel
      title={t("Contracts.document.title")}
      icon={LuFileText}
      iconColor="#1F5AFF"
      headerExtra={
        isVerified !== null ? <Integrity isVerified={isVerified} /> : null
      }
    >
      {!documentHash ? (
        <Text px="20px" py="24px" color="#8A9AB5" fontSize="13px">
          {t("Contracts.errors.noDocument")}
        </Text>
      ) : isLoading ? (
        <Box p="20px" aria-busy="true">
          <Skeleton h="560px" rounded="10px" />
        </Box>
      ) : errorKey || !url ? (
        <Stack align="center" gap="12px" px="20px" py="32px" textAlign="center">
          <Text role="alert" color="#0F1729" fontSize="13px" fontWeight={600}>
            {t(errorKey ?? "Contracts.errors.documentFailed")}
          </Text>
          <Button
            variant="plain"
            h="32px"
            px="12px"
            gap="6px"
            rounded="10px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontSize="12px"
            fontWeight={600}
            onClick={onRetry}
          >
            <Icon as={LuRefreshCw} boxSize="12px" />
            {t("Contracts.retry")}
          </Button>
        </Stack>
      ) : (
        <chakra.iframe
          src={url}
          title={t("Contracts.document.title")}
          display="block"
          w="full"
          h={{ base: "480px", md: "640px" }}
          border={0}
          bg="#F4F6F9"
        />
      )}

      {documentHash && (
        <Text
          px="20px"
          py="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
          color="#A0ABB8"
          fontSize="10px"
          lineHeight="15px"
          fontFamily="mono"
          wordBreak="break-all"
        >
          {t("Contracts.document.hash", { hash: documentHash })}
        </Text>
      )}
    </ContractDetailPanel>
  );
}
