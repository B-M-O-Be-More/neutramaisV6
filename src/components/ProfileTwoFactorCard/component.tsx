"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuCircleCheckBig,
  LuQrCode,
  LuShield,
} from "react-icons/lu";

import ProfileCard from "@/components/ProfileCard";
import ProfileTwoFactorDialog from "@/components/ProfileTwoFactorDialog";
import { useMyMfa } from "@/hooks/useMyMfa";

import { ProfileTwoFactorCardProps } from "./interface";

/**
 * "Autenticação em 2 fatores" do Meu Perfil (Figma 2206-20298, inativo, e
 * 2206-26571, ativo), com o status de `GET /users/me/mfa/status`.
 */
export function ProfileTwoFactorCard({
  email,
  phone,
  locale,
}: ProfileTwoFactorCardProps) {
  const { t } = useTranslation();
  const mfa = useMyMfa();
  const [dialog, setDialog] = React.useState<"enable" | "disable" | null>(null);

  const isActive = !!mfa.status?.enrolled;

  const badge = mfa.status && (
    <Box
      flexShrink={0}
      px="12px"
      py="4px"
      bg={isActive ? "#EDFBF5" : "#FEF2F2"}
      borderWidth="1px"
      borderColor={isActive ? "#AAECD5" : "#FECACA"}
      rounded="10px"
      color={isActive ? "#10B981" : "#EF4444"}
      fontSize="11px"
      fontWeight={700}
      lineHeight="16.5px"
    >
      {t(
        isActive
          ? "Profile.security.twoFactor.active"
          : "Profile.security.twoFactor.inactive",
      )}
    </Box>
  );

  let content: React.ReactNode;
  if (mfa.isLoading) {
    content = <Skeleton h="88px" rounded="12px" />;
  } else if (mfa.error) {
    content = (
      <Stack gap="8px" align="flex-start">
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t(mfa.error)}
        </Text>
        <Button
          variant="plain"
          h="auto"
          p="0"
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={600}
          onClick={mfa.reload}
        >
          {t("Profile.actions.retry")}
        </Button>
      </Stack>
    );
  } else if (isActive) {
    const since = mfa.status?.enrolled_at
      ? new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
          new Date(mfa.status.enrolled_at),
        )
      : null;
    content = (
      <Stack gap="12px">
        <Flex
          align="center"
          gap="12px"
          px="16px"
          py="14px"
          bg="#EDFBF5"
          borderWidth="1px"
          borderColor="#AAECD5"
          rounded="12px"
        >
          <Icon as={LuCircleCheckBig} boxSize="18px" color="#10B981" />
          <Stack gap="0">
            <Text color="#047857" fontSize="13px" fontWeight={700}>
              {t("Profile.security.twoFactor.enabledTitle")}
            </Text>
            <Text color="#047857" fontSize="12px" lineHeight="18px">
              {t("Profile.security.twoFactor.enabledMethod")}
            </Text>
          </Stack>
        </Flex>
        <Flex
          align="center"
          gap="10px"
          px="14px"
          py="10px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <Icon as={LuQrCode} boxSize="14px" color="#1F5AFF" />
          <Text flex="1" color="#0F1729" fontSize="13px" fontWeight={600}>
            {since
              ? t("Profile.security.twoFactor.since", { date: since })
              : t("Profile.security.twoFactor.methods.totp.title")}
          </Text>
          <Icon as={LuCircleCheck} boxSize="14px" color="#10B981" />
        </Flex>
        <Button
          variant="outline"
          h="41px"
          borderColor="#FECACA"
          rounded="14px"
          color="#EF4444"
          fontSize="13px"
          fontWeight={500}
          onClick={() => setDialog("disable")}
        >
          {t("Profile.security.twoFactor.disable")}
        </Button>
      </Stack>
    );
  } else {
    content = (
      <Stack gap="12px">
        <Flex
          role="alert"
          align="center"
          gap="8px"
          px="12px"
          py="10px"
          bg="#FEF2F2"
          borderWidth="1px"
          borderColor="#FECACA"
          rounded="10px"
        >
          <Icon
            as={LuCircleAlert}
            boxSize="13px"
            color="#EF4444"
            flexShrink={0}
          />
          <Text color="#EF4444" fontSize="12px" lineHeight="18px">
            {t("Profile.security.twoFactor.missing")}
          </Text>
        </Flex>
        <Button
          h="41px"
          gap="8px"
          bg="#1F5AFF"
          rounded="14px"
          color="white"
          fontSize="13px"
          fontWeight={700}
          _hover={{ bg: "#1A4FE0" }}
          onClick={() => setDialog("enable")}
        >
          <Icon as={LuShield} boxSize="14px" />
          {t("Profile.security.twoFactor.enable")}
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <ProfileCard
        title={t("Profile.security.twoFactor.title")}
        titleEnd={badge}
      >
        {content}
      </ProfileCard>
      <ProfileTwoFactorDialog
        mode={dialog}
        email={email}
        phone={phone}
        onClose={() => setDialog(null)}
        onChanged={mfa.reload}
      />
    </>
  );
}
