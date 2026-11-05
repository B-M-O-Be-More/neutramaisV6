"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export function CoverageStatus() {
  const { t } = useTranslation();

  return (
    <Flex
      position="absolute"
      top={{ base: "12px", md: "20%" }}
      right={{ base: "0", md: "25%" }}
      align="center"
      gap="10px"
      px="9px"
      py="5px"
      bg="rgba(255, 255, 255, 0.8)"
      border="1px solid rgba(226, 232, 240, 0.8)"
      rounded="full"
      boxShadow="0 3px 12px rgba(15, 23, 41, 0.04)"
    >
      <Flex align="center" gap="4px">
        <Box boxSize="5px" rounded="full" bg="#1F5AFF" />
        <Text fontSize="8px" lineHeight="12px" color="#334155">
          {t("Marketplace.networkCoverage.legend.hub")}
        </Text>
      </Flex>
      <Flex align="center" gap="4px">
        <Box boxSize="5px" rounded="full" bg="#10B981" />
        <Text fontSize="8px" lineHeight="12px" color="#334155">
          {t("Marketplace.networkCoverage.legend.active")}
        </Text>
      </Flex>
    </Flex>
  );
}
