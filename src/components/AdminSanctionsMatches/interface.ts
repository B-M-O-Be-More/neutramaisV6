import type { SanctionsMatch } from "@/services/admin.service";

export interface AdminSanctionsMatchesProps {
  matches: SanctionsMatch[];
  /** Documento da organização já formatado (ex.: CNPJ com máscara). */
  taxId: string;
  legalName: string;
  isLoading: boolean;
  /** Chave de tradução do erro; null sem erro. */
  error: string | null;
  onReload: () => void;
}
