"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { Trans, useTranslation } from "react-i18next";
import { LuEye } from "react-icons/lu";

/**
 * "Privacidade da cobertura" (Figma 2074-63337): o KMZ é privado e o buyer só
 * vê os agregados públicos.
 */
export function CoveragePrivacyNotice() {
  const { t } = useTranslation();

  return (
    <Flex
      align="flex-start"
      gap="12px"
      px="21px"
      py="17px"
      bg="#F3EEFF"
      borderWidth="1px"
      borderColor="#D3BFFD"
      rounded="14px"
    >
      <Icon as={LuEye} boxSize="15px" color="#8B5CF6" mt="2px" />
      <Stack gap="2px">
        <Text
          color="#8B5CF6"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("SellerCoverage.privacy.title")}
        </Text>
        <Text color="#5B21B6" fontSize="12px" lineHeight="18px">
          <Trans
            i18nKey="SellerCoverage.privacy.text"
            components={{ strong: <strong /> }}
          />
        </Text>
      </Stack>
    </Flex>
  );
}
