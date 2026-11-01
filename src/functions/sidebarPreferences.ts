// Preferências da navegação lateral, lembradas neste navegador: cada página
// monta o próprio AuthenticatedLayout, então sem isso a sidebar voltaria
// aberta a cada navegação. Sem storage (aba anônima, bloqueio, SSR), vale o
// padrão: sidebar aberta e todas as seções expandidas.

const COLLAPSED_KEY = "neutramais.sidebar.collapsed";
const CLOSED_SECTIONS_KEY = "neutramais.sidebar.closedSections";

/** Se a sidebar inteira está recolhida (só a marca visível). */
export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // Sem storage: vale só até a próxima navegação.
  }
}

/** Seções recolhidas, identificadas por "<papel>.<seção>" (ex.: "buyer.finance"). */
export function readClosedSidebarSections(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(CLOSED_SECTIONS_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveClosedSidebarSections(ids: string[]): void {
  try {
    localStorage.setItem(CLOSED_SECTIONS_KEY, JSON.stringify(ids));
  } catch {
    // Sem storage: vale só até a próxima navegação.
  }
}
