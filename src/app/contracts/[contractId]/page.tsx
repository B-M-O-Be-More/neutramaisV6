"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuDownload } from "react-icons/lu";

import ContractChangeRequests from "@/components/ContractChangeRequests";
import ContractClauses from "@/components/ContractClauses";
import ContractDetailActions from "@/components/ContractDetailActions";
import ContractPayments from "@/components/ContractPayments";
import ContractSummary from "@/components/ContractSummary";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import { toaster } from "@/components/ui/toaster";
import { CONTRACT_STATUS_STYLES } from "@/data/contractStatus";
import { currencyLocale } from "@/functions/currencyLocale";
import { formatProposalMoney } from "@/functions/proposalFormat";
import { useContractActions } from "@/hooks/useContractActions";
import { useContracts } from "@/hooks/useContracts";

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

function ContractDetailContent({ contractId }: { contractId: string }) {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const contractsState = useContracts();
  const actionsFor = useContractActions(contractsState);
  const [isAmendmentOpen, setIsAmendmentOpen] = React.useState(false);

  const contract = contractsState.contracts.find(
    (item) => item.id === contractId,
  );

  if (!contract) {
    return (
      <Stack
        maxW="1280px"
        px={{ base: 4, md: "32px" }}
        py={{ base: 6, md: "28px" }}
        gap="16px"
        align="flex-start"
      >
        <BackToContracts />
        <Text color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("Contracts.detail.notFound")}
        </Text>
      </Stack>
    );
  }

  const status = CONTRACT_STATUS_STYLES[contract.status];
  const actions = actionsFor(contract);
  const showComingSoon = () =>
    toaster.create({ type: "info", title: t("Contracts.comingSoon") });

  // "Solicitar aditivo" das ações abre o formulário da seção e leva até ele.
  const openAmendment = () => {
    setIsAmendmentOpen(true);
    document
      .getElementById(`contract-${contract.id}-change-requests`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitAmendment = async (description: string) => {
    if (await actions.onSubmitAmendment(description)) {
      setIsAmendmentOpen(false);
    }
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
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
          {contract.id}
        </Text>
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "flex-start" }}
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
            {contract.productName}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {[
              contract.sellerName,
              contract.id,
              t("Contracts.detail.order", { id: contract.orderId }),
            ].join(" · ")}
          </Text>
        </Stack>

        <Flex align="center" gap="12px" flexShrink={0}>
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
            onClick={showComingSoon}
          >
            <Icon as={LuDownload} boxSize="13px" />
            {t("Contracts.detail.downloadPdf")}
          </Button>
          <Flex
            align="center"
            gap="6px"
            px="12px"
            py="6px"
            bg={status.bg}
            borderWidth="1px"
            borderColor="rgba(0, 0, 0, 0.1)"
            rounded="14px"
            color={status.color}
          >
            <Box boxSize="8px" rounded="full" bg={status.color} />
            <Text fontSize="13px" fontWeight={700} lineHeight="19.5px">
              {t(`Contracts.statuses.${contract.status}`)}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap="20px" alignItems="start">
        <Stack gap="20px" gridColumn={{ lg: "span 2" }} minW={0}>
          <ContractClauses clauses={contract.clauses} />
          <ContractPayments
            payments={contract.payments}
            locale={locale}
            onDownloadInvoice={showComingSoon}
          />
          <ContractChangeRequests
            contractId={contract.id}
            requests={contract.changeRequests}
            locale={locale}
            isFormOpen={isAmendmentOpen}
            isSubmitting={actions.isPending}
            onOpenForm={() => setIsAmendmentOpen(true)}
            onCloseForm={() => setIsAmendmentOpen(false)}
            onSubmit={submitAmendment}
          />
        </Stack>

        <Stack gap="16px" minW={0}>
          <ContractSummary contract={contract} locale={locale} />
          <ContractDetailActions
            autoRenew={contract.autoRenew}
            cancellationRequested={contract.cancellationRequested}
            exitFee={
              contract.exitFee
                ? formatProposalMoney(contract.exitFee, locale)
                : null
            }
            isPending={actions.isPending}
            onRequestAmendment={openAmendment}
            onToggleAutoRenew={actions.onToggleAutoRenew}
            onConfirmCancellation={actions.onConfirmCancellation}
          />
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}

// Detalhe do contrato do buyer (Figma 2190-14094): cláusulas, histórico de
// pagamentos, aditivos, dados e ações. A API de contratos ainda não existe —
// useContracts devolve os dados do design.
export default function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();

  return (
    <AuthenticatedLayout>
      <ContractDetailContent contractId={decodeURIComponent(contractId)} />
    </AuthenticatedLayout>
  );
}
