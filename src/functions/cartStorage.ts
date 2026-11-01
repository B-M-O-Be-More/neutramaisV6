// Carrinho do buyer, lembrado neste navegador. A plataforma ainda não guarda
// o carrinho (RN-PED-02: ele não expira e não reserva estoque); fica por
// organização, para quem entra com outra conta no mesmo navegador. Sem
// storage (aba anônima, bloqueio, SSR), o carrinho vale só nesta página.

export interface CartEntry {
  offeringId: string;
  quantity: number;
}

/** O checkout aceita de 1 a 100 unidades por item. */
export const CART_MAX_QUANTITY = 100;

const KEY_PREFIX = "neutramais.cart.";
const CHANGE_EVENT = "neutramais:cart";

const EMPTY: CartEntry[] = [];
// useSyncExternalStore exige o mesmo array enquanto o valor não muda.
const cache = new Map<string, { raw: string | null; entries: CartEntry[] }>();
// Fallback em memória quando o storage falha.
const memory = new Map<string, string>();

function isEntry(value: unknown): value is CartEntry {
  const entry = value as CartEntry;
  return (
    typeof entry?.offeringId === "string" &&
    Number.isInteger(entry.quantity) &&
    entry.quantity >= 1 &&
    entry.quantity <= CART_MAX_QUANTITY
  );
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function readCart(organizationId: string): CartEntry[] {
  const key = KEY_PREFIX + organizationId;
  const raw = readRaw(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.entries;

  let entries = EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) entries = parsed.filter(isEntry);
  } catch {
    // Valor corrompido: carrinho vazio.
  }
  cache.set(key, { raw, entries });
  return entries;
}

export function saveCart(organizationId: string, entries: CartEntry[]): void {
  const key = KEY_PREFIX + organizationId;
  const raw = JSON.stringify(entries);
  try {
    localStorage.setItem(key, raw);
  } catch {
    memory.set(key, raw);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Avisa mudanças nesta aba e nas outras (evento `storage`). */
export function subscribeCart(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function serverCart(): CartEntry[] {
  return EMPTY;
}
