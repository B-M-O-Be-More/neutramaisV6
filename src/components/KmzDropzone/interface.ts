export interface KmzDropzoneProps {
  /** `id` do input de arquivo — liga rótulo e mensagens. */
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  /** Mensagem de erro (já traduzida). */
  error?: string;
  /** Idioma para o tamanho do arquivo (ex.: "pt-BR"). */
  locale: string;
}
