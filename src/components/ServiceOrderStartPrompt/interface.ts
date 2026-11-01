export interface ServiceOrderStartPromptProps {
  open: boolean;
  isPending: boolean;
  /** Fecha sem decidir: o técnico não é adicionado. */
  onClose: () => void;
  /** `true`: adiciona e inicia; `false`: só adiciona. */
  onChoose: (start: boolean) => void;
}
