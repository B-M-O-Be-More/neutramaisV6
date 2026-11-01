"use client";

import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuCircleAlert,
  LuFileText,
  LuMessageSquare,
  LuPackage,
  LuPaperclip,
  LuUpload,
  LuX,
  LuZap,
} from "react-icons/lu";

import { formatFileSize } from "@/functions/formatFileSize";
import {
  supportTicketSchema,
  TICKET_ATTACHMENTS_MAX,
  TICKET_DESCRIPTION_MIN,
  type SupportTicketValues,
} from "@/schemas/supportTicket";
import {
  NEW_TICKET_CATEGORIES,
  NEW_TICKET_PRIORITIES,
  type NewTicketCategory,
} from "@/services/supportTickets.service";

import { FormSupportTicketProps } from "./interface";

const CATEGORY_ICONS: Record<NewTicketCategory, IconType> = {
  provisioning: LuZap,
  slaQuality: LuCircleAlert,
  fiscal: LuFileText,
  contracts: LuFileText,
  generalQuestion: LuPackage,
  other: LuMessageSquare,
};

/** Imagens, PDFs e logs. */
const ATTACHMENT_ACCEPT = "image/*,application/pdf,text/plain,.log,.txt";

const PURPLE = "#8B5CF6";

// Mantém o input acessível ao teclado sem aparecer.
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

function FieldLabel({
  htmlFor,
  required = false,
  hint,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      {children}
      {required && " *"}
      {hint && (
        <Text as="span" color="#8A9AB5" fontWeight={400}>
          {" "}
          {hint}
        </Text>
      )}
    </>
  );
  return htmlFor ? (
    <Text
      asChild
      color="#0F1729"
      fontSize="13px"
      fontWeight={700}
      lineHeight="19.5px"
    >
      <label htmlFor={htmlFor}>{content}</label>
    </Text>
  ) : (
    <Text
      as="legend"
      color="#0F1729"
      fontSize="13px"
      fontWeight={700}
      lineHeight="19.5px"
      mb="8px"
    >
      {content}
    </Text>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <Text
      id={id}
      role="alert"
      color="#EF4444"
      fontSize="12px"
      lineHeight="18px"
    >
      {message}
    </Text>
  );
}

const INPUT_STYLE = {
  h: "44px",
  px: "16px",
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "12px",
  color: "#0F1729",
  fontSize: "13px",
  _placeholder: { color: "#A0ABB8" },
} as const;

/**
 * Abrir ticket de suporte (Figma 3100-50362): categoria, prioridade, título,
 * descrição, pedido ou oferta relacionados e anexos.
 */
export function FormSupportTicket({
  locale,
  onSubmit,
}: FormSupportTicketProps) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const tError = (message?: string) => (message ? t(message) : undefined);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketValues>({
    resolver: yupResolver(supportTicketSchema),
    defaultValues: supportTicketSchema.getDefault(),
  });

  const description = useWatch({ control, name: "description" }) ?? "";
  const attachments = useWatch({ control, name: "attachments" }) ?? [];

  const setAttachments = (files: File[]) =>
    setValue("attachments", files.slice(0, TICKET_ATTACHMENTS_MAX), {
      shouldValidate: true,
    });

  const addFiles = (list: FileList | null) => {
    if (list) setAttachments([...attachments, ...Array.from(list)]);
  };

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitError(
      await onSubmit({
        category: values.category,
        priority: values.priority,
        title: values.title,
        description: values.description,
        reference: values.reference,
        attachments: values.attachments,
      }),
    );
  });

  return (
    <Stack asChild gap="24px">
      <form noValidate onSubmit={submit}>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Box
              as="fieldset"
              aria-describedby={
                errors.category ? "ticket-category-error" : undefined
              }
            >
              <FieldLabel required>{t("TicketNew.category")}</FieldLabel>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="10px">
                {NEW_TICKET_CATEGORIES.map((category) => {
                  const isSelected = field.value === category;
                  return (
                    <chakra.label
                      key={category}
                      display="flex"
                      alignItems="center"
                      gap="12px"
                      px="16px"
                      py="12px"
                      bg={isSelected ? "#F8F5FF" : "white"}
                      borderWidth="1.5px"
                      borderColor={isSelected ? PURPLE : "#E5E8EE"}
                      rounded="12px"
                      cursor="pointer"
                      _hover={{ borderColor: isSelected ? PURPLE : "#C4CDD8" }}
                      _focusWithin={{
                        outline: `2px solid ${PURPLE}`,
                        outlineOffset: "2px",
                      }}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={category}
                        checked={isSelected}
                        onChange={() => field.onChange(category)}
                        onBlur={field.onBlur}
                        style={VISUALLY_HIDDEN}
                      />
                      <Icon
                        as={CATEGORY_ICONS[category]}
                        boxSize="14px"
                        flexShrink={0}
                        color={isSelected ? PURPLE : "#8A9AB5"}
                        aria-hidden
                      />
                      <Stack gap="0" flex="1" minW={0}>
                        <Text
                          color="#0F1729"
                          fontSize="13px"
                          fontWeight={600}
                          lineHeight="19.5px"
                        >
                          {t(`TicketNew.categories.${category}.title`)}
                        </Text>
                        <Text
                          color="#8A9AB5"
                          fontSize="11px"
                          lineHeight="16.5px"
                        >
                          {t(`TicketNew.categories.${category}.description`)}
                        </Text>
                      </Stack>
                      <Box
                        boxSize="16px"
                        flexShrink={0}
                        rounded="full"
                        borderWidth={isSelected ? "5px" : "1.5px"}
                        borderColor={isSelected ? PURPLE : "#A0ABB8"}
                        aria-hidden
                      />
                    </chakra.label>
                  );
                })}
              </SimpleGrid>
              <Box mt="6px">
                <FieldError
                  id="ticket-category-error"
                  message={tError(errors.category?.message)}
                />
              </Box>
            </Box>
          )}
        />

        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Box as="fieldset">
              <FieldLabel required>{t("TicketNew.priority")}</FieldLabel>
              <Flex gap="10px" wrap="wrap">
                {NEW_TICKET_PRIORITIES.map((priority) => {
                  const isSelected = field.value === priority;
                  return (
                    <chakra.label
                      key={priority}
                      display="flex"
                      alignItems="center"
                      px="16px"
                      h="48px"
                      bg={isSelected ? "#EEF3FF" : "white"}
                      borderWidth="1.5px"
                      borderColor={isSelected ? "#1F5AFF" : "#E5E8EE"}
                      rounded="12px"
                      color={isSelected ? "#1F5AFF" : "#0F1729"}
                      fontSize="12px"
                      fontWeight={700}
                      cursor="pointer"
                      _focusWithin={{
                        outline: "2px solid #1F5AFF",
                        outlineOffset: "2px",
                      }}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        value={priority}
                        checked={isSelected}
                        onChange={() => field.onChange(priority)}
                        onBlur={field.onBlur}
                        style={VISUALLY_HIDDEN}
                      />
                      {t("TicketNew.priorityOption", {
                        code: priority,
                        label: t(`Tickets.priorities.${priority}.label`),
                      })}
                    </chakra.label>
                  );
                })}
              </Flex>
            </Box>
          )}
        />

        <Stack gap="8px">
          <FieldLabel htmlFor="ticket-title" required>
            {t("TicketNew.title")}
          </FieldLabel>
          <Input
            id="ticket-title"
            placeholder={t("TicketNew.titlePlaceholder")}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "ticket-title-error" : undefined}
            {...INPUT_STYLE}
            {...register("title")}
          />
          <FieldError
            id="ticket-title-error"
            message={tError(errors.title?.message)}
          />
        </Stack>

        <Stack gap="8px">
          <FieldLabel
            htmlFor="ticket-description"
            required
            hint={t("TicketNew.descriptionHint", {
              count: TICKET_DESCRIPTION_MIN,
            })}
          >
            {t("TicketNew.description")}
          </FieldLabel>
          <Textarea
            id="ticket-description"
            rows={5}
            placeholder={t("TicketNew.descriptionPlaceholder")}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description
                ? "ticket-description-error ticket-description-count"
                : "ticket-description-count"
            }
            {...INPUT_STYLE}
            h="auto"
            py="12px"
            resize="vertical"
            {...register("description")}
          />
          <Flex justify="space-between" gap="12px">
            <FieldError
              id="ticket-description-error"
              message={tError(errors.description?.message)}
            />
            <Text
              id="ticket-description-count"
              ms="auto"
              color="#A0ABB8"
              fontSize="11px"
              lineHeight="16.5px"
            >
              {t("TicketNew.characters", { count: description.length })}
            </Text>
          </Flex>
        </Stack>

        <Stack gap="8px">
          <FieldLabel htmlFor="ticket-reference" hint={t("TicketNew.optional")}>
            {t("TicketNew.reference")}
          </FieldLabel>
          <Input
            id="ticket-reference"
            placeholder={t("TicketNew.referencePlaceholder")}
            aria-invalid={!!errors.reference}
            aria-describedby={
              errors.reference ? "ticket-reference-error" : undefined
            }
            {...INPUT_STYLE}
            {...register("reference")}
          />
          <FieldError
            id="ticket-reference-error"
            message={tError(errors.reference?.message)}
          />
        </Stack>

        <Stack gap="8px">
          <FieldLabel
            htmlFor="ticket-attachments"
            hint={t("TicketNew.optional")}
          >
            {t("TicketNew.attachments")}
          </FieldLabel>
          <Stack
            asChild
            align="center"
            gap="6px"
            p="32px"
            bg={isDragging ? "#F8F5FF" : "white"}
            borderWidth="1.5px"
            borderStyle="dashed"
            borderColor={
              errors.attachments ? "#EF4444" : isDragging ? PURPLE : "#D5DBE5"
            }
            rounded="12px"
            textAlign="center"
            cursor="pointer"
            _focusWithin={{
              outline: `2px solid ${PURPLE}`,
              outlineOffset: "2px",
            }}
            onDragOver={(event: React.DragEvent) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event: React.DragEvent) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <label>
              <input
                id="ticket-attachments"
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                aria-describedby="ticket-attachments-hint"
                style={VISUALLY_HIDDEN}
                onChange={(event) => {
                  addFiles(event.target.files);
                  // Permite escolher o mesmo arquivo de novo depois de remover.
                  event.target.value = "";
                }}
              />
              <Icon as={LuUpload} boxSize="18px" color="#A0ABB8" aria-hidden />
              <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
                {t("TicketNew.dropzone")}
              </Text>
              <Text
                id="ticket-attachments-hint"
                color="#A0ABB8"
                fontSize="11px"
                lineHeight="16.5px"
              >
                {t("TicketNew.dropzoneHint")}
              </Text>
            </label>
          </Stack>
          <FieldError
            id="ticket-attachments-error"
            message={tError(errors.attachments?.message)}
          />
          {attachments.length > 0 && (
            <Stack as="ul" gap="8px" listStyleType="none">
              {attachments.map((file, index) => (
                <Flex
                  as="li"
                  key={`${file.name}-${index}`}
                  align="center"
                  gap="10px"
                  px="12px"
                  py="8px"
                  bg="#F8F9FB"
                  borderWidth="1px"
                  borderColor="#E5E8EE"
                  rounded="10px"
                >
                  <Icon
                    as={LuPaperclip}
                    boxSize="14px"
                    flexShrink={0}
                    color="#8A9AB5"
                    aria-hidden
                  />
                  <Text
                    flex="1"
                    minW={0}
                    truncate
                    color="#0F1729"
                    fontSize="12px"
                    fontWeight={600}
                  >
                    {file.name}
                  </Text>
                  <Text color="#A0ABB8" fontSize="11px" flexShrink={0}>
                    {formatFileSize(file.size, locale)}
                  </Text>
                  <Button
                    variant="plain"
                    size="xs"
                    minW="24px"
                    h="24px"
                    p={0}
                    color="#8A9AB5"
                    _hover={{ color: "#EF4444" }}
                    aria-label={t("TicketNew.removeFile", { name: file.name })}
                    onClick={() =>
                      setAttachments(attachments.filter((_, i) => i !== index))
                    }
                  >
                    <Icon as={LuX} boxSize="14px" />
                  </Button>
                </Flex>
              ))}
            </Stack>
          )}
        </Stack>

        {submitError && (
          <Text
            role="alert"
            color="#EF4444"
            fontSize="13px"
            lineHeight="19.5px"
          >
            {t(submitError)}
          </Text>
        )}

        <Button
          type="submit"
          h="48px"
          gap="8px"
          bg={PURPLE}
          rounded="12px"
          color="white"
          fontSize="14px"
          fontWeight={700}
          _hover={{ bg: "#7C4DEB" }}
          loading={isSubmitting}
        >
          {t("TicketNew.submit")}
          <Icon as={LuArrowRight} boxSize="15px" />
        </Button>
      </form>
    </Stack>
  );
}
