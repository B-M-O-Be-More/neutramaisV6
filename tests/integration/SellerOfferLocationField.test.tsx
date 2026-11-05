import { yupResolver } from "@hookform/resolvers/yup";
import userEvent from "@testing-library/user-event";
import { useForm, useWatch } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerOfferLocationField from "@/components/SellerOfferLocationField";
import {
  EMPTY_OFFER_LOCATION,
  sellerOfferSchema,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";
import { mapboxGeocodingService } from "@/services/mapboxGeocoding.service";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

// As sugestões chegam depois da pausa da digitação e da busca: com a suíte
// inteira em paralelo, passam do 1 s padrão do findBy.
const OPTIONS_TIMEOUT = { timeout: 5_000 };

vi.mock("@/services/mapboxGeocoding.service", () => ({
  mapboxGeocodingService: {
    isAvailable: vi.fn(() => true),
    search: vi.fn(),
  },
}));

const RESULTS = [
  {
    id: "addr-1",
    label: "Av. Dom Luís, 300, Fortaleza - CE",
    longitude: -38.4931,
    latitude: -3.7375,
  },
  {
    id: "addr-2",
    label: "Av. Dom Luís, 500, Fortaleza - CE",
    longitude: -38.49,
    latitude: -3.74,
  },
];

/** Formulário mínimo com o campo, expondo as coordenadas para conferência. */
function Harness() {
  const {
    control,
    formState: { errors },
  } = useForm<SellerOfferValues>({
    resolver: yupResolver(sellerOfferSchema),
    defaultValues: {
      category: "connectivity",
      locations: [EMPTY_OFFER_LOCATION],
    },
  });
  const locations = useWatch({ control, name: "locations" });
  const { longitude = null, latitude = null } = locations?.[0] ?? {};
  return (
    <>
      <SellerOfferLocationField control={control} errors={errors} />
      <output data-testid="point">
        {longitude === null ? "sem ponto" : `${longitude},${latitude}`}
      </output>
      <output data-testid="labels">
        {(locations ?? []).map((location) => location.label).join("|")}
      </output>
    </>
  );
}

// O rótulo nomeia o campo e a lista de sugestões: busca pelo papel.
// O combobox do Chakra sincroniza o texto no tick seguinte: tecla a tecla,
// letras se perdem no jsdom com a máquina carregada (a busca saía
// "A om Lus"). O endereço entra inteiro, menos a última letra, numa mudança
// só; a última vem do teclado, porque o combobox decide abrir a lista pelo
// texto anterior à tecla.
const typist = () => userEvent.setup();

async function typeAddress(
  user: ReturnType<typeof typist>,
  input: HTMLElement,
  text: string,
) {
  await user.click(input);
  fireEvent.change(input, { target: { value: text.slice(0, -1) } });
  await user.type(input, text.slice(-1));
}

const addressInput = () =>
  screen.getByRole("combobox", {
    name: /SellerOfferCreate.coverage.locationLabel/,
  });

const addButton = () =>
  screen.getByRole("button", {
    name: "SellerOfferCreate.coverage.locationAdd",
  });

describe("SellerOfferLocationField", { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mapboxGeocodingService.search).mockResolvedValue(RESULTS);
  });

  it("busca o endereço, cria o ponto ao escolher e abre o campo de raio", async () => {
    renderWithProviders(<Harness />);
    const user = typist();

    expect(
      screen.queryByLabelText(/SellerOfferCreate.coverage.radiusLabel/),
    ).not.toBeInTheDocument();

    await typeAddress(user, addressInput(), "Av Dom Luis");

    const option = await screen.findByRole(
      "option",
      { name: /Av\. Dom Luís, 300/ },
      OPTIONS_TIMEOUT,
    );
    expect(mapboxGeocodingService.search).toHaveBeenCalledWith(
      "Av Dom Luis",
      expect.anything(),
    );

    await user.click(option);

    expect(screen.getByTestId("point")).toHaveTextContent("-38.4931,-3.7375");
    expect(addressInput()).toHaveValue("Av. Dom Luís, 300, Fortaleza - CE");
    expect(
      await screen.findByLabelText(/SellerOfferCreate.coverage.radiusLabel/),
    ).toBeVisible();
  });

  it("digitar de novo desfaz o ponto e esconde o raio", async () => {
    renderWithProviders(<Harness />);
    const user = typist();

    await typeAddress(user, addressInput(), "Av Dom Luis");
    await user.click(
      await screen.findByRole(
        "option",
        { name: /Av\. Dom Luís, 300/ },
        OPTIONS_TIMEOUT,
      ),
    );
    expect(screen.getByTestId("point")).toHaveTextContent("-38.4931");

    await user.type(addressInput(), "x");

    await waitFor(() =>
      expect(screen.getByTestId("point")).toHaveTextContent("sem ponto"),
    );
    expect(
      screen.queryByLabelText(/SellerOfferCreate.coverage.radiusLabel/),
    ).not.toBeInTheDocument();
  });

  it("não busca com menos de 3 letras", async () => {
    renderWithProviders(<Harness />);
    const user = typist();

    await user.type(addressInput(), "Av");
    // Espera passar a pausa da digitação.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mapboxGeocodingService.search).not.toHaveBeenCalled();
  });

  it("o + acrescenta outra localidade e o − remove a da linha", async () => {
    renderWithProviders(<Harness />);
    const user = typist();

    // Uma linha só: sem "−".
    expect(
      screen.queryByRole("button", {
        name: "SellerOfferCreate.coverage.locationRemove",
      }),
    ).not.toBeInTheDocument();

    await typeAddress(user, addressInput(), "Av Dom Luis");
    await user.click(
      await screen.findByRole(
        "option",
        { name: /Av\. Dom Luís, 300/ },
        OPTIONS_TIMEOUT,
      ),
    );
    await user.click(addButton());

    const second = screen.getByRole("combobox", {
      name: /SellerOfferCreate.coverage.locationItemLabel/,
    });
    expect(second).toHaveValue("");
    expect(
      screen.getAllByRole("button", {
        name: "SellerOfferCreate.coverage.locationRemove",
      }),
    ).toHaveLength(2);
    // O "+" fica só na última linha.
    expect(
      screen.getAllByRole("button", {
        name: "SellerOfferCreate.coverage.locationAdd",
      }),
    ).toHaveLength(1);

    await typeAddress(user, second, "Av Dom Luis");
    await user.click(
      await screen.findByRole(
        "option",
        { name: /Av\. Dom Luís, 500/ },
        OPTIONS_TIMEOUT,
      ),
    );
    expect(screen.getByTestId("labels")).toHaveTextContent(
      "Av. Dom Luís, 300, Fortaleza - CE|Av. Dom Luís, 500, Fortaleza - CE",
    );

    // Remove a primeira: a segunda sobe e mantém o endereço.
    await user.click(
      screen.getAllByRole("button", {
        name: "SellerOfferCreate.coverage.locationRemove",
      })[0],
    );
    expect(screen.getByTestId("labels")).toHaveTextContent(
      /^Av\. Dom Luís, 500, Fortaleza - CE$/,
    );
    expect(addressInput()).toHaveValue("Av. Dom Luís, 500, Fortaleza - CE");
  });
});
