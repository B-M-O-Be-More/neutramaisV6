"use client";

import { SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import ProfileCard from "@/components/ProfileCard";

import { ProfileCompanyTabProps } from "./interface";

function Tile({
  label,
  value,
  isLoading = false,
}: {
  label: string;
  value: string;
  isLoading?: boolean;
}) {
  return (
    <Stack
      gap="2px"
      px="12px"
      py="10px"
      bg="#F8F9FB"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="10px"
    >
      <Text
        as="dt"
        color="#A0ABB8"
        fontSize="9px"
        fontWeight={700}
        lineHeight="13.5px"
        letterSpacing="0.45px"
        textTransform="uppercase"
      >
        {label}
      </Text>
      {isLoading ? (
        <Skeleton h="18px" w="60%" rounded="6px" />
      ) : (
        <Text
          as="dd"
          color="#0F1729"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
        >
          {value}
        </Text>
      )}
    </Stack>
  );
}

/**
 * Aba "Minha empresa" (Figma 2205-18569 e 2943-27584). Tipo da conta e KYC vêm
 * do `GET /me`; a sede, do endereço legal da identity-api. Razão social,
 * CNPJ, setor, fundação e outorga SCM ainda não têm rota de leitura para o
 * próprio usuário.
 */
export function ProfileCompanyTab({
  profile,
  address,
  isLoadingAddress,
}: ProfileCompanyTabProps) {
  const { t } = useTranslation();
  const unknown = t("Profile.unknown");
  const organization = profile.organization;

  const headOffice = address
    ? [address.city, address.state].filter(Boolean).join("/")
    : unknown;

  const tiles = [
    { key: "legalName", value: unknown },
    { key: "taxId", value: unknown },
    {
      key: "type",
      value: organization.organization_type
        ? t(`Profile.company.types.${organization.organization_type}`)
        : unknown,
    },
    { key: "sector", value: unknown },
    { key: "foundedAt", value: unknown },
    { key: "headOffice", value: headOffice, isLoading: isLoadingAddress },
    {
      key: "kyc",
      value: t(`Profile.company.kycStates.${organization.kyc_state}`, {
        defaultValue: organization.kyc_state,
      }),
    },
    { key: "scmLicense", value: unknown },
  ];

  return (
    <ProfileCard title={t("Profile.company.title")}>
      <SimpleGrid as="dl" columns={{ base: 1, md: 2 }} gap="12px">
        {tiles.map((tile) => (
          <Tile
            key={tile.key}
            label={t(`Profile.company.fields.${tile.key}`)}
            value={tile.value}
            isLoading={tile.isLoading}
          />
        ))}
      </SimpleGrid>
    </ProfileCard>
  );
}
