/**
 * Configuracao PUBLICA do site.
 *
 * Tudo aqui vai para o navegador. Por isso so existem IDs e dados de contato —
 * nenhum segredo. As variaveis NEXT_PUBLIC_* precisam ser referenciadas de
 * forma literal (`process.env.NEXT_PUBLIC_X`) para o Next conseguir inlina-las
 * no bundle; por isso a repeticao abaixo e' intencional.
 *
 * Campos que dependem de informacao real da Arena (endereco, telefone, horario)
 * nascem `null`. O site NUNCA inventa esses dados: cada componente esconde a
 * secao correspondente enquanto o valor nao estiver configurado.
 */

function clean(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function num(value: string | undefined): number | null {
  const raw = clean(value);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

const siteUrl = clean(process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/+$/, '') ?? 'http://localhost:3000';

const whatsappNumber = clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)?.replace(/\D/g, '') ?? null;
const instagramHandle = clean(process.env.NEXT_PUBLIC_INSTAGRAM)?.replace(/^@/, '') ?? null;

const street = clean(process.env.NEXT_PUBLIC_ADDRESS_STREET);
const district = clean(process.env.NEXT_PUBLIC_ADDRESS_DISTRICT);
const city = clean(process.env.NEXT_PUBLIC_ADDRESS_CITY) ?? 'Balneário Camboriú';
const state = clean(process.env.NEXT_PUBLIC_ADDRESS_STATE) ?? 'SC';
const zip = clean(process.env.NEXT_PUBLIC_ADDRESS_ZIP);
const lat = num(process.env.NEXT_PUBLIC_LAT);
const lng = num(process.env.NEXT_PUBLIC_LNG);
const placeId = clean(process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID);

/** Endereco completo em uma linha, ou `null` enquanto a rua nao for informada. */
const fullAddress =
  street !== null
    ? [street, district, `${city} — ${state}`, zip].filter((part): part is string => part !== null).join(', ')
    : null;

/** Alvo do mapa: coordenadas quando existirem, senao o endereco textual. */
const mapQuery = lat !== null && lng !== null ? `${lat},${lng}` : (fullAddress ?? `${city}, ${state}`);

export const site = {
  name: 'Arena Colossal',
  tagline: 'Estética Automotiva',
  url: siteUrl,
  locale: 'pt-BR',

  contact: {
    whatsappNumber,
    whatsappLink:
      whatsappNumber !== null
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            'Olá! Vim pelo site da Arena Colossal e gostaria de falar sobre um serviço.',
          )}`
        : null,
    email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    instagram: instagramHandle,
    instagramUrl: instagramHandle !== null ? `https://instagram.com/${instagramHandle}` : null,
  },

  location: {
    street,
    district,
    city,
    state,
    zip,
    lat,
    lng,
    placeId,
    fullAddress,
    /** Mapa embutido sem cookie de terceiros ate o usuario interagir. */
    embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`,
    mapsUrl:
      placeId !== null
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}&query_place_id=${placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
    directionsUrl:
      placeId !== null
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}&destination_place_id=${placeId}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`,
  },

  analytics: {
    ga4: clean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID),
    gtm: clean(process.env.NEXT_PUBLIC_GTM_ID),
    metaPixel: clean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  },

  turnstileSiteKey: clean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
} as const;

/** Navegacao principal — a mesma lista alimenta navbar, menu mobile e rodape. */
export const navigation = [
  { label: 'Experiência', href: '#experiencia' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Resultados', href: '#resultados' },
  { label: 'Agendamento', href: '#agendamento' },
] as const;
