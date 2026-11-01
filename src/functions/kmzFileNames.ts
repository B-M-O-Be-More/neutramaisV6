// Nome do arquivo de cada versão de KMZ, lembrado neste navegador: a geo-api
// não guarda o nome (o download vem como "coverage-{versão}.kmz"). Sem
// storage (aba anônima, bloqueio), a lista mostra o rótulo "KMZ {id}".

const STORAGE_KEY = "neutramais.kmzFileNames";
// Os mais recentes bastam; o resto cai para o rótulo do id.
const MAX_ENTRIES = 200;

function read(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/** Nome lembrado para a versão, se houver. */
export function kmzFileName(versionId: string): string | undefined {
  const name = read()[versionId];
  return typeof name === "string" ? name : undefined;
}

/** Lembra o nome do arquivo enviado para a versão criada. */
export function rememberKmzFileName(versionId: string, name: string): void {
  try {
    const names = read();
    delete names[versionId];
    names[versionId] = name;
    const entries = Object.entries(names).slice(-MAX_ENTRIES);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Sem storage: segue sem o nome.
  }
}
