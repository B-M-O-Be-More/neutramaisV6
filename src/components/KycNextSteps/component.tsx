"use client";

import { Flex, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCircleCheckBig } from "react-icons/lu";

import { KycNextStepsProps } from "./interface";

// Tempo de leitura antes de sair da tela. Curto o bastante para não parecer
// travado, longo o bastante para o usuário registrar que a conta foi criada.
const REDIRECT_DELAY_MS = 3000;

/**
 * Etapa final do cadastro (Figma 1920-17545): confirma a criação da conta e
 * encaminha o usuário para o login.
 *
 * O envio de documentos (seleção de nível de KYC + upload) ficou para outro
 * momento — a versão anterior desta tela, com o catálogo de documentos e o envio
 * em lote para `/kyc/submit`, está no histórico do git.
 */
export function KycNextSteps({ onFinish }: KycNextStepsProps) {
  const { t } = useTranslation();

  // A callback vem inline do formulário, com identidade nova a cada render.
  // Numa dependência do efeito, o timer reiniciaria a cada render e o redirect
  // nunca aconteceria.
  const onFinishRef = React.useRef(onFinish);
  React.useEffect(() => {
    onFinishRef.current = onFinish;
  });

  React.useEffect(() => {
    const timer = setTimeout(() => onFinishRef.current(), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack gap="20px" w="full" align="center">
      <Flex
        align="center"
        justify="center"
        boxSize="56px"
        rounded="16px"
        bg="#EDFBF5"
      >
        <Icon as={LuCircleCheckBig} boxSize="26px" color="#10B981" />
      </Flex>

      <Stack gap={0} align="center">
        <Text
          fontSize="20px"
          fontWeight={800}
          lineHeight="30px"
          color="fg.default"
          textAlign="center"
        >
          {t("Register.flow.kyc.created.title")}
        </Text>

        <Text
          pt="4px"
          fontSize="14px"
          lineHeight="21px"
          color="fg.muted"
          textAlign="center"
        >
          {t("Register.flow.kyc.created.subtitle")}
        </Text>
      </Stack>

      <Flex align="center" gap="10px" pt="8px">
        <Spinner size="sm" color="brand.500" borderWidth="2px" />
        <Text fontSize="13px" color="fg.muted">
          {t("Register.flow.kyc.redirecting")}
        </Text>
      </Flex>
    </Stack>
  );
}
