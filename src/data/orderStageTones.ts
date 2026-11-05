import type { OrderStageTone } from "@/functions/orderStage";

// Cores da etapa do pedido no selo do cabeçalho e no "Status atual" (Figma
// 2191-17830: verde em execução; âmbar aguardando; vermelho encerrado).
export const ORDER_STAGE_TONES: Record<
  OrderStageTone,
  { accent: string; bg: string; border: string }
> = {
  success: { accent: "#10B981", bg: "#EDFBF5", border: "#AAECD5" },
  warning: { accent: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  danger: { accent: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};
