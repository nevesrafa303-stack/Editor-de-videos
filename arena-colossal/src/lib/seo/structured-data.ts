import { services } from '@/lib/config/services';
import { site } from '@/lib/config/site';

/**
 * JSON-LD da Arena.
 *
 * Principio: so entra no schema o que esta REALMENTE configurado. Endereco,
 * telefone, coordenadas e horario aparecem apenas quando existem — dado
 * inventado em structured data e' pior que dado ausente, porque o Google
 * publica aquilo como se fosse verdade.
 */

export type OpeningWindow = { weekday: number; open: string; close: string };

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function buildLocalBusinessJsonLd(businessHours: OpeningWindow[]) {
  const address: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: site.location.city,
    addressRegion: site.location.state,
    addressCountry: 'BR',
  };

  if (site.location.street !== null) address.streetAddress = site.location.street;
  if (site.location.zip !== null) address.postalCode = site.location.zip;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoDetailing',
    '@id': `${site.url}/#business`,
    name: site.name,
    description:
      'Estética automotiva premium em Balneário Camboriú: lavagem técnica, polimento, vitrificação, higienização e proteção.',
    url: site.url,
    image: `${site.url}/opengraph-image`,
    address,
    areaServed: { '@type': 'City', name: site.location.city },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Serviços Arena Colossal',
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: service.name, description: service.summary },
      })),
    },
  };

  if (site.contact.whatsappNumber !== null) jsonLd.telephone = `+${site.contact.whatsappNumber}`;
  if (site.contact.email !== null) jsonLd.email = site.contact.email;

  if (site.location.lat !== null && site.location.lng !== null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: site.location.lat,
      longitude: site.location.lng,
    };
  }

  const socials = [site.contact.instagramUrl].filter((url): url is string => url !== null);
  if (socials.length > 0) jsonLd.sameAs = socials;

  if (businessHours.length > 0) {
    jsonLd.openingHoursSpecification = businessHours.map((window) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAYS[window.weekday]}`,
      opens: window.open,
      closes: window.close,
    }));
  }

  return jsonLd;
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: `${site.name} — ${site.tagline}`,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${site.url}/#business` },
  };
}
