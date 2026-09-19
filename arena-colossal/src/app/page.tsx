import { Audience } from '@/components/sections/Audience';
import { BeforeAfter } from '@/components/sections/BeforeAfter';
import { BookingSection } from '@/components/sections/BookingSection';
import { BrandExperience } from '@/components/sections/BrandExperience';
import { DetailHotspots } from '@/components/sections/DetailHotspots';
import { Diagnostic } from '@/components/sections/Diagnostic';
import { Faq } from '@/components/sections/Faq';
import { FinalCta } from '@/components/sections/FinalCta';
import { Hero } from '@/components/sections/Hero';
import { Location } from '@/components/sections/Location';
import { Manifesto } from '@/components/sections/Manifesto';
import { Process } from '@/components/sections/Process';
import { Reviews } from '@/components/sections/Reviews';
import { Services } from '@/components/sections/Services';
import { ServicesMarquee } from '@/components/sections/ServicesMarquee';
import { Standards } from '@/components/sections/Standards';

/**
 * A ordem das secoes E' o argumento de venda:
 *
 *   IMPACTO      Hero
 *   CURIOSIDADE  Manifesto — reposiciona o que esta em jogo
 *   DESEJO       Faixa + Servicos — o que existe, com direcao de arte
 *   AUTORIDADE   Detalhes e Padroes — o nivel de leitura tecnica e o criterio
 *   PROCESSO     Processo — como o trabalho acontece
 *   PROVA        Antes/depois e avaliacoes
 *   MARCA        A Arena por dentro
 *   QUALIFICACAO Quando procurar — o visitante se reconhece numa situacao
 *   PARTICIPACAO Diagnostico — a parte que o visitante FAZ, nao le
 *   OBJECOES     Duvidas — o que trava a decisao, respondido antes de travar
 *   ACESSO       Localizacao
 *   CONVERSAO    Agendamento e fechamento
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <ServicesMarquee />
      <Services />
      <DetailHotspots />
      <Standards />
      <Process />
      <BeforeAfter />
      <Reviews />
      <BrandExperience />
      <Audience />
      <Diagnostic />
      <Faq />
      <Location />
      <BookingSection />
      <FinalCta />
    </>
  );
}
