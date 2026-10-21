import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { empresa } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a LAKS Company trata os dados pessoais enviados pelo site, em conformidade com a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

const instagram = empresa.redes.find((r) => r.nome === "Instagram")!.url;

export default function Page() {
  return (
    <>
      <header className="container-site flex h-20 items-center">
        <Link href="/" aria-label="LAKS Company, página inicial" className="text-fog">
          <Logo className="h-6 w-auto" />
        </Link>
      </header>
      <main
        id="conteudo"
        className="container-site max-w-3xl pb-24 pt-10 text-mute [&_h2]:font-expanded [&_h2]:mt-12 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-white [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-laranja">Transparência</p>
        <h1 className="font-expanded mt-4 text-[clamp(2rem,4.6vw,3.4rem)] font-bold uppercase leading-none text-white">
          Política de Privacidade
        </h1>
        <p>Última atualização: outubro de 2026.</p>

        <h2>Quem somos</h2>
        <p>
          Este site é da {empresa.nome}, inscrita no CNPJ {empresa.cnpj}, com sede em {empresa.cidade} ({empresa.uf}). Nós
          somos a controladora dos dados pessoais tratados por meio dele, nos termos da Lei Geral de Proteção de Dados (Lei
          nº 13.709/2018, LGPD).
        </p>

        <h2>Quais dados coletamos</h2>
        <p>Quando você preenche o formulário de diagnóstico gratuito, coletamos:</p>
        <ul>
          <li>nome completo, e-mail corporativo e WhatsApp;</li>
          <li>nome e Instagram da corretora;</li>
          <li>como conheceu a LAKS, experiência com tráfego pago e faixa de faturamento mensal;</li>
          <li>
            a página de origem e os parâmetros de campanha do link que trouxe você até aqui (por exemplo, utm_source e
            gclid), para sabermos qual anúncio funcionou.
          </li>
        </ul>

        <h2>Para que usamos</h2>
        <ul>
          <li>entrar em contato pelo WhatsApp ou por ligação para agendar e realizar a consultoria que você pediu;</li>
          <li>entender o momento da sua corretora e preparar um plano de ação;</li>
          <li>medir quais campanhas trazem contatos, para melhorar nossos anúncios.</li>
        </ul>
        <p>
          A base legal é o seu pedido de contato e os procedimentos preliminares a um possível contrato (art. 7º, V, da LGPD) e,
          para medição de campanhas com cookies, o seu consentimento (art. 7º, I).
        </p>

        <h2>Cookies e medição</h2>
        <p>
          Usamos o Google Tag Manager, o Pixel da Meta e o Microsoft Clarity para medir visitas e anúncios. Esses recursos só
          gravam cookies de medição e publicidade depois que você clica em &quot;Aceitar&quot; no aviso de cookies. Se recusar, o site
          funciona normalmente. Você pode mudar a escolha a qualquer momento em &quot;Preferências de cookies&quot;, no rodapé.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Os dados do formulário são enviados ao nosso sistema de atendimento e acessados apenas pelo time da LAKS responsável
          pelo seu contato. Usamos fornecedores de hospedagem, de gestão de contatos e de medição de anúncios, que tratam
          os dados em nosso nome. Não vendemos dados pessoais.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Pelo tempo necessário para o atendimento e a relação comercial, ou enquanto houver obrigação legal. Depois disso, os
          dados são excluídos ou anonimizados.
        </p>

        <h2>Segurança</h2>
        <p>
          O site usa conexão criptografada (HTTPS), e o formulário tem proteções contra envio automatizado. O acesso aos
          dados é restrito ao time que precisa deles para atender você.
        </p>

        <h2>Seus direitos</h2>
        <p>Pela LGPD, você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos ou desatualizados;</li>
          <li>pedir a exclusão dos dados, respeitadas as obrigações legais;</li>
          <li>revogar o consentimento para cookies de medição;</li>
          <li>pedir informações sobre com quem compartilhamos seus dados.</li>
        </ul>
        <p>
          Para exercer qualquer direito,{" "}
          {empresa.email ? (
            <>
              escreva para{" "}
              <a href={`mailto:${empresa.email}`} className="text-fog underline underline-offset-2">
                {empresa.email}
              </a>
              .
            </>
          ) : (
            <>
              fale com a gente pelo{" "}
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-fog underline underline-offset-2">
                Instagram @lakscompany
              </a>
              .
            </>
          )}
        </p>

        <p className="pt-8">
          <Link href="/" className="font-semibold text-laranja underline-offset-4 hover:underline">
            Voltar ao site
          </Link>
        </p>
      </main>
      <Footer ancoras={false} />
    </>
  );
}
