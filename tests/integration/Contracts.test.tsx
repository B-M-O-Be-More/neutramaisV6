import { createHash, webcrypto } from "node:crypto";

import { NextRequest } from "next/server";
import React, { type ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { toaster } from "@/components/ui/toaster";
import type { ProfileContext } from "@/services/profileSession.service";
import type { ContractStatus, OrderContract } from "@/types/contracts";

import {
  act,
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "../test-utils";

// Ponta a ponta no front: a página real chama o BFF real (route handlers de
// /api/contracts e /api/orders), que chama uma contracts-api e uma orders-api
// falsas com o comportamento da doc (developer-portal-neutra,
// site/back/contracts/rotas). Só a rede é simulada.

// A casca autenticada (sessão do login, sidebar) não interessa aqui.
vi.mock("@/components/Layouts/Authenticated", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const PROFILE_TOKEN = "buyer-profile-token";
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "profile_access_token" ? { value: PROFILE_TOKEN } : undefined,
  }),
}));

const CONTRACTS_API = "https://upstream.test/contracts/api/v2";
const ORDERS_API = "https://upstream.test/orders/api/v2";
// Os proxies leem a env na carga: precisa existir antes do import.
process.env.CONTRACTS_API_URL = CONTRACTS_API;
process.env.ORDERS_API_URL = ORDERS_API;

const ContractsRoutes = {
  list: await import("@/app/api/contracts/route"),
  read: await import("@/app/api/contracts/[contractId]/route"),
  document: await import("@/app/api/contracts/[contractId]/document/route"),
  sign: await import("@/app/api/contracts/[contractId]/sign/route"),
};
const OrderRoute = await import("@/app/api/orders/[orderId]/route");
const { default: ContractsPage } = await import("@/app/contracts/page");
const { default: ContractDetailPage } =
  await import("@/app/contracts/[contractId]/page");

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const BUYER_ORG = "3f6c2a1e-8b4d-4c7a-9e21-5d0b7a9c4e12";
const SELLER_ORG = "8a1d4e7b-2c3f-4a5b-9d6e-1f2a3b4c5d6e";
const USER = "c41a7e2d-9b3f-4d8a-a1e6-2f7b5c9d3e84";
const OTHER_USER = "7a2b9c1d-3e4f-4a5b-8c6d-9e0f1a2b3c4d";

// A API ordena pelo contractId: o contrato assinado (pedido antigo) vem
// primeiro, e o front precisa reordenar pela data do pedido.
const TO_SIGN = "dedd879c-5f6c-4d03-9e52-9eedf797ace6";
const SIGNED = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const ORDER_TO_SIGN = "bf382907-ac5c-4f4b-8879-3d1fbfa7b905";
const ORDER_SIGNED = "6f3ae50d-732c-42e4-96d1-e0814e9ac941";
const SIGNING_URL = "https://assina.ae/Xk7pQ2mR";

const PDF = new TextEncoder().encode("%PDF-1.4 contrato do pedido");
const PDF_HASH = createHash("sha256").update(PDF).digest("hex");

// Com espaço comum: o toHaveTextContent normaliza o NBSP só do lado do DOM.
const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    .format(value)
    .replace(/\s/g, " ");

function contract(
  contractId: string,
  orderId: string,
  status: ContractStatus,
  signatures: OrderContract["signatures"] = [],
): OrderContract {
  return {
    contractId,
    orderId,
    checkoutId: "dc9efd85-a37f-43b7-ba7e-bdc80d3eab1b",
    status,
    documentVersion: 1,
    documentHash: PDF_HASH,
    snapshotVersion: "1af3c20f",
    policy: "buyer-only-v1",
    requiredSignerOrganizations: [BUYER_ORG],
    aggregateVersion: 1,
    recoveryRequired: false,
    lastError: null,
    signatures,
  };
}

function order(id: string, name: string, totalMinor: number, at: string) {
  return {
    id,
    orderId: id,
    checkoutId: "dc9efd85-a37f-43b7-ba7e-bdc80d3eab1b",
    createdAt: Math.floor(new Date(at).getTime() / 1000),
    buyerOrganizationId: BUYER_ORG,
    sellerOrganizationId: SELLER_ORG,
    status: "accepted",
    items: [{ catalog: { offeringId: "of-1", name }, quantity: 1, totalMinor }],
    totalMinor,
    currency: "BRL",
  };
}

const ORDERS: Record<string, ReturnType<typeof order>> = {
  [ORDER_TO_SIGN]: order(
    ORDER_TO_SIGN,
    "Trânsito IP 1 Gbps",
    189_000,
    "2026-10-30T12:00:00Z",
  ),
  [ORDER_SIGNED]: order(
    ORDER_SIGNED,
    "Colocation 2U",
    54_990,
    "2026-09-02T12:00:00Z",
  ),
};

let profile: ProfileContext;

const BUYER_CONTEXT: ProfileContext = {
  organization_id: BUYER_ORG,
  user_id: USER,
  profile: "buyer",
  roles: ["buyer_owner"],
  permissions: ["contract:read", "contract:sign", "order:read"],
  kyc_level: "basic",
  kyc_state: "verified",
  transaction_eligible: true,
  profile_version: 1,
  grant_version: 1,
  context_version: 1,
};

// ---------------------------------------------------------------------------
// contracts-api e orders-api falsas
// ---------------------------------------------------------------------------

interface Call {
  method: string;
  url: string;
  authorization?: string;
  body?: unknown;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function createUpstream() {
  const contracts = new Map<string, OrderContract>([
    [
      SIGNED,
      contract(SIGNED, ORDER_SIGNED, "signed", [
        { subject: USER, organizationId: BUYER_ORG, signed: true },
      ]),
    ],
    [TO_SIGN, contract(TO_SIGN, ORDER_TO_SIGN, "awaiting_signer")],
  ]);
  const state = {
    contracts,
    calls: [] as Call[],
    /** "blocked": o nginx da homologação, 403 em HTML. */
    gateway: "open" as "open" | "blocked",
    signError: null as { status: number; detail: string } | null,
  };

  /** O Buyer assinou na Autentique e o webhook foi conferido. */
  const completeSignature = (id: string) => {
    const current = contracts.get(id)!;
    contracts.set(id, {
      ...current,
      status: "signed",
      signatures: current.signatures.map((s) => ({ ...s, signed: true })),
    });
  };

  async function handle(url: URL, init: RequestInit = {}): Promise<Response> {
    const method = init.method ?? "GET";
    const headers = new Headers(init.headers);
    state.calls.push({
      method,
      url: url.toString(),
      authorization: headers.get("Authorization") ?? undefined,
      body: init.body,
    });

    if (url.href.startsWith(ORDERS_API)) {
      const id = url.pathname.split("/").pop()!;
      const found = ORDERS[id];
      return found
        ? json({ message: "ok", data: found, metadata: null })
        : json({ detail: "Order not found" }, 404);
    }

    if (state.gateway === "blocked") {
      return new Response("<html><h1>403 Forbidden</h1></html>", {
        status: 403,
        headers: { "Content-Type": "text/html" },
      });
    }
    if (headers.get("Authorization") !== `Bearer ${PROFILE_TOKEN}`) {
      return json({ detail: "Identity Bearer token required" }, 401);
    }

    // /contracts/api/v2/order-contracts[/{id}[/document|/sign]]
    const [, id, action] =
      url.pathname.match(/\/order-contracts(?:\/([^/]+))?(?:\/(\w+))?$/) ?? [];

    if (!id) {
      const items = [...contracts.values()].sort((a, b) =>
        a.contractId.localeCompare(b.contractId),
      );
      return json({
        items,
        total: items.length,
        page: Number(url.searchParams.get("page") ?? 1),
        size: Number(url.searchParams.get("size") ?? 20),
      });
    }

    const current = contracts.get(id);
    if (!current) return json({ detail: "Contract not found" }, 404);

    if (action === "document") {
      return new Response(PDF, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="contract.pdf"',
          ETag: `"${PDF_HASH}"`,
        },
      });
    }

    if (action === "sign" && method === "POST") {
      if (state.signError) {
        return json({ detail: state.signError.detail }, state.signError.status);
      }
      if (current.status === "awaiting_signer") {
        contracts.set(id, {
          ...current,
          status: "awaiting_signatures",
          aggregateVersion: current.aggregateVersion + 3,
          signatures: [
            { subject: USER, organizationId: BUYER_ORG, signed: false },
          ],
        });
      }
      return json({
        status: contracts.get(id)!.status,
        signingUrl: SIGNING_URL,
        documentHash: PDF_HASH,
      });
    }

    return json(current);
  }

  return { state, handle, completeSignature };
}

let upstream: ReturnType<typeof createUpstream>;
let browserCalls: string[];

/**
 * fetch do jsdom: `/api/*` vai para o route handler real do BFF (como o Next
 * faria); URL absoluta é o BFF chamando o upstream.
 */
async function fetchRouter(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const raw = typeof input === "string" ? input : input.toString();
  if (!raw.startsWith("/api/")) return upstream.handle(new URL(raw), init);

  const method = init.method ?? "GET";
  browserCalls.push(`${method} ${raw}`);
  const url = new URL(raw, "http://localhost");
  const request = new NextRequest(url, { method });
  const path = url.pathname;

  if (path === "/api/auth/context") {
    return json({ message: "ok", data: profile, metadata: null });
  }

  let match = path.match(/^\/api\/orders\/([^/]+)$/);
  if (match) {
    return OrderRoute.GET(request, {
      params: Promise.resolve({ orderId: match[1] }),
    });
  }

  if (path === "/api/contracts") return ContractsRoutes.list.GET(request);

  match = path.match(/^\/api\/contracts\/([^/]+)(?:\/(document|sign))?$/);
  if (match) {
    const params = { params: Promise.resolve({ contractId: match[1] }) };
    if (match[2] === "document") {
      return ContractsRoutes.document.GET(request, params);
    }
    if (match[2] === "sign") return ContractsRoutes.sign.POST(request, params);
    return ContractsRoutes.read.GET(request, params);
  }

  return json({ detail: `Rota não simulada: ${method} ${path}` }, 404);
}

const upstreamCalls = (filter: string) =>
  upstream.state.calls.filter((call) =>
    `${call.method} ${call.url}`.includes(filter),
  );

// ---------------------------------------------------------------------------
// Navegador
// ---------------------------------------------------------------------------

const tab = {
  opener: {} as unknown,
  location: { href: "" },
  close: vi.fn(),
};
let downloads: string[];

beforeAll(() => {
  // Web Crypto do Node: o jsdom não traz `crypto.subtle` (SHA-256 do PDF).
  vi.stubGlobal("crypto", webcrypto);
  URL.createObjectURL = vi.fn(() => "blob:contract-pdf");
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  upstream = createUpstream();
  browserCalls = [];
  downloads = [];
  profile = BUYER_CONTEXT;
  tab.opener = {};
  tab.location.href = "";
  vi.stubGlobal("fetch", vi.fn(fetchRouter));
  vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
  vi.spyOn(toaster, "create");
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download);
  });
});

const toastTitles = () =>
  vi.mocked(toaster.create).mock.calls.map(([toast]) => toast.title);

async function renderList() {
  const view = renderWithProviders(<ContractsPage />);
  await screen.findAllByRole("article");
  return view;
}

const card = (name: string) => screen.getByRole("article", { name });

// ---------------------------------------------------------------------------

describe(
  "Contratos do buyer: front → BFF → contracts-api",
  {
    timeout: 20_000,
  },
  () => {
    it("lista pelo BFF com o token do perfil, junta o pedido e ordena pela data", async () => {
      await renderList();

      // Navegador fala só com o BFF; o BFF anexa o Bearer do perfil Buyer.
      expect(browserCalls).toContain("GET /api/contracts?page=1&size=100");
      const [list] = upstreamCalls(`${CONTRACTS_API}/order-contracts?`);
      expect(list.url).toBe(`${CONTRACTS_API}/order-contracts?page=1&size=100`);
      expect(list.authorization).toBe(`Bearer ${PROFILE_TOKEN}`);
      expect(upstreamCalls(`/productOrder/${ORDER_TO_SIGN}`)).toHaveLength(1);
      expect(upstreamCalls(`/productOrder/${ORDER_SIGNED}`)).toHaveLength(1);

      // A API manda o assinado primeiro; a tela mostra o pedido mais novo antes.
      const articles = screen.getAllByRole("article");
      expect(articles[0]).toHaveAccessibleName("Trânsito IP 1 Gbps");
      expect(articles[1]).toHaveAccessibleName("Colocation 2U");

      const toSign = card("Trânsito IP 1 Gbps");
      expect(
        within(toSign).getByText("Contracts.statuses.awaiting_signer"),
      ).toBeInTheDocument();
      expect(toSign).toHaveTextContent(brl(1890));
      expect(
        within(toSign).getByRole("button", { name: "Contracts.sign.sign" }),
      ).toBeInTheDocument();
      expect(
        within(toSign).getByRole("link", {
          name: "Contracts.actions.viewDetails",
        }),
      ).toHaveAttribute("href", `/contracts/${TO_SIGN}`);

      const signed = card("Colocation 2U");
      expect(
        within(signed).getByText("Contracts.statuses.signed"),
      ).toBeInTheDocument();
      expect(
        within(signed).queryByRole("button", { name: /Contracts\.sign\./ }),
      ).not.toBeInTheDocument();

      expect(
        screen.getByText("Contracts.signNotice.title"),
      ).toBeInTheDocument();
    });

    it("assina: abre a aba no clique, pede o link, navega a aba e relê o contrato", async () => {
      const { user } = await renderList();

      await user.click(
        within(card("Trânsito IP 1 Gbps")).getByRole("button", {
          name: "Contracts.sign.sign",
        }),
      );

      // A aba abre no clique (antes do await), senão o navegador bloqueia.
      expect(window.open).toHaveBeenCalledWith("", "_blank");
      await waitFor(() => expect(tab.location.href).toBe(SIGNING_URL));
      expect(tab.opener).toBeNull();
      expect(toastTitles()).toContain("Contracts.toasts.signingOpened");

      // POST sem corpo: o e-mail vem da Identity, nunca do front.
      const [sign] = upstreamCalls(`/order-contracts/${TO_SIGN}/sign`);
      expect(sign.method).toBe("POST");
      expect(sign.body).toBeUndefined();
      expect(sign.authorization).toBe(`Bearer ${PROFILE_TOKEN}`);

      // Releitura: o usuário vinculado agora reabre o link.
      const toSign = card("Trânsito IP 1 Gbps");
      expect(
        await within(toSign).findByRole("button", {
          name: "Contracts.sign.open",
        }),
      ).toBeInTheDocument();
      expect(
        within(toSign).getByText("Contracts.statuses.awaiting_signatures"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Contracts.signNotice.title")).toBeNull();

      // Assinou na Autentique e voltou para a aba do app.
      upstream.completeSignature(TO_SIGN);
      act(() => {
        window.dispatchEvent(new Event("focus"));
      });

      expect(
        await within(toSign).findByText("Contracts.statuses.signed"),
      ).toBeInTheDocument();
      expect(
        within(toSign).queryByRole("button", { name: /Contracts\.sign\./ }),
      ).not.toBeInTheDocument();
    });

    it("409 de signatário já vinculado: fecha a aba e explica", async () => {
      upstream.state.signError = {
        status: 409,
        detail: "Signer identity already bound",
      };
      const { user } = await renderList();

      await user.click(
        screen.getByRole("button", { name: "Contracts.sign.sign" }),
      );

      await waitFor(() => expect(tab.close).toHaveBeenCalled());
      expect(tab.location.href).toBe("");
      expect(toastTitles()).toContain("Contracts.errors.signerBound");
    });

    it("outro usuário vinculado: sem botão, com o aviso", async () => {
      upstream.state.contracts.set(
        TO_SIGN,
        contract(TO_SIGN, ORDER_TO_SIGN, "awaiting_signatures", [
          { subject: OTHER_USER, organizationId: BUYER_ORG, signed: false },
        ]),
      );
      await renderList();

      const toSign = card("Trânsito IP 1 Gbps");
      expect(
        within(toSign).getByText("Contracts.sign.boundToOther"),
      ).toBeInTheDocument();
      expect(
        within(toSign).queryByRole("button", { name: /Contracts\.sign\./ }),
      ).not.toBeInTheDocument();
    });

    it("perfil sem contract:sign (financeiro) só lê e baixa", async () => {
      profile = { ...BUYER_CONTEXT, permissions: ["contract:read"] };
      await renderList();

      expect(
        screen.queryByRole("button", { name: /Contracts\.sign\./ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Contracts.signNotice.title")).toBeNull();
      expect(
        screen.getAllByRole("button", {
          name: "Contracts.actions.downloadPdf",
        }),
      ).toHaveLength(2);
    });

    it("baixa o PDF pelo BFF com o nome do pedido", async () => {
      const { user } = await renderList();

      await user.click(
        within(card("Colocation 2U")).getByRole("button", {
          name: "Contracts.actions.downloadPdf",
        }),
      );

      await waitFor(() =>
        expect(downloads).toEqual([
          `contrato-pedido-${ORDER_SIGNED.slice(0, 8)}.pdf`,
        ]),
      );
      expect(browserCalls).toContain(`GET /api/contracts/${SIGNED}/document`);
      const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
      expect(blob.size).toBe(PDF.byteLength);
    });

    it("gateway bloqueado (403 HTML): avisa indisponível e recupera no tentar de novo", async () => {
      upstream.state.gateway = "blocked";
      const { user } = renderWithProviders(<ContractsPage />);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Contracts.errors.unavailable",
      );

      upstream.state.gateway = "open";
      await user.click(screen.getByRole("button", { name: "Contracts.retry" }));

      expect(await screen.findAllByRole("article")).toHaveLength(2);
    });

    it("lista vazia: contrato ainda em preparação", async () => {
      upstream.state.contracts.clear();
      renderWithProviders(<ContractsPage />);

      expect(await screen.findByText("Contracts.empty")).toBeInTheDocument();
    });
  },
);

describe(
  "Detalhe do contrato: front → BFF → contracts-api",
  {
    timeout: 20_000,
  },
  () => {
    // `params` já resolvido, como o Next entrega: React.use() lê sem suspender.
    function renderDetail(contractId: string) {
      const value = { contractId };
      const params = Object.assign(Promise.resolve(value), {
        status: "fulfilled",
        value,
      });
      return renderWithProviders(
        <React.Suspense fallback={null}>
          <ContractDetailPage params={params} />
        </React.Suspense>,
      );
    }

    it("mostra o pedido, a prévia do PDF conferida pelo SHA-256 e as ações", async () => {
      const { user } = renderDetail(TO_SIGN);

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "Trânsito IP 1 Gbps",
        }),
      ).toBeInTheDocument();
      expect(upstreamCalls(`/order-contracts/${TO_SIGN}`)[0].url).toBe(
        `${CONTRACTS_API}/order-contracts/${TO_SIGN}`,
      );

      // PDF lido pelo BFF e conferido contra o documentHash.
      expect(
        await screen.findByText("Contracts.document.verified"),
      ).toBeInTheDocument();
      expect(screen.getByTitle("Contracts.document.title")).toHaveAttribute(
        "src",
        "blob:contract-pdf",
      );
      expect(screen.getByText("Contracts.document.hash")).toBeInTheDocument();

      expect(
        screen.getByRole("link", { name: "Contracts.actions.viewOrder" }),
      ).toHaveAttribute("href", `/orders/${ORDER_TO_SIGN}`);
      expect(
        screen.getByText("Contracts.signature.noSigner"),
      ).toBeInTheDocument();

      // "Atualizar status" relê o contrato.
      const reads = upstreamCalls(`/order-contracts/${TO_SIGN}`).length;
      await user.click(
        screen.getByRole("button", { name: "Contracts.signature.refresh" }),
      );
      await waitFor(() =>
        expect(upstreamCalls(`/order-contracts/${TO_SIGN}`).length).toBe(
          reads + 1,
        ),
      );
    });

    it("PDF diferente do documentHash: alerta de integridade", async () => {
      upstream.state.contracts.set(TO_SIGN, {
        ...contract(TO_SIGN, ORDER_TO_SIGN, "awaiting_signer"),
        documentHash: "0".repeat(64),
      });
      renderDetail(TO_SIGN);

      expect(
        await screen.findByText("Contracts.document.mismatch"),
      ).toBeInTheDocument();
    });

    it("assina pelo painel e o signatário vira 'Você'", async () => {
      const { user } = renderDetail(TO_SIGN);

      const panel = (
        await screen.findByRole("heading", {
          name: "Contracts.signature.title",
        })
      ).closest("section")!;
      await user.click(
        within(panel).getByRole("button", { name: "Contracts.sign.sign" }),
      );

      await waitFor(() => expect(tab.location.href).toBe(SIGNING_URL));
      expect(
        await within(panel).findByText("Contracts.signature.you"),
      ).toBeInTheDocument();
      expect(
        within(panel).getByText("Contracts.signature.notVerified"),
      ).toBeInTheDocument();
    });

    it.each([
      ["inexistente", "11111111-2222-4333-8444-555555555555", 1],
      ["fora do formato UUID", "CTR-2026-001", 0],
    ])(
      "contrato %s: 'não encontrado'",
      async (_case, contractId, upstreamReads) => {
        renderDetail(contractId);

        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Contracts.errors.notFound",
        );
        // ID inválido para no BFF (422), sem chegar à contracts-api.
        expect(upstreamCalls("/order-contracts/")).toHaveLength(upstreamReads);
      },
    );
  },
);
