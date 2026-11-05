"use client";

import { Button, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuPenLine, LuRefreshCw } from "react-icons/lu";

import ContractCard from "@/components/ContractCard";
import ContractsStats from "@/components/ContractsStats";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ProposalsNotice from "@/components/ProposalsNotice";
import { ProfileSessionProvider } from "@/contexts/ProfileSessionContext";
import { currencyLocale } from "@/functions/currencyLocale";
import { useContractActions } from "@/hooks/useContractActions";
import { useContracts } from "@/hooks/useContracts";

/** Faixa branca da lista (vazio ou erro). */
function ListMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack
      align="center"
      justify="center"
      gap="12px"
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
        role={onRetry ? "alert" : undefined}
        color="#0F1729"
        fontSize="15px"
        fontWeight={700}
        lineHeight="22.5px"
      >
        {message}
      </Text>
      {onRetry && (
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
          onClick={onRetry}
        >
          <Icon as={LuRefreshCw} boxSize="13px" />
          {t("Contracts.retry")}
        </Button>
      )}
    </Stack>
  );
}

function ContractsContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { entries, summary, isLoading, errorKey, reload, refresh } =
    useContracts();
  const actionsFor = useContractActions({ onChanged: refresh });

  // "Assinar" do aviso leva ao primeiro contrato que espera a assinatura.
  const toSign = entries.filter(
    ({ contract }) => actionsFor(contract).signAction === "sign",
  );
  const goToFirstToSign = () => {
    const [first] = toSign;
    if (!first) return;
    document
      .getElementById(`contract-${first.contract.contractId}`)
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

      {toSign.length > 0 && (
        <ProposalsNotice
          tone="warning"
          size="page"
          icon={LuPenLine}
          title={t("Contracts.signNotice.title", { count: toSign.length })}
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
              onClick={goToFirstToSign}
            >
              {t("Contracts.signNotice.action")}
            </Button>
          }
        >
          {t("Contracts.signNotice.description")}
        </ProposalsNotice>
      )}

      {isLoading ? (
        <Stack gap="16px" aria-busy="true">
          <Skeleton h="122px" rounded="16px" />
          <Skeleton h="150px" rounded="14px" />
          <Skeleton h="150px" rounded="14px" />
        </Stack>
      ) : errorKey ? (
        <ListMessage
          message={t(errorKey)}
          onRetry={
            errorKey === "Contracts.errors.forbidden" ? undefined : reload
          }
        />
      ) : (
        <>
          <ContractsStats data={summary} locale={locale} />
          {entries.length === 0 ? (
            <ListMessage message={t("Contracts.empty")} />
          ) : (
            <Stack gap="16px">
              {entries.map((entry) => (
                <ContractCard
                  key={entry.contract.contractId}
                  entry={entry}
                  locale={locale}
                  {...actionsFor(entry.contract)}
                />
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}

// Contratos de pedido do buyer (contracts-api `/order-contracts`): o Orders
// pede o contrato depois do pagamento integral; o Buyer baixa o PDF e assina
// na Autentique. A API recebe o token do perfil Buyer (POST /auth/context).
export default function ContractsPage() {
  return (
    <AuthenticatedLayout>
      <ProfileSessionProvider profile="buyer">
        <ContractsContent />
      </ProfileSessionProvider>
    </AuthenticatedLayout>
  );
}
