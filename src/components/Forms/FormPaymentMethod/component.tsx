"use client";

import { Button, Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuCheck, LuCreditCard, LuPlus, LuShield, LuZap } from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import WalletHint from "@/components/WalletHint";
import {
  CARD_CVV_MASK,
  CARD_EXPIRY_MASK,
  CARD_NUMBER_MASK,
  PAYMENT_METHOD_TYPES,
  PIX_KEY_MASKS,
  PIX_KEY_TYPES,
  paymentMethodSchema,
  type PaymentMethodType,
  type PaymentMethodValues,
  type PixKeyType,
} from "@/schemas/paymentMethod";

import { FormPaymentMethodProps } from "./interface";

const TYPE_STYLE: Record<
  PaymentMethodType,
  { icon: IconType; color: string; border: string }
> = {
  pix: { icon: LuZap, color: "#10B981", border: "#AAECD5" },
  card: { icon: LuCreditCard, color: "#1F5AFF", border: "#C7D8FF" },
};

const SECTION_TITLE = {
  color: "#5A6478",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "19.5px",
} as const;

// Campos do design: fundo cinza-claro e cantos de 14px.
const FIELD = { h: "45px", bg: "#F8F9FB", fontSize: "13px" } as const;

/**
 * Cadastro de método de pagamento (Figma 2208-37661 / 2215-20243): escolhe
 * PIX ou cartão e preenche os dados do tipo. O formulário só valida — quem
 * usa decide o que fazer com os dados (`onSubmit`).
 */
export function FormPaymentMethod({
  initialType = "pix",
  isSubmitting = false,
  onSubmit,
  onCancel,
}: FormPaymentMethodProps) {
  const { t } = useTranslation();
  const tError = (message?: string) => (message ? t(message) : undefined);

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<PaymentMethodValues>({
    resolver: yupResolver(paymentMethodSchema),
    defaultValues: {
      ...paymentMethodSchema.getDefault(),
      methodType: initialType,
    },
  });

  const methodType = useWatch({ control, name: "methodType" });
  const pixKeyType = useWatch({ control, name: "pixKeyType" });

  const selectType = (type: PaymentMethodType) => {
    setValue("methodType", type);
    clearErrors();
  };

  const selectPixKeyType = (type: PixKeyType) => {
    setValue("pixKeyType", type);
    // A máscara muda com o tipo: a chave digitada não vale para o novo.
    setValue("pixKey", "");
    clearErrors("pixKey");
  };

  return (
    <form noValidate onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Stack gap="24px">
        <Stack gap="12px">
          <Text {...SECTION_TITLE}>{t("Wallet.addMethod.typeStep")}</Text>
          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            gap="16px"
            role="radiogroup"
            aria-label={t("Wallet.addMethod.typeStep")}
          >
            {PAYMENT_METHOD_TYPES.map((type) => {
              const style = TYPE_STYLE[type];
              const isSelected = methodType === type;
              return (
                <Stack
                  key={type}
                  asChild
                  align="center"
                  gap="12px"
                  p="20px"
                  bg={isSelected ? "white" : "#F8F9FB"}
                  borderWidth="2px"
                  borderColor={isSelected ? style.border : "#E5E8EE"}
                  rounded="15px"
                  boxShadow={
                    isSelected
                      ? "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
                      : undefined
                  }
                  cursor="pointer"
                  textAlign="center"
                  transition="border-color 0.15s, background 0.15s"
                  _hover={{ borderColor: style.border }}
                  _focusVisible={{
                    outline: "2px solid",
                    outlineColor: style.color,
                  }}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => selectType(type)}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      boxSize="40px"
                      bg="white"
                      borderWidth="1px"
                      borderColor="#E5E8EE"
                      rounded="15px"
                    >
                      <Icon
                        as={style.icon}
                        boxSize="20px"
                        color={style.color}
                      />
                    </Flex>
                    <Stack gap="4px" maxW="251px">
                      <Text
                        color={isSelected ? style.color : "#0F1729"}
                        fontSize="13px"
                        fontWeight={700}
                        lineHeight="19.5px"
                      >
                        {t(`Wallet.addMethod.types.${type}.title`)}
                      </Text>
                      <Text
                        color="#A0ABB8"
                        fontSize="10px"
                        fontWeight={500}
                        lineHeight="14px"
                      >
                        {t(`Wallet.addMethod.types.${type}.description`)}
                      </Text>
                    </Stack>
                    {isSelected && (
                      <Flex
                        align="center"
                        justify="center"
                        boxSize="20px"
                        bg={style.color}
                        rounded="full"
                      >
                        <Icon as={LuCheck} boxSize="12px" color="white" />
                      </Flex>
                    )}
                  </button>
                </Stack>
              );
            })}
          </SimpleGrid>
        </Stack>

        <Stack
          gap="20px"
          p="24px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
        >
          <Text {...SECTION_TITLE}>{t("Wallet.addMethod.dataStep")}</Text>

          {methodType === "pix" ? (
            <Stack gap="16px">
              <Stack gap="8px">
                <Text color="#5A6478" fontSize="12px" fontWeight={600}>
                  {t("Wallet.addMethod.pix.keyType")}
                </Text>
                <Flex
                  gap="8px"
                  wrap="wrap"
                  role="radiogroup"
                  aria-label={t("Wallet.addMethod.pix.keyType")}
                >
                  {PIX_KEY_TYPES.map((type) => {
                    const isActive = pixKeyType === type;
                    return (
                      <Button
                        key={type}
                        role="radio"
                        aria-checked={isActive}
                        variant="plain"
                        h="33px"
                        px="10px"
                        bg={isActive ? "#10B981" : "white"}
                        borderWidth="1px"
                        borderColor={isActive ? "#10B981" : "#E5E8EE"}
                        rounded="10px"
                        color={isActive ? "white" : "#5A6478"}
                        fontSize="12px"
                        fontWeight={isActive ? 700 : 400}
                        onClick={() => selectPixKeyType(type)}
                      >
                        {t(`Wallet.addMethod.pix.keyTypes.${type}`)}
                      </Button>
                    );
                  })}
                </Flex>
              </Stack>

              <Controller
                control={control}
                name="pixKey"
                render={({ field }) => (
                  <Input
                    // Remonta ao trocar o tipo: a máscara do IMask é fixada na montagem.
                    key={pixKeyType}
                    {...FIELD}
                    label={t("Wallet.addMethod.pix.keyLabel", {
                      type: t(`Wallet.addMethod.pix.keyTypes.${pixKeyType}`),
                    })}
                    required
                    name={field.name}
                    type={pixKeyType === "email" ? "email" : "text"}
                    inputMode={
                      pixKeyType === "email" || pixKeyType === "random"
                        ? undefined
                        : "numeric"
                    }
                    placeholder={t(
                      `Wallet.addMethod.pix.placeholders.${pixKeyType}`,
                    )}
                    mask={PIX_KEY_MASKS[pixKeyType]}
                    value={field.value}
                    onAccept={field.onChange}
                    onChange={
                      PIX_KEY_MASKS[pixKeyType] ? undefined : field.onChange
                    }
                    onBlur={field.onBlur}
                    error={tError(errors.pixKey?.message)}
                  />
                )}
              />

              <WalletHint
                tone="green"
                description={t("Wallet.addMethod.pix.hint")}
              />
            </Stack>
          ) : (
            <Stack gap="16px">
              <Controller
                control={control}
                name="cardNumber"
                render={({ field }) => (
                  <Input
                    {...FIELD}
                    fontFamily="mono"
                    label={t("Wallet.addMethod.card.number")}
                    required
                    name={field.name}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    mask={CARD_NUMBER_MASK}
                    value={field.value}
                    onAccept={field.onChange}
                    onBlur={field.onBlur}
                    error={tError(errors.cardNumber?.message)}
                  />
                )}
              />
              <Controller
                control={control}
                name="cardName"
                render={({ field }) => (
                  <Input
                    {...FIELD}
                    label={t("Wallet.addMethod.card.name")}
                    required
                    name={field.name}
                    autoComplete="cc-name"
                    textTransform="uppercase"
                    placeholder={t("Wallet.addMethod.card.namePlaceholder")}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(event.target.value.toUpperCase())
                    }
                    onBlur={field.onBlur}
                    error={tError(errors.cardName?.message)}
                  />
                )}
              />
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap="16px">
                <Controller
                  control={control}
                  name="cardExpiry"
                  render={({ field }) => (
                    <Input
                      {...FIELD}
                      label={t("Wallet.addMethod.card.expiry")}
                      required
                      name={field.name}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder={t("Wallet.addMethod.card.expiryPlaceholder")}
                      mask={CARD_EXPIRY_MASK}
                      value={field.value}
                      onAccept={field.onChange}
                      onBlur={field.onBlur}
                      error={tError(errors.cardExpiry?.message)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="cardCvv"
                  render={({ field }) => (
                    <Input
                      {...FIELD}
                      label={t("Wallet.addMethod.card.cvv")}
                      required
                      name={field.name}
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="000"
                      mask={CARD_CVV_MASK}
                      value={field.value}
                      onAccept={field.onChange}
                      onBlur={field.onBlur}
                      error={tError(errors.cardCvv?.message)}
                    />
                  )}
                />
              </SimpleGrid>

              <WalletHint
                tone="blue"
                icon={LuShield}
                description={t("Wallet.addMethod.card.hint")}
              />
            </Stack>
          )}

          <Flex
            justify="space-between"
            gap="12px"
            pt="8px"
            borderTopWidth="1px"
            borderColor="#F4F6F9"
          >
            <Button
              type="button"
              variant="outline"
              h="47px"
              minW="110px"
              px="12px"
              borderColor="#E5E8EE"
              rounded="15px"
              color="#5A6478"
              fontSize="14px"
              fontWeight={600}
              onClick={onCancel}
            >
              {t("Wallet.addMethod.cancel")}
            </Button>
            <Button
              type="submit"
              h="47px"
              px="16px"
              gap="8px"
              bg="#1F5AFF"
              rounded="15px"
              color="white"
              fontSize="14px"
              fontWeight={700}
              loading={isSubmitting}
            >
              <Icon as={LuPlus} boxSize="15px" />
              {t("Wallet.addMethod.submit")}
            </Button>
          </Flex>
        </Stack>
      </Stack>
    </form>
  );
}
