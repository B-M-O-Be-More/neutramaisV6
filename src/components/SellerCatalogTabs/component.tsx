"use client";

import { Button, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { SellerCatalogTab, SellerCatalogTabsProps } from "./interface";

const TABS: SellerCatalogTab[] = ["catalog", "coverage"];

/** Alternância entre "Catálogo" e "Cobertura" no topo do catálogo do seller. */
export function SellerCatalogTabs({
  value,
  available,
  onChange,
}: SellerCatalogTabsProps) {
  const { t } = useTranslation();

  return (
    <Flex
      role="tablist"
      aria-label={t("SellerOffers.tabs.label")}
      gap="4px"
      p="6.25px"
      bg="white"
      borderWidth="0.25px"
      borderColor="rgba(48,54,61,0.35)"
      rounded="14px"
      overflowX="auto"
    >
      {TABS.map((tab) => {
        const isActive = tab === value;
        const isAvailable = available.includes(tab);
        return (
          <Button
            key={tab}
            role="tab"
            aria-selected={isActive}
            disabled={!isAvailable}
            variant="plain"
            h="40px"
            px="12px"
            py="8px"
            rounded="10px"
            bg={isActive ? "#1F5AFF" : "transparent"}
            color={isActive ? "white" : "#8A9AB5"}
            fontSize="14px"
            fontWeight={isActive ? 600 : 400}
            lineHeight="21px"
            flexShrink={0}
            _hover={{ bg: isActive ? "#1F5AFF" : "#F4F6F9" }}
            _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
            onClick={() => onChange(tab)}
          >
            {t(`SellerOffers.tabs.${tab}`)}
          </Button>
        );
      })}
    </Flex>
  );
}
