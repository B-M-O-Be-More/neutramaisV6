// Que localidades mudaram entre duas versões da lista (para o mapa saber
// para onde ir).

interface ComparableLocation {
  longitude: number;
  latitude: number;
  radiusKm?: number | null;
  label?: string;
}

const sameLocation = (a: ComparableLocation, b: ComparableLocation) =>
  a.longitude === b.longitude &&
  a.latitude === b.latitude &&
  (a.radiusKm ?? null) === (b.radiusKm ?? null) &&
  (a.label ?? "") === (b.label ?? "");

/**
 * Índices de `next` que são novos ou diferentes do item na mesma posição em
 * `previous`. Remover a última não muda ninguém (lista vazia); remover uma do
 * meio desloca as seguintes, que contam como mudadas.
 */
export function changedLocationIndexes(
  previous: readonly ComparableLocation[],
  next: readonly ComparableLocation[],
): number[] {
  return next.flatMap((location, index) =>
    previous[index] && sameLocation(previous[index], location) ? [] : [index],
  );
}
