"use client";

import { Box, Button, Flex, Grid, Icon, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuChevronLeft, LuCircleCheck } from "react-icons/lu";

import SellerOfferBasicInfoStep from "@/components/SellerOfferBasicInfoStep";
import SellerOfferCoverageStep from "@/components/SellerOfferCoverageStep";
import SellerOfferPreview from "@/components/SellerOfferPreview";
import SellerOfferPricingStep from "@/components/SellerOfferPricingStep";
import SellerOfferReviewStep, {
  type SellerOfferPublishNotice,
} from "@/components/SellerOfferReviewStep";
import SellerOfferTechnicalSpecsStep from "@/components/SellerOfferTechnicalSpecsStep";
import Stepper from "@/components/Stepper";
import {
  formatHours,
  formatMoney,
  formatPercent,
} from "@/functions/offerFormat";
import { parseDecimal } from "@/functions/parseDecimal";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { usePublishOffering } from "@/hooks/usePublishOffering";
import { useUpdateOffering } from "@/hooks/useUpdateOffering";
import {
  sellerOfferSchema,
  SELLER_OFFER_DEFAULTS,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

import { FormSellerOfferProps } from "./interface";

const STEPS: { titleKey: string; fields: (keyof SellerOfferValues)[] }[] = [
  {
    titleKey: "SellerOfferCreate.steps.coverage",
    fields: [
      "category",
      "coverageVersionId",
      "coverageMode",
      "publicGeometry",
      "locations",
      "coverageRegion",
    ],
  },
  {
    titleKey: "SellerOfferCreate.steps.basicInfo",
    fields: ["image", "name", "shortDescription", "description"],
  },
  {
    titleKey: "SellerOfferCreate.steps.technicalSpecs",
    fields: [
      "speedValue",
      "speedUnit",
      "maxLatency",
      "acceptanceSla",
      "technicalSla",
      "deliveryTime",
      "hardwareManufacturer",
      "hardwareModel",
      "hardwareCondition",
      "hardwareWarranty",
      "hardwareSerialization",
      "numberingResourceType",
      "numberingBlock",
      "numberingHolder",
    ],
  },
  {
    titleKey: "SellerOfferCreate.steps.pricing",
    fields: [
      "pricingModel",
      "currency",
      "price",
      "setupFee",
      "stock",
      "cancellationTerms",
      "validUntil",
      "sponsored",
    ],
  },
  { titleKey: "SellerOfferCreate.steps.review", fields: [] },
];

const ALL_FIELDS = STEPS.flatMap((item) => item.fields);

/**
 * Assistente de criação de oferta (Figma 2664-55368): indicador de etapas,
 * formulário à esquerda e preview do marketplace à direita.
 *
 * As etapas ficam montadas (só a atual visível) para não perder o KMZ
 * enviado nem o mapa ao voltar. A oferta só é criada na revisão final
 * ("Publicar oferta agora") — ver `usePublishOffering`. Depois de criada, o
 * assistente não volta mais às etapas: um rascunho só é editado em Minhas
 * Ofertas, e uma nova tentativa retoma a publicação sem duplicar a oferta.
 */
export function FormSellerOffer(props: FormSellerOfferProps) {
  const { organizationId, locale, onCancel } = props;
  const isEdit = props.mode === "edit";
  const initialValues = isEdit ? props.initialValues : undefined;
  const { t } = useTranslation();
  const [step, setStep] = React.useState(0);
  const lastStep = STEPS.length - 1;
  const isReview = step === lastStep;

  const {
    control,
    register,
    trigger,
    subscribe,
    getValues,
    formState: { errors },
  } = useForm<SellerOfferValues>({
    resolver: yupResolver(sellerOfferSchema),
    // Valida ao avançar (cada etapa pelo `trigger`); depois disso, o efeito
    // abaixo revalida a etapa a cada mudança.
    mode: "onSubmit",
    defaultValues: initialValues ?? SELLER_OFFER_DEFAULTS,
  });

  // Etapas que já tentaram avançar: os erros delas acompanham a digitação.
  // Revalida todas as já validadas porque há regras entre etapas (a categoria
  // decide se o KMZ e a velocidade são obrigatórios).
  // Na edição os dados já existem: os erros acompanham desde o início.
  const [validatedSteps, setValidatedSteps] = React.useState<number[]>(() =>
    isEdit ? STEPS.map((_, index) => index) : [],
  );
  React.useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => {
          if (!validatedSteps.length) return;
          void trigger(validatedSteps.flatMap((index) => STEPS[index].fields));
        },
      }),
    [subscribe, trigger, validatedSteps],
  );

  const [
    category,
    name,
    shortDescription,
    image,
    acceptanceSla,
    technicalSla,
    price,
    currency,
    pricingModel,
  ] = useWatch({
    control,
    name: [
      "category",
      "name",
      "shortDescription",
      "image",
      "acceptanceSla",
      "technicalSla",
      "price",
      "currency",
      "pricingModel",
    ],
  });
  const imageUrl = useObjectUrl(image);

  const { publish, isPublishing, createdOfferingId } = usePublishOffering();
  const { save, isSaving } = useUpdateOffering();
  const isSubmitting = isPublishing || isSaving;
  const [notice, setNotice] = React.useState<SellerOfferPublishNotice | null>(
    null,
  );
  // Depois de criada, a oferta não é mais editada pelo assistente.
  const isLocked = !!createdOfferingId;

  const goTo = (target: number) => {
    // Na edição, qualquer etapa. Na criação, só volta para etapas visitadas,
    // e nunca depois de criar a oferta.
    if (isEdit || (!isLocked && target <= step)) setStep(target);
  };

  const submitSave = async () => {
    if (props.mode !== "edit") return;
    if (!(await trigger(ALL_FIELDS))) {
      setNotice({
        tone: "error",
        messages: [t("SellerOfferCreate.publish.errors.reviewInvalid")],
      });
      return;
    }

    setNotice(null);
    const outcome = await save(props.offering, getValues());
    if (outcome.status === "saved") {
      props.onSaved(outcome.warnings.map((key) => t(key)));
      return;
    }
    setNotice({ tone: "error", messages: [t(outcome.errorKey)] });
  };

  const submitPublish = async () => {
    if (props.mode === "edit") return;
    const { onPublished } = props;
    // Revalida tudo antes de criar: alguma regra pode ter mudado de etapa.
    if (!isLocked && !(await trigger(ALL_FIELDS))) {
      setNotice({
        tone: "error",
        messages: [t("SellerOfferCreate.publish.errors.reviewInvalid")],
      });
      return;
    }

    setNotice(null);
    const outcome = await publish(getValues());

    if (outcome.status === "published") {
      const values = getValues();
      onPublished({
        offeringId: outcome.offeringId,
        name: values.name.trim(),
        categoryLabel: values.category
          ? t(`SellerOfferCreate.categories.${values.category}.label`)
          : "",
        price: formatMoney(values.price, values.currency, locale) ?? "",
        acceptanceSla: formatHours(values.acceptanceSla) ?? "",
        warnings: outcome.warnings.map((key) => t(key)),
      });
      return;
    }

    if (outcome.status === "failed") {
      setNotice({ tone: "error", messages: [t(outcome.errorKey)] });
      return;
    }

    setNotice({
      tone: "warning",
      savedAsDraft: true,
      messages: [
        t("SellerOfferCreate.publish.savedAsDraft"),
        t(outcome.reasonKey),
        ...outcome.warnings.map((key) => t(key)),
      ],
    });
  };

  const next = async () => {
    if (isReview) {
      await (isEdit ? submitSave() : submitPublish());
      return;
    }
    setValidatedSteps((current) =>
      current.includes(step) ? current : [...current, step],
    );
    const valid = await trigger(STEPS[step].fields);
    if (valid) setStep((current) => Math.min(current + 1, lastStep));
  };

  const prev = () => {
    if (step === 0) onCancel();
    else setStep((current) => current - 1);
  };

  const priceSuffix =
    pricingModel === "monthly" || pricingModel === "annual"
      ? t(`SellerOfferCreate.preview.priceSuffix.${pricingModel}`)
      : undefined;

  return (
    <Stack gap="24px">
      <Box px={{ base: 0, md: "8px" }} overflowX="auto">
        <Box minW="560px">
          <Stepper
            steps={STEPS.map((item) => t(item.titleKey))}
            step={step}
            onStepClick={goTo}
            variant="compact"
            accentColor="#8B5CF6"
          />
        </Box>
      </Box>

      <Grid
        templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 320px" }}
        gap="32px"
        alignItems="start"
      >
        <Stack
          asChild
          gap="24px"
          p={{ base: "20px", md: "29px" }}
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="16px"
          minW={0}
        >
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void next();
            }}
          >
            <Box hidden={step !== 0}>
              <SellerOfferCoverageStep
                control={control}
                register={register}
                errors={errors}
                organizationId={organizationId}
                boundVersionId={
                  isEdit ? (props.offering.coverageVersionId ?? null) : null
                }
                locale={locale}
              />
            </Box>

            <Box hidden={step !== 1}>
              <SellerOfferBasicInfoStep
                control={control}
                register={register}
                errors={errors}
              />
            </Box>

            <Box hidden={step !== 2}>
              <SellerOfferTechnicalSpecsStep
                control={control}
                register={register}
                errors={errors}
              />
            </Box>

            <Box hidden={step !== 3}>
              <SellerOfferPricingStep
                control={control}
                register={register}
                errors={errors}
              />
            </Box>

            {isReview && (
              <SellerOfferReviewStep
                control={control}
                locale={locale}
                notice={notice}
              />
            )}

            <Flex
              align="stretch"
              justify="space-between"
              gap="12px"
              pt="17px"
              borderTopWidth="1px"
              borderColor="#F4F6F9"
            >
              <Button
                type="button"
                variant="outline"
                h="47px"
                px="21px"
                gap="8px"
                rounded="14px"
                borderColor="#E5E8EE"
                color="#5A6478"
                fontSize="14px"
                fontWeight={500}
                disabled={isLocked || isSubmitting}
                _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                onClick={prev}
              >
                <Icon as={LuChevronLeft} boxSize="14px" />
                {t("SellerOfferCreate.actions.back")}
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={
                  isEdit
                    ? t("SellerOfferEdit.actions.saving")
                    : t("SellerOfferCreate.actions.publishing")
                }
                h="47px"
                w={{ base: "auto", md: isReview ? "394px" : "355px" }}
                px="21px"
                gap="8px"
                rounded="14px"
                bg="#8B5CF6"
                color="white"
                fontSize="14px"
                fontWeight={700}
                boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
                _hover={{ bg: "#7C4DEB" }}
              >
                {isReview ? (
                  <>
                    <Icon as={LuCircleCheck} boxSize="15px" />
                    {isEdit
                      ? t("SellerOfferEdit.actions.save")
                      : isLocked
                        ? t("SellerOfferCreate.actions.retryPublish")
                        : t("SellerOfferCreate.actions.publish")}
                  </>
                ) : (
                  <>
                    {t("SellerOfferCreate.actions.continue")}
                    <Icon as={LuArrowRight} boxSize="15px" />
                  </>
                )}
              </Button>
            </Flex>
          </form>
        </Stack>

        <Box position={{ xl: "sticky" }} top="24px">
          <SellerOfferPreview
            category={category || null}
            name={name}
            description={shortDescription}
            imageUrl={imageUrl}
            monthlyPrice={parseDecimal(price)}
            currency={currency}
            priceSuffix={priceSuffix}
            technicalSla={formatPercent(technicalSla, locale)}
            acceptanceSla={formatHours(acceptanceSla)}
            locale={locale}
          />
        </Box>
      </Grid>
    </Stack>
  );
}
