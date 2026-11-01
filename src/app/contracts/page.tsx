"use client";

import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuRotateCcw } from "react-icons/lu";

import ContractCard from "@/components/ContractCard";
import ContractsStats from "@/components/ContractsStats";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ProposalsNotice from "@/components/ProposalsNotice";
import { currencyLocale } from "@/functions/currencyLocale";
import { useContractActions } from "@/hooks/useContractActions";
import { useContracts } from "@/hooks/useContracts";

function ContractsContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const contractsState = useContracts();
  const { contracts, summary, now } = contractsState;
  const actionsFor = useContractActions(contractsState);
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);

  const toggleExpanded = (id: string) =>
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  // "Gerenciar" leva ao primeiro contrato em renovação, já com os termos
  // abertos.
  const manageRenewals = () => {
    const renewing = contracts.find(
      (contract) => contract.status === "renewing",
    );
    if (!renewing) return;
    setExpandedIds((current) =>
      current.includes(renewing.id) ? current : [...current, renewing.id],
    );
    document
      .getElementById(`contract-${renewing.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Stack gap="4px">
        <Text
          as="h1"
          color="#0F1729"
          fontSize="24px"
          fontWeight={800}
          lineHeight="36px"
        >
          {t("Contracts.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
          {t("Contracts.subtitle")}
        </Text>
      </Stack>

      {summary.renewing > 0 && (
        <ProposalsNotice
          tone="warning"
          size="page"
          icon={LuRotateCcw}
          title={t("Contracts.renewalNotice.title", {
            count: summary.renewing,
          })}
          action={
            <Button
              variant="plain"
              h="auto"
              px="13px"
              py="7px"
              rounded="10px"
              borderWidth="1px"
              borderColor="#FDE68A"
              color="#D97706"
              fontSize="12px"
              fontWeight={700}
              lineHeight="18px"
              _hover={{ bg: "#FEF3C7" }}
              onClick={manageRenewals}
            >
              {t("Contracts.renewalNotice.manage")}
            </Button>
          }
        >
          {t("Contracts.renewalNotice.description")}
        </ProposalsNotice>
      )}

      <ContractsStats data={summary} locale={locale} />

      {contracts.length === 0 ? (
        <Flex
          align="center"
          justify="center"
          minH="121px"
          px="24px"
          py="20px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
          textAlign="center"
        >
          <Text
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
          >
            {t("Contracts.empty")}
          </Text>
        </Flex>
      ) : (
        <Stack gap="16px">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              locale={locale}
              now={now}
              expanded={expandedIds.includes(contract.id)}
              onToggle={() => toggleExpanded(contract.id)}
              {...actionsFor(contract)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// Contratos do buyer (Figma 2084-11696): aviso de renovação próxima,
// contadores e a lista com status, cobrança e renovação automática. A API de
// contratos ainda não existe — useContracts devolve os dados do design.
export default function ContractsPage() {
  return (
    <AuthenticatedLayout>
      <ContractsContent />
    </AuthenticatedLayout>
  );
}
