import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { marca } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Reforce Consultoria trata os dados pessoais de quem visita o site, em conformidade com a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function Page() {
  return (
    <>
      <header className="container-site flex h-20 items-center">
        <Link href="/" aria-label="Reforce Consultoria, página inicial" className="text-white">
          <Logo className="h-6 w-auto" decorativo />
        </Link>
      </header>
      <main
        id="conteudo"
        className="container-site max-w-3xl pb-24 pt-10 text-mute [&_h2]:font-display [&_h2]:mt-12 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
      >
        <h1 className="font-display text-[clamp(2rem,4.6vw,3.4rem)] font-light leading-tight text-white">Política de Privacidade</h1>
        <p>Última atualização: novembro de 2026.</p>

        <h2>Quem somos</h2>
        <p>
          Este site é da {marca.nome}, controladora dos dados pessoais tratados por meio dele, nos termos da Lei Geral de Proteção
          de Dados (Lei nº 13.709/2018, LGPD).
        </p>

        <h2>Quais dados tratamos</h2>
        <p>
          O formulário &quot;Diagnóstico rápido&quot; não envia dados para um servidor do site. Ele monta, no seu próprio aparelho, uma
          mensagem com as informações que você preencher (nome, empresa, cargo, e-mail, a demanda e o momento do projeto) e abre o
          WhatsApp ou o seu programa de e-mail com essa mensagem pronta. Os dados só chegam até nós se você enviar a mensagem.
        </p>
        <p>Também recebemos os dados que você nos enviar diretamente por e-mail, telefone ou WhatsApp.</p>

        <h2>Para que usamos</h2>
        <ul>
          <li>responder ao seu contato e preparar uma proposta;</li>
          <li>manter o histórico da conversa comercial.</li>
        </ul>
        <p>
          A base legal é o seu pedido de contato e os procedimentos preliminares a um possível contrato (art. 7º, V, da LGPD).
        </p>

        <h2>Cookies</h2>
        <p>Este site não usa cookies de medição ou de publicidade.</p>

        <h2>Com quem compartilhamos</h2>
        <p>
          A mensagem enviada por WhatsApp passa pela plataforma da Meta, e a enviada por e-mail, pelo seu provedor e pelo nosso.
          Não vendemos nem cedemos dados pessoais.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção ou exclusão dos seus dados, e tirar dúvidas sobre esta política, pelo e-mail{" "}
          <a href={`mailto:${marca.email}`} className="text-white underline underline-offset-2">
            {marca.email}
          </a>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
