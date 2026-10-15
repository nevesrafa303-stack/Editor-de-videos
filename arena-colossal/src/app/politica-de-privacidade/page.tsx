import type { Metadata } from 'next';

import { site } from '@/lib/config/site';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description:
    'Como a Arena Colossal trata os dados informados no agendamento online: o que é coletado, para quê e por quanto tempo.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/politica-de-privacidade' },
};

/**
 * Politica de privacidade.
 *
 * Descreve exatamente o que o sistema faz — nada a mais. Itens que dependem de
 * decisao da Arena (prazo de retencao, encarregado de dados) estao marcados no
 * README como pendencia de configuracao, e nao foram preenchidos com valores
 * inventados.
 */
export default function PrivacyPage() {
  return (
    <article className={`container-narrow ${styles.page}`}>
      <header className={styles.header}>
        <p className="eyebrow">Arena Colossal</p>
        <h1 className={styles.title}>Política de privacidade</h1>
        <p className={styles.lead}>
          Esta página explica quais dados o site coleta, por que coleta e com quem eles são
          compartilhados.
        </p>
      </header>

      <section className={styles.section}>
        <h2>Dados coletados no agendamento</h2>
        <p>
          Para reservar um horário, o formulário solicita: nome completo, telefone de WhatsApp,
          e-mail, marca, modelo e ano do veículo, serviço desejado, data, horário e observações
          opcionais.
        </p>
        <p>
          Esses dados são usados exclusivamente para registrar o agendamento, preparar o
          atendimento e entrar em contato sobre esse horário. Não são vendidos nem usados para
          publicidade de terceiros.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Com quem os dados são compartilhados</h2>
        <ul className={styles.list}>
          <li>
            <strong>Google Calendar</strong> — o agendamento vira um evento na agenda interna da
            Arena, contendo os dados acima.
          </li>
          <li>
            <strong>WhatsApp Business (Meta)</strong> — a equipe recebe um aviso com os dados do
            agendamento.
          </li>
          <li>
            <strong>Serviço de e-mail transacional</strong> — envia a confirmação para você e a
            cópia interna para a Arena.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> — verifica que o envio partiu de uma pessoa, sem
            criar perfil de navegação.
          </li>
        </ul>
        <p>
          Cada um desses serviços recebe apenas o necessário para cumprir sua função no
          agendamento.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Medição de uso</h2>
        <p>
          O site pode usar ferramentas de medição (Google Analytics, Google Tag Manager e Meta
          Pixel) para entender quais seções são visitadas e em que ponto do agendamento as pessoas
          desistem. Esses eventos não incluem nome, telefone nem e-mail.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Seus direitos</h2>
        <p>
          Você pode solicitar a confirmação, o acesso, a correção ou a exclusão dos seus dados a
          qualquer momento, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>
        {site.contact.email !== null || site.contact.whatsappLink !== null ? (
          <p>
            Para isso, fale com a Arena
            {site.contact.email !== null ? (
              <>
                {' '}
                pelo e-mail <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              </>
            ) : null}
            {site.contact.whatsappLink !== null ? (
              <>
                {site.contact.email !== null ? ' ou' : ''}{' '}
                <a href={site.contact.whatsappLink} target="_blank" rel="noopener noreferrer">
                  pelo WhatsApp
                </a>
              </>
            ) : null}
            .
          </p>
        ) : null}
      </section>

      <p className={styles.back}>
        <a href="/">Voltar ao site</a>
      </p>
    </article>
  );
}
