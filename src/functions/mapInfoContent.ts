// Conteúdo do popup de leitura do mapa de cobertura: título e linhas
// rótulo/valor. Montado em DOM com `textContent` — nomes vindos do KMZ não
// viram HTML.

/** Linha do popup: rótulo e valor já formatados. */
export type MapInfoRow = [label: string, value: string];

export function mapInfoContent(title: string, rows: MapInfoRow[]): HTMLElement {
  const root = document.createElement("div");
  root.style.cssText =
    "min-width:180px;max-width:260px;font-size:12px;line-height:18px;color:#0F1729;";

  const heading = document.createElement("strong");
  heading.textContent = title;
  heading.style.cssText =
    "display:block;margin-bottom:6px;font-size:13px;font-weight:700;";
  root.append(heading);

  const list = document.createElement("dl");
  list.style.cssText = "margin:0;display:grid;gap:4px;";
  for (const [label, value] of rows) {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;justify-content:space-between;gap:12px;align-items:baseline;";
    const term = document.createElement("dt");
    term.textContent = label;
    term.style.cssText = "color:#8A9AB5;flex-shrink:0;";
    const detail = document.createElement("dd");
    detail.textContent = value;
    detail.style.cssText =
      "margin:0;font-weight:600;text-align:right;overflow-wrap:anywhere;";
    row.append(term, detail);
    list.append(row);
  }
  root.append(list);
  return root;
}
