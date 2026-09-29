"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

import Input from "@/components/FormControl/Input";
import Select from "@/components/FormControl/Select";
import Stepper from "@/components/Stepper";
import { getPasswordStrength } from "@/functions/passwordStrength";
import { BRAZILIAN_UFS } from "@/data/brazilianStates";
import { DIAL_CODES } from "@/data/dialCodes";
import { TAX_ID_MASKS } from "@/data/taxIdMasks";
import { useCountries } from "@/hooks/useCountries/hook";
import { useRegisterFlow } from "@/contexts/RegisterFlowContext";
import { useRegisterOrganization } from "@/hooks/useRegisterOrganization/hook";
import { registerPayerSchema } from "@/schemas/register";
import { SECTOR_VALUES } from "@/types/register";

import { FormRegisterPayerProps, RegisterPayerValues } from "./interface";
import KycBasicNotice from "@/components/KycBasicNotice";

const STEPS: { titleKey: string; fields: (keyof RegisterPayerValues)[] }[] = [
  {
    titleKey: "Register.steps.companyData",
    fields: ["companyName", "document", "country", "phone", "sector"],
  },
  {
    titleKey: "Register.steps.address",
    fields: [
      "zipCode",
      "street",
      "number",
      "complement",
      "neighborhood",
      "city",
      "state",
    ],
  },
  {
    titleKey: "Register.steps.responsible",
    fields: [
      "responsibleName",
      "email",
      "password",
      "confirmPassword",
      "acceptTerms",
    ],
  },
];

export function FormRegisterPayer({ onSubmit }: FormRegisterPayerProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = React.useState(0);
  const lastStep = STEPS.length - 1;

  // Reflete a etapa atual na barra lateral. As 3 sub-etapas internas
  // (empresa, endereço, responsável) são as etapas 2, 3 e 4 do fluxo do Figma,
  // portanto o índice global é +1 (a etapa 1 é a seleção do tipo de conta).
  const { setStep: setFlowStep } = useRegisterFlow();
  React.useEffect(() => {
    setFlowStep(step + 1);
  }, [step, setFlowStep]);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPayerValues>({
    resolver: yupResolver(registerPayerSchema),
    mode: "onBlur",
    defaultValues: {
      companyName: "",
      document: "",
      country: "",
      phone: "",
      sector: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      responsibleName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const acceptTerms = useWatch({ control, name: "acceptTerms" });
  const country = useWatch({ control, name: "country" });
  const strength = getPasswordStrength(password);

  const { countries } = useCountries(i18n.language);

  const { submit: registerOrganization } =
    useRegisterOrganization<RegisterPayerValues>("buyer", { setError });

  // País do telefone é independente do país da empresa — uma empresa pode ter
  // telefone de outro país. Controla apenas a máscara.
  const [phoneCountry, setPhoneCountry] = React.useState<string>("BR");

  // Máscara de ID fiscal conforme o país da empresa (BR=CNPJ, US=EIN, ...).
  // Países sem máscara definida entram livres (alfanuméricos como VAT/NIF).
  const documentMask = TAX_ID_MASKS[country ?? ""] ?? /^.*$/;
  // Placeholder reflete o formato do país (ex.: 00.000.000/0000-00); genérico caso livre.
  const documentPlaceholder =
    typeof documentMask === "string"
      ? documentMask.replace(/a/g, "A").replace(/\*/g, "X")
      : t("Register.fields.document.placeholder");
  // DDI puxado do país selecionado no telefone. BR/US com agrupamento; demais
  // prefixam o DDI + número nacional livre (até 15 dígitos, padrão E.164).
  const dialCode = DIAL_CODES[phoneCountry];
  const phoneMask =
    phoneCountry === "BR"
      ? "+55 (00) 00000-0000"
      : phoneCountry === "US"
        ? "+1 (000) 000-0000"
        : dialCode
          ? `+${dialCode} 000000000000000`
          : /^.*$/;
  // Placeholder do telefone acompanha o DDI/formato do país.
  const phonePlaceholder =
    phoneCountry === "BR"
      ? "+55 (00) 00000-0000"
      : phoneCountry === "US"
        ? "+1 (000) 000-0000"
        : dialCode
          ? `+${dialCode} 000000000`
          : t("Register.fields.phone.placeholder");
  // CEP só para BR; outros países entram livres (códigos postais variam).
  const zipMask = country === "BR" ? "00000-000" : /^.*$/;

  const passwordMeetsMin =
    password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const canSubmit = passwordMeetsMin && acceptTerms === true;

  // Mensagens do schema são chaves de tradução — traduz no momento da exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const goTo = (target: number) => {
    if (target <= step) setStep(target); // só permite voltar para etapas já visitadas
  };

  const next = async () => {
    const valid = await trigger(STEPS[step].fields);
    if (valid) setStep((current) => Math.min(current + 1, lastStep));
  };

  const prev = () => setStep((current) => Math.max(current - 1, 0));

  // --- Integrações assíncronas (US-02) ----------------------------------
  const handleDocumentBlur = (value: string) => {
    if (value.replace(/\D/g, "").length < 14) return;
    // TODO: validar unicidade do CNPJ (debounce 500ms) -> "CNPJ já cadastrado".
    // TODO: consultar Receita Federal (situação cadastral ATIVA) de forma assíncrona.
  };

  const handleEmailBlur = (value: string) => {
    if (!value.includes("@")) return;
    // TODO: validar unicidade do email -> mensagem genérica de erro inline.
  };

  const handleZipBlur = (value: string) => {
    if (value.replace(/\D/g, "").length !== 8) return;
    // TODO: autocompletar endereço via ViaCEP; street/neighborhood editáveis,
    // city/state readonly.
  };
  // ----------------------------------------------------------------------

  const submit = handleSubmit(async (values) => {
    // TODO: persistir aceite clickwrap (timestamp, IP, user agent, versão dos
    // documentos e hash SHA-256) em log WORM de 5 anos.
    // Cadastra a organização (buyer) + usuário-raiz e redireciona para a
    // confirmação de email/telefone. Erros são tratados dentro do hook.
    const ok = await registerOrganization(values);
    if (ok) await onSubmit?.(values);
  });

  const emailField = register("email");

  return (
    <Stack
      as="form"
      onSubmit={submit}
      gap={8}
      w="full"
      maxW="2xl"
      textAlign="left"
    >
      <Stack>
        <Text fontSize={"30px"} fontWeight={700}>
          {t("Register.title")}
        </Text>
        <Text fontSize={"14px"} fontWeight={400} color={"#99A1AF"}>
          {t("Register.subtitle")}
        </Text>
      </Stack>
      <KycBasicNotice maxW="2xl" />
      {/* No desktop (lg+) a barra lateral é o stepper; aqui fica só o compacto
          para telas menores, onde a barra é ocultada. */}
      <Box display={{ base: "block", lg: "none" }} w="full">
        <Stepper
          steps={STEPS.map((s) => t(s.titleKey))}
          step={step}
          onStepClick={goTo}
        />
      </Box>

      <Stack p={"32px"} bg={"#151B2D"} rounded={"16px"}>
        <Text fontSize={"20px"} fontWeight={600} mb={6}>
          {t(STEPS[step].titleKey)}
        </Text>

        {/* Etapa 1 — Dados da Empresa */}
        {step === 0 && (
          <Stack gap={4}>
            <Input
              label={t("Register.fields.companyName.label")}
              required
              placeholder={t("Register.fields.companyName.placeholder")}
              error={tError(errors.companyName?.message)}
              {...register("companyName")}
            />

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Controller
                control={control}
                name="document"
                render={({ field }) => (
                  <Input
                    label={t("Register.fields.document.label")}
                    required
                    placeholder={documentPlaceholder}
                    helperText={t("Register.fields.document.helper")}
                    error={tError(errors.document?.message)}
                    mask={documentMask}
                    unmask
                    value={field.value}
                    onAccept={(value) => field.onChange(value)}
                    onBlur={() => {
                      field.onBlur();
                      handleDocumentBlur(field.value ?? "");
                    }}
                  />
                )}
              />

              <Select
                label={t("Register.fields.country.label")}
                required
                placeholder={t("Register.fields.country.placeholder")}
                error={tError(errors.country?.message)}
                {...register("country")}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Select
                label={t("Register.fields.phoneCountry.label")}
                value={phoneCountry}
                onChange={(e) => setPhoneCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>

              <Box gridColumn={{ md: "span 2" }}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <Input
                      label={t("Register.fields.phone.label")}
                      required
                      placeholder={phonePlaceholder}
                      error={tError(errors.phone?.message)}
                      mask={phoneMask}
                      value={field.value}
                      onAccept={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </Box>
            </SimpleGrid>

            <Select
              label={t("Register.fields.sector.label")}
              required
              placeholder={t("Register.fields.sector.placeholder")}
              error={tError(errors.sector?.message)}
              {...register("sector")}
            >
              {SECTOR_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`Register.sectors.${value}`)}
                </option>
              ))}
            </Select>
          </Stack>
        )}

        {/* Etapa 2 — Endereço */}
        {step === 1 && (
          <Stack gap={4}>
            <Controller
              control={control}
              name="zipCode"
              render={({ field }) => (
                <Input
                  label={t("Register.fields.zipCode.label")}
                  required
                  placeholder={t("Register.fields.zipCode.placeholder")}
                  error={tError(errors.zipCode?.message)}
                  mask={zipMask}
                  unmask
                  value={field.value}
                  onAccept={(value) => field.onChange(value)}
                  onBlur={() => {
                    field.onBlur();
                    handleZipBlur(field.value ?? "");
                  }}
                />
              )}
            />

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box gridColumn={{ md: "span 2" }}>
                <Input
                  label={t("Register.fields.street.label")}
                  required
                  placeholder={t("Register.fields.street.placeholder")}
                  error={tError(errors.street?.message)}
                  {...register("street")}
                />
              </Box>

              <Input
                label={t("Register.fields.number.label")}
                required
                placeholder={t("Register.fields.number.placeholder")}
                error={tError(errors.number?.message)}
                {...register("number")}
              />
            </SimpleGrid>

            <Input
              label={t("Register.fields.complement.label")}
              placeholder={t("Register.fields.complement.placeholder")}
              error={tError(errors.complement?.message)}
              {...register("complement")}
            />

            <Input
              label={t("Register.fields.neighborhood.label")}
              required
              placeholder={t("Register.fields.neighborhood.placeholder")}
              error={tError(errors.neighborhood?.message)}
              {...register("neighborhood")}
            />

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Input
                label={t("Register.fields.city.label")}
                required
                placeholder={t("Register.fields.city.placeholder")}
                error={tError(errors.city?.message)}
                {...register("city")}
              />

              <Select
                label={t("Register.fields.state.label")}
                required
                placeholder={t("Register.fields.state.placeholder")}
                error={tError(errors.state?.message)}
                {...register("state")}
              >
                {BRAZILIAN_UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </SimpleGrid>
          </Stack>
        )}

        {/* Etapa 3 — Responsável */}
        {step === 2 && (
          <Stack gap={4}>
            <Input
              label={t("Register.fields.responsibleName.label")}
              required
              placeholder={t("Register.fields.responsibleName.placeholder")}
              error={tError(errors.responsibleName?.message)}
              {...register("responsibleName")}
            />

            <Input
              label={t("Register.fields.email.label")}
              required
              type="email"
              placeholder={t("Register.fields.email.placeholder")}
              error={tError(errors.email?.message)}
              {...emailField}
              onBlur={(e) => {
                emailField.onBlur(e);
                handleEmailBlur(e.target.value);
              }}
            />

            <Box>
              <Input
                label={t("Register.fields.password.label")}
                required
                type="password"
                placeholder={t("Register.fields.password.placeholder")}
                error={tError(errors.password?.message)}
                {...register("password")}
              />
              {password.length > 0 && (
                <Stack gap={1} w="full" mt={2}>
                  <Flex gap={2}>
                    {[1, 2, 3].map((segment) => (
                      <Box
                        key={segment}
                        flex="1"
                        h="6px"
                        rounded="full"
                        bg={
                          segment <= strength.step
                            ? `${strength.colorPalette}.500`
                            : "#364153"
                        }
                      />
                    ))}
                  </Flex>
                  <Text fontSize="xs" color="#4A5565">
                    {t("Register.passwordStrength.label", {
                      level: t(`Register.passwordStrength.${strength.level}`),
                    })}
                  </Text>
                </Stack>
              )}
            </Box>

            <Input
              label={t("Register.fields.confirmPassword.label")}
              required
              type="password"
              placeholder={t("Register.fields.confirmPassword.placeholder")}
              error={tError(errors.confirmPassword?.message)}
              {...register("confirmPassword")}
            />

            <Field.Root invalid={!!errors.acceptTerms}>
              <Controller
                control={control}
                name="acceptTerms"
                render={({ field }) => (
                  <Checkbox.Root
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(e.checked === true)}
                  >
                    <Checkbox.HiddenInput onBlur={field.onBlur} />
                    <Checkbox.Control />
                    <Checkbox.Label>
                      {/* TODO: criar as rotas /terms e /privacy (documentos legais). */}
                      <Trans
                        i18nKey="Register.terms.accept"
                        components={{
                          terms: (
                            <Link
                              href="/terms"
                              target="_blank"
                              style={{ color: "#1F5AFF" }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ),
                          privacy: (
                            <Link
                              href="/privacy"
                              target="_blank"
                              style={{ color: "#1F5AFF" }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ),
                        }}
                      />
                    </Checkbox.Label>
                  </Checkbox.Root>
                )}
              />
              <Field.ErrorText>
                {tError(errors.acceptTerms?.message)}
              </Field.ErrorText>
            </Field.Root>
          </Stack>
        )}

        <Flex gap={3} mt={"32px"}>
          {step > 0 && (
            <Button
              flex="1"
              type="button"
              variant="outline"
              onClick={prev}
              disabled={step === 0}
            >
              {t("Register.buttons.back")}
            </Button>
          )}

          {step < lastStep ? (
            <Button flex="1" type="button" onClick={next}>
              {t("Register.buttons.next")}
            </Button>
          ) : (
            <Button
              flex="1"
              type="submit"
              loading={isSubmitting}
              disabled={!canSubmit}
            >
              {t("Register.buttons.submit")}
            </Button>
          )}
        </Flex>
      </Stack>

      <Flex justify="center">
        <Text fontWeight={400} color={"#99A1AF"} fontSize={"14px"}>
          {t("Register.footer.haveAccount")}{" "}
          <Link href="/login" style={{ color: "#1F5AFF" }}>
            {t("Register.footer.login")}
          </Link>
        </Text>
      </Flex>
    </Stack>
  );
}
