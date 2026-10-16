import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '../fonts';
import {displayFontFamily} from '../fonts';
import {LOGOS_DISPONIVEIS, OPERADORAS, type Criativo, type Formato, type Operadora} from './data';

/**
 * Anúncio animado Aport Seguros (12 s). A animação entra nos primeiros ~6 s e
 * o quadro final fica parado, legível, até o fim — o último frame também serve
 * como peça estática.
 *
 * Stories respeita as áreas de UI do Instagram: nada essencial nos 220 px do
 * topo nem nos 300 px da base.
 */

export type AportAdProps = {criativo: Criativo; formato: Formato};

const F = displayFontFamily;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const brl = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

/** entrada padrão: sobe + fade, com atraso em frames */
const useRise = (delay: number, dist = 40, dur = 18) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, dur], [0, 1], {...clamp, easing: easeOut});
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};

const usePop = (delay: number) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping: 13, stiffness: 140, mass: 0.8}});
};

// ───────────────────────── logo da operadora ─────────────────────────

const LogoOperadora: React.FC<{id: Criativo['operadora']; op: Operadora; altura: number}> = ({
  id,
  op,
  altura,
}) => {
  const oficial = LOGOS_DISPONIVEIS[id];
  if (oficial) {
    return <Img src={staticFile(oficial)} style={{height: altura, objectFit: 'contain'}} />;
  }
  const w = op.wordmark;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1}}>
      <span style={{fontFamily: F, fontWeight: 800, fontSize: altura * 0.62, color: w.cor, letterSpacing: -1}}>
        {w.cor2 && w.linha1 === 'SulAmérica' ? (
          <>
            Sul<span style={{color: w.cor2}}>América</span>
          </>
        ) : (
          w.linha1
        )}
      </span>
      {w.linha2 && (
        <span style={{fontFamily: F, fontWeight: 500, fontSize: altura * 0.34, color: w.cor, marginTop: 2}}>
          {w.linha2}
        </span>
      )}
    </div>
  );
};

const LogoAport: React.FC<{cor: string; tamanho: number}> = ({cor, tamanho}) => {
  const oficial = LOGOS_DISPONIVEIS.aport;
  if (oficial) return <Img src={staticFile(oficial)} style={{height: tamanho * 1.6, objectFit: 'contain'}} />;
  return (
    <span style={{fontFamily: F, fontWeight: 800, fontSize: tamanho, color: cor, letterSpacing: 3}}>
      APORT <span style={{fontWeight: 500}}>SEGUROS</span>
    </span>
  );
};

// ───────────────────────── blocos ─────────────────────────

const Hero: React.FC<{criativo: Criativo; op: Operadora; altura: number}> = ({criativo, op, altura}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const wipe = interpolate(f, [0, 14], [0, 1], {...clamp, easing: easeOut});
  const zoom = interpolate(f, [0, durationInFrames], [1.04, 1.16]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: altura,
        overflow: 'hidden',
        clipPath: `inset(0 0 ${(1 - wipe) * 100}% 0 round 0 0 64px 64px)`,
        background: op.primaria,
      }}
    >
      {criativo.hospital ? (
        <>
          <Img
            src={staticFile(`aport/hospitais/${criativo.hospital.arquivo}`)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
              transformOrigin: '50% 40%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${op.escura}55 0%, transparent 28%, ${op.escura}22 45%, ${op.primaria}EE 82%, ${op.primaria} 100%)`,
            }}
          />
        </>
      ) : (
        <Padrao op={op} />
      )}
    </div>
  );
};

/** fundo gráfico (cruzes e círculos flutuando) para os criativos sem foto */
const Padrao: React.FC<{op: Operadora}> = ({op}) => {
  const f = useCurrentFrame();
  const formas = [
    {x: 8, y: 22, s: 120, t: 'cruz', v: 0.6},
    {x: 82, y: 14, s: 220, t: 'circ', v: -0.4},
    {x: 70, y: 62, s: 90, t: 'cruz', v: 0.5},
    {x: 18, y: 70, s: 160, t: 'circ', v: 0.3},
    {x: 92, y: 80, s: 70, t: 'cruz', v: -0.7},
    {x: 45, y: 8, s: 60, t: 'circ', v: 0.8},
  ];
  return (
    <AbsoluteFill
      style={{background: `radial-gradient(120% 90% at 20% 0%, ${op.primaria} 0%, ${op.escura} 100%)`}}
    >
      {formas.map((s, i) => {
        const dy = Math.sin((f / 30) * s.v + i) * 14;
        const rot = f * s.v * 0.4;
        const common: React.CSSProperties = {
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.s,
          height: s.s,
          transform: `translate(-50%, calc(-50% + ${dy}px)) rotate(${rot}deg)`,
          opacity: 0.13,
        };
        return s.t === 'circ' ? (
          <div key={i} style={{...common, borderRadius: '50%', border: `${s.s * 0.12}px solid #fff`}} />
        ) : (
          <svg key={i} viewBox="0 0 10 10" style={common}>
            <path d="M3.5 0h3v3.5H10v3H6.5V10h-3V6.5H0v-3h3.5z" fill="#fff" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

const LogoPill: React.FC<{criativo: Criativo; op: Operadora; top: number}> = ({criativo, op, top}) => {
  const p = usePop(6);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: '50%',
        transform: `translate(-50%, ${(1 - p) * -60}px) scale(${0.85 + p * 0.15})`,
        opacity: Math.min(1, p * 1.5),
        background: '#fff',
        borderRadius: 999,
        padding: '22px 56px',
        boxShadow: '0 18px 50px rgba(0,0,0,0.22)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <LogoOperadora id={criativo.operadora} op={op} altura={84} />
    </div>
  );
};

const Titulo: React.FC<{texto: string; tamanho: number}> = ({texto, tamanho}) => {
  const f = useCurrentFrame();
  const palavras = texto.split(' ');
  return (
    <div
      style={{
        fontFamily: F,
        fontWeight: 800,
        fontSize: tamanho,
        lineHeight: 1.04,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: -2,
        textShadow: '0 6px 30px rgba(0,0,0,0.25)',
      }}
    >
      {palavras.map((w, i) => {
        const p = interpolate(f - 16 - i * 4, [0, 16], [0, 1], {...clamp, easing: easeOut});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 50}px)`,
              marginRight: i < palavras.length - 1 ? '0.25em' : 0,
            }}
          >
            {w === 'CNPJ' ? <span style={{whiteSpace: 'nowrap'}}>{w}</span> : w}
          </span>
        );
      })}
    </div>
  );
};

const Preco: React.FC<{criativo: Criativo; op: Operadora; escala: number}> = ({criativo, op, escala}) => {
  const f = useCurrentFrame();
  const pop = usePop(44);
  const conta = interpolate(f, [50, 92], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const valor = Math.round(criativo.preco * conta * 100) / 100;
  const tagIn = useRise(70, 20);
  return (
    <div
      style={{
        opacity: Math.min(1, pop * 1.4),
        transform: `scale(${0.8 + pop * 0.2})`,
        transformOrigin: 'left center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div style={{fontFamily: F, fontWeight: 800, fontSize: 92 * escala, color: op.escura, lineHeight: 1}}>
        {criativo.vidas}
      </div>
      <div style={{fontFamily: F, fontWeight: 500, fontSize: 38 * escala, color: '#555', marginTop: 10 * escala}}>
        a partir de
      </div>
      <div
        style={{
          fontFamily: F,
          fontWeight: 800,
          fontSize: 76 * escala,
          color: op.primaria,
          lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {brl(valor)}
        <span style={{fontSize: 44 * escala, verticalAlign: 'top'}}>*</span>
      </div>
      <div
        style={{
          ...tagIn,
          marginTop: 16 * escala,
          background: op.primaria,
          color: '#fff',
          fontFamily: F,
          fontWeight: 700,
          fontSize: 26 * escala,
          letterSpacing: 1,
          padding: `${10 * escala}px ${22 * escala}px`,
          borderRadius: 10,
        }}
      >
        EXCLUSIVO PARA CNPJ
      </div>
    </div>
  );
};

const Beneficios: React.FC<{criativo: Criativo; op: Operadora; escala: number; largura: number | string}> = ({
  criativo,
  op,
  escala,
  largura,
}) => {
  const f = useCurrentFrame();
  const painel = interpolate(f, [62, 80], [0, 1], {...clamp, easing: easeOut});
  const n = criativo.beneficios.length;
  const fonte = (n >= 4 ? 34 : 38) * escala;
  return (
    <div
      style={{
        width: largura,
        background: op.primaria,
        borderRadius: 36,
        padding: `${34 * escala}px ${34 * escala}px`,
        boxShadow: `0 24px 60px ${op.escura}40`,
        opacity: painel,
        transform: `translateX(${(1 - painel) * 80}px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 20 * escala,
        boxSizing: 'border-box',
      }}
    >
      {criativo.beneficios.map((b, i) => {
        const p = interpolate(f - 76 - i * 12, [0, 16], [0, 1], {...clamp, easing: easeOut});
        const check = interpolate(f - 82 - i * 12, [0, 10], [0, 1], clamp);
        return (
          <div
            key={b}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 18 * escala,
              opacity: p,
              transform: `translateX(${(1 - p) * 40}px)`,
            }}
          >
            <svg width={44 * escala} height={44 * escala} viewBox="0 0 44 44" style={{flexShrink: 0, marginTop: 2}}>
              <circle cx="22" cy="22" r="22" fill="#fff" />
              <path
                d="M12 23 l7 7 l14 -15"
                fill="none"
                stroke={op.primaria}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="32"
                strokeDashoffset={32 * (1 - check)}
              />
            </svg>
            <span style={{fontFamily: F, fontWeight: 700, fontSize: fonte, color: '#fff', lineHeight: 1.18}}>
              {b}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Rodape: React.FC<{criativo: Criativo; escala: number; alinhamento: 'left' | 'center'}> = ({
  criativo,
  escala,
  alinhamento,
}) => {
  const a = useRise(118, 20);
  const b = useRise(126, 20);
  return (
    <div style={{textAlign: alinhamento, fontFamily: F}}>
      <div style={{...a, fontWeight: 700, fontSize: 30 * escala, color: '#333'}}>*{criativo.h4}</div>
      <div style={{...b, fontWeight: 500, fontSize: 24 * escala, color: '#777', marginTop: 8}}>{criativo.h5}</div>
    </div>
  );
};

const CTA: React.FC<{criativo: Criativo; op: Operadora; estilo: React.CSSProperties; escala: number}> = ({
  criativo,
  op,
  estilo,
  escala,
}) => {
  const f = useCurrentFrame();
  const entra = interpolate(f, [132, 152], [0, 1], {...clamp, easing: easeOut});
  const ciclo = Math.max(0, f - 160) % 60;
  const pulso = f > 160 ? 1 + Math.sin((ciclo / 60) * Math.PI) * 0.025 : 1;
  const brilho = interpolate(ciclo, [0, 28], [-30, 130], clamp);
  return (
    <div
      style={{
        ...estilo,
        background: op.escura,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22 * escala,
        opacity: entra,
        transform: `translateY(${(1 - entra) * 80}px) scale(${pulso})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${brilho}%`,
          width: '22%',
          background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.22), transparent)',
        }}
      />
      <span style={{fontFamily: F, fontWeight: 800, fontSize: 44 * escala, color: '#fff', whiteSpace: 'nowrap'}}>
        {criativo.cta}
      </span>
      <svg width={46 * escala} height={46 * escala} viewBox="0 0 46 46">
        <circle cx="23" cy="23" r="23" fill={op.destaque} />
        <path d="M17 13 l11 10 l-11 10" fill="none" stroke={op.escura} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ───────────────────────── composição ─────────────────────────

export const AportAd: React.FC<AportAdProps> = ({criativo, formato}) => {
  const op = OPERADORAS[criativo.operadora];
  const f = useCurrentFrame();
  const fundo = interpolate(f, [0, 10], [0, 1], clamp);
  const marca = useRise(140, 16);

  if (formato === 'feed') {
    // 1080 × 1350
    const heroH = criativo.hospital ? 560 : 520;
    return (
      <AbsoluteFill style={{background: '#fff', opacity: 0.4 + fundo * 0.6}}>
        <AbsoluteFill style={{background: op.clara}} />
        <Hero criativo={criativo} op={op} altura={heroH} />
        <LogoPill criativo={criativo} op={op} top={48} />
        <div style={{position: 'absolute', left: 60, right: 60, top: heroH - 250, height: 230, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
          <Titulo texto={criativo.h1} tamanho={96} />
        </div>
        <div style={{position: 'absolute', left: 64, top: heroH + 80, width: 460}}>
          <Preco criativo={criativo} op={op} escala={0.88} />
        </div>
        <div style={{position: 'absolute', right: 56, top: heroH + 50, width: 470, height: 420, display: 'flex', alignItems: 'center'}}>
          <Beneficios criativo={criativo} op={op} escala={0.92} largura="100%" />
        </div>
        <div style={{position: 'absolute', left: 64, right: 64, top: 1058}}>
          <Rodape criativo={criativo} escala={0.95} alinhamento="left" />
        </div>
        <CTA
          criativo={criativo}
          op={op}
          escala={1}
          estilo={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 136}}
        />
        <div style={{...marca, position: 'absolute', right: 64, top: 1170}}>
          <LogoAport cor={op.escura} tamanho={22} />
        </div>
      </AbsoluteFill>
    );
  }

  // stories 1080 × 1920 — área útil 220..1620
  const heroH = 770;
  const muitos = criativo.beneficios.length >= 4;
  return (
    <AbsoluteFill style={{background: '#fff', opacity: 0.4 + fundo * 0.6}}>
      <AbsoluteFill style={{background: op.clara}} />
      <Hero criativo={criativo} op={op} altura={heroH} />
      <LogoPill criativo={criativo} op={op} top={230} />
      <div style={{position: 'absolute', left: 70, right: 70, top: heroH - 300, height: 270, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <Titulo texto={criativo.h1} tamanho={112} />
      </div>
      <div style={{position: 'absolute', left: 80, top: heroH + 40}}>
        <Preco criativo={criativo} op={op} escala={1.05} />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: muitos ? 1120 : 1150 + (3 - criativo.beneficios.length) * 30}}>
        <Beneficios criativo={criativo} op={op} escala={muitos ? 0.84 : 0.92} largura="100%" />
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 1418}}>
        <Rodape criativo={criativo} escala={0.85} alinhamento="center" />
      </div>
      <CTA
        criativo={criativo}
        op={op}
        escala={0.98}
        estilo={{position: 'absolute', left: 70, right: 70, top: 1500, height: 120, borderRadius: 999}}
      />
      {/* faixa de base: fica sob a UI do Instagram, só assina a marca */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 240,
          background: op.escura,
          borderRadius: '64px 64px 0 0',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 54,
          boxSizing: 'border-box',
          opacity: fundo,
        }}
      >
        <div style={marca}>
          <LogoAport cor="#fff" tamanho={30} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
