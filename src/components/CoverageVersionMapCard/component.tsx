"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuLayers, LuMap } from "react-icons/lu";

import CoverageMap from "@/components/CoverageMap";

import { CoverageVersionMapCardProps } from "./interface";

/**
 * "Mapa de visualização KMZ" (Figma 2074-64908): a área da versão ativa e os
 * placemarks com área ("Regiões cobertas"). Sem geometria, mostra o quadro
 * vazio do Figma 2074-65199.
 */
export function CoverageVersionMapCard({
  geometry,
  isLoading = false,
  error = null,
  regions,
}: CoverageVersionMapCardProps) {
  const { t } = useTranslation();
  const showMap = !!geometry || isLoading;

  return (
    <Stack
      gap="16px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="center" gap="8px">
        <Icon as={LuLayers} boxSize="15px" color="#1F5AFF" />
        <Text
          as="h2"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {t("SellerCoverage.detail.map.title")}
        </Text>
      </Flex>

      {showMap ? (
        <Box
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="14px"
          overflow="hidden"
        >
          <CoverageMap
            geometry={geometry}
            height="171px"
            label={t("SellerCoverage.detail.map.label")}
            isLoading={!geometry && isLoading}
          />
        </Box>
      ) : (
        <Stack
          gap="4px"
          p="13px"
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="14px"
        >
          <Text
            color="#A0ABB8"
            fontSize="10px"
            fontWeight={700}
            lineHeight="15px"
            textAlign="center"
            textTransform="uppercase"
          >
            {t("SellerCoverage.detail.map.placeholderTitle")}
          </Text>
          <Stack
            align="center"
            justify="center"
            gap="8px"
            h="128px"
            px="16px"
            bg="#F0F5FF"
            rounded="10px"
            textAlign="center"
          >
            <Icon as={LuMap} boxSize="28px" color="#C7D8FF" />
            <Text
              role={error ? "status" : undefined}
              color="#A0ABB8"
              fontSize="11px"
              lineHeight="16.5px"
            >
              {t(error ?? "SellerCoverage.detail.map.placeholder")}
            </Text>
          </Stack>
        </Stack>
      )}

      {regions.length > 0 && (
        <Stack gap="8px">
          <Text
            as="h3"
            color="#8A9AB5"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
            textTransform="uppercase"
          >
            {t("SellerCoverage.detail.map.regions", { count: regions.length })}
          </Text>
          <Flex as="ul" gap="4px" wrap="wrap" listStyleType="none">
            {regions.map((region) => (
              <Text
                as="li"
                key={region}
                px="8px"
                py="2px"
                bg="#F4F6F9"
                rounded="8px"
                color="#5A6478"
                fontSize="11px"
                lineHeight="16.5px"
              >
                {region}
              </Text>
            ))}
          </Flex>
        </Stack>
      )}
    </Stack>
  );
}
