import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main id="conteudo" className="container-site flex min-h-dvh flex-col items-start justify-center py-24">
      <Logo gradiente className="h-8 w-auto" />
      <p className="font-expanded mt-10 text-[clamp(4rem,14vw,10rem)] font-black leading-none text-white/10">404</p>
      <h1 className="font-expanded mt-2 text-[clamp(1.8rem,4vw,3rem)] font-bold uppercase text-white">Página fora da operação.</h1>
      <p className="mt-4 max-w-md text-mute">A página que você procurou não existe ou mudou de endereço.</p>
      <Link href="/" className="bg-ouro mt-10 inline-flex rounded-full px-7 py-4 font-bold text-ink">
        Voltar para o início
      </Link>
    </main>
  );
}
