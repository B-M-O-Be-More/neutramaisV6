import type {
  CampaignOffer,
  OfferProvider,
  OffersShowcase,
} from "@/types/offers";

// Dados do design (Figma 2084-13767), usados até a marketplace-api expor
// campanhas, reputação de provedor e prazos de promoção. Os prazos são
// relativos a `now` para o "Expira em…" continuar fazendo sentido.

const MINUTE = 60 * 1000;

const RUSSAS: OfferProvider = {
  name: "Russas Telecom",
  rating: 4.8,
  reviews: 124,
  kycVerified: true,
};

const LINUMAX: OfferProvider = {
  name: "LinuMax telecom",
  rating: 4.8,
  reviews: 124,
  kycVerified: true,
};

const IXNET: OfferProvider = {
  name: "Ixnet",
  rating: 4.8,
  reviews: 124,
  kycVerified: true,
};

export function placeholderOffersShowcase(now: number): OffersShowcase {
  const expires = (minutes: number) =>
    new Date(now + minutes * MINUTE).toISOString();

  const fiberWeek = (id: string): CampaignOffer => ({
    id,
    badge: "weekPromotion",
    cover: "connectivity",
    provider: RUSSAS,
    category: "fiber",
    title: "Internet Fibra Gamer",
    expiresAt: expires(217),
  });

  return {
    topProviders: { providers: [RUSSAS, LINUMAX, IXNET] },
    specials: ["sp-1", "sp-2", "sp-3", "sp-4"].map(fiberWeek),
    featured: [
      {
        id: "ft-1",
        badge: "bestOffers",
        cover: "connectivity",
        sponsored: true,
        provider: RUSSAS,
        category: "fiber",
        title: "Internet Fibra Gamer",
        expiresAt: expires(217),
      },
      {
        id: "ft-2",
        badge: "forYou",
        cover: "forYou",
        provider: LINUMAX,
        category: "hardware",
        title: "Roteador Mikrotik RB4011",
        expiresAt: expires(217),
      },
      {
        id: "ft-3",
        badge: "newOffers",
        cover: "connectivity",
        provider: RUSSAS,
        category: "fiber",
        title: "Internet Fibra Gamer",
        expiresAt: expires(217),
      },
      {
        id: "ft-4",
        badge: "weekOffers",
        cover: "hardware",
        provider: RUSSAS,
        category: "hardware",
        title: "Roteador Mikrotik RB4011",
        expiresAt: expires(217),
      },
    ],
    forYou: [
      { id: "fy-1", category: "hardware", title: "Roteador Mikrotik RB4011" },
      { id: "fy-2", category: "hardware", title: "Roteador Mikrotik RB4011" },
      { id: "fy-3", category: "fiber", title: "Internet Fibra Premium" },
    ],
    bestDeals: ["bd-1", "bd-2", "bd-3", "bd-4"].map((id) => ({
      id,
      badge: "bestOffers",
      cover: "hardware",
      discountPercent: 23,
      provider: RUSSAS,
      category: "hardware",
      location: "Nacional",
      title: "Roteador Mikrotik RB4011",
      expiresAt: expires(217),
    })),
  };
}
