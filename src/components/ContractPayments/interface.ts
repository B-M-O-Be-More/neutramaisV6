import type { ContractPayment } from "@/types/contracts";

export interface ContractPaymentsProps {
  payments: ContractPayment[];
  locale: string;
  /** Baixa a nota fiscal da fatura. */
  onDownloadInvoice: (payment: ContractPayment) => void;
}
