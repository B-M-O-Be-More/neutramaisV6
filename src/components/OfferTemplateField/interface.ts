import type { OfferCategoryPanelTone } from "@/components/OfferCategoryPanel";
import type { TemplateFormValue } from "@/functions/templateFields";
import type { CategoryTemplateField } from "@/services/productCatalog.service";

export interface OfferTemplateFieldProps {
  /** `id` do controle (único na página). */
  id: string;
  /** Campo do template ou campo de valor de uma regra. */
  field: CategoryTemplateField;
  value: TemplateFormValue | undefined;
  onChange: (value: TemplateFormValue) => void;
  onBlur?: () => void;
  /** Mensagem de erro (já traduzida). */
  error?: string;
  tone: OfferCategoryPanelTone;
}
