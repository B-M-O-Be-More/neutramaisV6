"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowLeft,
  LuCircleAlert,
  LuCircleX,
  LuInbox,
  LuRefreshCw,
} from "react-icons/lu";

import FormForgotPassword from "@/components/Forms/FormForgotPassword";
import { useRequestPasswordReset } from "@/hooks/useRequestPasswordReset";

import { ERROR_CAUSES, SUCCESS_DETAILS } from "./interface";

/**
 * Tela de recuperação de senha (US-03, Figma 2095-23125 / 2095-25446 /
 * 2095-25559 / 2096-25926). Encadeia os quatro estados do fluxo — formulário,
 * verificação, e-mail enviado e falha — sob o mesmo link "Voltar ao login".
 */
export function ForgotPassword() {
  const { t } = useTranslation();
  const { status, email, request, reset } = useRequestPasswordReset();

  return (
    <Stack w="full" maxW="420px" gap={0}>
      {/* Voltar ao login — comum a todos os estados */}
      <Link href="/login">
        <Flex align="center" gap="6px" h="24px">
          <Icon as={LuArrowLeft} boxSize="16px" color="#8A9AB5" />
          <Text
            fontSize="16px"
            fontWeight={500}
            lineHeight="24px"
            color="#8A9AB5"
          >
            {t("ForgotPassword.backToLogin")}
          </Text>
        </Flex>
      </Link>

      {status === "form" && (
        <Box pt="24px">
          <FormForgotPassword defaultEmail={email} onSubmit={request} />
        </Box>
      )}

      {/* Verificando conta... */}
      {status === "loading" && (
        <Stack align="center" gap="20px" pt="64px" pb="40px">
          <Flex
            align="center"
            justify="center"
            boxSize="64px"
            rounded="full"
            flexShrink={0}
            bg="#EEF3FF"
            borderWidth="2px"
            borderColor="#C7D8FF"
          >
            <Icon
              as={LuRefreshCw}
              boxSize="26px"
              color="#1F5AFF"
              animation="spin"
            />
          </Flex>

          <Stack gap="4px" align="center">
            <Text
              fontSize="18px"
              fontWeight={800}
              lineHeight="27px"
              color="#0F1729"
              textAlign="center"
            >
              {t("ForgotPassword.loading.title")}
            </Text>
            <Text
              fontSize="13px"
              lineHeight="19.5px"
              color="#8A9AB5"
              textAlign="center"
            >
              {t("ForgotPassword.loading.subtitle")}
            </Text>
          </Stack>
        </Stack>
      )}

      {/* E-mail enviado! */}
      {status === "success" && (
        <Stack gap="20px" pt="24px">
          <Stack align="center" gap="16px" py="16px">
            <Flex
              align="center"
              justify="center"
              boxSize="64px"
              rounded="full"
              flexShrink={0}
              bg="#EDFBF5"
              borderWidth="2px"
              borderColor="#10B981"
            >
              <Icon as={LuInbox} boxSize="28px" color="#10B981" />
            </Flex>

            <Stack gap="4px" align="center">
              <Text
                fontSize="22px"
                fontWeight={800}
                lineHeight="33px"
                color="#0F1729"
                textAlign="center"
              >
                {t("ForgotPassword.success.title")}
              </Text>
              <Text
                fontSize="14px"
                lineHeight="21px"
                color="#8A9AB5"
                textAlign="center"
              >
                {t("ForgotPassword.success.subtitle")}
                <br />
                <Text as="span" fontWeight={700} color="#0F1729">
                  {email}
                </Text>
              </Text>
            </Stack>
          </Stack>

          {/* Detalhes do envio */}
          <Stack
            gap={0}
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
            overflow="hidden"
          >
            {SUCCESS_DETAILS.map((detail, index) => (
              <Flex
                key={detail}
                align="flex-start"
                justify="space-between"
                gap={4}
                px="16px"
                py="12px"
                borderBottomWidth={
                  index < SUCCESS_DETAILS.length - 1 ? "1px" : "0"
                }
                borderColor="#F4F6F9"
              >
                <Text fontSize="12px" lineHeight="18px" color="#8A9AB5">
                  {t(`ForgotPassword.success.details.${detail}.label`)}
                </Text>
                <Text
                  fontSize="12px"
                  fontWeight={600}
                  lineHeight="18px"
                  color="#0F1729"
                  textAlign="right"
                >
                  {t(`ForgotPassword.success.details.${detail}.value`)}
                </Text>
              </Flex>
            ))}
          </Stack>

          {/* Aviso de segurança */}
          <Flex
            align="flex-start"
            gap="12px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            rounded="14px"
            px="17px"
            py="15px"
          >
            <Icon
              as={LuCircleAlert}
              boxSize="14px"
              color="#D97706"
              flexShrink={0}
              mt="2px"
            />
            <Text fontSize="12px" lineHeight="18px" color="#92400E">
              {t("ForgotPassword.success.warning.text")}
              <Text as="span" fontWeight={700}>
                {t("ForgotPassword.success.warning.highlight")}
              </Text>
              {t("ForgotPassword.success.warning.suffix")}
            </Text>
          </Flex>

          <Button
            asChild
            w="full"
            bgImage="none"
            bg="#1F5AFF"
            color="white"
            rounded="14px"
            py="12px"
            h="auto"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
            _hover={{ bg: "brand.600" }}
          >
            <Link href="/login">{t("ForgotPassword.backToLogin")}</Link>
          </Button>
        </Stack>
      )}

      {/* E-mail não encontrado */}
      {status === "error" && (
        <Stack gap="20px" pt="24px">
          <Stack align="center" gap="16px" py="16px">
            <Flex
              align="center"
              justify="center"
              boxSize="64px"
              rounded="full"
              flexShrink={0}
              bg="#FEF2F2"
              borderWidth="2px"
              borderColor="#FECACA"
            >
              <Icon as={LuCircleX} boxSize="28px" color="#EF4444" />
            </Flex>

            <Stack gap="4px" align="center">
              <Text
                fontSize="22px"
                fontWeight={800}
                lineHeight="33px"
                color="#0F1729"
                textAlign="center"
              >
                {t("ForgotPassword.error.title")}
              </Text>
              <Text
                fontSize="14px"
                lineHeight="21px"
                color="#8A9AB5"
                textAlign="center"
              >
                {t("ForgotPassword.error.subtitle")}
                <br />
                <Text as="span" fontWeight={700} color="#0F1729">
                  {email}
                </Text>
              </Text>
            </Stack>
          </Stack>

          {/* Possíveis causas */}
          <Stack
            gap="10px"
            bg="#FEF2F2"
            borderWidth="1px"
            borderColor="#FECACA"
            rounded="14px"
            p="17px"
          >
            <Text
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
              color="#EF4444"
            >
              {t("ForgotPassword.error.causesTitle")}
            </Text>

            <Stack gap="8px">
              {ERROR_CAUSES.map((cause) => (
                <Flex key={cause} align="flex-start" gap="8px">
                  <Box
                    boxSize="6px"
                    rounded="full"
                    bg="#EF4444"
                    flexShrink={0}
                    mt="6px"
                  />
                  <Text fontSize="12px" lineHeight="18px" color="#991B1B">
                    {t(`ForgotPassword.error.causes.${cause}`)}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Stack>

          <Button
            onClick={reset}
            w="full"
            bgImage="none"
            bg="#1F5AFF"
            color="white"
            rounded="14px"
            py="14px"
            h="auto"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
            _hover={{ bg: "brand.600" }}
          >
            {t("ForgotPassword.error.retry")}
          </Button>

          <Text
            fontSize="12px"
            lineHeight="18px"
            color="#A0ABB8"
            textAlign="center"
          >
            {t("ForgotPassword.error.stillStuck")}{" "}
            <Link href={`mailto:${t("ForgotPassword.error.supportEmail")}`}>
              <Text as="span" fontWeight={600} color="#1F5AFF">
                {t("ForgotPassword.error.supportEmail")}
              </Text>
            </Link>
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
