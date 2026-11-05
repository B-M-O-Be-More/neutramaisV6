/** Até duas iniciais do nome ("Maria Azevedo da Silva" → "MA"). */
export function nameInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-ZÀ-Ý]/.test(word));
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

// Papéis do mais amplo para o mais restrito: o primeiro que o usuário tiver é
// o "cargo" exibido quando não há um cadastrado.
const ROLE_PRIORITY = [
  "org_owner",
  "seller_owner",
  "buyer_owner",
  "org_admin",
  "super_admin",
  "seller_commercial",
  "buyer_purchaser",
  "seller_finance",
  "buyer_finance",
  "seller_operations",
  "seller_technical",
  "buyer_technical",
  "seller_support",
  "buyer_support",
];

/** Papel principal (chave de `Profile.roles.*`), ou null sem papel conhecido. */
export function primaryRole(roles: string[]): string | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

/** Chave base32 do `otpauth://totp/...?secret=...`, para cadastro manual. */
export function otpauthSecret(uri: string): string {
  return uri.match(/[?&]secret=([^&]+)/i)?.[1] ?? "";
}

/** "Janeiro de 2026" no idioma pedido. */
export function memberSince(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const text = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface BrowserSession {
  /** Ex.: "Chrome 126". */
  browser: string;
  /** Ex.: "macOS", "Windows", "iOS". */
  os: string;
}

// Ordem importa: Edge e Opera também se dizem Chrome; Chrome se diz Safari.
const BROWSERS: [RegExp, string][] = [
  [/Edg\/(\d+)/, "Edge"],
  [/OPR\/(\d+)/, "Opera"],
  [/Firefox\/(\d+)/, "Firefox"],
  [/Chrome\/(\d+)/, "Chrome"],
  [/Version\/(\d+).*Safari/, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

/** Navegador e sistema da sessão atual, lidos do user agent. */
export function describeUserAgent(userAgent: string): BrowserSession {
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent));
  const version = browser ? userAgent.match(browser[0])?.[1] : undefined;
  const os = SYSTEMS.find(([pattern]) => pattern.test(userAgent));
  return {
    browser: browser ? `${browser[1]}${version ? ` ${version}` : ""}` : "",
    os: os?.[1] ?? "",
  };
}
