"use client";

import {
  Button,
  Field,
  Flex,
  Icon,
  Input,
  InputGroup,
  NativeSelect,
  Slider,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuTriangleAlert } from "react-icons/lu";

import { formatMegabytes } from "@/functions/formatMegabytes";
import {
  clampQuotaMb,
  STORAGE_QUOTA_MAX_MB,
  STORAGE_QUOTA_MIN_MB,
  STORAGE_QUOTA_REASON_MAX,
  STORAGE_QUOTA_REASON_MIN,
  storageQuotaSchema,
  type StorageQuotaValues,
} from "@/schemas/storageQuota";

import { FormStorageQuotaProps } from "./interface";

// Marcas abaixo do slider (Figma: 50, 500 e 1.000 MB).
const TICKS = [STORAGE_QUOTA_MIN_MB, 500, STORAGE_QUOTA_MAX_MB];

const LABEL = {
  color: "#5A6478",
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: "16.5px",
} as const;

const FIELD = {
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "12px",
  color: "#0F1729",
  fontSize: "13px",
  focusRingColor: "#1F5AFF",
} as const;

/**
 * Nova cota de armazenamento de cobertura (Figma 2902-99727): slider e
 * quantidade manual (50 a 1.000 MB, ligados) e o motivo, que vai para a
 * auditoria da geo-api. Reduzir abaixo do consumo mantém os dados, mas
 * bloqueia novos envios — o formulário avisa antes de salvar.
 */
export function FormStorageQuota({
  storage,
  organizationName,
  isSaving,
  error,
  locale,
  onSubmit,
  onCancel,
}: FormStorageQuotaProps) {
  const { t } = useTranslation();
  const mb = (value: number) => formatMegabytes(value, locale);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StorageQuotaValues>({
    resolver: yupResolver(storageQuotaSchema),
    // Parte da cota atual, dentro da faixa do slider.
    defaultValues: { quotaMb: clampQuotaMb(storage.quotaMb), reason: "" },
  });

  const tError = (message?: string) => (message ? t(message) : undefined);

  const quota = useWatch({ control, name: "quotaMb" });
  const reason = useWatch({ control, name: "reason" }) ?? "";
  const hasQuota = Number.isFinite(quota);
  const belowUsage = hasQuota && quota < storage.usedMb;

  const quotaError = tError(errors.quotaMb?.message);
  const reasonError = tError(errors.reason?.message);

  const submit = handleSubmit((values) =>
    onSubmit({ quotaMb: values.quotaMb, reason: values.reason.trim() }),
  );

  return (
    <Stack asChild gap="20px">
      <form noValidate onSubmit={submit}>
        {/* Organização: fixa, vem da página que abriu o modal. */}
        <Stack gap="6px">
          <Text asChild {...LABEL}>
            <label htmlFor="storage-quota-organization">
              {t("CoverageStorage.quota.organizationLabel")}
            </label>
          </Text>
          <NativeSelect.Root disabled>
            <NativeSelect.Field
              id="storage-quota-organization"
              value={organizationName}
              h="39px"
              ps="18px"
              pe="36px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="12px"
              color="#0F1729"
              fontSize="13px"
              _disabled={{ opacity: 1, cursor: "default" }}
            >
              <option value={organizationName}>{organizationName}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator>
              <LuChevronDown color="#0F1729" />
            </NativeSelect.Indicator>
          </NativeSelect.Root>
        </Stack>

        {/* Nova cota: valor em destaque e slider. */}
        <Stack
          gap="12px"
          p="16px"
          bg="#EEF3FF"
          borderWidth="1px"
          borderColor="#C7D8FF"
          rounded="12px"
        >
          <Flex justify="space-between" align="center" gap="12px">
            <Stack gap="2px">
              <Text
                color="#0F1729"
                fontSize="13px"
                fontWeight={600}
                lineHeight="19.5px"
              >
                {t("CoverageStorage.quota.newQuota")}
              </Text>
              <Text color="#6F7B90" fontSize="10px" lineHeight="15px">
                {t("CoverageStorage.quota.currentLimit", {
                  quota: mb(storage.quotaMb),
                })}
              </Text>
            </Stack>
            <Text
              color="#1F5AFF"
              fontSize="20px"
              fontWeight={700}
              lineHeight="30px"
              aria-live="polite"
            >
              {hasQuota ? mb(quota) : "—"}
            </Text>
          </Flex>

          <Controller
            control={control}
            name="quotaMb"
            render={({ field }) => (
              <Slider.Root
                min={STORAGE_QUOTA_MIN_MB}
                max={STORAGE_QUOTA_MAX_MB}
                step={1}
                value={[
                  clampQuotaMb(
                    Number.isFinite(field.value)
                      ? field.value
                      : STORAGE_QUOTA_MIN_MB,
                  ),
                ]}
                onValueChange={(details) => field.onChange(details.value[0])}
                disabled={isSaving}
                // O Slider (zag-js) espera um rótulo por alça — a regra do
                // jsx-a11y só conhece o aria-label de string do DOM.
                // eslint-disable-next-line jsx-a11y/aria-proptypes
                aria-label={[t("CoverageStorage.quota.sliderLabel")]}
              >
                <Slider.Control>
                  <Slider.Track
                    h="11px"
                    bg="#EEF0F4"
                    borderWidth="0.5px"
                    borderColor="#5A6478"
                    rounded="full"
                  >
                    <Slider.Range bg="#1F5AFF" />
                  </Slider.Track>
                  <Slider.Thumbs
                    boxSize="17px"
                    bg="#1F5AFF"
                    borderWidth="2px"
                    borderColor="white"
                    boxShadow="0 1px 3px rgba(15,23,41,0.3)"
                  />
                </Slider.Control>
              </Slider.Root>
            )}
          />

          <Flex justify="space-between" aria-hidden="true">
            {TICKS.map((tick) => (
              <Text
                key={tick}
                color="#8A9AB5"
                fontSize="9px"
                lineHeight="13.5px"
              >
                {mb(tick)}
              </Text>
            ))}
          </Flex>
        </Stack>

        {/* Quantidade manual: o mesmo valor do slider. */}
        <Field.Root invalid={!!quotaError} gap="6px">
          <Flex w="full" justify="space-between" align="center">
            <Field.Label htmlFor="storage-quota-mb" {...LABEL}>
              {t("CoverageStorage.quota.manualLabel")}
            </Field.Label>
            <Text color="#A0ABB8" fontSize="9px" lineHeight="13.5px">
              {t("CoverageStorage.quota.manualRange", {
                min: mb(STORAGE_QUOTA_MIN_MB),
                max: mb(STORAGE_QUOTA_MAX_MB),
              })}
            </Text>
          </Flex>
          <Controller
            control={control}
            name="quotaMb"
            render={({ field }) => (
              <InputGroup
                endElement={
                  <Text color="#8A9AB5" fontSize="11px">
                    {t("CoverageStorage.quota.unit")}
                  </Text>
                }
                endElementProps={{ pe: "14px" }}
              >
                <Input
                  id="storage-quota-mb"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  disabled={isSaving}
                  value={
                    Number.isFinite(field.value) ? String(field.value) : ""
                  }
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    field.onChange(digits ? Number(digits) : Number.NaN);
                  }}
                  onBlur={field.onBlur}
                  aria-describedby={
                    quotaError ? "storage-quota-mb-error" : undefined
                  }
                  h="41px"
                  ps="14px"
                  pe="48px"
                  fontWeight={700}
                  {...FIELD}
                  borderColor={quotaError ? "#EF4444" : FIELD.borderColor}
                />
              </InputGroup>
            )}
          />
          {quotaError && (
            <Field.ErrorText
              id="storage-quota-mb-error"
              color="#EF4444"
              fontSize="11px"
            >
              {quotaError}
            </Field.ErrorText>
          )}
        </Field.Root>

        {belowUsage && (
          <Flex
            role="alert"
            align="flex-start"
            gap="8px"
            px="12px"
            py="10px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            rounded="10px"
          >
            <Icon
              as={LuTriangleAlert}
              boxSize="14px"
              color="#D97706"
              mt="2px"
            />
            <Text color="#92400E" fontSize="12px" lineHeight="18px">
              {t("CoverageStorage.quota.belowUsage", {
                used: mb(storage.usedMb),
              })}
            </Text>
          </Flex>
        )}

        {/* Motivo: mínimo de caracteres e registro na auditoria. */}
        <Field.Root invalid={!!reasonError} gap="6px">
          <Field.Label htmlFor="storage-quota-reason" {...LABEL}>
            {t("CoverageStorage.quota.reasonLabel")}
          </Field.Label>
          <Textarea
            id="storage-quota-reason"
            maxLength={STORAGE_QUOTA_REASON_MAX}
            disabled={isSaving}
            placeholder={t("CoverageStorage.quota.reasonPlaceholder")}
            aria-describedby="storage-quota-reason-helper"
            {...register("reason")}
            h="100px"
            px="14px"
            py="10px"
            resize="vertical"
            lineHeight="19.5px"
            _placeholder={{ color: "rgba(15,23,41,0.5)" }}
            {...FIELD}
            borderColor={reasonError ? "#EF4444" : FIELD.borderColor}
          />
          <Text
            id="storage-quota-reason-helper"
            color={reasonError ? "#EF4444" : "#A0ABB8"}
            fontSize="9px"
            lineHeight="13.5px"
          >
            {reasonError ??
              t("CoverageStorage.quota.reasonHelper", {
                count: reason.trim().length,
                min: STORAGE_QUOTA_REASON_MIN,
              })}
          </Text>
        </Field.Root>

        {error && (
          <Text color="#EF4444" fontSize="12px" lineHeight="18px" role="alert">
            {error}
          </Text>
        )}

        <Flex
          justify="flex-end"
          gap="8px"
          pt="16px"
          borderTopWidth="1px"
          borderColor="#E5E8EE"
        >
          <Button
            type="button"
            variant="outline"
            h="36px"
            px="16px"
            rounded="8px"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontSize="12px"
            fontWeight={700}
            disabled={isSaving}
            onClick={onCancel}
          >
            {t("CoverageStorage.quota.cancel")}
          </Button>
          <Button
            type="submit"
            h="36px"
            px="16px"
            rounded="8px"
            bg="#1F5AFF"
            color="white"
            fontSize="12px"
            fontWeight={700}
            loading={isSaving}
            _hover={{ bg: "#1A4FE0" }}
          >
            {t("CoverageStorage.quota.save")}
          </Button>
        </Flex>
      </form>
    </Stack>
  );
}
