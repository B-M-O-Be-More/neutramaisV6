import {
  productCatalogService,
  type ProductSpecification,
} from "@/services/productCatalog.service";

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");

/**
 * Plano da categoria: o mais recente com o mesmo nome (a API não impede
 * nomes repetidos) ou um novo. Criar plano exige o catálogo — `GET /catalog`
 * cria o da organização na primeira leitura.
 */
export async function resolveOfferSpecification(name: string): Promise<string> {
  const specifications: ProductSpecification[] =
    (await productCatalogService.listSpecifications()) ?? [];
  const existing =
    specifications.find((spec) => spec.isActive && sameName(spec.name, name)) ??
    specifications.find((spec) => sameName(spec.name, name));
  if (existing) return existing.id;

  await productCatalogService.getCatalog();
  const created = await productCatalogService.createSpecification({ name });
  return created!.id;
}
