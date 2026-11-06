"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { s } from "./scale";

export function CoverageStatus() {
  const { t } = useTranslation();

  return (
    <Flex
      position="absolute"
      top={{ md: s(20), lg: s(28) }}
      right={{ md: s(24), lg: s(48) }}
      align="center"
      gap={s(9)}
      px={s(9)}
      py={s(6)}
      bg="rgba(255, 255, 255, 0.9)"
      border="1px solid #E5E8EE"
      rounded={s(10)}
    >
      <Flex align="center" gap={s(4)}>
        <Box boxSize={s(7)} rounded="full" bg="#1F5AFF" />
        <Text fontSize={s(8)} lineHeight={s(12)} color="#0A0A0A">
          {t("Marketplace.networkCoverage.legend.hub")}
        </Text>
      </Flex>
      <Flex align="center" gap={s(4)}>
        <Box boxSize={s(7)} rounded="full" bg="#10B981" />
        <Text fontSize={s(8)} lineHeight={s(12)} color="#0A0A0A">
          {t("Marketplace.networkCoverage.legend.active")}
        </Text>
      </Flex>
    </Flex>
  );
}
