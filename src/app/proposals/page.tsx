"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";

import DirectProposalCancelDialog from "@/components/DirectProposalCancelDialog";
import DirectProposalCard from "@/components/DirectProposalCard";
import DirectProposalDetailsDialog from "@/components/DirectProposalDetailsDialog";
import DirectProposalReviseDialog from "@/components/DirectProposalReviseDialog";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import ProposalsHowItWorks from "@/components/ProposalsHowItWorks";
import ProposalsNotice from "@/components/ProposalsNotice";
import ProposalsStatusFilter from "@/components/ProposalsStatusFilter";
import ProposalsTabs, { type ProposalsTab } from "@/components/ProposalsTabs";
import RfqCancelDialog from "@/components/RfqCancelDialog";
import RfqCard, { type RfqCardAction } from "@/components/RfqCard";
import RfqCreateDialog from "@/components/RfqCreateDialog";
import { toaster } from "@/components/ui/toaster";
import { currencyLocale } from "@/functions/currencyLocale";
import { useDirectProposals } from "@/hooks/useDirectProposals";
import { useRfqs } from "@/hooks/useRfqs";
import type { ProposalCancelValues } from "@/schemas/proposals";
import {
  DIRECT_PROPOSAL_STATUSES,
  type DirectProposalRevision,
  type DirectProposalStatus,
  type Rfq,
  type RfqDraft,
} from "@/types/proposals";

// Abas de status da RFQ (Figma 2073-39104). Canceladas só em "Todas".
const RFQ_FILTERS = [
  "proposalReceived",
  "awaiting",
  "converted",
  "expired",
] as const;

type DirectFilter = DirectProposalStatus | "all";
type RfqFilter = (typeof RFQ_FILTERS)[number] | "all";

/** Telas ainda não desenhadas (pedidos, propostas da RFQ, acompanhamento). */
const COMING_SOON_ACTIONS: RfqCardAction[] = [
  "viewProposals",
  "requestRevision",
  "follow",
  "viewOrder",
];

/** Lista vazia: sem nada ou nada com o filtro escolhido. */
function EmptyList({ message }: { message: string }) {
  return (
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
        {message}
      </Text>
    </Flex>
  );
}

function ProposalsContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);

  const [tab, setTab] = React.useState<ProposalsTab>("direct");
  const [showHowItWorks, setShowHowItWorks] = React.useState(true);

  const direct = useDirectProposals();
  const [directFilter, setDirectFilter] = React.useState<DirectFilter>("all");
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [revisingId, setRevisingId] = React.useState<string | null>(null);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const rfq = useRfqs();
  const [rfqFilter, setRfqFilter] = React.useState<RfqFilter>("all");
  const [isBatchMode, setBatchMode] = React.useState(false);
  const [selectedRfqs, setSelectedRfqs] = React.useState<string[]>([]);
  const [rfqsToCancel, setRfqsToCancel] = React.useState<string[] | null>(null);
  const [isCancellingRfqs, setCancellingRfqs] = React.useState(false);
  // Cada abertura do assistente é uma sessão nova (`key`), opcionalmente
  // preenchida com a RFQ que está sendo refeita.
  const [wizard, setWizard] = React.useState<{
    key: number;
    initial?: RfqDraft;
  } | null>(null);

  // Horas restantes das RFQs: atualiza a cada minuto.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const findProposal = (id: string | null) =>
    direct.proposals.find((proposal) => proposal.id === id) ?? null;
  const viewing = findProposal(viewingId);
  const revising = findProposal(revisingId);
  const cancelling = findProposal(cancellingId);

  const visibleProposals =
    directFilter === "all"
      ? direct.proposals
      : direct.proposals.filter((proposal) => proposal.status === directFilter);

  const visibleRfqs =
    rfqFilter === "all"
      ? rfq.rfqs
      : rfq.rfqs.filter((item) => item.status === rfqFilter);

  const showComingSoon = () =>
    toaster.create({ type: "info", title: t("Proposals.comingSoon") });

  const openWizard = (initial?: RfqDraft) =>
    setWizard((current) => ({ key: (current?.key ?? 0) + 1, initial }));

  const handleRevise = async (revision: DirectProposalRevision) => {
    if (!revising) return false;
    const revised = await direct.revise(revising.id, revision);
    if (!revised) {
      toaster.create({ type: "error", title: t("Proposals.errors.notOpen") });
      return false;
    }
    toaster.create({
      type: "success",
      title: t("Proposals.direct.toasts.revised", {
        id: revised.id,
        version: revised.version,
      }),
    });
    return true;
  };

  const handleCancelProposal = async (values: ProposalCancelValues) => {
    if (!cancelling) return false;
    const ok = await direct.cancel(cancelling.id, values.reason, values.notes);
    toaster.create(
      ok
        ? {
            type: "success",
            title: t("Proposals.direct.toasts.cancelled", {
              id: cancelling.id,
            }),
          }
        : { type: "error", title: t("Proposals.errors.notOpen") },
    );
    return ok;
  };

  const handleRfqAction = (item: Rfq, action: RfqCardAction) => {
    if (action === "cancel") {
      setRfqsToCancel([item.id]);
      return;
    }
    if (action === "newRfq") {
      // Refaz a RFQ com os mesmos dados; o buyer ajusta o que quiser.
      openWizard({
        category: item.category,
        productName: item.productName,
        description: item.description,
        location: item.location,
        budget: item.budget,
        responseHours: item.responseHours,
        urgent: item.urgent,
        requirements: item.requirements,
      });
      return;
    }
    if (COMING_SOON_ACTIONS.includes(action)) showComingSoon();
  };

  const toggleBatchMode = () => {
    setBatchMode((current) => !current);
    setSelectedRfqs([]);
  };

  const handleCancelRfqs = async () => {
    if (!rfqsToCancel) return;
    setCancellingRfqs(true);
    try {
      const count = await rfq.cancel(rfqsToCancel);
      toaster.create({
        type: "success",
        title: t("Proposals.rfq.toasts.cancelled", {
          count,
          id: rfqsToCancel[0],
        }),
      });
      setSelectedRfqs((current) =>
        current.filter((id) => !rfqsToCancel.includes(id)),
      );
      setRfqsToCancel(null);
    } finally {
      setCancellingRfqs(false);
    }
  };

  const handleCreateRfq = async (draft: RfqDraft) => {
    const created = await rfq.create(draft);
    setTab("rfq");
    setRfqFilter("all");
    return created;
  };

  const directOptions = [
    {
      value: "all" as const,
      label: t("Proposals.direct.filters.all"),
      count: direct.proposals.length,
    },
    ...DIRECT_PROPOSAL_STATUSES.map((status) => ({
      value: status,
      label: t(`Proposals.direct.filters.${status}`),
      count: direct.counts[status],
    })),
  ];

  const rfqOptions = [
    {
      value: "all" as const,
      label: t("Proposals.rfq.filters.all"),
      count: rfq.rfqs.length,
    },
    ...RFQ_FILTERS.map((status) => ({
      value: status as RfqFilter,
      label: t(`Proposals.rfq.filters.${status}`),
      count: rfq.counts[status],
    })),
  ];

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="20px"
    >
      {showHowItWorks && (
        <ProposalsHowItWorks onDismiss={() => setShowHowItWorks(false)} />
      )}

      <ProposalsTabs value={tab} onChange={setTab} />

      <Flex
        align="flex-start"
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="12px"
      >
        <Stack gap="4px">
          <Text
            as="h1"
            color="#0F1729"
            fontSize="24px"
            fontWeight={800}
            lineHeight="36px"
          >
            {t(tab === "direct" ? "Proposals.title" : "Proposals.rfq.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
            {t("Proposals.subtitle")}
          </Text>
        </Stack>
        <Button
          h="37px"
          px="12px"
          gap="8px"
          rounded="14px"
          bg="#1F5AFF"
          color="white"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
          flexShrink={0}
          boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          _hover={{ bg: "#1646CC" }}
          onClick={() => openWizard()}
        >
          <Icon as={LuPlus} boxSize="16px" />
          {t("Proposals.newRfq")}
        </Button>
      </Flex>

      {tab === "direct" ? (
        <>
          <ProposalsNotice
            tone="info"
            size="page"
            title={t("Proposals.direct.notice.title")}
          >
            {t("Proposals.direct.notice.description")}
          </ProposalsNotice>

          <ProposalsStatusFilter
            label={t("Proposals.direct.filters.label")}
            options={directOptions}
            value={directFilter}
            onChange={setDirectFilter}
          />

          {visibleProposals.length === 0 ? (
            <EmptyList
              message={t(
                directFilter === "all"
                  ? "Proposals.direct.empty"
                  : "Proposals.direct.emptyFiltered",
              )}
            />
          ) : (
            <Stack gap="20px">
              {visibleProposals.map((proposal) => (
                <DirectProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  locale={locale}
                  onView={() => setViewingId(proposal.id)}
                  onRevise={() => setRevisingId(proposal.id)}
                  onCancel={() => setCancellingId(proposal.id)}
                  onViewOrder={showComingSoon}
                />
              ))}
            </Stack>
          )}
        </>
      ) : (
        <>
          <ProposalsStatusFilter
            label={t("Proposals.rfq.filters.label")}
            options={rfqOptions}
            value={rfqFilter}
            onChange={setRfqFilter}
          >
            <Button
              variant="plain"
              h="35.5px"
              px="17px"
              rounded="10px"
              borderWidth="1px"
              borderColor="#8B5CF6"
              bg={isBatchMode ? "white" : "#8B5CF6"}
              color={isBatchMode ? "#8B5CF6" : "#E5E8EE"}
              fontSize="13px"
              fontWeight={isBatchMode ? 600 : 400}
              lineHeight="19.5px"
              aria-pressed={isBatchMode}
              _hover={{ bg: isBatchMode ? "#F3EEFF" : "#7C4DEB" }}
              onClick={toggleBatchMode}
            >
              {t(
                isBatchMode
                  ? "Proposals.rfq.filters.batchExit"
                  : "Proposals.rfq.filters.batch",
              )}
            </Button>
            {isBatchMode && (
              <Button
                variant="plain"
                h="35.5px"
                px="17px"
                rounded="10px"
                borderWidth="1px"
                borderColor="#FECACA"
                color="#EF4444"
                fontSize="13px"
                fontWeight={500}
                lineHeight="19.5px"
                _hover={{ bg: "#FEF2F2" }}
                disabled={selectedRfqs.length === 0}
                onClick={() => setRfqsToCancel(selectedRfqs)}
              >
                {t("Proposals.rfq.filters.batchCancel", {
                  count: selectedRfqs.length,
                })}
              </Button>
            )}
          </ProposalsStatusFilter>

          {visibleRfqs.length === 0 ? (
            <EmptyList
              message={t(
                rfqFilter === "all"
                  ? "Proposals.rfq.empty"
                  : "Proposals.rfq.emptyFiltered",
              )}
            />
          ) : (
            <Stack gap="16px">
              {visibleRfqs.map((item) => (
                <RfqCard
                  key={item.id}
                  rfq={item}
                  locale={locale}
                  now={now}
                  selectable={isBatchMode}
                  selected={selectedRfqs.includes(item.id)}
                  onSelectedChange={(selected) =>
                    setSelectedRfqs((current) =>
                      selected
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                  onAction={(action) => handleRfqAction(item, action)}
                />
              ))}
            </Stack>
          )}
        </>
      )}

      <DirectProposalDetailsDialog
        proposal={viewing}
        locale={locale}
        onClose={() => setViewingId(null)}
        onRevise={(proposal) => {
          setViewingId(null);
          setRevisingId(proposal.id);
        }}
        onCancel={(proposal) => {
          setViewingId(null);
          setCancellingId(proposal.id);
        }}
      />

      <DirectProposalReviseDialog
        key={revisingId ?? "none"}
        proposal={revising}
        locale={locale}
        isPending={!!revising && direct.pendingId === revising.id}
        onClose={() => setRevisingId(null)}
        onSubmit={handleRevise}
      />

      <DirectProposalCancelDialog
        proposal={cancelling}
        isPending={!!cancelling && direct.pendingId === cancelling.id}
        onClose={() => setCancellingId(null)}
        onConfirm={handleCancelProposal}
      />

      <RfqCancelDialog
        rfqIds={rfqsToCancel}
        isPending={isCancellingRfqs}
        onConfirm={handleCancelRfqs}
        onClose={() => setRfqsToCancel(null)}
      />

      {wizard && (
        <RfqCreateDialog
          key={wizard.key}
          open
          nextId={rfq.nextId}
          initial={wizard.initial}
          onClose={() => setWizard(null)}
          onCreate={handleCreateRfq}
        />
      )}
    </Stack>
  );
}

// Propostas e RFQ do buyer (Figma 2036-13698): propostas diretas a um seller
// e cotações em lote (RFQ) para todos os sellers elegíveis.
export default function ProposalsPage() {
  return (
    <AuthenticatedLayout>
      <ProposalsContent />
    </AuthenticatedLayout>
  );
}
