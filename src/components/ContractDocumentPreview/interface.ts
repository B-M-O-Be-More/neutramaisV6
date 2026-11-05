import type { UseContractDocumentReturn } from "@/hooks/useContractDocument";

export interface ContractDocumentPreviewProps extends Pick<
  UseContractDocumentReturn,
  "url" | "isVerified" | "isLoading" | "errorKey"
> {
  /** SHA-256 do PDF; null quando o pedido foi cancelado antes do contrato. */
  documentHash: string | null;
  onRetry: () => void;
}
