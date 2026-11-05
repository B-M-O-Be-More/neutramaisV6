import { describe, expect, it } from "vitest";

import {
  buildCategoryIndex,
  categoryPathLabel,
  descendantsOf,
  selectionForCategoryId,
  selectionOf,
  staticCategoryIndex,
} from "@/functions/offerCategoryTree";
import type { ProductCategory } from "@/services/productCatalog.service";

const CONNECTIVITY = "0193a000-0000-7000-8000-000000000c01";
const HARDWARE = "0193a000-0000-7000-8000-000000000c03";
const DEDICATED = "0193a000-0000-7000-8000-0000000000d1";
const DEDICATED_FIBER = "0193a000-0000-7000-8000-0000000000d2";
const ENERGY = "0193a000-0000-7000-8000-0000000000e1";

const category = (
  patch: Partial<ProductCategory> & Pick<ProductCategory, "id" | "name">,
): ProductCategory => ({
  parentId: null,
  description: null,
  templateVersion: 1,
  requiresCoverage: false,
  hasNumericStock: false,
  isActive: true,
  displayOrder: 0,
  template: null,
  rules: null,
  children: null,
  ...patch,
});

const TREE: ProductCategory[] = [
  category({
    id: HARDWARE,
    name: "Hardware e CPE",
    hasNumericStock: true,
    displayOrder: 2,
  }),
  category({
    id: ENERGY,
    name: "Energia",
    description: "Geradores e baterias",
    displayOrder: 9,
  }),
  category({
    id: CONNECTIVITY,
    name: "Conectividade",
    requiresCoverage: true,
    displayOrder: 0,
    children: [
      category({
        id: DEDICATED,
        parentId: CONNECTIVITY,
        name: "Link dedicado",
        requiresCoverage: true,
        children: [
          category({
            id: DEDICATED_FIBER,
            parentId: DEDICATED,
            name: "Fibra",
            requiresCoverage: false,
          }),
        ],
      }),
      category({
        id: "inactive",
        parentId: CONNECTIVITY,
        name: "Desativada",
        isActive: false,
      }),
    ],
  }),
];

describe("buildCategoryIndex", () => {
  const index = buildCategoryIndex(TREE);

  it("ordena as raízes por displayOrder e esconde as inativas", () => {
    expect(index.roots.map((root) => root.name)).toEqual([
      "Conectividade",
      "Hardware e CPE",
      "Energia",
    ]);
    expect(index.byId.has("inactive")).toBe(false);
  });

  it("dá a família da raiz conhecida e `custom` para raiz nova", () => {
    expect(index.byId.get(CONNECTIVITY)?.family).toBe("connectivity");
    expect(index.byId.get(HARDWARE)?.family).toBe("hardware");
    expect(index.byId.get(ENERGY)?.family).toBe("custom");
  });

  it("subcategoria herda a família e guarda raiz, nível e caminho", () => {
    const fiber = index.byId.get(DEDICATED_FIBER)!;
    expect(fiber).toMatchObject({
      family: "connectivity",
      rootId: CONNECTIVITY,
      depth: 2,
      path: ["Conectividade", "Link dedicado", "Fibra"],
      requiresCoverage: false,
    });
  });

  it("lista as subcategorias em pré-ordem", () => {
    const root = index.byId.get(CONNECTIVITY)!;
    expect(descendantsOf(root).map((node) => node.id)).toEqual([
      DEDICATED,
      DEDICATED_FIBER,
    ]);
  });

  it("caminho usa o rótulo traduzido da raiz", () => {
    expect(
      categoryPathLabel(index.byId.get(DEDICATED)!, "Conectividade (pt)"),
    ).toBe("Conectividade (pt) › Link dedicado");
  });

  it("seleção leva o id da subcategoria e as flags dela", () => {
    expect(selectionOf(index.byId.get(DEDICATED_FIBER)!, "Conectividade")).toEqual(
      {
        category: "connectivity",
        categoryId: DEDICATED_FIBER,
        categoryLabel: "Conectividade › Link dedicado › Fibra",
        requiresCoverage: false,
        hasNumericStock: false,
      },
    );
  });
});

describe("selectionForCategoryId", () => {
  it("acha a categoria salva na árvore", () => {
    const index = buildCategoryIndex(TREE);
    expect(selectionForCategoryId(index, DEDICATED)?.categoryId).toBe(
      DEDICATED,
    );
  });

  it("sem a árvore, cai na família conhecida com as flags fixas", () => {
    expect(
      selectionForCategoryId(staticCategoryIndex(), DEDICATED),
    ).toBeNull();
    expect(
      selectionForCategoryId({ roots: [], byId: new Map() }, HARDWARE, () =>
        "Hardware / CPE",
      ),
    ).toEqual({
      category: "hardware",
      categoryId: HARDWARE,
      categoryLabel: "Hardware / CPE",
      requiresCoverage: false,
      hasNumericStock: true,
    });
  });

  it("sem categoria devolve null", () => {
    expect(selectionForCategoryId(staticCategoryIndex(), null)).toBeNull();
  });
});

describe("staticCategoryIndex", () => {
  it("tem as seis famílias, sem subcategorias", () => {
    const index = staticCategoryIndex();
    expect(index.roots).toHaveLength(6);
    expect(index.roots.every((root) => root.children.length === 0)).toBe(true);
  });
});
