"use client";

import { Box, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import OfferCover from "@/components/OfferCover";
import OfferProviderSummary from "@/components/OfferProviderSummary";

import { OfferTopProvidersCardProps } from "./interface";

/** "Top 3 provedores" com destaque regional (Figma 2084-20166). */
export function OfferTopProvidersCard({
  providers,
}: OfferTopProvidersCardProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="article"
      gap="0"
      h="full"
      overflow="hidden"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <OfferCover
        kind="connectivity"
        badge={t("Offers.badges.regionalHighlight")}
        caption={t("Offers.topProviders")}
      />
      <Stack
        as="ol"
        gap="0"
        listStyleType="none"
        aria-label={t("Offers.topProviders")}
      >
        {providers.map((provider) => (
          <Box
            as="li"
            key={provider.name}
            px="16px"
            pt="16px"
            pb="13px"
            borderBottomWidth="1px"
            borderColor="#F4F6F9"
          >
            <OfferProviderSummary provider={provider} />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
