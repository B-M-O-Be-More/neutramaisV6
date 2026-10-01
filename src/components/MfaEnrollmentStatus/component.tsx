"use client";

import { Box, Button, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import { Trans, useTranslation } from "react-i18next";
import {
  LuArrowLeft,
  LuCircleAlert,
  LuCircleX,
  LuClock,
  LuShieldCheck,
} from "react-icons/lu";

import { SUPPORT_EMAIL } from "@/data/support";
import { MFA_RATE_LIMIT_WINDOW_SECONDS } from "@/hooks/useMfaEnrollment";

import { MfaEnrollmentStatusProps } from "./interface";

const ICONS = {
  error: LuCircleX,
  rateLimit: LuClock,
  timeout: LuClock,
} as const;

/**
 * Telas de fim do cadastro de MFA do primeiro login (NEU-479). Em todas os
 * segredos já foram descartados e o único caminho é refazer o login — que
 * descobre o estado real (inclusive um cadastro que chegou a ser concluído).
 *
 * Figma: Neutra+ MP · erro na ativação (2549:64613), muitas tentativas
 * (2549:64668) e tempo limite (2549:64741).
 */
export function MfaEnrollmentStatus({
  failure,
  retryInSeconds = 0,
  onBackToLogin,
}: MfaEnrollmentStatusProps) {
  const { t } = useTranslation();

  const minutesLeft = Math.ceil(retryInSeconds / 60);
  const windowMinutes = Math.ceil(MFA_RATE_LIMIT_WINDOW_SECONDS / 60);

  const supportLink = (
    <Link href={`mailto:${SUPPORT_EMAIL}`} fontWeight={600} color="#1F5AFF" />
  );

  return (
    <Stack w="full" maxW="420px" gap={0}>
      <Button
        type="button"
        variant="plain"
        onClick={onBackToLogin}
        alignSelf="flex-start"
        h="24px"
        px={0}
        gap="6px"
      >
        <Icon as={LuArrowLeft} boxSize="15px" color="#8A9AB5" />
        <Text
          fontSize="13px"
          fontWeight={500}
          lineHeight="19.5px"
          color="#8A9AB5"
        >
          {t("MfaEnrollment.backToLogin")}
        </Text>
      </Button>

      <Stack gap="20px" pt="24px">
        <Stack gap="16px" py="16px" align="center" textAlign="center">
          <Flex
            align="center"
            justify="center"
            boxSize="64px"
            rounded="full"
            bg="#FEF2F2"
            borderWidth="2px"
            borderColor="#FECACA"
          >
            <Icon as={ICONS[failure]} boxSize="28px" color="#EF4444" />
          </Flex>

          <Box>
            <Text
              as="h1"
              fontSize="22px"
              fontWeight={800}
              lineHeight="33px"
              color="#0F1729"
            >
              {t(`MfaEnrollment.failure.${failure}.title`)}
            </Text>
            <Text
              pt="4px"
              fontSize="14px"
              lineHeight="21px"
              color={failure === "error" ? "#4A5568" : "#8A9AB5"}
            >
              {t(`MfaEnrollment.failure.${failure}.description`)}
            </Text>
          </Box>
        </Stack>

        {failure === "rateLimit" && (
          <>
            <Flex
              gap="12px"
              align="flex-start"
              p="17px"
              rounded="14px"
              bg="#FEF2F2"
              borderWidth="1px"
              borderColor="#FECACA"
            >
              <Icon
                as={LuCircleAlert}
                boxSize="15px"
                mt="2px"
                flexShrink={0}
                color="#EF4444"
              />
              <Box>
                <Text
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                  color="#EF4444"
                >
                  {t("MfaEnrollment.failure.rateLimit.blocked.title")}
                </Text>
                <Text
                  pt="2px"
                  fontSize="12px"
                  lineHeight="18px"
                  color="#991B1B"
                >
                  <Trans
                    i18nKey="MfaEnrollment.failure.rateLimit.blocked.description"
                    count={windowMinutes}
                    components={{ b: <Text as="strong" fontWeight={700} /> }}
                  />
                </Text>
              </Box>
            </Flex>

            <Flex
              align="center"
              justify="space-between"
              gap="12px"
              px="17px"
              py="15px"
              rounded="14px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
            >
              <Flex align="center" gap="8px">
                <Icon as={LuClock} boxSize="14px" color="#D97706" />
                <Text
                  fontSize="13px"
                  fontWeight={600}
                  lineHeight="19.5px"
                  color="#5A6478"
                >
                  {t("MfaEnrollment.failure.rateLimit.release.label")}
                </Text>
              </Flex>
              <Text
                fontSize="13px"
                fontWeight={700}
                lineHeight="19.5px"
                color="#D97706"
                aria-live="off"
              >
                {minutesLeft > 0
                  ? t("MfaEnrollment.failure.rateLimit.release.inMinutes", {
                      count: minutesLeft,
                    })
                  : t("MfaEnrollment.failure.rateLimit.release.now")}
              </Text>
            </Flex>

            <Flex
              gap="12px"
              align="flex-start"
              px="17px"
              py="13px"
              rounded="14px"
              bg="#EEF3FF"
              borderWidth="1px"
              borderColor="#C7D8FF"
            >
              <Icon
                as={LuShieldCheck}
                boxSize="14px"
                mt="2px"
                flexShrink={0}
                color="#1F5AFF"
              />
              <Text fontSize="12px" lineHeight="18px" color="#1E3A8A">
                <Trans
                  i18nKey="MfaEnrollment.failure.rateLimit.suspicious"
                  values={{ email: SUPPORT_EMAIL }}
                  components={{ b: <Text as="strong" fontWeight={700} /> }}
                />
              </Text>
            </Flex>
          </>
        )}

        <Button
          type="button"
          onClick={onBackToLogin}
          w="full"
          h="50px"
          px="12px"
          bg="#1646CC"
          color="white"
          rounded="14px"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
          shadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          _hover={{ bg: "brand.700" }}
        >
          {t("MfaEnrollment.backToLogin")}
        </Button>

        {failure === "error" && (
          <Text
            fontSize="12px"
            lineHeight="18px"
            color="#A0ABB8"
            textAlign="center"
          >
            <Trans
              i18nKey="MfaEnrollment.failure.error.support"
              values={{ email: SUPPORT_EMAIL }}
              components={{ mail: supportLink }}
            />
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
