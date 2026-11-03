import Image from "next/image";
import datacrazy from "@/assets/img/logos/datacrazy.webp";
import hyper from "@/assets/img/logos/hyper.webp";
import metrifiquei from "@/assets/img/logos/metrifiquei.webp";
import relou from "@/assets/img/logos/relou.webp";
import skillsales from "@/assets/img/logos/skillsales.webp";

const patrocinadores = [
  { src: hyper, alt: "Hyper" },
  { src: metrifiquei, alt: "Metrifiquei" },
  { src: datacrazy, alt: "Datacrazy" },
  { src: relou, alt: "Relou, o RH do digital" },
];

export function Patrocinio() {
  return (
    <section aria-label="Realização e patrocínio" className="border-t border-white/10 py-16 md:py-20">
      <div className="container-site flex flex-col items-center gap-12 text-center md:flex-row md:justify-center md:gap-20">
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">Realização</p>
          <Image src={skillsales} alt="Skill Sales" sizes="220px" className="mt-5 h-8 w-auto opacity-90" />
        </div>
        <span aria-hidden="true" className="hidden h-16 w-px bg-white/10 md:block" />
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">Patrocínio</p>
          <ul data-reveal="stagger" className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {patrocinadores.map((p) => (
              <li key={p.alt}>
                <Image src={p.src} alt={p.alt} sizes="200px" className="h-8 w-auto opacity-70 transition duration-300 hover:-translate-y-0.5 hover:opacity-100 md:h-9" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
