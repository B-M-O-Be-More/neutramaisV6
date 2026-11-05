import { buildSpecificationPayload } from "@/functions/buildSpecificationPayload";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import {
  productCatalogService,
  type CategoryTemplateField,
} from "@/services/productCatalog.service";

/**
 * Especificação da oferta (o SKU técnico, com os valores do template da
 * categoria). Na criação, ou quando a edição troca a categoria, é uma nova;
 * na mesma categoria, a atual recebe os valores do formulário — o PATCH
 * substitui `characteristics` inteiro. `templateFields` são os campos
 * genéricos do template (sem tela própria).
 */
export async function resolveOfferSpecification(
  values: SellerOfferValues,
  current?: { specificationId: string },
  templateFields: CategoryTemplateField[] = [],
): Promise<string> {
  const payload = buildSpecificationPayload(values, templateFields);
  if (current) {
    await productCatalogService.updateSpecification(current.specificationId, {
      categoryId: payload.categoryId,
      characteristics: payload.characteristics,
    });
    return current.specificationId;
  }
  const created = await productCatalogService.createSpecification(payload);
  return created!.id;
}
