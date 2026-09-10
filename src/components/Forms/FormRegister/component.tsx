"use client";

import {
  Box,
  Button,
  chakra,
  Checkbox,
  Field,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuChevronLeft,
  LuCircleAlert,
  LuCircleCheck,
  LuMail,
  LuPhone,
  LuStore,
  LuTriangleAlert,
  LuUsers,
} from "react-icons/lu";

import Input from "@/components/FormControl/Input";
import Select from "@/components/FormControl/Select";
import { BRAZILIAN_UFS } from "@/data/brazilianStates";
import { DIAL_CODES } from "@/data/dialCodes";
import { TAX_ID_MASKS } from "@/data/taxIdMasks";
import { REGISTER_STEPS } from "@/contexts/RegisterFlowContext/interface";
import { RESUME_PARAM, useRegisterFlow } from "@/contexts/RegisterFlowContext";
import { getPasswordStrength } from "@/functions/passwordStrength";
import { toE164 } from "@/functions/toE164";
import { useCountries } from "@/hooks/useCountries/hook";
import useFetch from "@/hooks/useFetch/hook";
import { registerFlowSchema } from "@/schemas/register";
import { toaster } from "@/components/ui/toaster";
import {
  ConflictError,
  RateLimitError,
  ValidationError,
  upstreamPasswordViolations,
} from "@/services/errors";
import { violationMessage } from "@/schemas/password";
import { REGISTER_PASSWORD_MESSAGES } from "@/schemas/register";
import {
  advanceRegisterHandoff,
  clearRegisterHandoff,
  confirmPhoneHandoff,
  readRegisterHandoff,
  saveRegisterHandoff,
} from "@/functions/registerHandoff";
import { useConfirmPhone } from "@/hooks/useConfirmPhone";
import KycNextSteps from "@/components/KycNextSteps";
import { useRouter } from "next/navigation";
import type {
  Organization,
  OrganizationType,
  RegisterOrganizationDto,
} from "@/services/organizations.service";
import { SECTOR_VALUES } from "@/types/register";

import {
  FormRegisterProps,
  RegisterFlowValues,
  RegisterType,
} from "./interface";

// Campos validados por RHF em cada etapa de dados (índices 0..3 do fluxo).
// A Verificação (4) não tem campos: só aguarda o clique no link do e-mail. O KYC
// (5) usa estado local (arquivos + hashes), fora do schema.
const STEP_FIELDS: (keyof RegisterFlowValues)[][] = [
  ["type"],
  ["companyName", "tradeName", "document", "country", "phone", "sector"],
  [
    "zipCode",
    "street",
    "number",
    "complement",
    "neighborhood",
    "city",
    "state",
  ],
  ["responsibleName", "email", "password", "confirmPassword", "acceptTerms"],
];
const VERIFY_STEP = STEP_FIELDS.length; // 4 = Verificação (aguarda o link do e-mail)
const KYC_STEP = VERIFY_STEP + 1; // 5 = KYC (documentos)

// Título (heading) exibido no topo de cada etapa. Reutiliza as chaves da barra
// lateral e usa chaves próprias para a de tipo de conta e a última. Precisa ter
// uma entrada por etapa de REGISTER_STEPS — inclusive a de KYC, senão o topo da
// última etapa renderiza vazio.
const STEP_HEADINGS = [
  "Register.flow.role.heading",
  "Register.sidebar.steps.company.title",
  "Register.sidebar.steps.address.title",
  "Register.sidebar.steps.responsible.title",
  "Register.sidebar.steps.verify.title",
  "Register.flow.kyc.heading",
];

const ROLE_OPTIONS: {
  value: RegisterType;
  icon: IconType;
  iconColor: string;
  iconBg: string;
}[] = [
  { value: "buyer", icon: LuUsers, iconColor: "#1F5AFF", iconBg: "#EEF3FF" },
  { value: "seller", icon: LuStore, iconColor: "#8B5CF6", iconBg: "#F3EEFF" },
];

// Mapeia campos da identity-api → campos do formulário, para exibir erros de
// validação (422) / conflito (409) inline no input correto.
const FIELD_MAP: Record<string, keyof RegisterFlowValues> = {
  tax_id: "document",
  contact_email: "email",
  email: "email",
  contact_phone: "phone",
  phone: "phone",
  country_code: "country",
  legal_name: "companyName",
  trade_name: "tradeName",
  password: "password",
  display_name: "responsibleName",
};

/**
 * Cadastro de organização (US-02) — fluxo unificado em tema claro (Figma
 * 1920-8537). Um único formulário RHF cobre as 4 etapas de dados (tipo de conta,
 * empresa, endereço, responsável); a etapa atual é espelhada na barra lateral via
 * RegisterFlowContext.
 *
 * Ao fim da etapa do Responsável, `POST /organizations/register` cria a
 * organização e a credencial do usuário-raiz, e o backend dispara o e-mail de
 * confirmação. A etapa de Verificação (4) apenas aguarda o clique no link; quando
 * ele é aberto (→ /confirm-email), o handoff traz o usuário de volta já na etapa
 * de KYC (5), onde os documentos são coletados.
 */
export function FormRegister({ typeRegister }: FormRegisterProps) {
  const { t, i18n } = useTranslation();
  const { step, setStep, resumedFrom } = useRegisterFlow();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setError,
    getValues,
    formState: { errors },
  } = useForm<RegisterFlowValues>({
    resolver: yupResolver(registerFlowSchema),
    mode: "onBlur",
    defaultValues: {
      type: typeRegister,
      companyName: "",
      tradeName: "",
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

  const type = useWatch({ control, name: "type" });
  const country = useWatch({ control, name: "country" });
  const password = useWatch({ control, name: "password" }) ?? "";
  const email = useWatch({ control, name: "email" });
  const phone = useWatch({ control, name: "phone" });
  const strength = getPasswordStrength(password);

  const { countries } = useCountries(i18n.language);

  // País do telefone é independente do país da empresa (controla só a máscara).
  const [phoneCountry, setPhoneCountry] = React.useState<string>("BR");

  // POST /organizations/register em andamento (disparado no fim da etapa 3).
  const [registering, setRegistering] = React.useState(false);

  // Requests via useFetch contra as rotas BFF (/api/*). O api.client (base /api)
  // adiciona o prefixo, então os paths aqui vão sem "/api".
  const [registerRequest] = useFetch<Organization>();

  // Handoff do cadastro, para quando o fluxo é retomado pelo link do e-mail em
  // outra aba — ali os valores do formulário já não existem. A ETAPA vem da URL
  // (ver RegisterFlowContext); daqui saem o e-mail e o telefone (exibição), o
  // `emailConfirmed` (libera a etapa do telefone) e o `userId` (credencial das
  // chamadas de OTP, que acontecem sem sessão).
  //
  // Lido no inicializador (uma vez) e não num efeito: evita render em cascata. A
  // página envolve este componente num limite de Suspense por causa do
  // useSearchParams, então esta subárvore renderiza só no cliente e o
  // localStorage está disponível no primeiro render.
  const [handoff] = React.useState(() => readRegisterHandoff());

  // O handoff só vale quando o fluxo foi de fato retomado pela URL. Sozinho ele
  // é resquício de localStorage: sobrevive a um cadastro anterior e faria a tela
  // alegar "e-mail validado" numa aba que nunca abriu o link.
  const linkHandoff = resumedFrom ? handoff : null;

  // Confirmação do telefone por SMS: enviar código → habilitar campo → validar.
  const phoneOtp = useConfirmPhone(linkHandoff?.userId);
  const [otp, setOtp] = React.useState("");

  // Card informativo da etapa de verificação / próximos passos.
  const renderInfoCard = (opts: {
    icon: IconType;
    title: string;
    contact: string;
    done?: boolean;
    hint?: string;
    /** Conteúdo extra abaixo do cabeçalho (ex.: campo de OTP + ação). */
    children?: React.ReactNode;
  }) => (
    <Box
      w="full"
      bg="bg.surface"
      borderWidth="1px"
      borderColor={opts.done ? "#AAECD5" : "border.default"}
      rounded="14px"
      p="21px"
    >
      <Flex align="center" gap={3}>
        <Flex
          align="center"
          justify="center"
          boxSize="36px"
          rounded="14px"
          flexShrink={0}
          bg={opts.done ? "#10B981" : "#EEF3FF"}
        >
          <Icon
            as={opts.done ? LuCircleCheck : opts.icon}
            boxSize="18px"
            color={opts.done ? "white" : "#1F5AFF"}
          />
        </Flex>
        <Box>
          <Text fontSize="13px" fontWeight={700} color="fg.default">
            {opts.title}
          </Text>
          <Text fontSize="12px" color="fg.muted">
            {opts.contact}
          </Text>
        </Box>
      </Flex>

      {opts.done && (
        <Text fontSize="12px" fontWeight={600} color="#10B981" pt="12px">
          {t("Register.flow.verify.verified")}
        </Text>
      )}

      {opts.hint && (
        <Text fontSize="12px" color="fg.muted" pt="12px" lineHeight="1.6">
          {opts.hint}
        </Text>
      )}

      {opts.children && <Box pt="16px">{opts.children}</Box>}
    </Box>
  );

  const documentMask = TAX_ID_MASKS[country ?? ""] ?? /^.*$/;
  const documentPlaceholder =
    typeof documentMask === "string"
      ? documentMask.replace(/a/g, "A").replace(/\*/g, "X")
      : t("Register.fields.document.placeholder");
  const dialCode = DIAL_CODES[phoneCountry];
  const phoneMask =
    phoneCountry === "BR"
      ? "+55 (00) 00000-0000"
      : phoneCountry === "US"
        ? "+1 (000) 000-0000"
        : dialCode
          ? `+${dialCode} 000000000000000`
          : /^.*$/;
  const phonePlaceholder =
    phoneCountry === "BR"
      ? "+55 (00) 00000-0000"
      : phoneCountry === "US"
        ? "+1 (000) 000-0000"
        : dialCode
          ? `+${dialCode} 000000000`
          : t("Register.fields.phone.placeholder");
  const zipMask = country === "BR" ? "00000-000" : /^.*$/;

  // Mensagens do schema são chaves de tradução — traduz na exibição.
  const tError = (message?: string) => (message ? t(message) : undefined);

  const totalSteps = REGISTER_STEPS.length;
  const isVerifyStep = step === VERIFY_STEP;
  const isKycStep = step === KYC_STEP;
  const RESPONSIBLE_STEP = VERIFY_STEP - 1; // 3 — última etapa de dados

  // Na etapa retomada pelo link o formulário está vazio (outra aba), então
  // e-mail e telefone vêm do handoff; durante o fluxo normal, do próprio form.
  const confirmationEmail = email || linkHandoff?.email || "";
  const confirmationPhone = phone || linkHandoff?.phone || "";

  // A etapa do telefone só abre depois do e-mail confirmado pelo link — antes
  // disso o card fica apenas informando que o e-mail vem primeiro. Exige as DUAS
  // provas (retomada pela URL + handoff marcado): ver `linkHandoff`.
  const emailConfirmed = linkHandoff?.emailConfirmed === true;
  const phoneConfirmed =
    phoneOtp.status === "confirmed" || linkHandoff?.phoneConfirmed === true;

  // Monta o payload de POST /organizations/register a partir dos valores do form.
  const buildRegisterPayload = (
    values: RegisterFlowValues,
  ): RegisterOrganizationDto => ({
    organization_type: values.type as OrganizationType,
    country_code: values.country,
    tax_id: (values.document ?? "").replace(/\D/g, ""),
    legal_name: values.companyName,
    trade_name: values.tradeName?.trim() || undefined,
    contact_email: values.email,
    contact_phone: toE164(values.phone),
    // Obrigatório: o register cria a organização e a credencial do usuário-raiz
    // na mesma chamada. Ver nota em organizations.service.ts.
    password: values.password,
  });

  // Traduz erros da API para feedback no formulário (campo inline ou toast).
  const handleRegisterError = (error: unknown) => {
    // Política de senha: o upstream devolve as violações em
    // `metadata.detail.violations`, fora do envelope de erros e nem sempre como
    // 422 — por isso vem antes dos erros por status.
    const violations = upstreamPasswordViolations(error);
    if (violations) {
      const message = violations
        .map((violation) =>
          violationMessage(violation, REGISTER_PASSWORD_MESSAGES),
        )
        .find(Boolean);
      setError("password", {
        message: message ?? "Register.errors.passwordPolicy",
      });
      return;
    }

    if (error instanceof ValidationError) {
      let mapped = false;
      for (const [apiField, messages] of Object.entries(error.fields)) {
        const formField = FIELD_MAP[apiField];
        if (formField && messages[0]) {
          setError(formField, { message: messages[0] });
          mapped = true;
        }
      }
      if (!mapped) {
        toaster.create({
          type: "error",
          title: t("Register.feedback.error"),
          description: error.errors[0]?.detail ?? error.message,
        });
      }
      return;
    }
    if (error instanceof ConflictError) {
      setError("document", { message: "Register.errors.documentTaken" });
      return;
    }
    if (error instanceof RateLimitError) {
      toaster.create({
        type: "error",
        title: t("Register.feedback.rateLimit"),
      });
      return;
    }
    toaster.create({
      type: "error",
      title: t("Register.feedback.error"),
      description: error instanceof Error ? error.message : undefined,
    });
  };

  // Etapa 4 (Responsável): registra a organização + usuário-raiz. O backend
  // dispara o e-mail de confirmação (link → /register/confirm-email).
  const registerOrganization = async (): Promise<boolean> => {
    const values = getValues();
    const payload = buildRegisterPayload(values);
    setRegistering(true);
    try {
      // Sem log do payload: ele carrega a senha em texto plano.
      const { data: organization } = await registerRequest(
        "/organizations/register",
        { method: "POST", body: payload },
      );

      // O backend dispara o e-mail de confirmação apontando para
      // /confirm-email?token=...&user_id=..., que abre em OUTRA aba. Guardamos o
      // mínimo para retomar o cadastro de lá (ver functions/registerHandoff).
      saveRegisterHandoff({
        organizationId: organization.id,
        email: values.email,
        phone: toE164(values.phone),
        step: VERIFY_STEP,
        emailConfirmed: false,
      });

      // NÃO chamamos `POST /organizations/{id}/users`: esse endpoint exige
      // Bearer ("Bearer token required") e aqui ainda não há sessão. Ele serve
      // para um admin autenticado adicionar membros — o usuário-raiz já nasce
      // do register acima.
      //
      // TODO: `responsibleName` deixou de ser enviado (o register recusa
      // `display_name` com `extra_forbidden`). Alinhar com o backend onde o
      // nome do responsável entra.
      return true;
    } catch (error) {
      handleRegisterError(error);
      return false;
    } finally {
      setRegistering(false);
    }
  };

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (!valid) return;
    // Ao concluir a etapa 4 (Responsável), efetiva o cadastro antes de avançar
    // para a Verificação. Só avança se o registro der certo.
    if (step === RESPONSIBLE_STEP) {
      const ok = await registerOrganization();
      if (ok) setStep(step + 1);
      return;
    }
    if (step < VERIFY_STEP) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  // Ação única do card do telefone: antes de haver código enviado ela dispara o
  // SMS; depois, valida o que foi digitado.
  const handlePhoneAction = async () => {
    if (phoneOtp.status === "idle") {
      await phoneOtp.sendCode();
      return;
    }

    const ok = await phoneOtp.confirm(otp);
    if (ok) confirmPhoneHandoff();
  };

  // A confirmação do telefone é OPCIONAL: o botão encerra a Verificação
  // independentemente dela. A etapa vai também para a URL para que um refresh
  // não devolva o usuário à Verificação já cumprida.
  const finishVerification = () => {
    advanceRegisterHandoff(KYC_STEP);
    setStep(KYC_STEP);
    router.replace(`/register?${RESUME_PARAM}=kyc`);
  };

  // A partir da Verificação não há mais dados a submeter: a org já foi criada na
  // etapa do Responsável e a confirmação acontece pelo link do e-mail. O submit
  // do form só existe para não deixar o Enter recarregar a página.
  const submit = handleSubmit(() => {});

  // Encerra o cadastro: o handoff cumpriu seu papel e não deve sobrar no
  // navegador para reposicionar o stepper num cadastro futuro.
  const finish = () => {
    clearRegisterHandoff();
    router.push("/login");
  };

  const emailField = register("email");

  return (
    <Stack
      as="form"
      onSubmit={submit}
      gap={0}
      w="full"
      maxW="480px"
      textAlign="left"
    >
      {/* Barra de progresso (6 etapas) */}
      <Flex align="center" gap={1} w="full">
        {REGISTER_STEPS.map((s, i) => (
          <Box
            key={s.id}
            flex="1"
            h="4px"
            rounded="full"
            bg={i <= step ? "brand.500" : "border.default"}
          />
        ))}
        <Text fontSize="11px" color="fg.muted" pl={2} flexShrink={0}>
          {step + 1}/{totalSteps}
        </Text>
      </Flex>

      {/* Voltar */}
      {step === 0 ? (
        <Link href="/login">
          <Flex
            align="center"
            gap={1.5}
            color="fg.muted"
            pt="32px"
            _hover={{ color: "fg.default" }}
          >
            <Icon as={LuChevronLeft} boxSize="15px" />
            <Text fontSize="13px" fontWeight={500}>
              {t("Register.flow.backToLogin")}
            </Text>
          </Flex>
        </Link>
      ) : (
        <chakra.button
          type="button"
          onClick={prev}
          display="flex"
          alignItems="center"
          gap={1.5}
          color="fg.muted"
          pt="32px"
          w="fit-content"
          _hover={{ color: "fg.default" }}
        >
          <Icon as={LuChevronLeft} boxSize="15px" />
          <Text fontSize="13px" fontWeight={500}>
            {t("Register.flow.back")}
          </Text>
        </chakra.button>
      )}

      {/* Cabeçalho da etapa */}
      <Stack gap={1} pt="20px">
        <Text
          fontSize="10px"
          fontWeight={700}
          letterSpacing="0.5px"
          textTransform="uppercase"
          color="fg.muted"
        >
          {t("Register.flow.stepLabel", {
            current: step + 1,
            total: totalSteps,
          })}
        </Text>
        <Text fontSize="22px" fontWeight={800} color="fg.default">
          {t(STEP_HEADINGS[step])}
        </Text>
      </Stack>

      <Box pt="28px">
        {/* ── Etapa 1 — Tipo de conta ── */}
        {step === 0 && (
          <Stack gap={4}>
            <Text fontSize="14px" color="fg.muted">
              {t("Register.flow.role.question")}
            </Text>

            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                  {ROLE_OPTIONS.map((option) => {
                    const selected = field.value === option.value;
                    return (
                      <chakra.button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        display="flex"
                        flexDirection="column"
                        gap={3}
                        p="22px"
                        rounded="16px"
                        borderWidth="2px"
                        borderColor={selected ? "brand.500" : "border.default"}
                        bg={selected ? "brand.50" : "bg.surface"}
                        textAlign="left"
                        cursor="pointer"
                        transition="border-color 0.2s, background 0.2s"
                        _hover={{
                          borderColor: selected ? "brand.500" : "gray.300",
                        }}
                      >
                        <Flex
                          align="center"
                          justify="center"
                          boxSize="48px"
                          rounded="14px"
                          bg={option.iconBg}
                        >
                          <Icon
                            as={option.icon}
                            boxSize="22px"
                            color={option.iconColor}
                          />
                        </Flex>
                        <Box>
                          <Text
                            fontSize="14px"
                            fontWeight={700}
                            color={selected ? "brand.500" : "fg.default"}
                          >
                            {t(`Register.flow.role.${option.value}.title`)}
                          </Text>
                          <Text
                            fontSize="12px"
                            fontWeight={500}
                            color="fg.muted"
                            mt={1}
                          >
                            {t(
                              `Register.flow.role.${option.value}.description`,
                            )}
                          </Text>
                        </Box>
                        {selected && (
                          <Flex align="center" gap={1} color="brand.500">
                            <Icon as={LuCircleCheck} boxSize="14px" />
                            <Text fontSize="12px" fontWeight={600}>
                              {t("Register.flow.role.selected")}
                            </Text>
                          </Flex>
                        )}
                      </chakra.button>
                    );
                  })}
                </SimpleGrid>
              )}
            />

            {!!errors.type && (
              <Text fontSize="13px" color="error.500">
                {tError(errors.type.message)}
              </Text>
            )}

            {type === "seller" && (
              <Flex
                align="flex-start"
                gap={3}
                bg="#FFFBEB"
                borderWidth="1px"
                borderColor="#FDE68A"
                rounded="14px"
                px="17px"
                py="15px"
              >
                <Icon
                  as={LuTriangleAlert}
                  boxSize="14px"
                  color="#D97706"
                  mt="2px"
                  flexShrink={0}
                />
                <Text fontSize="12px" color="#92400E">
                  <Trans i18nKey="Register.flow.role.sellerNotice" />
                </Text>
              </Flex>
            )}

            <Flex
              align="flex-start"
              gap={3}
              bg="#FEF2F2"
              borderWidth="1px"
              borderColor="#FECACA"
              rounded="14px"
              px="17px"
              py="15px"
            >
              <Icon
                as={LuCircleAlert}
                boxSize="14px"
                color="#EF4444"
                mt="2px"
                flexShrink={0}
              />
              <Text fontSize="12px" color="#991B1B">
                <Trans i18nKey="Register.flow.role.pjOnly" />
              </Text>
            </Flex>
          </Stack>
        )}

        {/* ── Etapa 2 — Dados da empresa ── */}
        {step === 1 && (
          <Stack gap={4}>
            <Input
              label={t("Register.fields.companyName.label")}
              required
              placeholder={t("Register.fields.companyName.placeholder")}
              error={tError(errors.companyName?.message)}
              {...register("companyName")}
            />

            <Input
              label={t("Register.fields.tradeName.label")}
              placeholder={t("Register.fields.tradeName.placeholder")}
              error={tError(errors.tradeName?.message)}
              {...register("tradeName")}
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
                    onBlur={field.onBlur}
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

        {/* ── Etapa 3 — Endereço ── */}
        {step === 2 && (
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
                  onBlur={field.onBlur}
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

        {/* ── Etapa 4 — Responsável legal ── */}
        {step === 3 && (
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
                            : "border.default"
                        }
                      />
                    ))}
                  </Flex>
                  <Text fontSize="xs" color="fg.muted">
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

        {/* ── Etapa 5 — Verificação: e-mail por link, telefone por OTP ──
            O e-mail é confirmado pelo link que o backend envia
            (→ /confirm-email?token=...&user_id=...); ao voltar por ele, o handoff
            retoma o cadastro AQUI, agora com o telefone liberado. Enquanto o
            e-mail não é confirmado, o card do telefone só informa a ordem. */}
        {isVerifyStep && (
          <Stack gap="20px">
            <Text fontSize="14px" color="fg.muted">
              {t(
                emailConfirmed
                  ? "Register.flow.verify.subtitleConfirmed"
                  : "Register.flow.verify.subtitle",
              )}
            </Text>

            {renderInfoCard({
              icon: LuMail,
              title: t("Register.flow.verify.email.title"),
              contact:
                confirmationEmail || t("Register.flow.verify.email.fallback"),
              done: emailConfirmed,
              hint: emailConfirmed
                ? undefined
                : t("Register.flow.verify.email.hint"),
            })}

            {renderInfoCard({
              icon: LuPhone,
              title: t("Register.flow.verify.phone.title"),
              contact:
                confirmationPhone || t("Register.flow.verify.phone.fallback"),
              done: phoneConfirmed,
              // Sem o e-mail confirmado não há o que fazer aqui: o card apenas
              // diz qual é a ordem.
              hint: !emailConfirmed
                ? t("Register.flow.verify.phone.emailFirst")
                : phoneConfirmed
                  ? undefined
                  : t(
                      phoneOtp.status === "idle"
                        ? "Register.flow.verify.phone.sendHint"
                        : "Register.flow.verify.phone.sentHint",
                    ),
              children: emailConfirmed && !phoneConfirmed && (
                <Stack gap="12px">
                  <Input
                    label={t("Register.flow.verify.phone.code.label")}
                    placeholder={t(
                      "Register.flow.verify.phone.code.placeholder",
                    )}
                    // Só habilita depois do 200 do resend-phone-otp: antes disso
                    // não existe código a digitar.
                    disabled={phoneOtp.status === "idle"}
                    mask="000000"
                    value={otp}
                    onAccept={setOtp}
                    error={phoneOtp.error ? t(phoneOtp.error) : undefined}
                  />

                  <Button
                    type="button"
                    onClick={handlePhoneAction}
                    loading={phoneOtp.loading}
                    disabled={phoneOtp.status === "sent" && otp.length < 6}
                    w="full"
                    h="47px"
                    rounded="14px"
                    bg="brand.500"
                    color="white"
                    fontSize="14px"
                    fontWeight={700}
                    _hover={{ bg: "brand.600" }}
                  >
                    {t(
                      phoneOtp.status === "idle"
                        ? "Register.flow.verify.phone.sendCode"
                        : "Register.flow.verify.phone.validate",
                    )}
                  </Button>

                  {phoneOtp.status === "sent" && (
                    <chakra.button
                      type="button"
                      onClick={phoneOtp.sendCode}
                      disabled={phoneOtp.loading}
                      alignSelf="center"
                      color="brand.500"
                      fontSize="12px"
                      fontWeight={600}
                      _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                    >
                      {t("Register.flow.verify.phone.resendCode")}
                    </chakra.button>
                  )}
                </Stack>
              ),
            })}
          </Stack>
        )}

        {/* ── Etapa 6 — KYC: documentos do nível basic ──
            Alcançada quando o e-mail é confirmado pelo link do e-mail. */}
        {isKycStep && <KycNextSteps onFinish={finish} />}
      </Box>

      {/* Ação principal */}
      <Box pt="24px">
        {/* Etapas de dados: avança (e, na última, efetiva o cadastro). */}
        {!isVerifyStep && !isKycStep && (
          <Button
            type="button"
            onClick={next}
            loading={registering}
            w="full"
            h="50px"
            rounded="14px"
            bg="brand.500"
            color="white"
            fontSize="15px"
            fontWeight={700}
            _hover={{ bg: "brand.600" }}
          >
            {t("Register.flow.continue")}
            <Icon as={LuArrowRight} boxSize="16px" />
          </Button>
        )}

        {/* Verificação, antes do link: não há ação nenhuma aqui — depende do
            clique no e-mail. */}
        {isVerifyStep && !emailConfirmed && (
          <Text fontSize="12px" color="fg.muted" textAlign="center">
            {t("Register.flow.verify.waiting")}
          </Text>
        )}

        {/* Verificação, depois do link: o telefone é opcional, então este botão
            encerra a etapa esteja ele confirmado ou não. */}
        {isVerifyStep && emailConfirmed && (
          <Button
            type="button"
            onClick={finishVerification}
            w="full"
            h="50px"
            rounded="14px"
            bg="brand.500"
            color="white"
            fontSize="15px"
            fontWeight={700}
            _hover={{ bg: "brand.600" }}
          >
            {t("Register.flow.verify.finish")}
            <Icon as={LuArrowRight} boxSize="16px" />
          </Button>
        )}

        {/* KYC: o CTA ("Explorar marketplace") vive dentro do KycNextSteps, junto
            com o restante do bloco desenhado no Figma. */}
      </Box>
    </Stack>
  );
}
