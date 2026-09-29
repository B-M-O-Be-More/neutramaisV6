"use client";

import { Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import SearchNetworkPromoCard from "@/components/SearchNetworkPromoCard";

import { SearchNetworkPromotionsProps } from "./interface";

/**
 * Faixa de campanhas da busca de redes. Os cards dividem a largura e, quando
 * não cabem (mínimo de 260px cada), a faixa rola na horizontal.
 */
export function SearchNetworkPromotions({
  promotions,
}: SearchNetworkPromotionsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      as="section"
      aria-label={t("SearchNetwork.promotions.label")}
      gap="12px"
      pb="4px"
      overflowX="auto"
    >
      {promotions.map(({ id, ...promotion }) => (
        <SearchNetworkPromoCard key={id} {...promotion} />
      ))}
    </Flex>
  );
}
