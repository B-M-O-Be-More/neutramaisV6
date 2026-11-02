"use client";

import {
  Button,
  Flex,
  Grid,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuChevronLeft,
  LuChevronRight,
  LuPackageSearch,
  LuRefreshCw,
} from "react-icons/lu";

import DirectProposalCreateDialog from "@/components/DirectProposalCreateDialog";
import SearchNetworkFilters, {
  DEFAULT_SEARCH_NETWORK_FILTERS,
  SearchNetworkFiltersValue,
} from "@/components/SearchNetworkFilters";
import SearchNetworkOfferCard from "@/components/SearchNetworkOfferCard";
import { useSession } from "@/contexts/SessionContext";
import { useOrganizationAddress } from "@/hooks/useOrganizationAddress";
import { useOrganizationOfferings } from "@/hooks/useOrganizationOfferings";
import { useSendDirectProposal } from "@/hooks/useSendDirectProposal";
import type { ProductOffering } from "@/services/productCatalog.service";

import { SearchNetworkCatalogProps } from "./interface";
import {
  filterOfferings,
  toOfferCardProps,
  toProposalOffer,
} from "./offerings";

const PAGE_SIZE = 20;

/** "62420000" → "62420-000"; outro formato passa como veio. */
function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : value;
}

function currencyLocale(language: string): string {
  return language.startsWith("pt") ? "pt-BR" : language;
}

/**
 * Catálogo da busca de redes: cabeçalho com a contagem, filtros à esquerda e
 * a grade de ofertas à direita, com esqueleto, erro e lista vazia.
 *
 * As ofertas vêm de GET /productCatalog/productOffering (paginação por
 * offset/limit). Os filtros são aplicados no cliente sobre a página
 * carregada — a rota ainda não aceita filtros.
 */
export function SearchNetworkCatalog({
  tab,
  query,
  onViewAll,
}: SearchNetworkCatalogProps) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = React.useState<SearchNetworkFiltersValue>(
    DEFAULT_SEARCH_NETWORK_FILTERS,
  );
  const [page, setPage] = React.useState(1);
  // Oferta do modal "Nova Proposta"; null com o modal fechado.
  const [proposalFor, setProposalFor] = React.useState<ProductOffering | null>(
    null,
  );
  const { profile } = useSession();
  const { address } = useOrganizationAddress(profile?.organization.id ?? null);
  const { send } = useSendDirectProposal();

  const { offerings, pagination, isLoading, hasError, refetch } =
    useOrganizationOfferings({
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });

  const locale = currencyLocale(i18n.language);
  const visibleOfferings = filterOfferings(offerings, filters, query);
  const totalCount = pagination?.totalCount ?? offerings.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleViewAll = () => {
    setFilters(DEFAULT_SEARCH_NETWORK_FILTERS);
    onViewAll();
  };

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} h="480px" rounded="14px" />
        ))}
      </SimpleGrid>
    );
  } else if (hasError || visibleOfferings.length === 0) {
    const message = hasError
      ? t("SearchNetwork.catalog.error")
      : offerings.length === 0
        ? t("SearchNetwork.catalog.empty")
        : t("SearchNetwork.catalog.emptyFiltered");

    content = (
      <Stack
        align="center"
        gap="12px"
        py="40px"
        px="24px"
        textAlign="center"
        bg="white"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="#E5E8EE"
        rounded="14px"
      >
        <Flex
          align="center"
          justify="center"
          boxSize="44px"
          rounded="14px"
          bg="#F4F6F9"
        >
          <Icon as={LuPackageSearch} boxSize="22px" color="#8A9AB5" />
        </Flex>
        <Text
          color="#0F1729"
          fontSize="14px"
          fontWeight={600}
          lineHeight="21px"
        >
          {message}
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
            {t("SearchNetwork.catalog.retry")}
          </Button>
        )}
      </Stack>
    );
  } else {
    content = (
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
        {visibleOfferings.map((offering) => (
          <SearchNetworkOfferCard
            key={offering.id}
            {...toOfferCardProps(offering, t, locale)}
            onPropose={() => setProposalFor(offering)}
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Stack as="section" gap="20px">
      <Flex
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap="8px"
      >
        <Stack gap={0}>
          <Text
            as="h2"
            color="#0F1729"
            fontSize="20px"
            fontWeight={700}
            lineHeight="30px"
          >
            {t(`SearchNetwork.catalog.title.${tab}`)}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("SearchNetwork.catalog.subtitle")}
          </Text>
        </Stack>
        <Flex align="center" gap="12px">
          {!isLoading && !hasError && (
            <Text color="#A0ABB8" fontSize="13px" lineHeight="19.5px">
              {t("SearchNetwork.catalog.count", {
                shown: visibleOfferings.length,
                total: totalCount,
              })}
            </Text>
          )}
          <Button
            variant="plain"
            h="auto"
            p={0}
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={600}
            lineHeight="19.5px"
            onClick={handleViewAll}
          >
            {t("SearchNetwork.catalog.viewAll")}
          </Button>
        </Flex>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", lg: "260px minmax(0, 1fr)" }}
        gap="20px"
        alignItems="start"
      >
        <SearchNetworkFilters value={filters} onChange={setFilters} />

        <Stack gap="16px" minW={0}>
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
                {t("SearchNetwork.catalog.previous")}
              </Button>
              <Text color="#5A6478" fontSize="13px">
                {t("SearchNetwork.catalog.page", { page, total: totalPages })}
              </Text>
              <Button
                variant="plain"
                size="sm"
                gap="4px"
                color="#1F5AFF"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((current) => current + 1)}
              >
                {t("SearchNetwork.catalog.next")}
                <Icon as={LuChevronRight} boxSize="14px" />
              </Button>
            </Flex>
          )}
        </Stack>
      </Grid>

      {proposalFor && (
        <DirectProposalCreateDialog
          key={proposalFor.id}
          offer={toProposalOffer(proposalFor, t, locale)}
          buyerName={profile?.display_name ?? ""}
          defaultAddress={
            address
              ? {
                  street: address.street,
                  postalCode: formatPostalCode(address.postal_code),
                }
              : undefined
          }
          locale={locale}
          proposalsHref="/proposals"
          onClose={() => setProposalFor(null)}
          onSend={send}
        />
      )}
    </Stack>
  );
}
