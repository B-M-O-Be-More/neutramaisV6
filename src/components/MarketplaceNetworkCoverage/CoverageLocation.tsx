"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { LuMapPin } from "react-icons/lu";
import { useTranslation } from "react-i18next";

export function CoverageLocation() {
  const { t } = useTranslation();

  return (
    <Flex
      position="absolute"
      right={{ base: "0", md: "25%" }}
      bottom={{ base: "0", md: "20%" }}
      align="center"
      gap="8px"
      p="8px 10px"
      bg="rgba(255, 255, 255, 0.94)"
      border="1px solid #E6EBF2"
      rounded="12px"
      boxShadow="0 6px 20px rgba(15, 23, 41, 0.12)"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="22px"
        flexShrink={0}
        rounded="full"
        bg="#EEF3FF"
        color="#1F5AFF"
      >
        <Icon as={LuMapPin} boxSize="12px" />
      </Flex>
      <Stack gap={0}>
        <Text fontSize="9px" fontWeight={700} lineHeight="13px" color="#0F1729">
          {t("Marketplace.networkCoverage.location.title")}
        </Text>
        <Text fontSize="8px" lineHeight="12px" color="#8A9AB5">
          {t("Marketplace.networkCoverage.location.caption")}
        </Text>
      </Stack>
    </Flex>
  );
}
