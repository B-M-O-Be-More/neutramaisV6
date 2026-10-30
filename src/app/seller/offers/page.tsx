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
import {
  LuChevronLeft,
  LuChevronRight,
  LuPlus,
  LuRefreshCw,
} from "react-icons/lu";

import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import SellerCatalogTabs, {
  type SellerCatalogTab,
} from "@/components/SellerCatalogTabs";
import SellerOfferArchiveDialog from "@/components/SellerOfferArchiveDialog";
import SellerCoveragePanel from "@/components/SellerCoveragePanel";
import SellerOfferCard from "@/components/SellerOfferCard";
import SellerOffersFilters, {
  type SellerOffersFiltersValue,
} from "@/components/SellerOffersFilters";
import SellerOffersStats, {
  type SellerOffersStatsData,
} from "@/components/SellerOffersStats";
import { toaster } from "@/components/ui/toaster";
import {
  SellerSessionProvider,
  useSellerSession,
} from "@/contexts/SellerSessionContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useOfferingTransition,
  type OfferingAction,
} from "@/hooks/useOfferingTransition";
import { useOfferingsSummary } from "@/hooks/useOfferingsSummary";
import { useOrganizationOfferings } from "@/hooks/useOrganizationOfferings";
import { useProductSpecifications } from "@/hooks/useProductSpecifications";
import type { ProductOffering } from "@/services/productCatalog.service";
import { currencyLocale } from "@/functions/currencyLocale";
import { offerLifecycleGates } from "@/functions/offerLifecycleGates";
import { canUploadCoverage } from "@/functions/rolesToPersonas";

const PAGE_SIZE = 20;

const AVAILABLE_TABS: SellerCatalogTab[] = ["catalog", "coverage"];

const INITIAL_FILTERS: SellerOffersFiltersValue = {
  search: "",
  specificationId: "",
  status: "all",
};

function SellerOffersContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { organizationId, context } = useSellerSession();
  const [tab, setTab] = React.useState<SellerCatalogTab>("catalog");
  const [filters, setFilters] =
    React.useState<SellerOffersFiltersValue>(INITIAL_FILTERS);
  const [page, setPage] = React.useState(1);
  const [archiving, setArchiving] = React.useState<ProductOffering | null>(
    null,
  );

  // A busca só vai para a API depois de uma pausa na digitação.
  const name = useDebouncedValue(filters.search.trim(), 300);

  const { offerings, pagination, isLoading, hasError, refetch } =
    useOrganizationOfferings({
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      status: filters.status === "all" ? undefined : filters.status,
      name: name || undefined,
      specificationId: filters.specificationId || undefined,
    });
  const summary = useOfferingsSummary();
  const { specifications } = useProductSpecifications();
  const { pendingId, transition } = useOfferingTransition();
  const gates = offerLifecycleGates(context);

  const specificationNames = React.useMemo(
    () => new Map(specifications.map((spec) => [spec.id, spec.name])),
    [specifications],
  );

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const hasFilters =
    !!name || !!filters.specificationId || filters.status !== "all";

  const handleFiltersChange = (value: SellerOffersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const runTransition = async (
    offering: ProductOffering,
    action: OfferingAction,
  ) => {
    const result = await transition(offering.id, action);
    if (result.ok) {
      toaster.create({
        type: "success",
        title: t(`SellerOffers.toasts.${action}`, { name: offering.name }),
      });
      refetch();
      summary.refetch();
    } else {
      toaster.create({ type: "error", title: t(result.errorKey) });
    }
    return result.ok;
  };

  const handleAction = (offering: ProductOffering, action: OfferingAction) => {
    // Arquivar é terminal: pede confirmação antes.
    if (action === "archive") {
      setArchiving(offering);
      return;
    }
    void runTransition(offering, action);
  };

  const handleArchiveConfirm = async () => {
    if (!archiving) return;
    const ok = await runTransition(archiving, "archive");
    if (ok) setArchiving(null);
  };

  // Visualizações, pedidos e receita ainda não têm endpoint (vêm do serviço de
  // pedidos). Sem nenhuma oferta, são zero por definição; com ofertas, "—".
  const isEmptyCatalog = summary.summary?.totalOffers === 0;
  const stats: SellerOffersStatsData = {
    totalOffers: summary.summary
      ? new Intl.NumberFormat(locale).format(summary.summary.totalOffers)
      : null,
    views: isEmptyCatalog ? "0" : null,
    orders: isEmptyCatalog ? "0" : null,
    revenue: isEmptyCatalog
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "BRL",
        }).format(0)
      : null,
    totalCaption: summary.summary?.totalOffers
      ? t("SellerOffers.stats.publishedCaption", {
          count: summary.summary.byStatus.published,
        })
      : undefined,
  };

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="16px" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} h="236px" rounded="14px" />
        ))}
      </SimpleGrid>
    );
  } else if (hasError || offerings.length === 0) {
    content = (
      <Stack
        align="center"
        justify="center"
        gap="12px"
        minH="121px"
        px="24px"
        py="20px"
        bg="white"
        rounded="17px"
        textAlign="center"
      >
        <Text
          color="#0F1729"
          fontSize="15.8px"
          fontWeight={700}
          lineHeight="23.7px"
        >
          {hasError
            ? t("SellerOffers.list.error")
            : hasFilters
              ? t("SellerOffers.list.emptyFiltered")
              : t("SellerOffers.list.empty")}
        </Text>
        {hasError && (
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
            onClick={refetch}
          >
            <Icon as={LuRefreshCw} boxSize="13px" />
            {t("SellerOffers.list.retry")}
          </Button>
        )}
      </Stack>
    );
  } else {
    content = (
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="16px">
        {offerings.map((offering) => (
          <SellerOfferCard
            key={offering.id}
            offering={offering}
            categoryName={specificationNames.get(offering.specificationId)}
            locale={locale}
            isPending={pendingId === offering.id}
            gates={gates}
            onAction={(action) => handleAction(offering, action)}
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="20px"
    >
      <SellerCatalogTabs
        value={tab}
        available={AVAILABLE_TABS}
        onChange={setTab}
      />

      {tab === "coverage" ? (
        <SellerCoveragePanel
          organizationId={organizationId}
          canUpload={canUploadCoverage(context?.roles ?? [])}
          locale={locale}
        />
      ) : (
        <>
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
                {t("SellerOffers.title")}
              </Text>
              <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
                {t("SellerOffers.subtitle")}
              </Text>
            </Stack>
            <Button
              asChild
              h="37px"
              px="12px"
              gap="8px"
              rounded="14px"
              bg="#8B5CF6"
              color="white"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
              flexShrink={0}
              boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
              _hover={{ bg: "#7C4DEB" }}
            >
              <NextLink href="/seller/offers/new">
                <Icon as={LuPlus} boxSize="15px" />
                {t("SellerOffers.newOffer")}
              </NextLink>
            </Button>
          </Flex>

          <SellerOffersStats data={stats} />

          <SellerOffersFilters
            value={filters}
            onChange={handleFiltersChange}
            specifications={specifications}
            counts={summary.summary?.byStatus}
          />

          {content}

          {totalPages > 1 && (
            <Flex align="center" justify="center" gap="12px">
              <Button
                variant="plain"
                size="sm"
                gap="4px"
                color="#1F5AFF"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => current - 1)}
              >
                <Icon as={LuChevronLeft} boxSize="14px" />
                {t("SellerOffers.list.previous")}
              </Button>
              <Text color="#5A6478" fontSize="13px">
                {t("SellerOffers.list.page", { page, total: totalPages })}
              </Text>
              <Button
                variant="plain"
                size="sm"
                gap="4px"
                color="#1F5AFF"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((current) => current + 1)}
              >
                {t("SellerOffers.list.next")}
                <Icon as={LuChevronRight} boxSize="14px" />
              </Button>
            </Flex>
          )}
        </>
      )}

      <SellerOfferArchiveDialog
        offeringName={archiving?.name ?? null}
        isPending={!!archiving && pendingId === archiving.id}
        onConfirm={handleArchiveConfirm}
        onClose={() => setArchiving(null)}
      />
    </Stack>
  );
}

// Catálogo do seller (Figma 2073-35059 vazio; 2096-26025 com ofertas): KPIs,
// filtros por nome/categoria/status e os cards com as ações do ciclo de vida.
export default function SellerOffersPage() {
  return (
    <AuthenticatedLayout>
      <SellerSessionProvider>
        <SellerOffersContent />
      </SellerSessionProvider>
    </AuthenticatedLayout>
  );
}
