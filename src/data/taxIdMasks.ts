/**
 * Máscaras de ID fiscal por país (ISO 3166-1 alpha-2), no formato do react-imask.
 *
 * O valor pode ser:
 *  - string: padrão posicional fixo. Definições do IMask: `0` = dígito,
 *    `a` = letra, `*` = alfanumérico. Caracteres fora dessas definições são
 *    literais fixos (ex.: "U", "B", ".", "-", espaço). Ex.: BR "00.000.000/0000-00".
 *  - RegExp: para formatos de comprimento variável (ex.: "até 8 dígitos") ou com
 *    regras que não cabem num padrão fixo. Validado a cada tecla. Ex.: NA /^\d{0,8}$/.
 *
 * É um dataset best-effort: cobre os formatos mais conhecidos. Onde há letra de
 * verificação ou tamanho variável, preferimos `*`/`a`/RegExp para NÃO bloquear
 * IDs válidos. Países ausentes ficam sem máscara (input livre).
 *
 * TODO: substituir/alinhar pela tabela country_tax_id_format do backend.
 */
export const TAX_ID_MASKS: Record<string, string | RegExp> = {
  // ===== América =====
  BR: "00.000.000/0000-00", // CNPJ
  US: "00-0000000", // EIN
  CA: "000000000 aa 0000", // Business Number: raiz 9 díg + programa 2 letras + ref 4 díg (ex.: 123456789 RC 0001)
  MX: "aaa000000***", // RFC pessoa jurídica (3 letras + 6 díg + 3 alnum)
  AR: "00-00000000-0", // CUIT
  CL: "00.000.000-*", // RUT (DV pode ser "K")
  CO: "000.000.000-0", // NIT
  EC: "0000000000000", // RUC (13)
  PE: "00000000000", // RUC (11)
  PY: "00000000-0", // RUC
  UY: "000000000000", // RUT (12)
  BO: /^\d{5,15}$/, // NIT (variável)
  VE: "*-00000000-0", // RIF (letra + 8 díg + DV)
  CR: "0000000000", // Cédula jurídica (10)
  DO: "000000000", // RNC (9)
  GT: /^\d{6,12}$/, // NIT (variável)
  PA: /^[0-9A-Za-z-]{1,20}$/, // RUC (variável)

  // ===== União Europeia (VAT) =====
  AT: "U00000000", // ATU + 8 díg
  BE: "0000000000", // 10 díg
  BG: /^\d{9,10}$/, // 9–10 díg
  HR: "00000000000", // 11 díg
  CY: "00000000a", // 8 díg + 1 letra
  CZ: /^\d{8,10}$/, // 8–10 díg
  DK: "00000000", // 8 díg
  EE: "000000000", // 9 díg
  FI: "00000000", // 8 díg
  FR: "**000000000", // 2 alnum + SIREN 9 díg
  DE: "000000000", // 9 díg (USt-IdNr)
  GR: "000000000", // 9 díg (prefixo EL)
  HU: "00000000", // 8 díg
  IE: /^[0-9A-Za-z]{8,9}$/, // 8–9 alnum
  IT: "00000000000", // 11 díg
  LV: "00000000000", // 11 díg
  LT: /^(\d{9}|\d{12})$/, // 9 ou 12 díg
  LU: "00000000", // 8 díg
  MT: "00000000", // 8 díg
  NL: "000000000B00", // 9 díg + "B" + 2 díg
  PL: "0000000000", // 10 díg (NIP)
  PT: "000000000", // 9 díg (NIF)
  RO: /^\d{2,10}$/, // 2–10 díg
  SK: "0000000000", // 10 díg
  SI: "00000000", // 8 díg
  ES: "*0000000*", // NIF/CIF (alnum + 7 díg + alnum)
  SE: "000000000000", // 12 díg

  // ===== Resto da Europa =====
  GB: "000000000", // VAT (9)
  CH: "000.000.000", // UID (CHE-)
  NO: "000000000", // 9 díg (MVA)

  // ===== Ásia / Oceania / África / Oriente Médio =====
  AU: "00 000 000 000", // ABN (11)
  NZ: /^\d{8,9}$/, // IRD (8–9)
  JP: "0000000000000", // Corporate Number (13)
  CN: /^[0-9A-Za-z]{18}$/, // USCC (18 alnum)
  IN: /^[0-9A-Za-z]{15}$/, // GSTIN (15 alnum)
  KR: "000-00-00000", // BRN (10 díg)
  RU: /^(\d{10}|\d{12})$/, // INN (10 ou 12)
  TR: "0000000000", // VKN (10)
  IL: "000000000", // 9 díg
  ZA: "0000000000", // VAT (10)
  SA: "000000000000000", // VAT (15)
  AE: "000000000000000", // TRN (15)
  SG: /^[0-9A-Za-z]{9,10}$/, // UEN (alnum)
  MY: /^[0-9A-Za-z]{10,13}$/, // variável
  ID: "00.000.000.0-000.000", // NPWP (15 díg)
  NA: /^\d{0,8}$/, // Namíbia — até 8 dígitos
};
