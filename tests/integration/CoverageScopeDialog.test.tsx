import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CoverageGeoJson } from "@/components/CoverageMap";
import CoverageScopeDialog, {
  type CoverageScope,
} from "@/components/CoverageScopeDialog";

import { renderWithProviders, screen, within } from "../test-utils";

vi.mock("@/services/mapboxGeocoding.service", () => ({
  mapboxGeocodingService: {
    isAvailable: vi.fn(() => true),
    search: vi.fn().mockResolvedValue([]),
  },
}));

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
