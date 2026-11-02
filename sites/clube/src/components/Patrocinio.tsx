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
    <section aria-label="Realização e patrocínio" className="border-t border-white/10 py-14 md:py-16">
      <div className="container-site grid gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">Realização</p>
          <Image src={skillsales} alt="Skill Sales" sizes="220px" className="mt-4 h-8 w-auto opacity-90" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">Patrocínio</p>
          <ul data-reveal="stagger" className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-6">
            {patrocinadores.map((p) => (
              <li key={p.alt}>
                <Image src={p.src} alt={p.alt} sizes="200px" className="h-8 w-auto opacity-75 transition hover:opacity-100 md:h-9" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
