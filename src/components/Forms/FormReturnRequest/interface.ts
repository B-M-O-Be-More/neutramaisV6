import type { ReturnRequestValues } from "@/schemas/returns";

export type { ReturnRequestValues };

export interface FormReturnRequestProps {
  /** Idioma do tamanho dos arquivos. */
  locale: string;
  isSubmitting: boolean;
  onSubmit: (values: ReturnRequestValues) => void;
}
