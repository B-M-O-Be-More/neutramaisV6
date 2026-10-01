"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Image,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { LuCheck, LuChevronLeft } from "react-icons/lu";

import { manualKeyGroups } from "@/functions/manualKeyGroups";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

import { MfaEnrollmentQrCodeProps } from "./interface";

/**
 * Primeira tela da configuração do autenticador (NEU-479): QR gerado
 * LOCALMENTE a partir do `otpauth_uri` (nunca por serviço de terceiros) e a
 * chave manual como alternativa acessível. Apresentacional — o estado vive no
 * useMfaEnrollment (via Login).
 *
 * Figma: Neutra+ MP · "Autenticação - Login MFA - 3" (2541:63672).
 */
export function MfaEnrollmentQrCode({
  otpauthUri,
  manualKey,
  onNext,
  onBack,
}: MfaEnrollmentQrCodeProps) {
  const { t } = useTranslation();
  const { status, copy } = useCopyToClipboard();

  return (
    <Stack w="full" maxW="570px" gap={0}>
      {/* Em telas largas o aviso fica no canto do painel, como no layout;
          nas menores, entra no fluxo antes do conteúdo. */}
      <Flex
        position={{ base: "static", xl: "absolute" }}
        top="72px"
        right="54px"
        w={{ base: "full", xl: "360px" }}
        mb={{ base: 6, xl: 0 }}
        gap="16px"
        align="flex-start"
        p="18px"
        rounded="10px"
        bg="#EEF3FF"
      >
        <Flex
          align="center"
          justify="center"
          boxSize="28px"
          flexShrink={0}
          rounded="full"
          bg="#1F5AFF"
          aria-hidden
        >
          <Text
            fontSize="17px"
            fontWeight={700}
            lineHeight="28px"
            color="white"
          >
            i
          </Text>
        </Flex>
        <Box pt="2px" fontSize="14px" lineHeight="20px" color="#4A5568">
          <Text>{t("MfaEnrollment.qrCode.info.scan")}</Text>
          <Text pt="20px">{t("MfaEnrollment.qrCode.info.apps")}</Text>
        </Box>
      </Flex>

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

      <Stack gap="19px" align="center" pt="32px">
        <Box textAlign="center">
          <Text
            as="h1"
            fontSize="28px"
            fontWeight={700}
            lineHeight="38px"
            color="#0F1729"
          >
            {t("MfaEnrollment.qrCode.title")}
          </Text>
          <Text
            pt="8px"
            mx="auto"
            maxW="420px"
            fontSize="16px"
            lineHeight="24px"
            color="#5A7CAD"
          >
            {t("MfaEnrollment.qrCode.subtitle")}
          </Text>
        </Box>

        {/* Fundo branco fixo: leitores de QR falham com baixo contraste */}
        <Box
          p="25px"
          bg="white"
          rounded="10px"
          borderWidth="1px"
          borderColor="#E2E6EE"
        >
          <QRCode
            value={otpauthUri}
            size={190}
            level="M"
            role="img"
            aria-label={t("MfaEnrollment.qrCode.qrLabel")}
          />
        </Box>

        <Stack w="full" maxW="537px" gap="19px">
          <Flex align="center" gap="10px">
            <Text
              as="h2"
              flexShrink={0}
              fontSize="15px"
              fontWeight={600}
              lineHeight="22px"
              color="#0F1729"
            >
              {t("MfaEnrollment.qrCode.manualKey.title")}
            </Text>
            <Box flex="1" maxW="300px" h="1px" bg="#CBD5E6" />
          </Flex>

          <Box>
            <Flex
              align="center"
              gap={3}
              minH="54px"
              pl="17px"
              pr="8px"
              bg="white"
              rounded="8px"
              borderWidth="1px"
              borderColor="#CBD5E6"
            >
              <Text
                flex="1"
                py="13px"
                fontFamily="mono"
                fontSize="15px"
                fontWeight={500}
                lineHeight="24px"
                color="#0F1729"
                wordBreak="break-word"
                data-testid="mfa-manual-key"
              >
                {manualKeyGroups(manualKey)}
              </Text>
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t("MfaEnrollment.qrCode.manualKey.copy")}
                onClick={() => copy(manualKey)}
              >
                {status === "copied" ? (
                  <Icon as={LuCheck} boxSize="22px" color="#16A34A" />
                ) : (
                  <Image
                    src="/assets/mfa/copy.svg"
                    alt=""
                    width="22px"
                    height="22px"
                  />
                )}
              </IconButton>
            </Flex>

            <Text pt="4px" fontSize="13px" lineHeight="20px" color="#5A7CAD">
              {t("MfaEnrollment.qrCode.manualKey.hint")}
            </Text>

            <VisuallyHidden aria-live="polite">
              {status === "copied" &&
                t("MfaEnrollment.qrCode.manualKey.copied")}
              {status === "failed" && t("MfaEnrollment.copyFailed")}
            </VisuallyHidden>
            {status === "failed" && (
              <Text pt={1} fontSize="12px" color="error.500">
                {t("MfaEnrollment.copyFailed")}
              </Text>
            )}
          </Box>
        </Stack>
      </Stack>

      <Button
        type="button"
        onClick={onNext}
        alignSelf="center"
        mt="11px"
        w="full"
        maxW="300px"
        h="50px"
        bg="#1F5AFF"
        color="white"
        rounded="9px"
        fontSize="16px"
        fontWeight={600}
        lineHeight="24px"
        _hover={{ bg: "brand.600" }}
      >
        {t("MfaEnrollment.qrCode.next")}
        <span aria-hidden>→</span>
      </Button>
    </Stack>
  );
}
