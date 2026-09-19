import { BeforeAfter } from '@/components/sections/BeforeAfter';
import { BookingSection } from '@/components/sections/BookingSection';
import { BrandExperience } from '@/components/sections/BrandExperience';
import { DetailHotspots } from '@/components/sections/DetailHotspots';
import { FinalCta } from '@/components/sections/FinalCta';
import { Hero } from '@/components/sections/Hero';
import { Location } from '@/components/sections/Location';
import { Manifesto } from '@/components/sections/Manifesto';
import { Process } from '@/components/sections/Process';
import { Reviews } from '@/components/sections/Reviews';
import { Services } from '@/components/sections/Services';

/**
 * A ordem das secoes E' o argumento de venda:
 *
 *   IMPACTO      Hero
 *   CURIOSIDADE  Manifesto — reposiciona o que esta em jogo
 *   DESEJO       Servicos — o que existe, com direcao de arte
 *   AUTORIDADE   Detalhes — o nivel de leitura tecnica
 *   PROCESSO     Processo — como o trabalho acontece
 *   PROVA        Antes/depois e avaliacoes
 *   MARCA        A Arena por dentro
 *   ACESSO       Localizacao
 *   CONVERSAO    Agendamento e fechamento
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Services />
      <DetailHotspots />
      <Process />
      <BeforeAfter />
      <Reviews />
      <BrandExperience />
      <Location />
      <BookingSection />
      <FinalCta />
    </>
  );
}
