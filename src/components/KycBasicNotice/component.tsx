"use client";

import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { LuInfo } from "react-icons/lu";
import { Trans, useTranslation } from "react-i18next";

import { KycBasicNoticeProps } from "./interface";

export function KycBasicNotice(props: KycBasicNoticeProps) {
  const { t } = useTranslation();

  return (
    <Box
      w="full"
      p={5}
      borderRadius="12px"
      borderWidth="1px"
      borderColor="rgba(31, 90, 255, 0.35)"
      bg="rgba(31, 90, 255, 0.06)"
      textAlign="left"
      {...props}
    >
      <Flex gap={3} align="flex-start">
        <Icon as={LuInfo} boxSize={5} mt="2px" flexShrink={0} color="#8EC5FF" />

        <Box>
          <Text fontWeight={600} fontSize={"14px"} color="#8EC5FF" mb={1}>
            {t("Register.kyc.title")}
          </Text>

          <Text fontWeight={400} fontSize="12px" color="fg.muted">
            <Trans
              i18nKey="Register.kyc.description"
              components={{
                b: <Text as="span" fontWeight={700} color="#FFF" />,
              }}
            />
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
