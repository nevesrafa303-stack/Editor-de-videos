import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Imersão Clube das Agências trata os dados pessoais de quem visita o site, em conformidade com a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

// CONFIRMAR: razão social, CNPJ e e-mail da Skill Sales para pedidos de titulares (LGPD).
export default function Page() {
  return (
    <>
      <header className="container-site flex h-20 items-center">
        <Link href="/" aria-label="Imersão Clube das Agências, página inicial" className="text-white">
          <Logo className="h-10 w-auto" decorativo />
        </Link>
      </header>
      <main
        id="conteudo"
        className="container-site max-w-3xl pb-24 pt-10 text-mute [&_h2]:font-expanded [&_h2]:mt-12 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-white [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
      >
        <h1 className="font-expanded text-[clamp(2rem,4.6vw,3.4rem)] font-bold uppercase leading-none text-white">Política de Privacidade</h1>
        <p>Última atualização: novembro de 2026.</p>

        <h2>Quem somos</h2>
        <p>
          Este site é da Skill Sales, realizadora da Imersão Clube das Agências e controladora dos dados pessoais tratados por
          meio dele, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).
        </p>

        <h2>Quais dados tratamos</h2>
        <p>
          Este site não tem formulário próprio. Quando você clica para garantir um ingresso ou falar com o suporte, a conversa
          acontece no WhatsApp, onde você informa os dados necessários para a compra. Com o seu consentimento, também tratamos
          dados de navegação coletados por cookies de medição, incluindo os parâmetros de campanha da visita (por exemplo,
          utm_source).
        </p>

        <h2>Para que usamos</h2>
        <ul>
          <li>atender o seu pedido de ingresso e enviar as informações do evento;</li>
          <li>medir quais campanhas trazem interessados, para melhorar nossos anúncios.</li>
        </ul>
        <p>
          A base legal é a execução do contrato e os procedimentos preliminares a ele (art. 7º, V, da LGPD) e, para medição
          com cookies, o seu consentimento (art. 7º, I).
        </p>

        <h2>Cookies e medição</h2>
        <p>
          Usamos o Pixel da Meta para medir visitas e anúncios. Ele só grava cookies de medição e publicidade depois que você
          clica em &quot;Aceitar&quot; no aviso de cookies. Se recusar, o site funciona normalmente. Você pode mudar a escolha a
          qualquer momento em &quot;Preferências de cookies&quot;, no rodapé.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Usamos fornecedores de hospedagem, de atendimento e de medição de anúncios, que tratam os dados em nosso nome. Não
          vendemos dados pessoais.
        </p>

        <h2>Seus direitos</h2>
        <p>Pela LGPD, você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos ou desatualizados;</li>
          <li>pedir a exclusão dos dados, respeitadas as obrigações legais;</li>
          <li>revogar o consentimento para cookies de medição.</li>
        </ul>
        <p>Para exercer qualquer direito, fale com o nosso suporte pelo WhatsApp informado no site.</p>

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
