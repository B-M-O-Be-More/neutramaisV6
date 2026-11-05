"use client";

import { Box, Button, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import type { ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuRefreshCw } from "react-icons/lu";

import Textarea from "@/components/FormControl/Textarea";
import ReturnEvidencePicker from "@/components/ReturnEvidencePicker";
import { RETURN_FREIGHT_PAYER } from "@/data/returnStatus";
import { returnRequestSchema } from "@/schemas/returns";
import { RETURN_REASONS, RETURN_TYPES } from "@/types/returns";

import { FormReturnRequestProps, ReturnRequestValues } from "./interface";

/** Título de um bloco do formulário; com `htmlFor`, vira o rótulo do campo. */
function SectionLabel({
  id,
  htmlFor,
  children,
}: {
  id?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Text
      id={id}
      color="#0F1729"
      fontSize="13px"
      fontWeight={700}
      lineHeight="19.5px"
      asChild={!!htmlFor}
    >
      {htmlFor ? <label htmlFor={htmlFor}>{children}</label> : children}
    </Text>
  );
}

function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <Text id={id} color="#EF4444" fontSize="12px" lineHeight="18px">
      {children}
    </Text>
  );
}

/**
 * Solicitação de devolução ou troca de um pedido entregue (Figma 2943-31744):
 * tipo, motivo, descrição, comprovações e quem paga o frete de retorno.
 */
export function FormReturnRequest({
  locale,
  isSubmitting,
  onSubmit,
}: FormReturnRequestProps) {
  const { t } = useTranslation();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnRequestValues>({
    resolver: yupResolver(returnRequestSchema),
    mode: "onSubmit",
    defaultValues: { type: "return", description: "", files: [] },
  });

  const type = useWatch({ control, name: "type" });
  const reason = useWatch({ control, name: "reason" });
  const reasonError = errors.reason?.message;
  const filesError = errors.files?.message;

  return (
    <Box
      p={{ base: "20px", md: "24px" }}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="20px">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Stack gap="8px">
                <SimpleGrid
                  role="radiogroup"
                  aria-label={t("Returns.form.typeLabel")}
                  columns={{ base: 1, sm: 2 }}
                  gap="12px"
                >
                  {RETURN_TYPES.map((option) => {
                    const selected = field.value === option;
                    return (
                      <Button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        variant="plain"
                        h="auto"
                        minH="101px"
                        p="16px"
                        flexDirection="column"
                        alignItems="flex-start"
                        justifyContent="center"
                        gap={0}
                        bg={selected ? "#EEF3FF" : "white"}
                        borderWidth="2px"
                        borderColor={selected ? "#1F5AFF" : "#E5E8EE"}
                        rounded="12px"
                        textAlign="left"
                        whiteSpace="normal"
                        _hover={{
                          borderColor: selected ? "#1F5AFF" : "#C7D8FF",
                        }}
                        onClick={() => field.onChange(option)}
                      >
                        <Icon
                          as={LuRefreshCw}
                          boxSize="17px"
                          color={selected ? "#1F5AFF" : "#8A9AB5"}
                        />
                        <Text
                          pt="8px"
                          color="#0F1729"
                          fontSize="13px"
                          fontWeight={700}
                          lineHeight="19.5px"
                        >
                          {t(`Returns.types.${option}.label`)}
                        </Text>
                        <Text
                          pt="4px"
                          color="#8A9AB5"
                          fontSize="11px"
                          fontWeight={400}
                          lineHeight="16.5px"
                        >
                          {t(`Returns.types.${option}.description`)}
                        </Text>
                      </Button>
                    );
                  })}
                </SimpleGrid>
                <Text
                  px="8px"
                  color="#5A6478"
                  fontSize="10px"
                  lineHeight="20px"
                >
                  {t(`Returns.types.${type}.note`)}
                </Text>
              </Stack>
            )}
          />

          <Controller
            control={control}
            name="reason"
            render={({ field }) => (
              <Stack gap="8px">
                <SectionLabel id="return-reason-label">
                  {t("Returns.form.reason")} *
                </SectionLabel>
                <SimpleGrid
                  role="radiogroup"
                  aria-labelledby="return-reason-label"
                  aria-invalid={!!reasonError}
                  aria-describedby={
                    reasonError ? "return-reason-error" : undefined
                  }
                  columns={{ base: 1, sm: 2 }}
                  gap="8px"
                >
                  {RETURN_REASONS.map((option) => {
                    const selected = field.value === option;
                    return (
                      <Button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        variant="plain"
                        h="auto"
                        px="16px"
                        py="12px"
                        justifyContent="flex-start"
                        bg={selected ? "#EEF3FF" : "white"}
                        borderWidth="1px"
                        borderColor={
                          selected
                            ? "#1F5AFF"
                            : reasonError
                              ? "#FECACA"
                              : "#E5E8EE"
                        }
                        rounded="8px"
                        color={selected ? "#1F5AFF" : "#5A6478"}
                        fontSize="12px"
                        fontWeight={selected ? 600 : 400}
                        lineHeight="18px"
                        _hover={{
                          borderColor: selected ? "#1F5AFF" : "#C7D8FF",
                        }}
                        onClick={() => field.onChange(option)}
                        onBlur={field.onBlur}
                      >
                        {t(`Returns.reasons.${option}`)}
                      </Button>
                    );
                  })}
                </SimpleGrid>
                {reasonError && (
                  <ErrorText id="return-reason-error">
                    {t(reasonError)}
                  </ErrorText>
                )}
              </Stack>
            )}
          />

          <Stack gap="8px">
            <SectionLabel htmlFor="return-description">
              {t("Returns.form.description")} *
            </SectionLabel>
            <Textarea
              id="return-description"
              minH="131px"
              p="16px"
              bg="#F8F9FB"
              borderColor="#E5E8EE"
              rounded="12px"
              color="#0F1729"
              fontSize="13px"
              lineHeight="19.5px"
              maxLength={2000}
              _placeholder={{ color: "rgba(15, 23, 41, 0.5)" }}
              placeholder={t("Returns.form.descriptionPlaceholder")}
              error={
                errors.description?.message
                  ? t(errors.description.message)
                  : undefined
              }
              {...register("description")}
            />
          </Stack>

          <Controller
            control={control}
            name="files"
            render={({ field }) => (
              <ReturnEvidencePicker
                id="return-evidence"
                files={field.value}
                onChange={field.onChange}
                locale={locale}
                disabled={isSubmitting}
                error={filesError ? t(filesError) : undefined}
              />
            )}
          />

          <Stack
            gap="4px"
            p="16px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            rounded="12px"
            color="#92400E"
            aria-live="polite"
          >
            <Text fontSize="12px" fontWeight={700} lineHeight="18px">
              {t("Returns.form.freightTitle")}
            </Text>
            <Text fontSize="11px" lineHeight="16.5px">
              {reason
                ? t("Returns.freight.summary", {
                    payer: t(
                      `Returns.freight.payers.${RETURN_FREIGHT_PAYER[reason]}`,
                    ),
                    reason: t(`Returns.freight.reasons.${reason}`),
                  })
                : t("Returns.form.freightPending")}
            </Text>
          </Stack>

          <Button
            type="submit"
            mt="4px"
            h="47.5px"
            bg="#1F5AFF"
            rounded="12px"
            color="white"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            _hover={{ bg: "#1646CC" }}
            loading={isSubmitting}
          >
            {t(`Returns.types.${type}.submit`)}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
