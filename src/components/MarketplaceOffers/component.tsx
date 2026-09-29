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
import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuPackageSearch, LuRefreshCw } from "react-icons/lu";

import type { MarketplaceCategoryKey } from "@/components/MarketplaceCategories/interface";
import MarketplaceCategoryFilter from "@/components/MarketplaceCategoryFilter";
import { MarketplaceCategoryFilterValue } from "@/components/MarketplaceCategoryFilter/interface";
import MarketplaceOfferCard from "@/components/MarketplaceOfferCard";
import { MarketplaceOfferCardProps } from "@/components/MarketplaceOfferCard/interface";
import { useProductOfferings } from "@/hooks/useProductOfferings";
import type { ProductOffering } from "@/services/productCatalog.service";

import { MarketplaceOffersProps } from "./interface";

const DEFAULT_FILTERS = { page: 1, pageSize: 6 };

// Comprar exige sessão. Até existirem carrinho e checkout, as duas ações levam
// ao login.
const PURCHASE_HREF = "/login";

// Chaves de `metadata` que viram texto no resumo do card. As demais são
// ignoradas até ganharem tradução.
const METADATA_HIGHLIGHTS = ["ipFixo"] as const;

function currencyLocale(language: string): string {
  return language.startsWith("pt") ? "pt-BR" : language;
}

/** "500 Mbps" → { value: "500", unit: "Mbps" }. */
function splitSpeed(speed: string): { value: string; unit?: string } {
  const match = speed.trim().match(/^([\d.,]+)\s*(.*)$/);
  if (!match) return { value: speed.trim() };
  return { value: match[1], unit: match[2] || undefined };
}

/**
 * Categoria da oferta. A marketplace-api ainda não expõe categoria (nem na
 * oferta, nem na especificação), então tudo cai em "connectivity", única do
 * MVP com ofertas publicadas. Quando o campo existir, basta lê-lo aqui — card
 * e filtro passam a refletir a categoria real.
 */
// A oferta já é recebida para a assinatura não mudar quando o campo chegar.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolveCategory(_offering: ProductOffering): MarketplaceCategoryKey {
  return "connectivity";
}

/**
 * Converte a oferta da API nas props do card.
 *
 * A busca pública ainda não traz provedor (nome, reputação, KYC), descrição,
 * SLA nem descontos — esses blocos do card ficam ocultos.
 */
function toCardProps(
  offering: ProductOffering,
  t: TFunction,
  locale: string,
): MarketplaceOfferCardProps {
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  });
  const installation = Number(offering.installationPrice);
  const category = resolveCategory(offering);
  const categoryLabel = t(`Marketplace.categories.items.${category}.title`);

  const highlights = METADATA_HIGHLIGHTS.filter(
    (key) => offering.metadata?.[key] === true,
  ).map((key) => t(`Marketplace.offers.metadata.${key}`));

  const location = offering.stateCode
    ? offering.isCapital === null
      ? offering.stateCode
      : t(
          offering.isCapital
            ? "Marketplace.offers.capital"
            : "Marketplace.offers.countryside",
          { state: offering.stateCode },
        )
    : "—";

  return {
    category,
    title: offering.name,
    description: highlights.length ? highlights.join(" · ") : undefined,
    headline: offering.speed
      ? splitSpeed(offering.speed)
      : { value: categoryLabel },
    categoryTag: offering.isCorporate
      ? `${categoryLabel} · ${t("Marketplace.offers.corporate")}`
      : categoryLabel,
    stats: [
      {
        label: t("Marketplace.offers.stats.installation"),
        value:
          installation > 0
            ? money.format(installation)
            : t("Marketplace.offers.free"),
        tone: installation > 0 ? "neutral" : "success",
      },
      {
        label: t("Marketplace.offers.stats.contract"),
        value: offering.durationMonths
          ? t("Marketplace.offers.months", { count: offering.durationMonths })
          : "—",
        tone: "brand",
        showClock: Boolean(offering.durationMonths),
      },
      {
        label: t("Marketplace.offers.stats.location"),
        value: location,
      },
    ],
    price: money.format(Number(offering.monthlyPrice)),
    priceSuffix: t("Marketplace.offers.perMonth"),
    addHref: PURCHASE_HREF,
    buyHref: PURCHASE_HREF,
  };
}

/**
 * Vitrine de ofertas públicas da home (marketplace-api, sem auth).
 * Fica logo abaixo das promoções, sob o mesmo título de "Preços públicos",
 * com o filtro de categoria acima da grade. Exibe esqueletos enquanto carrega
 * e estados próprios para lista vazia e erro.
 *
 * O filtro de categoria é aplicado no cliente sobre a página carregada — a
 * busca pública não aceita categoria (ver `resolveCategory`).
 */
export function MarketplaceOffers({
  filters = DEFAULT_FILTERS,
}: MarketplaceOffersProps) {
  const { t, i18n } = useTranslation();
  const [category, setCategory] =
    React.useState<MarketplaceCategoryFilterValue>("all");
  const { offerings, isLoading, hasError, refetch } =
    useProductOfferings(filters);
  const locale = currencyLocale(i18n.language);
  const skeletonCount = filters.pageSize ?? DEFAULT_FILTERS.pageSize;

  const visibleOfferings =
    category === "all"
      ? offerings
      : offerings.filter((offering) => resolveCategory(offering) === category);

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3 }}
        gap="20px"
        aria-busy="true"
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <Skeleton key={index} h="480px" rounded="14px" />
        ))}
      </SimpleGrid>
    );
  } else if (hasError || visibleOfferings.length === 0) {
    const message = hasError
      ? t("Marketplace.offers.error")
      : category === "all"
        ? t("Marketplace.offers.empty")
        : t("Marketplace.offers.emptyCategory", {
            category: t(`Marketplace.offers.filter.${category}`),
          });

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
        <Text fontSize="14px" fontWeight={600} lineHeight="21px" color="#0F1729">
          {message}
        </Text>
        {hasError ? (
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
            {t("Marketplace.offers.retry")}
          </Button>
        ) : null}
      </Stack>
    );
  } else {
    content = (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="20px">
        {visibleOfferings.map((offering) => (
          <MarketplaceOfferCard
            key={offering.id}
            {...toCardProps(offering, t, locale)}
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Stack gap="20px">
      <MarketplaceCategoryFilter value={category} onChange={setCategory} />
      {content}
    </Stack>
  );
}
