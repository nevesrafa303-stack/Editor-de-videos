import type { MetadataRoute } from 'next';

import { site } from '@/lib/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // API nao tem conteudo indexavel; /agendamento/<id> e' link privado do
        // cliente e nao deve aparecer em busca nenhuma.
        disallow: ['/api/', '/agendamento/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
