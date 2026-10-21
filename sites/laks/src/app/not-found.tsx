import { Simbolo } from "@/components/Logo";
import { Cta } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="conteudo" className="container-site flex min-h-dvh flex-col items-start justify-center py-24">
      <Simbolo className="h-12 w-auto" />
      <p className="font-expanded mt-10 text-[clamp(4rem,14vw,10rem)] font-black leading-none text-white/10">404</p>
      <h1 className="font-expanded mt-2 text-[clamp(1.8rem,4vw,3rem)] font-bold uppercase text-white">Bola fora.</h1>
      <p className="mt-4 max-w-md text-mute">A página que você procurou não existe ou mudou de endereço.</p>
      <Cta href="/" className="mt-10">
        Voltar para o início
      </Cta>
    </main>
  );
}
