import type { NextConfig } from 'next';

/**
 * Cabecalhos de seguranca aplicados a todas as rotas.
 * CSP fica intencionalmente fora daqui: os scripts de analytics sao opcionais
 * e definidos por env, entao a politica e montada em runtime no middleware.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/**
 * Variaveis publicas fixadas no build, para servidor e cliente.
 *
 * POR QUE ISSO E' NECESSARIO: o Next substitui `process.env.NEXT_PUBLIC_*` por
 * valor literal no bundle do NAVEGADOR, durante o build. No servidor, a mesma
 * expressao continua lendo o ambiente em tempo de execucao. Numa pagina
 * dinamica (`/agendamento/[id]`), isso significa que o servidor pode renderizar
 * o botao de WhatsApp — porque a variavel existe no ambiente — enquanto o
 * cliente, com `undefined` gravado no bundle, nao renderiza nada. Resultado:
 * erro de hidratacao e a arvore inteira remontada no cliente.
 *
 * Declarar as chaves aqui faz o Next fixar o MESMO valor nos dois lados. A
 * consequencia e' que mudar uma variavel publica exige novo build — que ja e'
 * exatamente o que o README documenta.
 */
const PUBLIC_ENV_KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'NEXT_PUBLIC_INSTAGRAM',
  'NEXT_PUBLIC_CONTACT_EMAIL',
  'NEXT_PUBLIC_ADDRESS_STREET',
  'NEXT_PUBLIC_ADDRESS_DISTRICT',
  'NEXT_PUBLIC_ADDRESS_CITY',
  'NEXT_PUBLIC_ADDRESS_STATE',
  'NEXT_PUBLIC_ADDRESS_ZIP',
  'NEXT_PUBLIC_LAT',
  'NEXT_PUBLIC_LNG',
  'NEXT_PUBLIC_GOOGLE_PLACE_ID',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
  'NEXT_PUBLIC_GTM_ID',
  'NEXT_PUBLIC_META_PIXEL_ID',
] as const;

const publicEnv = Object.fromEntries(
  PUBLIC_ENV_KEYS.map((key) => [key, process.env[key] ?? '']),
);

const nextConfig: NextConfig = {
  env: publicEnv,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560],
  },
  experimental: {
    optimizePackageImports: ['gsap'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
