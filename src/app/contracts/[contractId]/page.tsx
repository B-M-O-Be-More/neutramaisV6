"use client";

import {
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuDownload, LuRefreshCw } from "react-icons/lu";

import ContractDetailActions from "@/components/ContractDetailActions";
import ContractDocumentPreview from "@/components/ContractDocumentPreview";
import ContractSignaturePanel from "@/components/ContractSignaturePanel";
import ContractStatusBadge from "@/components/ContractStatusBadge";
import ContractSummary from "@/components/ContractSummary";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import {
  ProfileSessionProvider,
  useProfileSession,
} from "@/contexts/ProfileSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { orderItemNames, shortId } from "@/functions/contractFormat";
import { useContract } from "@/hooks/useContract";
import { useContractActions } from "@/hooks/useContractActions";
import { useContractDocument } from "@/hooks/useContractDocument";
import type { ContractEntry } from "@/types/contracts";

/** Volta para a lista de contratos (breadcrumb). */
function BackToContracts() {
  const { t } = useTranslation();

  return (
    <Button
      variant="plain"
      h="auto"
      px="10px"
      py="6px"
      ms="-10px"
      gap="8px"
      color="#8A9AB5"
      fontSize="16px"
      fontWeight={500}
      lineHeight="24px"
      _hover={{ color: "#5A6478" }}
      asChild
    >
      <NextLink href="/contracts">
        <Icon as={LuChevronLeft} boxSize="18px" />
        {t("Contracts.detail.breadcrumb")}
      </NextLink>
    </Button>
  );
}

const PAGE_PROPS = {
  maxW: "1280px",
  px: { base: 4, md: "32px" },
  py: { base: 6, md: "28px" },
} as const;

function ContractDetailView({
  entry,
  refresh,
}: {
  entry: ContractEntry;
  refresh: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { context } = useProfileSession();
  const { contract, order } = entry;
  const pdf = useContractDocument(contract.contractId, contract.documentHash);
  const actions = useContractActions({ onChanged: refresh })(
    contract,
    pdf.blob,
  );

  const names = order ? orderItemNames(order) : [];
  const title = names.length
    ? names.join(", ")
    : t("Contracts.card.untitled", { id: shortId(contract.orderId) });

  return (
    <Stack {...PAGE_PROPS} gap="24px">
      <Flex
        as="nav"
        align="center"
        gap="12px"
        aria-label={t("Contracts.detail.breadcrumbLabel")}
      >
        <BackToContracts />
        <Text color="#E5E8EE" fontSize="16px" lineHeight="24px" aria-hidden>
          /
        </Text>
        <Text
          color="#0F1729"
          fontSize="14px"
          fontWeight={600}
          lineHeight="21px"
          aria-current="page"
        >
          {shortId(contract.contractId)}
        </Text>
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        align="flex-start"
        justify="space-between"
        gap="16px"
      >
        <Stack gap={0} minW={0}>
          <Text
            as="h1"
            color="#0F1729"
            fontSize="22px"
            fontWeight={800}
            lineHeight="33px"
          >
            {title}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {[
              t("Contracts.card.contract", {
                id: shortId(contract.contractId),
              }),
              t("Contracts.card.order", { id: shortId(contract.orderId) }),
            ].join(" · ")}
          </Text>
        </Stack>

        <Flex align="center" gap="12px" flexShrink={0}>
          {actions.canDownload && (
            <Button
              variant="plain"
              h="auto"
              px="10px"
              py="6px"
              gap="6px"
              bg="#EEF3FF"
              borderWidth="1px"
              borderColor="#C7D8FF"
              rounded="13px"
              color="#1F5AFF"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              _hover={{ bg: "#E0EAFF" }}
              loading={actions.isDownloading}
              onClick={actions.onDownload}
            >
              <Icon as={LuDownload} boxSize="13px" />
              {t("Contracts.actions.downloadPdf")}
            </Button>
          )}
          <ContractStatusBadge status={contract.status} size="md" />
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap="20px" alignItems="start">
        <Stack gap="20px" gridColumn={{ lg: "span 2" }} minW={0}>
          <ContractSignaturePanel
            contract={contract}
            currentUserId={context?.user_id ?? null}
            signAction={actions.signAction}
            isSigning={actions.isSigning}
            onSign={actions.onSign}
            onRefresh={refresh}
          />
          <ContractDocumentPreview
            documentHash={contract.documentHash}
            url={pdf.url}
            isVerified={pdf.isVerified}
            isLoading={pdf.isLoading}
            errorKey={pdf.errorKey}
            onRetry={pdf.reload}
          />
        </Stack>

        <Stack gap="16px" minW={0}>
          <ContractSummary entry={entry} locale={locale} />
          <ContractDetailActions orderId={contract.orderId} {...actions} />
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}

function ContractDetailContent({ contractId }: { contractId: string }) {
  const { t } = useTranslation();
  const { entry, isLoading, errorKey, reload, refresh } =
    useContract(contractId);

  if (isLoading) {
    return (
      <Stack {...PAGE_PROPS} gap="24px" aria-busy="true">
        <Skeleton h="24px" w="220px" rounded="8px" />
        <Skeleton h="56px" rounded="12px" />
        <Skeleton h="420px" rounded="14px" />
      </Stack>
    );
  }

  if (!entry) {
    const canRetry =
      errorKey !== "Contracts.errors.forbidden" &&
      errorKey !== "Contracts.errors.notFound";
    return (
      <Stack {...PAGE_PROPS} gap="16px" align="flex-start">
        <BackToContracts />
        <Text role="alert" color="#0F1729" fontSize="15px" fontWeight={700}>
          {t(errorKey ?? "Contracts.errors.failed")}
        </Text>
        {canRetry && (
          <Button
            variant="plain"
            h="36px"
            px="14px"
            gap="6px"
            rounded="10px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={600}
            onClick={reload}
          >
            <Icon as={LuRefreshCw} boxSize="13px" />
            {t("Contracts.retry")}
          </Button>
        )}
      </Stack>
    );
  }

  return <ContractDetailView entry={entry} refresh={refresh} />;
}

// Detalhe do contrato de pedido do buyer: status da assinatura, PDF conferido
// pelo SHA-256, dados do pedido e as ações (assinar na Autentique, baixar).
export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = React.use(params);

  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <ContractDetailContent contractId={decodeURIComponent(contractId)} />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
