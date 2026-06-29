"use client";

import FormRegisterPayer from "@/components/Forms/FormRegisterPayer";
import FormRegisterSeller from "@/components/Forms/FormRegisterSeller";

import { Button, Flex, Icon, Image, List, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuArrowLeft,
  LuArrowRight,
  LuBuilding2,
  LuCircleCheck,
} from "react-icons/lu";
import type { IconType } from "react-icons";

import { FormRegisterProps, RegisterType } from "./interface";

// Cada opção de conta exibida no card de seleção. As features são chaves de
// tradução resolvidas em Register.accountType.<type>.features.<key>.
const ACCOUNT_OPTIONS: {
  type: RegisterType;
  icon: IconType;
  iconColor: string;
  iconBg: string;
  features: string[];
}[] = [
  {
    type: "buyer",
    icon: LuBuilding2,
    iconColor: "#2B7FFF",
    iconBg: "rgba(43, 127, 255, 0.1)",
    features: ["catalog", "orders", "support"],
  },
  {
    type: "seller",
    icon: LuBuilding2,
    iconColor: "#AD46FF",
    iconBg: "rgba(173, 70, 255, 0.1)",
    features: ["publish", "autoOrders", "payouts"],
  },
];

export function FormRegister({ typeRegister }: FormRegisterProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<RegisterType | undefined>(
    typeRegister,
  );

  // Etapa de seleção do tipo de conta.
  if (!selected) {
    return (
      <Stack gap={6} w="full" maxW="448px" align="center">
        {/* Card principal */}
        <Stack
          w="full"
          gap={0}
          bg="#151B2D"
          borderWidth="1px"
          borderColor="#1F2937"
          rounded="16px"
          overflow="hidden"
          shadow="0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
        >
          {/* Cabeçalho com a logo */}
          <Flex
            align="center"
            justify="center"
            h="63px"
            px="16px"
            borderBottomWidth="1px"
            borderColor="#30363D"
          >
            <Image
              src="/assets/logo.png"
              alt={t("Register.logoAlt")}
              h="31px"
              w="auto"
              objectFit="contain"
            />
          </Flex>

          {/* Conteúdo */}
          <Stack gap={{ base: 6, md: 8 }} p={{ base: "20px", md: "32px" }}>
            <Stack gap={1} textAlign="center">
              <Text
                fontSize="24px"
                lineHeight="32px"
                fontWeight={700}
                color="#F9FAFB"
              >
                {t("Register.accountType.title")}
              </Text>
              <Text
                fontSize="14px"
                lineHeight="20px"
                fontWeight={400}
                color="#9CA3AF"
              >
                {t("Register.accountType.subtitle")}
              </Text>
            </Stack>

            <Stack gap={3}>
              {ACCOUNT_OPTIONS.map((option) => (
                <Flex
                  key={option.type}
                  as="button"
                  onClick={() => setSelected(option.type)}
                  role="group"
                  align="flex-start"
                  gap={{ base: 3, md: 4 }}
                  px={{ base: "16px", md: "20px" }}
                  py="12px"
                  rounded="12px"
                  borderWidth="2px"
                  borderColor="#1F2937"
                  cursor="pointer"
                  textAlign="left"
                  transition="border-color 0.2s, transform 0.2s"
                  _hover={{
                    borderColor: "#1F5AFF",
                    transform: "translateY(-2px)",
                  }}
                >
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="48px"
                    rounded="8px"
                    bg={option.iconBg}
                    flexShrink={0}
                  >
                    <Icon
                      as={option.icon}
                      boxSize="24px"
                      color={option.iconColor}
                    />
                  </Flex>

                  <Stack gap="10px" flex="1" minW={0}>
                    <Stack gap={1}>
                      <Text
                        fontSize="16px"
                        lineHeight="24px"
                        fontWeight={700}
                        color="#F9FAFB"
                      >
                        {t(`Register.accountType.${option.type}.title`)}
                      </Text>
                      <Text fontSize="14px" lineHeight="20px" color="#9CA3AF">
                        {t(`Register.accountType.${option.type}.description`)}
                      </Text>
                    </Stack>

                    <List.Root gap={1} variant="plain">
                      {option.features.map((feature) => (
                        <List.Item
                          key={feature}
                          display="flex"
                          alignItems="center"
                          gap={2}
                          fontSize="12px"
                          lineHeight="16px"
                          color="#9CA3AF"
                          whiteSpace={{ base: "normal", md: "nowrap" }}
                        >
                          <Icon
                            as={LuCircleCheck}
                            boxSize="14px"
                            color="#22C55E"
                            flexShrink={0}
                          />
                          {t(
                            `Register.accountType.${option.type}.features.${feature}`,
                          )}
                        </List.Item>
                      ))}
                    </List.Root>
                  </Stack>

                  <Icon
                    as={LuArrowRight}
                    boxSize="20px"
                    color="#9CA3AF"
                    flexShrink={0}
                    transition="transform 0.2s, color 0.2s"
                    _groupHover={{
                      transform: "translateX(4px)",
                      color: "#1F5AFF",
                    }}
                  />
                </Flex>
              ))}
            </Stack>

            <Flex justify="center">
              <Text
                fontSize="14px"
                lineHeight="20px"
                fontWeight={400}
                color="#9CA3AF"
              >
                {t("Register.footer.haveAccount")}{" "}
                <Link href="/login" style={{ color: "#1F5AFF" }}>
                  {t("Register.footer.login")}
                </Link>
              </Text>
            </Flex>
          </Stack>
        </Stack>

        {/* Rodapé */}
        <Stack gap={2} w="full">
          <Text
            fontSize="12px"
            lineHeight="16px"
            color="#9CA3AF"
            textAlign="center"
          >
            {t("Register.footer.copyright", { year: new Date().getFullYear() })}
          </Text>
          <Flex
            justify="center"
            align="center"
            gap={4}
            color="#9CA3AF"
            flexWrap="wrap"
          >
            <Link href="/terms" style={{ fontSize: "12px" }}>
              {t("Register.footer.terms")}
            </Link>
            <Text fontSize="12px" aria-hidden>
              •
            </Text>
            <Link href="/privacy" style={{ fontSize: "12px" }}>
              {t("Register.footer.privacy")}
            </Link>
            <Text fontSize="12px" aria-hidden>
              •
            </Text>
            <Link href="/help" style={{ fontSize: "12px" }}>
              {t("Register.footer.help")}
            </Link>
          </Flex>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap={4} w="full" maxW="2xl" align="flex-start">
      <Image
        src="/assets/logo.png"
        alt={t("Register.logoAlt")}
        h="31px"
        w="auto"
        objectFit="contain"
        alignSelf="center"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        color="#9CA3AF"
        onClick={() => setSelected(undefined)}
      >
        <Icon as={LuArrowLeft} boxSize="16px" />
        {t("Register.accountType.back")}
      </Button>

      {selected === "seller" ? <FormRegisterSeller /> : <FormRegisterPayer />}
    </Stack>
  );
}
