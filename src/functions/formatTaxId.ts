/**
 * Documento fiscal para exibição: CNPJ com 14 dígitos vira
 * `00.000.000/0000-00`; qualquer outro tipo (ou formato) sai como veio.
 */
export function formatTaxId(taxId: string, kind?: string): string {
  const digits = taxId.replace(/\D/g, "");
  if (kind?.toUpperCase() === "CNPJ" && digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  }
  return taxId;
}
