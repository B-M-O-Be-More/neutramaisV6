import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoverageGeoJson } from "@/components/CoverageMap";
import CoverageScopeDialog, {
  type CoverageScope,
} from "@/components/CoverageScopeDialog";
import { geoCoverageService } from "@/services/geoCoverage.service";

import { renderWithProviders, screen, within } from "../test-utils";

vi.mock("@/services/mapboxGeocoding.service", () => ({
  mapboxGeocodingService: {
    isAvailable: vi.fn(() => true),
    search: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: { listElements: vi.fn() },
}));

const VERSION = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";

// Área do KMZ: quadrado 0..10.
const KMZ = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
  ],
};

const polygon = (points: [number, number][]) => ({
  type: "Polygon" as const,
  coordinates: [[...points, points[0]]],
});

const FULL: CoverageScope = { mode: "full", publicGeometry: null };

function renderDialog(
  value: CoverageScope = FULL,
  coverage: CoverageGeoJson = KMZ,
) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <CoverageScopeDialog
      open
      coverage={coverage}
      versionId={VERSION}
      value={value}
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { onConfirm, onClose };
}

const confirmButton = () =>
  screen.getByRole("button", {
    name: "SellerOfferCreate.coverageScope.confirm",
  });

describe("CoverageScopeDialog (Escolher cobertura)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Duas áreas (Centro e Norte) e um ponto, que não entra na lista.
    vi.mocked(geoCoverageService.listElements).mockResolvedValue({
      items: [
        {
          placemarkIndex: 0,
          name: "Centro",
          folderPath: ["Fortaleza"],
          geometry: polygon([
            [1, 1],
            [4, 1],
            [4, 4],
          ]),
        },
        {
          placemarkIndex: 1,
          name: "POP",
          geometry: { type: "Point", coordinates: [5, 5] },
        },
        {
          placemarkIndex: 2,
          name: "Norte",
          geometry: polygon([
            [6, 6],
            [9, 6],
            [9, 9],
          ]),
        },
      ],
      hasMore: false,
      nextCursor: null,
    });
  });

  it("confirma a cobertura completa sem polígono", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();

    expect(
      await screen.findByText("SellerOfferCreate.coverageScope.fullInfoTitle"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SellerOfferCreate.coverageScope.status.full"),
    ).toBeInTheDocument();

    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(FULL);
  });

  it("a legenda mostra linhas e pontos só quando o KMZ os tem", async () => {
    renderDialog(FULL, {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: {}, geometry: KMZ },
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [1, 1],
              [2, 2],
            ],
          },
        },
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [3, 3] },
        },
      ],
    });

    for (const key of ["full", "lines", "points"]) {
      expect(
        await screen.findByText(
          `SellerOfferCreate.coverageScope.legend.${key}`,
        ),
      ).toBeInTheDocument();
    }
  });

  it("KMZ só com manchas não lista linhas nem pontos", async () => {
    renderDialog();

    expect(
      await screen.findByText("SellerOfferCreate.coverageScope.legend.full"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("SellerOfferCreate.coverageScope.legend.lines"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("SellerOfferCreate.coverageScope.legend.points"),
    ).not.toBeInTheDocument();
  });

  it("cobertura editada só confirma com o polígono fechado", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      await screen.findByRole("radio", {
        name: /SellerOfferCreate.coverageScope.mode.custom/,
      }),
    );

    expect(
      screen.getByText("SellerOfferCreate.coverageScope.drawTitle"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /coverageScope.locationLabel/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SellerOfferCreate.coverageScope.status.drawing"),
    ).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });

  it("reabre com o polígono salvo e o devolve ao confirmar", async () => {
    const user = userEvent.setup();
    const saved = polygon([
      [1, 1],
      [4, 1],
      [4, 4],
    ]);
    const { onConfirm } = renderDialog({
      mode: "custom",
      publicGeometry: saved,
    });

    expect(
      await screen.findByText("SellerOfferCreate.coverageScope.status.custom"),
    ).toBeInTheDocument();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith({
      mode: "custom",
      publicGeometry: saved,
    });
  });

  it("avisa e bloqueia quando o polígono sai da área do KMZ", async () => {
    renderDialog({
      mode: "custom",
      publicGeometry: polygon([
        [1, 1],
        [14, 1],
        [4, 4],
      ]),
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "SellerOfferCreate.coverageScope.issues.outside",
    );
    expect(confirmButton()).toBeDisabled();
  });

  it("lista vários polígonos e remove só o que está fora do KMZ", async () => {
    const user = userEvent.setup();
    const inside = polygon([
      [1, 1],
      [4, 1],
      [4, 4],
    ]);
    const outside = polygon([
      [6, 6],
      [14, 6],
      [8, 8],
    ]);
    const { onConfirm } = renderDialog({
      mode: "custom",
      publicGeometry: {
        type: "MultiPolygon",
        coordinates: [inside.coordinates, outside.coordinates],
      },
    });

    expect(
      await screen.findAllByText("SellerOfferCreate.coverageScope.shapes.name"),
    ).toHaveLength(2);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    const removeButtons = screen.getAllByRole("button", {
      name: "SellerOfferCreate.coverageScope.shapes.remove",
    });
    await user.click(removeButtons[1]);

    expect(
      screen.getAllByText("SellerOfferCreate.coverageScope.shapes.name"),
    ).toHaveLength(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith({
      mode: "custom",
      publicGeometry: inside,
    });
  });

  it("bloqueia polígonos sobrepostos e polígono que se cruza", async () => {
    const user = userEvent.setup();
    const square = polygon([
      [1, 1],
      [4, 1],
      [4, 4],
      [1, 4],
    ]);
    const overlapping = polygon([
      [3, 3],
      [6, 3],
      [6, 6],
      [3, 6],
    ]);
    // Laço: os lados 1→2 e 3→4 se cruzam.
    const bowTie = polygon([
      [7, 1],
      [9, 3],
      [9, 1],
      [7, 3],
    ]);
    renderDialog({
      mode: "custom",
      publicGeometry: {
        type: "MultiPolygon",
        coordinates: [
          square.coordinates,
          overlapping.coordinates,
          bowTie.coordinates,
        ],
      },
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "SellerOfferCreate.coverageScope.issues.invalid",
    );
    expect(alert).toHaveTextContent(
      "SellerOfferCreate.coverageScope.issues.overlap",
    );
    expect(
      screen.getAllByText(
        "SellerOfferCreate.coverageScope.shapeInfo.issue.overlap",
      ),
    ).toHaveLength(2);
    expect(confirmButton()).toBeDisabled();

    // Sem o laço e sem um dos sobrepostos, o que sobra pode ser enviado.
    const remove = () =>
      screen.getAllByRole("button", {
        name: "SellerOfferCreate.coverageScope.shapes.remove",
      });
    await user.click(remove()[2]);
    await user.click(remove()[1]);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("selecionar um polígono mostra os detalhes e permite removê-lo", async () => {
    const user = userEvent.setup();
    renderDialog({
      mode: "custom",
      publicGeometry: polygon([
        [1, 1],
        [4, 1],
        [4, 4],
      ]),
    });

    await user.click(
      await screen.findByRole("button", {
        name: /SellerOfferCreate.coverageScope.shapes.name/,
        pressed: false,
      }),
    );

    const card = screen.getByRole("group", {
      name: "SellerOfferCreate.coverageScope.shapes.name",
    });
    expect(
      within(card).getByText(
        "SellerOfferCreate.coverageScope.shapeInfo.inside",
      ),
    ).toBeInTheDocument();
    expect(within(card).getByText("3")).toBeInTheDocument();

    await user.click(
      within(card).getByRole("button", {
        name: "SellerOfferCreate.coverageScope.shapeInfo.remove",
      }),
    );

    expect(
      screen.queryByText("SellerOfferCreate.coverageScope.shapes.name"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("SellerOfferCreate.coverageScope.status.drawing"),
    ).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });

  describe("áreas do KMZ", () => {
    const areasMode = () =>
      screen.findByRole("radio", {
        name: /SellerOfferCreate.coverageScope.mode.areas/,
      });

    it("lista as áreas com polígono e confirma os índices escolhidos", async () => {
      const user = userEvent.setup();
      const { onConfirm } = renderDialog();

      // Só busca as áreas ao abrir o modo.
      expect(geoCoverageService.listElements).not.toHaveBeenCalled();
      await user.click(await areasMode());

      expect(
        await screen.findByRole("checkbox", { name: "Centro" }),
      ).toBeInTheDocument();
      expect(geoCoverageService.listElements).toHaveBeenCalledWith(
        VERSION,
        expect.objectContaining({ afterIndex: -1, limit: 500 }),
        expect.anything(),
      );
      expect(
        screen.queryByRole("checkbox", { name: "POP" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.coverageScope.status.areasEmpty"),
      ).toBeInTheDocument();
      expect(confirmButton()).toBeDisabled();

      await user.click(screen.getByRole("checkbox", { name: "Norte" }));
      expect(
        screen.getByText("SellerOfferCreate.coverageScope.status.areas"),
      ).toBeInTheDocument();

      await user.click(confirmButton());
      expect(onConfirm).toHaveBeenCalledWith({
        mode: "areas",
        areaIndexes: [2],
        publicGeometry: polygon([
          [6, 6],
          [9, 6],
          [9, 9],
        ]),
      });
    });

    it("reabre com as áreas salvas marcadas; selecionar todas e limpar", async () => {
      const user = userEvent.setup();
      const { onConfirm } = renderDialog({
        mode: "areas",
        publicGeometry: null,
        areaIndexes: [0],
      });

      expect(
        await screen.findByRole("checkbox", { name: "Centro" }),
      ).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Norte" })).not.toBeChecked();

      await user.click(
        screen.getByRole("button", {
          name: "SellerOfferCreate.coverageScope.areas.selectAll",
        }),
      );
      expect(screen.getByRole("checkbox", { name: "Norte" })).toBeChecked();

      await user.click(
        screen.getByRole("button", {
          name: "SellerOfferCreate.coverageScope.areas.clear",
        }),
      );
      expect(
        screen.getByRole("checkbox", { name: "Centro" }),
      ).not.toBeChecked();
      expect(confirmButton()).toBeDisabled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("falha ao ler as áreas avisa e bloqueia o confirmar", async () => {
      vi.mocked(geoCoverageService.listElements).mockRejectedValue(
        new Error("503"),
      );
      const user = userEvent.setup();
      renderDialog();

      await user.click(await areasMode());

      expect(
        await screen.findByText(
          "SellerOfferCreate.coverageScope.areas.loadError",
        ),
      ).toBeInTheDocument();
      expect(confirmButton()).toBeDisabled();
    });

    it("KMZ sem polígonos avisa que não há áreas para escolher", async () => {
      vi.mocked(geoCoverageService.listElements).mockResolvedValue({
        items: [
          {
            placemarkIndex: 0,
            geometry: { type: "Point", coordinates: [5, 5] },
          },
        ],
        hasMore: false,
        nextCursor: null,
      });
      const user = userEvent.setup();
      renderDialog();

      await user.click(await areasMode());

      expect(
        await screen.findByText("SellerOfferCreate.coverageScope.areas.empty"),
      ).toBeInTheDocument();
    });
  });

  it("cancelar fecha sem confirmar", async () => {
    const user = userEvent.setup();
    const { onConfirm, onClose } = renderDialog();

    // O "X" do cabeçalho tem o mesmo nome acessível; o texto é só do rodapé.
    await user.click(
      await screen.findByText("SellerOfferCreate.coverageScope.cancel"),
    );
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
