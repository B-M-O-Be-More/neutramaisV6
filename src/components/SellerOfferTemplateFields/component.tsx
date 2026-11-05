"use client";

import { Button, SimpleGrid, Text } from "@chakra-ui/react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import OfferCategoryPanel from "@/components/OfferCategoryPanel";
import OfferTemplateField from "@/components/OfferTemplateField";

import { SellerOfferTemplateFieldsProps } from "./interface";

type FieldMessages = Record<string, { message?: string } | undefined>;

/**
 * Campos do template da categoria que não têm tela própria no assistente:
 * os de uma subcategoria, os de uma categoria criada pelo Admin e os
 * opcionais da família (ex.: Tecnologia e Simetria em Conectividade). Os
 * valores vão em `characteristics` da especificação.
 */
export function SellerOfferTemplateFields({
  control,
  errors,
  fields,
  isLoading,
  hasError,
  onRetry,
  tone,
}: SellerOfferTemplateFieldsProps) {
  const { t } = useTranslation();
  const fieldErrors = errors.templateValues as FieldMessages | undefined;

  if (!isLoading && !hasError && !fields.length) return null;

  return (
    <OfferCategoryPanel
      id="offer-template-fields-title"
      title={t("SellerOfferCreate.templateFields.title")}
      tone={tone}
    >
      {isLoading ? (
        <Text color="#5A6478" fontSize="13px" role="status">
          {t("SellerOfferCreate.templateFields.loading")}
        </Text>
      ) : hasError ? (
        <Text color="#B45309" fontSize="13px" role="alert">
          {t("SellerOfferCreate.templateFields.loadError")}{" "}
          <Button
            variant="plain"
            h="auto"
            p={0}
            color={tone.fg}
            fontSize="13px"
            fontWeight={700}
            onClick={onRetry}
          >
            {t("SellerOfferCreate.templateFields.retry")}
          </Button>
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
          {fields.map((field) => {
            const message = fieldErrors?.[field.key]?.message;
            return (
              <Controller
                key={field.key}
                control={control}
                name={`templateValues.${field.key}`}
                render={({ field: input }) => (
                  <OfferTemplateField
                    id={`offer-template-${field.key}`}
                    field={field}
                    value={input.value}
                    onChange={input.onChange}
                    onBlur={input.onBlur}
                    error={message ? t(message) : undefined}
                    tone={tone}
                  />
                )}
              />
            );
          })}
        </SimpleGrid>
      )}
    </OfferCategoryPanel>
  );
}
