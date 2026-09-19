import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal } from '@/components/ui/Reveal';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { getService, services } from '@/lib/config/services';
import { site } from '@/lib/config/site';
import { formatDuration } from '@/lib/utils/format';

import styles from './page.module.css';

type Params = { params: Promise<{ slug: string }> };

/** Dez páginas estáticas, geradas no build. */
export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (service === null) return { title: 'Serviço não encontrado' };

  return {
    title: service.name,
    description: `${service.summary} ${service.description}`.slice(0, 160),
    alternates: { canonical: `/servicos/${service.slug}` },
    openGraph: {
      title: `${service.name} | Arena Colossal`,
      description: service.summary,
      url: `${site.url}/servicos/${service.slug}`,
      type: 'article',
    },
  };
}

/**
 * Página do serviço.
 *
 * Por que cada serviço tem página própria: é o que separa uma landing page de
 * uma plataforma. Cada uma é uma porta de entrada real pela busca ("polimento
 * técnico Balneário Camboriú"), com conteúdo suficiente para decidir e um
 * caminho direto para o agendamento com o serviço já selecionado.
 *
 * O bloco "o que este serviço não resolve" é o coração da página. Publicar o
 * limite do serviço é incomum no setor — e é exatamente por isso que funciona:
 * quem lê entende que do outro lado tem alguém que conhece o próprio trabalho.
 */
export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = getService(slug);

  if (service === null) notFound();

  const relacionados = service.combina
    .map((outro) => getService(outro))
    .filter((outro): outro is NonNullable<typeof outro> => outro !== null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.name,
    provider: { '@type': 'AutoDetailing', name: site.name, '@id': `${site.url}/#business` },
    areaServed: { '@type': 'City', name: site.location.city },
    url: `${site.url}/servicos/${service.slug}`,
  };

  return (
    <article className={styles.page}>
      <header className={`container ${styles.hero}`}>
        <nav className={styles.trilha} aria-label="Você está em">
          <a href="/">Início</a>
          <span aria-hidden="true">/</span>
          <a href="/servicos">Serviços</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{service.name}</span>
        </nav>

        <div className={styles.heroCorpo}>
          <div className={styles.heroTexto}>
            <p className={styles.numero}>{service.index}</p>
            <h1 className={styles.titulo}>{service.name}</h1>
            <p className={styles.resumo}>{service.summary}</p>
            <p className={styles.descricao}>{service.description}</p>

            <dl className={styles.ficha}>
              <div>
                <dt>Bloco na agenda</dt>
                <dd>{formatDuration(service.durationMinutes)}</dd>
              </div>
              <div>
                <dt>Atendimento</dt>
                <dd>
                  {site.location.city} — {site.location.state}
                </dd>
              </div>
            </dl>

            <div className={styles.acoes}>
              <Button href={`/?servico=${service.slug}#agendamento`} size="lg">
                Agendar {service.name}
              </Button>
              <WhatsAppLink source={`servico_${service.slug}`} className={styles.whats}>
                Tirar uma dúvida antes
              </WhatsAppLink>
            </div>
          </div>

          <Reveal variant="mask" className={styles.heroMedia}>
            <MediaFrame
              src={service.image}
              alt={`Arena Colossal — ${service.name}`}
              placeholderLabel={`Foto — ${service.name}`}
              ratio="4 / 3"
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
          </Reveal>
        </div>
      </header>

      <section className={`container ${styles.bloco}`} aria-label="Como acontece">
        <h2 className={styles.blocoTitulo}>Como acontece</h2>
        <ol className={styles.etapas}>
          {service.etapas.map((etapa, index) => (
            <Reveal as="li" key={etapa} variant="up" delay={index * 70} className={styles.etapa}>
              <span className={styles.etapaIndice}>{String(index + 1).padStart(2, '0')}</span>
              <p className={styles.etapaTexto}>{etapa}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className={`container ${styles.limites}`} aria-label="Escopo do serviço">
        <div className={styles.limiteCard} data-tipo="indicado">
          <h2 className={styles.limiteTitulo}>Quando faz sentido</h2>
          <p className={styles.limiteTexto}>{service.indicado}</p>
        </div>

        <div className={styles.limiteCard} data-tipo="nao">
          <h2 className={styles.limiteTitulo}>O que este serviço não resolve</h2>
          <p className={styles.limiteTexto}>{service.naoResolve}</p>
        </div>
      </section>

      {relacionados.length > 0 ? (
        <section className={`container ${styles.bloco}`} aria-label="Serviços que combinam">
          <h2 className={styles.blocoTitulo}>Costuma vir junto</h2>
          <ul className={styles.relacionados}>
            {relacionados.map((outro) => (
              <li key={outro.slug}>
                <a className={styles.relacionado} href={`/servicos/${outro.slug}`}>
                  <span className={styles.relacionadoIndice}>{outro.index}</span>
                  <span className={styles.relacionadoNome}>{outro.name}</span>
                  <span className={styles.relacionadoResumo}>{outro.summary}</span>
                  <span aria-hidden="true" className={styles.seta}>
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`container ${styles.fechamento}`}>
        <p className={styles.fechamentoTexto}>
          O processo final é definido na avaliação, com o carro na frente. O agendamento reserva o
          horário — o resto se decide olhando.
        </p>
        <Button href={`/?servico=${service.slug}#agendamento`} size="lg">
          Reservar horário
        </Button>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
