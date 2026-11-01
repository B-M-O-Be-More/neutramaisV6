export interface SellerCoverageDetailProps {
  /** Organização do seller (dona do arquivo). */
  organizationId: string | null;
  /** Arquivo lógico de cobertura (as versões ligadas por `predecessorId`). */
  fileId: string;
  /** Só o Dono envia versões, troca a ativa e exclui. */
  canUpload: boolean;
  /** Idioma para datas e tamanhos (ex.: "pt-BR"). */
  locale: string;
  /** Volta para a lista de coberturas (ex.: depois de excluir). */
  onBack: () => void;
}
