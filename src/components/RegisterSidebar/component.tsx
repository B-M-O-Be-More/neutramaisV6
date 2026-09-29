"use client";

import { Box, Flex, Icon, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";

import { REGISTER_STEPS } from "@/contexts/RegisterFlowContext/interface";
import { useRegisterFlow } from "@/contexts/RegisterFlowContext";

type StepState = "done" | "active" | "upcoming";

/**
 * Barra lateral da tela de cadastro (Figma node 1920-12449). Substitui o
 * AuthBrandPanel de marketing nesta página: exibe a logo, o título e um stepper
 * vertical com as 6 etapas do fluxo, destacando a etapa atual (lida do
 * RegisterFlowContext). Visível apenas em telas grandes (lg+); nas menores é
 * ocultada e o AuthLayout exibe o wordmark compacto + o stepper do formulário.
 */
export function RegisterSidebar() {
  const { t } = useTranslation();
  const { step: current } = useRegisterFlow();

  const stateOf = (index: number, built: boolean): StepState => {
    if (index === current) return "active";
    // Etapas não construídas (ex.: Verificação) nunca contam como concluídas,
    // mesmo quando a etapa atual está adiante delas.
    if (built && index < current) return "done";
    return "upcoming";
  };

  return (
    <Flex
      display={{ base: "none", lg: "flex" }}
      w={{ lg: "480px", xl: "560px" }}
      flexShrink={0}
      direction="column"
      position="relative"
      overflow="hidden"
      bgImage="linear-gradient(to bottom right, #0F1729, #1A2540, #0D1220)"
    >
      {/* Decorações de fundo */}
      <Box
        position="absolute"
        top="0"
        right="0"
        boxSize="320px"
        rounded="full"
        bg="rgba(31, 90, 255, 0.10)"
        transform="translate(80px, -80px)"
      />
      <Box
        position="absolute"
        bottom="0"
        left="0"
        boxSize="256px"
        rounded="full"
        bg="rgba(139, 92, 246, 0.10)"
        transform="translate(-64px, 64px)"
      />

      <Flex direction="column" position="relative" h="full" px="48px" py="48px">
        {/* Logo */}
        <Flex align="center" mb="64px">
          <Image
            src="/assets/logo.png"
            alt={t("Register.logoAlt")}
            h="45px"
            w="243px"
            objectFit="contain"
          />
        </Flex>

        {/* Título + stepper */}
        <Stack flex="1" justify="center" gap={0}>
          <Text
            color="white"
            fontSize="26px"
            fontWeight={800}
            lineHeight="1.25"
          >
            {t("Register.sidebar.headline")}
            <br />
            <Text as="span" color="brand.500">
              {t("Register.sidebar.headlineHighlight")}
            </Text>
          </Text>

          <Text
            color="#5A6478"
            fontSize="14px"
            lineHeight="1.6"
            mt={3}
            mb="32px"
          >
            {t("Register.sidebar.subtitle")}
          </Text>

          <Stack gap={4}>
            {REGISTER_STEPS.map((stepDef, index) => {
              const state = stateOf(index, stepDef.built);
              const isActive = state === "active";
              const isDone = state === "done";

              return (
                <Flex
                  key={stepDef.id}
                  align="flex-start"
                  gap={3}
                  opacity={state === "upcoming" ? 0.4 : 1}
                >
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="28px"
                    rounded="10px"
                    flexShrink={0}
                    bg={
                      isActive
                        ? "brand.500"
                        : isDone
                          ? "#10B981"
                          : "rgba(255, 255, 255, 0.1)"
                    }
                  >
                    {isDone ? (
                      <Icon as={LuCheck} boxSize="14px" color="white" />
                    ) : (
                      <Text fontSize="10px" fontWeight={700} color="white">
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    )}
                  </Flex>

                  <Box>
                    <Text
                      fontSize="13px"
                      fontWeight={isActive ? 700 : 400}
                      color={
                        isActive ? "white" : isDone ? "#10B981" : "#98A6B3"
                      }
                    >
                      {t(`Register.sidebar.steps.${stepDef.id}.title`)}
                    </Text>
                    <Text fontSize="11px" color="#5A6478">
                      {t(`Register.sidebar.steps.${stepDef.id}.description`)}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </Stack>
        </Stack>

        {/* Rodapé */}
        <Box
          mt="32px"
          pt="25px"
          borderTopWidth="1px"
          borderColor="rgba(255, 255, 255, 0.10)"
        >
          <Text fontSize="12px" color="white">
            {t("Register.footer.haveAccount")}{" "}
            <Link href="/login" style={{ color: "#1F5AFF", fontWeight: 600 }}>
              {t("Register.footer.login")}
            </Link>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
