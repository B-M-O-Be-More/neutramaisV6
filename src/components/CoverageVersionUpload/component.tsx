"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { LuCircleX, LuInfo, LuTriangleAlert, LuUpload } from "react-icons/lu";

import KmzDropzone from "@/components/KmzDropzone";
import { useKmzUpload } from "@/hooks/useKmzUpload";

import { CoverageVersionUploadProps } from "./interface";

// "Causas de bloqueio de upload" (Figma 2074-65079).
const BLOCKING_CAUSES = [
  "invalidFile",
  "tooLarge",
  "malformed",
  "geometry",
  "bounds",
  "content",
] as const;

/**
 * "Upload nova versão" (Figma 2074-65067): envia um KMZ que substitui a
 * versão ativa no mesmo arquivo (`predecessorId`). As regras de validação
 * abrem pelo botão do cabeçalho. A troca das ofertas não é automática.
 */
export function CoverageVersionUpload({
  organizationId,
  predecessorId,
  canUpload,
  locale,
  onUploaded,
}: CoverageVersionUploadProps) {
  const { t } = useTranslation();
  const { upload, isUploading } = useKmzUpload(organizationId);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string>();
  const [showRules, setShowRules] = React.useState(false);
  const rulesId = React.useId();
  const disabled = !canUpload || isUploading || !predecessorId;

  const handleUpload = async () => {
    if (!file || !predecessorId) return;
    setError(undefined);
    const result = await upload(file, { predecessorId });
    if (!result.ok) {
      setError(t(result.errorKey));
      return;
    }
    setFile(null);
    onUploaded(result);
  };

  return (
    <Stack
      gap="16px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="center" justify="space-between" gap="12px">
        <Text
          as="h2"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("SellerCoverage.detail.upload.title")}
        </Text>
        <Button
          variant="plain"
          h="34px"
          px="12px"
          gap="4px"
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={600}
          aria-expanded={showRules}
          aria-controls={rulesId}
          onClick={() => setShowRules((current) => !current)}
        >
          <Icon as={LuInfo} boxSize="12px" />
          {t("SellerCoverage.detail.upload.rules")}
        </Button>
      </Flex>

      {showRules && (
        <Stack
          id={rulesId}
          gap="4px"
          p="17px"
          bg="#F8F9FB"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="10px"
        >
          <Text
            pb="8px"
            color="#0F1729"
            fontSize="12px"
            fontWeight={700}
            lineHeight="18px"
          >
            {t("SellerCoverage.detail.upload.causesTitle")}
          </Text>
          <Stack as="ul" gap="4px" listStyleType="none">
            {BLOCKING_CAUSES.map((cause) => (
              <Flex as="li" key={cause} align="flex-start" gap="8px">
                <Icon
                  as={LuCircleX}
                  boxSize="11px"
                  color="#EF4444"
                  mt="3.5px"
                  flexShrink={0}
                />
                <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                  {t(`SellerCoverage.detail.upload.causes.${cause}`)}
                </Text>
              </Flex>
            ))}
          </Stack>
          <Text
            mt="8px"
            pt="9px"
            borderTopWidth="1px"
            borderColor="#E5E8EE"
            color="#10B981"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
          >
            {t("SellerCoverage.detail.upload.accepted")}
          </Text>
        </Stack>
      )}

      <KmzDropzone
        id="coverage-version-file"
        file={file}
        onChange={(next) => {
          setError(undefined);
          setFile(next);
        }}
        disabled={disabled}
        error={error}
        locale={locale}
      />

      {file && (
        <Stack gap="8px">
          {isUploading && (
            <Text
              color="#5A6478"
              fontSize="12px"
              lineHeight="18px"
              role="status"
            >
              {t("SellerOfferCreate.kmz.processing")}
            </Text>
          )}
          <Button
            h="40px"
            gap="8px"
            rounded="12px"
            bg="#1F5AFF"
            color="white"
            fontSize="14px"
            fontWeight={700}
            disabled={!canUpload || !predecessorId}
            loading={isUploading}
            loadingText={t("SellerCoverage.form.saving")}
            _hover={{ bg: "#1646CC" }}
            onClick={handleUpload}
          >
            <Icon as={LuUpload} boxSize="15px" />
            {t("SellerCoverage.detail.upload.submit")}
          </Button>
        </Stack>
      )}

      <Flex
        align="flex-start"
        gap="8px"
        p="13px"
        bg="#FFFBEB"
        borderWidth="1px"
        borderColor="#FDE68A"
        rounded="10px"
      >
        <Icon
          as={LuTriangleAlert}
          boxSize="13px"
          color="#D97706"
          mt="2.5px"
          flexShrink={0}
        />
        <Text color="#92400E" fontSize="12px" lineHeight="18px">
          <Trans
            i18nKey="SellerCoverage.detail.upload.notice"
            components={{ strong: <strong /> }}
          />
        </Text>
      </Flex>
    </Stack>
  );
}
