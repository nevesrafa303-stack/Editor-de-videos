import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { marca } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Mentoria RISE trata os dados pessoais de quem visita o site, em conformidade com a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function Page() {
  const responsavel = marca.razaoSocial ? `${marca.razaoSocial}${marca.cnpj ? `, inscrita no CNPJ ${marca.cnpj}` : ""}` : marca.nome;
  return (
    <>
      <header className="container-site flex h-20 items-center">
        <Link href="/" aria-label="Mentoria RISE, página inicial" className="text-white">
          <Logo className="h-6 w-auto" decorativo />
        </Link>
      </header>
      <main
        id="conteudo"
        className="container-site max-w-3xl pb-24 pt-10 text-mute [&_h2]:font-expanded [&_h2]:mt-12 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-white [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
      >
        <h1 className="font-expanded text-[clamp(2rem,4.6vw,3.4rem)] font-bold uppercase leading-none text-white">
          Política de Privacidade
        </h1>
        <p>Última atualização: outubro de 2026.</p>

        <h2>Quem somos</h2>
        <p>
          Este site é da {responsavel}, controladora dos dados pessoais tratados por meio dele, nos termos da Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018, LGPD).
        </p>

        <h2>Quais dados tratamos</h2>
        <p>
          Este site não tem formulário próprio. Quando você clica em &quot;Aplicar para uma vaga&quot;, é levado ao formulário de
          aplicação da RISE, hospedado na plataforma Respondi, onde informa os dados pedidos. Junto com o link, enviamos os
          parâmetros de campanha da sua visita (por exemplo, utm_source e gclid), para sabermos qual anúncio trouxe você.
        </p>
        <p>Com o seu consentimento, também tratamos dados de navegação coletados por cookies de medição.</p>

        <h2>Para que usamos</h2>
        <ul>
          <li>avaliar a sua aplicação e entrar em contato sobre a mentoria;</li>
          <li>medir quais campanhas trazem aplicações, para melhorar nossos anúncios.</li>
        </ul>
        <p>
          A base legal é o seu pedido de participação e os procedimentos preliminares a um possível contrato (art. 7º, V, da
          LGPD) e, para medição de campanhas com cookies, o seu consentimento (art. 7º, I).
        </p>

        <h2>Cookies e medição</h2>
        <p>
          Usamos o Google Tag Manager e o Pixel da Meta para medir visitas e anúncios. Esses recursos só gravam cookies de
          medição e publicidade depois que você clica em &quot;Aceitar&quot; no aviso de cookies. Se recusar, o site funciona
          normalmente. Você pode mudar a escolha a qualquer momento em &quot;Preferências de cookies&quot;, no rodapé.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Usamos fornecedores de hospedagem, de formulários e de medição de anúncios, que tratam os dados em nosso nome. Não
          vendemos dados pessoais.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Pelo tempo necessário para avaliar a aplicação e manter a relação comercial, ou enquanto houver obrigação legal.
          Depois disso, os dados são excluídos ou anonimizados.
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
          {marca.email ? (
            <>
              escreva para{" "}
              <a href={`mailto:${marca.email}`} className="text-fog underline underline-offset-2">
                {marca.email}
              </a>
              .
            </>
          ) : (
            <>fale com o time da Mentoria RISE pelos canais oficiais.</>
          )}
        </p>

        <p className="pt-8">
          <Link href="/" className="font-semibold text-ouro underline-offset-4 hover:underline">
            Voltar ao site
          </Link>
        </p>
      </main>
      <Footer ancoras={false} />
    </>
  );
}
