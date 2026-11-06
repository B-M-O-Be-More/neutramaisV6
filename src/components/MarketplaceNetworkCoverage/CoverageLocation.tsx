"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { LuMapPin } from "react-icons/lu";
import { useTranslation } from "react-i18next";

import { s } from "./scale";

export function CoverageLocation() {
  const { t } = useTranslation();

  return (
    <Flex
      position="absolute"
      right={{ md: s(24), lg: s(48) }}
      bottom={{ md: s(20), lg: s(40) }}
      align="center"
      gap={s(9)}
      px={s(12)}
      py={s(9)}
      bg="white"
      border="1px solid #E5E8EE"
      rounded={s(12)}
      boxShadow="0 7px 5px rgba(0, 0, 0, 0.1), 0 3px 2px rgba(0, 0, 0, 0.1)"
    >
      <Flex
        align="center"
        justify="center"
        boxSize={s(26)}
        flexShrink={0}
        rounded={s(10)}
        bg="#EEF3FF"
        color="#1F5AFF"
      >
        <Icon as={LuMapPin} boxSize={s(12)} />
      </Flex>
      <Stack gap={0}>
        <Text
          fontSize={s(9.5)}
          fontWeight={700}
          lineHeight={s(14)}
          color="#0F1729"
        >
          {t("Marketplace.networkCoverage.location.title")}
        </Text>
        <Text fontSize={s(8)} lineHeight={s(12)} color="#8A9AB5">
          {t("Marketplace.networkCoverage.location.caption")}
        </Text>
      </Stack>
    </Flex>
  );
}
