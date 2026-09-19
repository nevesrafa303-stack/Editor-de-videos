import type { MetadataRoute } from 'next';

import { site } from '@/lib/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Rotas de API nao tem conteudo indexavel e algumas sao de escrita.
        disallow: '/api/',
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
