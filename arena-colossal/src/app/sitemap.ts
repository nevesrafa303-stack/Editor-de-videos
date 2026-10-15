import type { MetadataRoute } from 'next';

import { services } from '@/lib/config/services';
import { site } from '@/lib/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: site.url, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/servicos`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    // Cada servico e' uma porta de entrada propria pela busca.
    ...services.map((service) => ({
      url: `${site.url}/servicos/${service.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${site.url}/politica-de-privacidade`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
