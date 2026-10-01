"use client";

import { Box, Button, Flex, Icon, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";

import { MfaEnrollmentIntroProps } from "./interface";

const FEATURES = [
  { key: "app", icon: "/assets/mfa/authenticator-app.svg" },
  { key: "codes", icon: "/assets/mfa/recovery-codes.svg" },
  { key: "fast", icon: "/assets/mfa/quick-process.svg" },
] as const;

/**
 * Abertura do cadastro de MFA obrigatório do primeiro login (NEU-479): explica
 * por que a verificação é exigida ANTES de liberar qualquer acesso e só então
 * inicia a troca com o backend. Apresentacional — o estado vive no
 * useMfaEnrollment (via Login).
 *
 * Figma: Neutra+ MP · "MFA Notice Card" (2541:63431).
 */
export function MfaEnrollmentIntro({
  onStart,
  onBack,
  isSubmitting = false,
}: MfaEnrollmentIntroProps) {
  const { t } = useTranslation();

  return (
    <Stack w="full" maxW="472px" gap={0}>
      <Button
        type="button"
        variant="plain"
        onClick={onBack}
        alignSelf="flex-start"
        h="24px"
        px={0}
        gap="6px"
      >
        <Icon as={LuChevronLeft} boxSize="16px" color="#8A9AB5" />
        <Text
          fontSize="16px"
          fontWeight={500}
          lineHeight="24px"
          color="#8A9AB5"
        >
          {t("MfaEnrollment.back")}
        </Text>
      </Button>

      <Flex
        align="center"
        justify="center"
        alignSelf="center"
        boxSize="84px"
        mt="28px"
        rounded="full"
        bg="#EEF3FF"
      >
        <Image src="/assets/mfa/shield.svg" alt="" width="46px" height="52px" />
      </Flex>

      <Text
        as="h1"
        pt="20px"
        mx="auto"
        maxW="420px"
        fontSize="28px"
        fontWeight={700}
        lineHeight="36px"
        color="#0F1729"
        textAlign="center"
      >
        {t("MfaEnrollment.intro.title")}
      </Text>

      <Text
        pt="6px"
        mx="auto"
        maxW="430px"
        fontSize="16px"
        lineHeight="23px"
        color="#5A7CAD"
        textAlign="center"
      >
        {t("MfaEnrollment.intro.subtitle")}
      </Text>

      <Flex
        mt="13px"
        gap="14px"
        align="flex-start"
        px="17px"
        py="17px"
        rounded="10px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FD9E0B"
      >
        <Image
          src="/assets/mfa/warning.svg"
          alt=""
          width="30px"
          height="30px"
          flexShrink={0}
        />
        <Text pt="2px" fontSize="14px" lineHeight="20px" color="#4F321C">
          {t("MfaEnrollment.intro.warning")}
        </Text>
      </Flex>

      <Stack as="ul" gap="20px" pt="18px" px="6px" listStyleType="none">
        {FEATURES.map(({ key, icon }) => (
          <Flex as="li" key={key} gap="18px" align="flex-start">
            <Flex
              align="center"
              justify="center"
              boxSize="54px"
              rounded="10px"
              flexShrink={0}
              bg="#EEF3FF"
            >
              <Image src={icon} alt="" width="24px" height="24px" />
            </Flex>
            <Box pt="3px">
              <Text
                fontSize="15px"
                fontWeight={700}
                lineHeight="22px"
                color="#0F1729"
              >
                {t(`MfaEnrollment.intro.features.${key}.title`)}
              </Text>
              <Text fontSize="13px" lineHeight="19px" color="#5A7CAD">
                {t(`MfaEnrollment.intro.features.${key}.description`)}
              </Text>
            </Box>
          </Flex>
        ))}
      </Stack>

      <Box px="6px" pt="18px">
        <Button
          type="button"
          onClick={onStart}
          w="full"
          h="54px"
          bg="#1F5AFF"
          color="white"
          rounded="9px"
          fontSize="16px"
          fontWeight={600}
          lineHeight="24px"
          loading={isSubmitting}
          _hover={{ bg: "brand.600" }}
        >
          {t("MfaEnrollment.intro.start")}
        </Button>
      </Box>
    </Stack>
  );
}
