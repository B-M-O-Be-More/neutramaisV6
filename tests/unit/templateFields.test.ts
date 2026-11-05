import { describe, expect, it } from "vitest";

import {
  buildRuleValues,
  formTemplateFields,
  humanizeTemplateValue,
  isRuleOn,
  ruleValuesErrors,
  ruleValuesToForm,
  templateCharacteristics,
  templateFieldError,
  templateFieldsErrors,
  templateFormToValue,
  templateValuesToForm,
} from "@/functions/templateFields";
import type {
  CategoryTemplateField,
  CategoryTemplateRule,
} from "@/services/productCatalog.service";

const field = (
  patch: Partial<CategoryTemplateField> &
    Pick<CategoryTemplateField, "key" | "type">,
): CategoryTemplateField => ({ label: patch.key, required: false, ...patch });

const TECHNOLOGY = field({
  key: "technology",
  type: "single_choice",
  options: ["fiber", "radio"],
});
const SYMMETRIC = field({ key: "symmetric", type: "boolean" });
const BANDWIDTH = field({
  key: "bandwidthMbps",
  type: "number_with_unit",
  unit: "Mbps",
  required: true,
  min: 0,
});
const UPTIME = field({ key: "uptime", type: "number", min: 0, max: 100 });
const PORTS = field({
  key: "ports",
  type: "multiple_choice",
  options: ["sfp", "rj45", "qsfp"],
});

describe("formTemplateFields", () => {
  it("tira as chaves que a família já preenche com tela própria", () => {
    expect(
      formTemplateFields([BANDWIDTH, TECHNOLOGY, SYMMETRIC], "connectivity"),
    ).toEqual([TECHNOLOGY, SYMMETRIC]);
  });

  it("família sem tela própria mostra o template inteiro", () => {
    expect(formTemplateFields([BANDWIDTH, TECHNOLOGY], "custom")).toEqual([
      BANDWIDTH,
      TECHNOLOGY,
    ]);
  });

  it("sem template, nenhum campo", () => {
    expect(formTemplateFields(null, "software")).toEqual([]);
  });
});

describe("templateFieldError", () => {
  it("obrigatório vazio", () => {
    expect(templateFieldError(BANDWIDTH, "")).toBe(
      "SellerOfferCreate.errors.templateRequired",
    );
    expect(templateFieldError(TECHNOLOGY, "")).toBeNull();
  });

  it("número: aceita vírgula e confere os limites", () => {
    expect(templateFieldError(UPTIME, "99,5")).toBeNull();
    expect(templateFieldError(UPTIME, "abc")).toBe(
      "SellerOfferCreate.errors.templateNumber",
    );
    expect(templateFieldError(UPTIME, "100,1")).toBe(
      "SellerOfferCreate.errors.templateRange",
    );
    expect(templateFieldError(BANDWIDTH, "-1")).toBe(
      "SellerOfferCreate.errors.templateRange",
    );
  });

  it("escolhas só aceitam as opções do template", () => {
    expect(templateFieldError(TECHNOLOGY, "fiber")).toBeNull();
    expect(templateFieldError(TECHNOLOGY, "copper")).toBe(
      "SellerOfferCreate.errors.templateChoice",
    );
    expect(templateFieldError(PORTS, ["sfp", "qsfp"])).toBeNull();
    expect(templateFieldError(PORTS, ["sfp", "x"])).toBe(
      "SellerOfferCreate.errors.templateChoice",
    );
  });

  it("data, link e limite de texto", () => {
    const date = field({ key: "since", type: "date" });
    const link = field({ key: "datasheet", type: "link" });
    const short = field({ key: "note", type: "short_text", maxLength: 5 });
    expect(templateFieldError(date, "2026-11-05")).toBeNull();
    expect(templateFieldError(date, "05/11/2026")).toBe(
      "SellerOfferCreate.errors.templateDate",
    );
    expect(templateFieldError(link, "https://bmo.dev.br/ficha.pdf")).toBeNull();
    expect(templateFieldError(link, "bmo.dev.br")).toBe(
      "SellerOfferCreate.errors.templateUrl",
    );
    expect(templateFieldError(short, "123456")).toBe(
      "SellerOfferCreate.errors.templateTooLong",
    );
  });
});

describe("conversões", () => {
  it("formulário → API pelo tipo; vazio não vai", () => {
    expect(templateFormToValue(UPTIME, "99,5")).toBe(99.5);
    expect(templateFormToValue(SYMMETRIC, "false")).toBe(false);
    expect(templateFormToValue(PORTS, ["sfp"])).toEqual(["sfp"]);
    expect(templateFormToValue(TECHNOLOGY, " fiber ")).toBe("fiber");
    expect(templateFormToValue(TECHNOLOGY, "")).toBeUndefined();
  });

  it("API → formulário, só das chaves pedidas", () => {
    expect(
      templateValuesToForm(
        { uptime: 99.5, symmetric: true, ports: ["sfp"], bandwidthMbps: 500 },
        ["uptime", "symmetric", "ports"],
      ),
    ).toEqual({ uptime: "99,5", symmetric: "true", ports: ["sfp"] });
  });

  it("characteristics e erros só dos campos do template", () => {
    const values = { technology: "radio", symmetric: "", stray: "x" };
    expect(templateCharacteristics([TECHNOLOGY, SYMMETRIC], values)).toEqual({
      technology: "radio",
    });
    expect(templateFieldsErrors([TECHNOLOGY, BANDWIDTH], values)).toEqual({
      bandwidthMbps: "SellerOfferCreate.errors.templateRequired",
    });
  });
});

describe("humanizeTemplateValue", () => {
  it("valor técnico sem tradução vira texto legível", () => {
    expect(humanizeTemplateValue("mobile_4g")).toBe("Mobile 4g");
    expect(humanizeTemplateValue("on-premises")).toBe("On premises");
    expect(humanizeTemplateValue("")).toBe("");
  });
});

describe("regras condicionais do template", () => {
  const FAST: CategoryTemplateRule = {
    key: "fastActivation",
    name: "Ativação rápida",
    required: true,
    valueFields: [
      field({ key: "maxAcceptanceHours", type: "number", min: 1, max: 72 }),
    ],
  };
  const SUPPORT: CategoryTemplateRule = {
    key: "extendedSupport",
    name: "Suporte estendido",
    required: false,
    valueFields: [
      field({ key: "months", type: "number", min: 1 }),
      field({ key: "channel", type: "single_choice", options: ["phone", "chat"] }),
    ],
  };

  it("obrigatória vale sempre; opcional só ligada", () => {
    expect(isRuleOn(FAST, {})).toBe(true);
    expect(isRuleOn(SUPPORT, {})).toBe(false);
    expect(isRuleOn(SUPPORT, { extendedSupport: true })).toBe(true);
  });

  it("regra ligada pede todos os campos de valor", () => {
    expect(
      ruleValuesErrors([FAST, SUPPORT], { extendedSupport: true }, {
        fastActivation: { maxAcceptanceHours: "100" },
        extendedSupport: { months: "12" },
      }),
    ).toEqual({
      "fastActivation.maxAcceptanceHours": "SellerOfferCreate.errors.templateRange",
      "extendedSupport.channel": "SellerOfferCreate.errors.templateRequired",
    });
    // Opcional desligada não é validada.
    expect(ruleValuesErrors([SUPPORT], {}, {})).toEqual({});
  });

  it("monta ruleValues: ligada com valores, opcional desligada como null", () => {
    expect(
      buildRuleValues([FAST, SUPPORT], {}, {
        fastActivation: { maxAcceptanceHours: "48" },
        extendedSupport: { months: "12" },
      }),
    ).toEqual({
      fastActivation: { maxAcceptanceHours: 48 },
      extendedSupport: null,
    });
    expect(buildRuleValues([], {}, {})).toBeUndefined();
  });

  it("valores salvos voltam ligados no formulário", () => {
    expect(
      ruleValuesToForm({
        fastActivation: { maxAcceptanceHours: 48 },
        extendedSupport: null,
      }),
    ).toEqual({
      rulesEnabled: { fastActivation: true },
      ruleValues: { fastActivation: { maxAcceptanceHours: "48" } },
    });
  });
});
