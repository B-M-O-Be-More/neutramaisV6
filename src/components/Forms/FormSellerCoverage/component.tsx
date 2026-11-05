"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuArrowUpRight } from "react-icons/lu";

import KmzDropzone from "@/components/KmzDropzone";
import KmzUploadConfirmDialog, {
  type PendingKmzUpload,
} from "@/components/KmzUploadConfirmDialog";
import { useKmzUpload } from "@/hooks/useKmzUpload";
import {
  SELLER_COVERAGE_DEFAULTS,
  sellerCoverageSchema,
  type SellerCoverageValues,
} from "@/schemas/sellerCoverage";

import { FormSellerCoverageProps } from "./interface";

/**
 * Cadastro de cobertura (Figma 2664-56660): o arquivo KMZ. Salvar lê o KMZ
 * no navegador e o envia à geo-api, que cria uma versão imutável.
 *
 * O Figma também pede nome, descrição e informações adicionais, mas o upload
 * da geo-api não recebe esses campos — a versão é identificada pelo arquivo.
 */
export function FormSellerCoverage({
  organizationId,
  canUpload,
  locale,
  onSaved,
}: FormSellerCoverageProps) {
  const { t } = useTranslation();
  const { upload, isUploading, preview, isPreviewing } =
    useKmzUpload(organizationId);
  const [uploadError, setUploadError] = React.useState<string>();
  // KMZ com o consumo calculado, esperando o seller confirmar o envio.
  const [pending, setPending] = React.useState<PendingKmzUpload | null>(null);
  const disabled = !canUpload || isUploading || isPreviewing;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SellerCoverageValues>({
    resolver: yupResolver(sellerCoverageSchema),
    defaultValues: SELLER_COVERAGE_DEFAULTS,
  });

  const tError = (message?: string) => (message ? t(message) : undefined);

  // Salvar calcula o consumo na cota; o envio só sai depois de confirmado.
  const onSubmit = handleSubmit(async (values) => {
    setUploadError(undefined);
    const result = await preview(values.file!);
    if (!result.ok) {
      setUploadError(t(result.errorKey));
      return;
    }
    setPending({ file: values.file!, preview: result.preview });
  });

  const confirmUpload = async () => {
    if (!pending) return;
    const result = await upload(pending.file);
    setPending(null);
    if (!result.ok) {
      setUploadError(t(result.errorKey));
      return;
    }
    onSaved({ version: result.version, geometry: result.geometry });
    reset(SELLER_COVERAGE_DEFAULTS);
  };

  return (
    <Stack
      asChild
      gap="20px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <form noValidate onSubmit={onSubmit}>
        <Stack gap="4px">
          <Text
            as="h2"
            color="#0F1729"
            fontSize="15px"
            fontWeight={700}
            lineHeight="22.5px"
          >
            {t("SellerCoverage.form.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {t("SellerCoverage.form.subtitle")}
          </Text>
        </Stack>

        <Controller
          control={control}
          name="file"
          render={({ field }) => (
            <KmzDropzone
              id="coverage-file"
              file={field.value}
              onChange={(file) => {
                setUploadError(undefined);
                field.onChange(file);
              }}
              disabled={disabled}
              error={uploadError ?? tError(errors.file?.message)}
              locale={locale}
            />
          )}
        />

        {(isPreviewing || isUploading) && (
          <Text color="#5A6478" fontSize="12px" lineHeight="18px" role="status">
            {t(
              isPreviewing
                ? "SellerOfferCreate.kmz.confirm.previewing"
                : "SellerOfferCreate.kmz.processing",
            )}
          </Text>
        )}

        <Flex gap="12px">
          <Button
            type="button"
            variant="outline"
            flex="1"
            h="45px"
            rounded="18px"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontSize="17px"
            fontWeight={600}
            disabled={disabled}
            onClick={() => {
              setUploadError(undefined);
              reset(SELLER_COVERAGE_DEFAULTS);
            }}
          >
            {t("SellerCoverage.form.cancel")}
          </Button>
          <Button
            type="submit"
            flex="1"
            h="45px"
            gap="10px"
            rounded="18px"
            bg="#1F5AFF"
            color="white"
            fontSize="17px"
            fontWeight={700}
            boxShadow="0px 1.2px 1.8px rgba(0,0,0,0.1), 0px 1.2px 1.2px rgba(0,0,0,0.1)"
            disabled={!canUpload}
            loading={isPreviewing || isUploading}
            loadingText={t("SellerCoverage.form.saving")}
            _hover={{ bg: "#1646CC" }}
          >
            {t("SellerCoverage.form.save")}
            <Icon as={LuArrowUpRight} boxSize="18px" />
          </Button>
        </Flex>

        {/* Em portal: fica fora do <form> no DOM. */}
        <KmzUploadConfirmDialog
          pending={pending}
          isUploading={isUploading}
          locale={locale}
          onConfirm={confirmUpload}
          onClose={() => setPending(null)}
        />
      </form>
    </Stack>
  );
}
