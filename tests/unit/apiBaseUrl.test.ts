import { afterEach, describe, expect, it, vi } from "vitest";

import { apiBaseUrl, missingApiUrlMessage } from "@/server/apiBaseUrl";

const SERVICES = [
  ["identity", "IDENTITY_API_URL", "/identity/api/v1"],
  ["marketplace", "MARKETPLACE_API_URL", "/marketplace/api/v2"],
  ["compliance", "COMPLIANCE_API_URL", "/compliance/api/v1"],
  ["geo", "GEO_API_URL", "/geo/api/v2"],
  ["wallet", "WALLET_API_URL", "/wallet/api/v2"],
] as const;

describe("apiBaseUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  const clearOverrides = () => {
    for (const [, variable] of SERVICES) vi.stubEnv(variable, "");
  };

  it.each(SERVICES)(
    "%s: API_BASE_URL + caminho e versão do serviço",
    (service, _variable, path) => {
      clearOverrides();
      vi.stubEnv("API_BASE_URL", "https://hom-api.neutramais.com/");

      expect(apiBaseUrl(service)).toBe(`https://hom-api.neutramais.com${path}`);
    },
  );

  it("a URL própria do serviço vence a base", () => {
    clearOverrides();
    vi.stubEnv("API_BASE_URL", "https://hom-api.neutramais.com");
    vi.stubEnv("GEO_API_URL", "http://localhost:8000/geo/api/v2/");

    expect(apiBaseUrl("geo")).toBe("http://localhost:8000/geo/api/v2");
    expect(apiBaseUrl("identity")).toBe(
      "https://hom-api.neutramais.com/identity/api/v1",
    );
  });

  it("sem nenhuma das duas, não há URL", () => {
    clearOverrides();
    vi.stubEnv("API_BASE_URL", "");

    expect(apiBaseUrl("wallet")).toBeUndefined();
    expect(missingApiUrlMessage("wallet")).toBe(
      "Configure API_BASE_URL (ou WALLET_API_URL) no ambiente.",
    );
  });
});
