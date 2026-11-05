"use client";

import {
  Checkbox,
  Input,
  InputGroup,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import {
  OfferPanelField,
  offerPanelControlStyles,
} from "@/components/OfferCategoryPanel";
import { humanizeTemplateValue } from "@/functions/templateFields";

import { OfferTemplateFieldProps } from "./interface";

/** Limites de caracteres de cada tipo de texto (marketplace-api). */
const TEXT_MAX: Record<string, number> = {
  short_text: 255,
  long_text: 5000,
  attachment: 2048,
  link: 2048,
};

/**
 * Um campo do template da categoria (ou de valor de uma regra), desenhado
 * pelo tipo que a API informa: texto curto ou longo, número (com unidade),
 * escolha única ou múltipla, sim/não, data, anexo (referência) ou link.
 * Rótulo, opções e unidade são traduzidos pela chave do template
 * (`SellerOfferCreate.templateFields.*`); o que ainda não tem tradução usa o
 * rótulo da API ou o valor em texto legível.
 */
export function OfferTemplateField({
  id,
  field,
  value,
  onChange,
  onBlur,
  error,
  tone,
}: OfferTemplateFieldProps) {
  const { t } = useTranslation();
  const label = t(`SellerOfferCreate.templateFields.labels.${field.key}`, {
    defaultValue: field.label,
  });
  const unit = field.unit
    ? t(`SellerOfferCreate.templateFields.units.${field.unit}`, {
        defaultValue: field.unit,
      })
    : undefined;
  const optionLabel = (option: string) =>
    t(`SellerOfferCreate.templateFields.options.${option}`, {
      defaultValue: humanizeTemplateValue(option),
    });
  const text = Array.isArray(value) ? "" : (value ?? "");
  const list = Array.isArray(value) ? value : [];
  const styles = offerPanelControlStyles(tone, error);

  const hasMin = typeof field.min === "number";
  const hasMax = typeof field.max === "number";
  const helper =
    field.type === "number" || field.type === "number_with_unit"
      ? hasMin && hasMax
        ? t("SellerOfferCreate.templateFields.rangeBetween", {
            min: field.min,
            max: field.max,
          })
        : hasMin
          ? t("SellerOfferCreate.templateFields.rangeMin", { min: field.min })
          : hasMax
            ? t("SellerOfferCreate.templateFields.rangeMax", { max: field.max })
            : undefined
      : undefined;
  const helperId = helper ? `${id}-helper` : undefined;
  const describedBy =
    [error && `${id}-error`, helperId].filter(Boolean).join(" ") || undefined;
  const maxLength = Math.min(
    field.maxLength ?? Infinity,
    TEXT_MAX[field.type] ?? Infinity,
  );
  const common = {
    id,
    onBlur,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": field.required,
  };

  const select = (options: { value: string; label: string }[]) => (
    <NativeSelect.Root>
      <NativeSelect.Field
        {...common}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        {...styles}
        pe="32px"
      >
        <option value="">
          {t("SellerOfferCreate.templateFields.choose")}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator>
        <LuChevronDown color="#98A6B3" />
      </NativeSelect.Indicator>
    </NativeSelect.Root>
  );

  let control: ReactNode;
  switch (field.type) {
    case "long_text":
      control = (
        <Textarea
          {...common}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
          rows={3}
          {...styles}
          h="auto"
          py="9px"
        />
      );
      break;
    case "number":
      control = (
        <Input
          {...common}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          {...styles}
        />
      );
      break;
    case "number_with_unit":
      control = (
        <InputGroup
          endElement={
            <Text color="#5A6478" fontSize="13px" aria-hidden="true">
              {unit}
            </Text>
          }
          endElementProps={{ pe: "13px" }}
        >
          <Input
            {...common}
            value={text}
            onChange={(event) => onChange(event.target.value)}
            inputMode="decimal"
            aria-label={unit ? `${label} (${unit})` : undefined}
            {...styles}
            pe="56px"
          />
        </InputGroup>
      );
      break;
    case "single_choice":
      control = select(
        (field.options ?? []).map((option) => ({
          value: option,
          label: optionLabel(option),
        })),
      );
      break;
    case "boolean":
      control = select([
        { value: "true", label: t("SellerOfferCreate.templateFields.yes") },
        { value: "false", label: t("SellerOfferCreate.templateFields.no") },
      ]);
      break;
    case "multiple_choice":
      control = (
        <Stack
          role="group"
          aria-label={label}
          aria-describedby={describedBy}
          gap="6px"
          p="10px"
          bg="white"
          borderWidth="1px"
          borderColor={error ? "#EF4444" : tone.border}
          rounded="10px"
        >
          {(field.options ?? []).map((option, index) => (
            <Checkbox.Root
              key={option}
              checked={list.includes(option)}
              onCheckedChange={(details) =>
                onChange(
                  details.checked === true
                    ? [...list, option]
                    : list.filter((item) => item !== option),
                )
              }
              gap="8px"
              size="sm"
            >
              <Checkbox.HiddenInput
                id={index === 0 ? id : undefined}
                onBlur={onBlur}
              />
              <Checkbox.Control />
              <Checkbox.Label color="#0F1729" fontSize="13px">
                {optionLabel(option)}
              </Checkbox.Label>
            </Checkbox.Root>
          ))}
        </Stack>
      );
      break;
    case "date":
      control = (
        <Input
          {...common}
          type="date"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          {...styles}
        />
      );
      break;
    default:
      control = (
        <Input
          {...common}
          type={field.type === "link" ? "url" : "text"}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
          placeholder={
            field.type === "link" ? "https://" : undefined
          }
          {...styles}
        />
      );
  }

  return (
    <OfferPanelField
      id={id}
      label={unit ? `${label} (${unit})` : label}
      required={field.required}
      error={error}
    >
      {control}
      {helper && (
        <Text id={helperId} pt="4px" color="#8A9AB5" fontSize="12px">
          {helper}
        </Text>
      )}
    </OfferPanelField>
  );
}
