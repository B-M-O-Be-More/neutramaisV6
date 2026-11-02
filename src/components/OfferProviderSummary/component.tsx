"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuStar, LuZap } from "react-icons/lu";

import { OfferProviderSummaryProps } from "./interface";

const STARS = [1, 2, 3, 4, 5];

/**
 * Provedor nos cards da vitrine (Figma 2084-20183): ícone, nome, estrelas,
 * nota, avaliações e o selo de KYC.
 */
export function OfferProviderSummary({ provider }: OfferProviderSummaryProps) {
  const { t, i18n } = useTranslation();
  const rating = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(provider.rating);

  return (
    <Flex align="center" gap="10px" minW={0}>
      <Flex
        align="center"
        justify="center"
        boxSize="36px"
        flexShrink={0}
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="10px"
      >
        <Icon as={LuZap} boxSize="14px" color="#1F5AFF" aria-hidden />
      </Flex>
      <Stack gap="0" flex="1" minW={0}>
        <Text
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
          truncate
        >
          {provider.name}
        </Text>
        <Flex align="center" justify="space-between" gap="8px">
          <Flex
            align="center"
            gap="6px"
            aria-label={t("Offers.provider.rating", {
              rating,
              count: provider.reviews,
            })}
            role="img"
          >
            <Flex gap="2px" aria-hidden>
              {STARS.map((star) => (
                <Icon
                  key={star}
                  as={LuStar}
                  boxSize="10px"
                  color={
                    star <= Math.round(provider.rating) ? "#F59E0B" : "#D5DBE5"
                  }
                  fill={
                    star <= Math.round(provider.rating) ? "#F59E0B" : "none"
                  }
                />
              ))}
            </Flex>
            <Text
              color="#0F1729"
              fontSize="12px"
              fontWeight={700}
              lineHeight="18px"
              aria-hidden
            >
              {rating}
            </Text>
            <Text color="#A0ABB8" fontSize="12px" lineHeight="18px" aria-hidden>
              ({provider.reviews})
            </Text>
          </Flex>
          {provider.kycVerified && (
            <Box
              flexShrink={0}
              px="7px"
              py="1px"
              bg="#EDFBF5"
              borderWidth="1px"
              borderColor="#AAECD5"
              rounded="8px"
              color="#10B981"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
            >
              {t("Offers.provider.kyc")}
            </Box>
          )}
        </Flex>
      </Stack>
    </Flex>
  );
}
