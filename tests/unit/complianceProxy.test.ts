import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar[name] === undefined ? undefined : { value: jar[name] },
  }),
}));

// Lida na carga do módulo — precisa existir antes do import.
process.env.COMPLIANCE_API_URL = "https://upstream.test/compliance/api/v1";

const { forwardToCompliance, isUuid } =
  await import("@/server/complianceProxy");

const REQUEST_ID = "018f6a10-2c4e-7b31-9d5a-3e8f1c7a4b20";

function upstream(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    headers: { get: () => "application/json" },
  });
}

function lastInit(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls[0][1] as RequestInit & {
    headers: Record<string, string>;
  };
}

describe("complianceProxy", () => {
  beforeEach(() => {
    jar = { access_token: "eyJ.compliance" };
  });

  afterEach(() => vi.unstubAllGlobals());

  it("envia o Bearer do cookie e embrulha o JSON cru no envelope", async () => {
    const fetchMock = upstream(200, { request_id: REQUEST_ID, version: 4 });
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardToCompliance({
      method: "GET",
      path: `/admin/kyc/requests/${REQUEST_ID}`,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://upstream.test/compliance/api/v1/admin/kyc/requests/${REQUEST_ID}`,
    );
    expect(lastInit(fetchMock).headers.Authorization).toBe(
      "Bearer eyJ.compliance",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "",
      data: { request_id: REQUEST_ID, version: 4 },
      errors: null,
      metadata: null,
    });
  });

  it("repassa o Idempotency-Key e o corpo", async () => {
    const fetchMock = upstream(200, {});
    vi.stubGlobal("fetch", fetchMock);

    await forwardToCompliance({
      method: "POST",
      path: `/admin/kyc/requests/${REQUEST_ID}/decision`,
      body: { decision: "approve", expected_version: 7 },
      headers: { "Idempotency-Key": "key-1" },
    });

    const init = lastInit(fetchMock);
    expect(init.headers["Idempotency-Key"]).toBe("key-1");
    expect(JSON.parse(init.body as string)).toEqual({
      decision: "approve",
      expected_version: 7,
    });
  });

  it("converte {error:{code}} em envelope, com o código em errors[0]", async () => {
    vi.stubGlobal(
      "fetch",
      upstream(409, {
        error: { code: "version_conflict", message: "version_conflict" },
      }),
    );

    const response = await forwardToCompliance({
      method: "POST",
      path: `/admin/kyc/requests/${REQUEST_ID}/start-review`,
      body: { expected_version: 1 },
    });

    expect(response.status).toBe(409);
    const envelope = await response.json();
    expect(envelope.data).toBeNull();
    expect(envelope.errors[0]).toEqual({
      field: "_server",
      code: "version_conflict",
      detail: "version_conflict",
    });
  });

  it("traz os detalhes de validação depois do código", async () => {
    vi.stubGlobal(
      "fetch",
      upstream(422, {
        error: {
          code: "validation_error",
          message: "Request validation failed",
          details: [
            { field: "", type: "value_error", rule: "reason_code_required" },
          ],
        },
      }),
    );

    const response = await forwardToCompliance({
      method: "POST",
      path: `/admin/kyc/requests/${REQUEST_ID}/decision`,
      body: {},
    });

    const envelope = await response.json();
    expect(envelope.errors.map((item: { code: string }) => item.code)).toEqual([
      "validation_error",
      "reason_code_required",
    ]);
  });

  it("vira UPSTREAM_UNAVAILABLE quando o fetch falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    const response = await forwardToCompliance({
      method: "GET",
      path: `/admin/kyc/requests/${REQUEST_ID}`,
    });

    expect(response.status).toBe(502);
    expect((await response.json()).errors[0].code).toBe("UPSTREAM_UNAVAILABLE");
  });

  it("só aceita UUID como id de path", () => {
    expect(isUuid(REQUEST_ID)).toBe(true);
    expect(isUuid("../../identity")).toBe(false);
    expect(isUuid(`${REQUEST_ID}/../x`)).toBe(false);
  });
});
