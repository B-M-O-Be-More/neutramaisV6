"use client";

import { Checkbox, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import OfferCategoryPanel from "@/components/OfferCategoryPanel";
import OfferTemplateField from "@/components/OfferTemplateField";
import { isRuleOn } from "@/functions/templateFields";

import { SellerOfferRuleFieldsProps } from "./interface";

type RuleMessages = Record<
  string,
  Record<string, { message?: string } | undefined> | undefined
>;

/**
 * Regras condicionais do template da categoria (NEU-627). O Admin escreve a
 * lógica; o Seller só preenche os valores. Regra obrigatória vale sempre;
 * opcional entra quando o Seller liga. Regra ligada pede todos os campos de
 * valor. O efeito (selo, campo alterado) aparece na oferta depois de salva.
 */
export function SellerOfferRuleFields({
  control,
  errors,
  rules,
  tone,
}: SellerOfferRuleFieldsProps) {
  const { t } = useTranslation();
  const toggles = useWatch({ control, name: "rulesEnabled" });
  const ruleErrors = errors.ruleValues as RuleMessages | undefined;

  if (!rules.length) return null;

  return (
    <OfferCategoryPanel
      id="offer-rules-title"
      title={t("SellerOfferCreate.rules.title")}
      tone={tone}
    >
      <Text color="#5A6478" fontSize="12px" lineHeight="18px" mt="-8px">
        {t("SellerOfferCreate.rules.hint")}
      </Text>
      {rules.map((rule) => {
        const on = isRuleOn(rule, toggles);
        const name = t(`SellerOfferCreate.rules.names.${rule.key}`, {
          defaultValue: rule.name,
        });
        const description = rule.description
          ? t(`SellerOfferCreate.rules.descriptions.${rule.key}`, {
              defaultValue: rule.description,
            })
          : undefined;
        return (
          <Stack
            key={rule.key}
            role="group"
            aria-label={name}
            gap="12px"
            p="16px"
            bg="white"
            borderWidth="1px"
            borderColor={tone.border}
            rounded="12px"
          >
            <Stack gap="2px">
              <Text color="#0F1729" fontSize="13px" fontWeight={700}>
                {name}
                {rule.required && (
                  <Text as="span" color={tone.fg} fontWeight={600}>
                    {" · "}
                    {t("SellerOfferCreate.rules.required")}
                  </Text>
                )}
              </Text>
              {description && (
                <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                  {description}
                </Text>
              )}
            </Stack>

            {!rule.required && (
              <Controller
                control={control}
                name={`rulesEnabled.${rule.key}`}
                render={({ field }) => (
                  <Checkbox.Root
                    checked={!!field.value}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked === true)
                    }
                    gap="8px"
                    size="sm"
                  >
                    <Checkbox.HiddenInput
                      id={`offer-rule-${rule.key}-on`}
                      onBlur={field.onBlur}
                    />
                    <Checkbox.Control />
                    <Checkbox.Label color="#0F1729" fontSize="13px">
                      {t("SellerOfferCreate.rules.apply")}
                    </Checkbox.Label>
                  </Checkbox.Root>
                )}
              />
            )}

            {on && (
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
                {rule.valueFields.map((valueField) => {
                  const message =
                    ruleErrors?.[rule.key]?.[valueField.key]?.message;
                  return (
                    <Controller
                      key={valueField.key}
                      control={control}
                      name={`ruleValues.${rule.key}.${valueField.key}`}
                      render={({ field }) => (
                        <OfferTemplateField
                          id={`offer-rule-${rule.key}-${valueField.key}`}
                          // Regra ligada pede todos os campos de valor.
                          field={{ ...valueField, required: true }}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={message ? t(message) : undefined}
                          tone={tone}
                        />
                      )}
                    />
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>
        );
      })}
    </OfferCategoryPanel>
  );
}
