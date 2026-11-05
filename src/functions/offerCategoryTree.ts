import {
  CUSTOM_OFFER_CATEGORY,
  OFFER_CATEGORIES,
  offerCategoryById,
  type OfferCategory,
  type OfferCategoryDefinition,
} from "@/data/offerCategories";
import type { ProductCategory } from "@/services/productCatalog.service";

/**
 * Categoria da árvore da plataforma, com a família (tela do assistente) da
 * raiz e o caminho de nomes desde a raiz.
 */
export interface OfferCategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  requiresCoverage: boolean;
  hasNumericStock: boolean;
  /** Família da raiz: decide os campos com tela própria. */
  family: OfferCategory;
  rootId: string;
  /** 0 na raiz. */
  depth: number;
  /** Nomes da raiz até esta categoria (inclusive), como a API devolve. */
  path: string[];
  children: OfferCategoryNode[];
}

export interface OfferCategoryIndex {
  roots: OfferCategoryNode[];
  byId: Map<string, OfferCategoryNode>;
}

/** O que a escolha da categoria grava no formulário da oferta. */
export interface OfferCategorySelection {
  category: OfferCategory;
  categoryId: string;
  /** Raiz › subcategoria, com o nome da raiz já traduzido. */
  categoryLabel: string;
  requiresCoverage: boolean;
  hasNumericStock: boolean;
}

const byDisplayOrder = (a: ProductCategory, b: ProductCategory) =>
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "pt-BR");

/** Família da raiz: a de tela própria com o mesmo id, senão `custom`. */
export function familyOfRoot(rootId: string): OfferCategoryDefinition {
  return offerCategoryById(rootId) ?? CUSTOM_OFFER_CATEGORY;
}

/** Índice da árvore de `GET /category?tree=true`. */
export function buildCategoryIndex(tree: ProductCategory[]): OfferCategoryIndex {
  const byId = new Map<string, OfferCategoryNode>();

  const visit = (
    category: ProductCategory,
    root: { id: string; family: OfferCategory },
    parentPath: string[],
  ): OfferCategoryNode => {
    const path = [...parentPath, category.name];
    const node: OfferCategoryNode = {
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      description: category.description,
      requiresCoverage: category.requiresCoverage,
      hasNumericStock: category.hasNumericStock,
      family: root.family,
      rootId: root.id,
      depth: parentPath.length,
      path,
      children: [],
    };
    byId.set(node.id, node);
    node.children = [...(category.children ?? [])]
      .filter((child) => child.isActive !== false)
      .sort(byDisplayOrder)
      .map((child) => visit(child, root, path));
    return node;
  };

  const roots = [...tree]
    .filter((category) => category.isActive !== false)
    .sort(byDisplayOrder)
    .map((category) =>
      visit(
        category,
        { id: category.id, family: familyOfRoot(category.id).key },
        [],
      ),
    );

  return { roots, byId };
}

/**
 * Índice só com as famílias conhecidas, sem subcategorias: usado enquanto a
 * árvore carrega ou quando a API falha — o assistente segue como antes.
 */
export function staticCategoryIndex(): OfferCategoryIndex {
  const byId = new Map<string, OfferCategoryNode>();
  const roots = OFFER_CATEGORIES.map((definition): OfferCategoryNode => {
    const node: OfferCategoryNode = {
      id: definition.categoryId,
      parentId: null,
      name: definition.specificationName,
      description: null,
      requiresCoverage: definition.requiresCoverage,
      hasNumericStock: !!definition.hasNumericStock,
      family: definition.key,
      rootId: definition.categoryId,
      depth: 0,
      path: [definition.specificationName],
      children: [],
    };
    byId.set(node.id, node);
    return node;
  });
  return { roots, byId };
}

/** Subcategorias de uma categoria, em pré-ordem (pai antes das filhas). */
export function descendantsOf(node: OfferCategoryNode): OfferCategoryNode[] {
  return node.children.flatMap((child) => [child, ...descendantsOf(child)]);
}

/**
 * Caminho para exibir: o nome da raiz é trocado pelo rótulo traduzido da
 * família (quando houver), o resto segue a API.
 */
export function categoryPathLabel(
  node: OfferCategoryNode,
  rootLabel?: string,
): string {
  const [root, ...rest] = node.path;
  return [rootLabel || root, ...rest].join(" › ");
}

/** Valores do formulário ao escolher a categoria (raiz ou subcategoria). */
export function selectionOf(
  node: OfferCategoryNode,
  rootLabel?: string,
): OfferCategorySelection {
  return {
    category: node.family,
    categoryId: node.id,
    categoryLabel: categoryPathLabel(node, rootLabel),
    requiresCoverage: node.requiresCoverage,
    hasNumericStock: node.hasNumericStock,
  };
}

/**
 * Seleção de uma oferta salva. Sem a árvore (ou com a categoria fora dela),
 * cai na família pelo id da raiz conhecida, com as flags fixas.
 */
export function selectionForCategoryId(
  index: OfferCategoryIndex,
  categoryId: string | null | undefined,
  rootLabel: (family: OfferCategory) => string | undefined = () => undefined,
): OfferCategorySelection | null {
  if (!categoryId) return null;
  const node = index.byId.get(categoryId);
  if (node) return selectionOf(node, rootLabel(node.family));
  const family = offerCategoryById(categoryId);
  if (!family) return null;
  return {
    category: family.key,
    categoryId,
    categoryLabel: rootLabel(family.key) ?? family.specificationName,
    requiresCoverage: family.requiresCoverage,
    hasNumericStock: !!family.hasNumericStock,
  };
}
