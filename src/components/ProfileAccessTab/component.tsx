"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuCircleCheck,
  LuCircleCheckBig,
  LuStore,
  LuUpload,
  LuUsers,
} from "react-icons/lu";

import ProfileCard from "@/components/ProfileCard";
import { KYC_DOCUMENT_GROUPS, KYC_TARGET_LEVELS } from "@/data/kycDocuments";
import type { KycLevelSupported } from "@/services/kyc.service";

import { ProfileAccessTabProps } from "./interface";

// Recursos liberados por nível (Figma 2206-20891).
const LEVEL_FEATURES: Record<string, string[]> = {
  basic: ["viewMarketplace", "accessPanel"],
  verified: ["buyOrders", "transact"],
  complete: ["withdraw", "highValue", "publishOffers"],
};

// Documentos opcionais do design sem `document_type` na identity-api.
const OPTIONAL_DOCUMENTS = ["numberResources", "legalOperation"];
const OPTIONAL_FEATURES = ["numberResources", "sales", "extraVerification"];

const PERSONAS = [
  {
    key: "buyer",
    icon: LuUsers,
    color: "#1F5AFF",
    bg: "#EEF3FF",
    border: "#C7D8FF",
  },
  {
    key: "seller",
    icon: LuStore,
    color: "#8B5CF6",
    bg: "#F3EEFF",
    border: "#D3BFFD",
  },
] as const;

type StepState = "done" | "next" | "locked";

function stepState(
  level: (typeof KYC_TARGET_LEVELS)[number],
  current: KycLevelSupported,
): StepState {
  const order = ["pending", ...KYC_TARGET_LEVELS];
  const reached = order.indexOf(current);
  const position = order.indexOf(level);
  if (position <= reached) return "done";
  return position === reached + 1 ? "next" : "locked";
}

function FeatureChips({ items, prefix }: { items: string[]; prefix: string }) {
  const { t } = useTranslation();
  return (
    <Flex gap="6px" wrap="wrap">
      {items.map((item) => (
        <Box
          key={item}
          px="8px"
          py="2px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="8px"
          color="#8A9AB5"
          fontSize="10px"
          lineHeight="15px"
        >
          {t(`${prefix}.${item}`)}
        </Box>
      ))}
    </Flex>
  );
}

function DocumentRow({
  label,
  action,
}: {
  label: string;
  action: React.ReactNode;
}) {
  return (
    <Flex
      as="li"
      align="center"
      gap="10px"
      px="12px"
      py="8px"
      bg="#F8F9FB"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="10px"
    >
      <Icon as={LuUpload} boxSize="13px" color="#A0ABB8" flexShrink={0} />
      <Text flex="1" color="#0F1729" fontSize="12px" lineHeight="18px">
        {label}
      </Text>
      {action}
    </Flex>
  );
}

const SEND_BUTTON = {
  h: "26px",
  px: "12px",
  bg: "#EEF3FF",
  borderWidth: "1px",
  borderColor: "#C7D8FF",
  rounded: "8px",
  color: "#1F5AFF",
  fontSize: "11px",
  fontWeight: 600,
} as const;

/**
 * Aba "Papéis & acessos" (Figma 2206-20891): os níveis de KYC da organização
 * (concluídos, o próximo passo com os documentos e os bloqueados) e os
 * papéis Buyer e Seller. O nível vem do `GET /me`; o envio dos documentos
 * segue no fluxo de KYC existente.
 */
export function ProfileAccessTab({
  profile,
  personas,
  kycHref,
}: ProfileAccessTabProps) {
  const { t } = useTranslation();
  const current = profile.organization.kyc_level;

  return (
    <Stack gap="20px">
      <ProfileCard
        title={t("Profile.access.kycTitle")}
        titleEnd={
          <Box
            flexShrink={0}
            px="10px"
            py="4px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            rounded="10px"
            color="#D97706"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
          >
            {t(`Profile.access.currentLevel.${current}`)}
          </Box>
        }
      >
        <Text mt="-12px" color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t("Profile.access.kycSubtitle")}
        </Text>

        <Stack as="ol" gap="12px" listStyleType="none">
          {KYC_TARGET_LEVELS.map((level, index) => {
            const state = stepState(level, current);
            const group = KYC_DOCUMENT_GROUPS.find(
              (item) => item.level === level,
            );
            return (
              <Stack
                as="li"
                key={level}
                gap="12px"
                p="16px"
                bg={state === "done" ? "#FFFBEB" : "white"}
                borderWidth="1px"
                borderColor={state === "done" ? "#FDE68A" : "#E5E8EE"}
                rounded="12px"
                opacity={state === "locked" ? 0.5 : 1}
                aria-current={state === "next" ? "step" : undefined}
              >
                <Flex align="flex-start" gap="12px">
                  <Flex
                    align="center"
                    justify="center"
                    boxSize="28px"
                    flexShrink={0}
                    bg={state === "done" ? "transparent" : "#F4F6F9"}
                    rounded="full"
                    color="#8A9AB5"
                    fontSize="12px"
                    fontWeight={700}
                  >
                    {state === "done" ? (
                      <Icon
                        as={LuCircleCheckBig}
                        boxSize="16px"
                        color="#D97706"
                      />
                    ) : (
                      index + 1
                    )}
                  </Flex>
                  <Stack gap="6px" flex="1" minW={0}>
                    <Flex align="center" gap="8px" wrap="wrap">
                      <Text
                        color={state === "done" ? "#D97706" : "#0F1729"}
                        fontSize="13px"
                        fontWeight={700}
                        lineHeight="19.5px"
                      >
                        {t(`Profile.access.levels.${level}.title`)}
                      </Text>
                      {state !== "locked" && (
                        <Box
                          px="6px"
                          py="1px"
                          bg={state === "done" ? "white" : "#FFFBEB"}
                          borderWidth="1px"
                          borderColor="#FDE68A"
                          rounded="6px"
                          color="#D97706"
                          fontSize="8px"
                          fontWeight={700}
                          lineHeight="12px"
                          textTransform="uppercase"
                        >
                          {t(`Profile.access.stepStates.${state}`)}
                        </Box>
                      )}
                    </Flex>
                    <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                      {t(`Profile.access.levels.${level}.description`)}
                    </Text>
                    <FeatureChips
                      items={LEVEL_FEATURES[level]}
                      prefix="Profile.access.features"
                    />
                  </Stack>
                </Flex>

                {state === "next" && group && (
                  <Stack gap="8px">
                    <Text
                      color="#0F1729"
                      fontSize="12px"
                      fontWeight={700}
                      lineHeight="18px"
                    >
                      {t("Profile.access.sendDocuments")}
                    </Text>
                    <Stack as="ul" gap="6px" listStyleType="none">
                      {group.documents.map((document) => (
                        <DocumentRow
                          key={document.type}
                          label={t(`Register.flow.kyc.docs.${document.type}`)}
                          action={
                            <Button asChild {...SEND_BUTTON}>
                              <NextLink href={kycHref}>
                                {t("Profile.access.send")}
                              </NextLink>
                            </Button>
                          }
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            );
          })}

          <Stack
            as="li"
            gap="12px"
            p="16px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="12px"
          >
            <Flex align="flex-start" gap="12px">
              <Flex
                align="center"
                justify="center"
                boxSize="28px"
                flexShrink={0}
                bg="#F4F6F9"
                rounded="full"
                color="#8A9AB5"
                fontSize="12px"
                fontWeight={700}
              >
                {KYC_TARGET_LEVELS.length + 1}
              </Flex>
              <Stack gap="6px" flex="1" minW={0}>
                <Text color="#0F1729" fontSize="13px" fontWeight={700}>
                  {t("Profile.access.optional.title")}
                </Text>
                <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                  {t("Profile.access.optional.description")}
                </Text>
                <FeatureChips
                  items={OPTIONAL_FEATURES}
                  prefix="Profile.access.optional.features"
                />
              </Stack>
            </Flex>
            <Stack as="ul" gap="6px" listStyleType="none">
              {OPTIONAL_DOCUMENTS.map((document) => (
                <DocumentRow
                  key={document}
                  label={t(`Profile.access.optional.documents.${document}`)}
                  action={
                    // Sem `document_type` para eles na identity-api.
                    <Button {...SEND_BUTTON} disabled>
                      {t("Profile.access.soon")}
                    </Button>
                  }
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </ProfileCard>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
        {PERSONAS.map((persona) => {
          const isActive = personas.includes(persona.key);
          return (
            <Stack
              key={persona.key}
              gap="10px"
              p="16px"
              bg={persona.bg}
              borderWidth="1px"
              borderColor={persona.border}
              rounded="12px"
              opacity={isActive ? 1 : 0.6}
            >
              <Flex align="center" gap="10px">
                <Icon as={persona.icon} boxSize="16px" color={persona.color} />
                <Stack gap="0">
                  <Text
                    color={persona.color}
                    fontSize="12px"
                    fontWeight={700}
                    lineHeight="18px"
                  >
                    {t(`Profile.access.personas.${persona.key}.title`)}
                  </Text>
                  <Text color="#8A9AB5" fontSize="10px" lineHeight="15px">
                    {t(
                      isActive
                        ? "Profile.access.personas.active"
                        : "Profile.access.personas.inactive",
                    )}
                  </Text>
                </Stack>
              </Flex>
              <Stack as="ul" gap="4px" listStyleType="none">
                {[0, 1, 2].map((index) => (
                  <Flex as="li" key={index} align="center" gap="6px">
                    <Icon
                      as={LuCircleCheck}
                      boxSize="11px"
                      color={persona.color}
                    />
                    <Text color="#5A6478" fontSize="11px" lineHeight="16.5px">
                      {t(
                        `Profile.access.personas.${persona.key}.items.${index}`,
                      )}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Stack>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
