/**
 * FONTE UNICA DE VERDADE DOS SFX.
 *
 * A licao que o QC pegou: calibrar por RMS de BANDA LARGA e depois provar por
 * RMS de BANDA ESTREITA mede duas coisas diferentes — o efeito passa na
 * calibragem e some no render. Aqui banda de analise, janela e alvo sao os
 * MESMOS na calibragem (06_sfx.mjs) e na prova (08_qc.mjs).
 *
 * O alvo tambem nao e absoluto: e RELATIVO a voz ja tratada. "Perceptivel mas
 * abaixo da voz" so significa alguma coisa medido contra a voz daquele video.
 */

export const SR = 48000;

export const SFX = {
  // Hit/impact suave: SUB grave curto. A voz leva highpass em 80Hz na Etapa 3,
  // entao 40-85Hz fica praticamente livre — e onde o hit se prova sem competir.
  hit: {
    banda: {lo: 40, hi: 85},
    janela: {ss: 0.0, t: 0.12},
    /** dB acima da voz NA MESMA BANDA. O QC exige >= +6; calibramos com folga. */
    margemDb: 11,
    /** o efeito nunca pode passar disto abaixo da voz em banda larga */
    tetoRelativoDb: -6,
  },
  // Whoosh: ruido em movimento, banda media-alta.
  whoosh: {
    banda: {lo: 1200, hi: 4500},
    janela: {ss: 0.12, t: 0.18},
    margemDb: 11,
    tetoRelativoDb: -6,
  },
  // Pop/tick: um tick e BRILHANTE. Em 900Hz ele cai no miolo da voz e some;
  // em 2.2-3.2kHz ele fica nitido e a voz tem bem menos energia.
  pop: {
    banda: {lo: 2200, hi: 3200},
    janela: {ss: 0.0, t: 0.05},
    margemDb: 10,
    tetoRelativoDb: -8,
  },
  // Riser: "ar" agudo sob o gancho. Em banda alta ele nao embola com a voz —
  // um riser em 150-900Hz fica enterrado na propria fala e nao se prova.
  // Acima do pop (2.2-3.2k) para os dois nunca se confundirem na medicao.
  riser: {
    banda: {lo: 4000, hi: 9000},
    janela: {ss: 1.15, t: 0.35},
    margemDb: 9,
    tetoRelativoDb: -10,
  },
};

/** Cadeias lavfi que sintetizam cada efeito (Etapa 3.4, sem biblioteca). */
export const RECEITAS = {
  // Energia concentrada em ~58Hz: o harmonico de 116Hz entra baixo so para dar
  // corpo em alto-falante de celular, sem inflar o nivel de banda larga.
  hit: [
    '-f', 'lavfi', '-i', `sine=frequency=58:duration=0.34:sample_rate=${SR}`,
    '-f', 'lavfi', '-i', `sine=frequency=116:duration=0.34:sample_rate=${SR}`,
    '-filter_complex',
    '[0:a]volume=1.0[a];[1:a]volume=0.18[b];' +
    '[a][b]amix=inputs=2:normalize=0,' +
    'afade=t=in:st=0:d=0.004,afade=t=out:st=0.05:d=0.29:curve=exp,' +
    'lowpass=f=110,volume=1.6',
  ],
  whoosh: [
    '-f', 'lavfi', '-i', `anoisesrc=color=pink:duration=0.45:sample_rate=${SR}:amplitude=0.9`,
    '-af',
    'highpass=f=300,lowpass=f=5200,' +
    'afade=t=in:st=0:d=0.16:curve=qua,afade=t=out:st=0.2:d=0.25:curve=exp,volume=1.2',
  ],
  pop: [
    '-f', 'lavfi', '-i', `sine=frequency=2600:duration=0.08:sample_rate=${SR}`,
    '-af',
    'afade=t=in:st=0:d=0.002,afade=t=out:st=0.012:d=0.068:curve=exp,' +
    'bandpass=f=2600:width_type=h:width=900,volume=1.4',
  ],
  // Riser de "ar": ruido branco filtrado alto, crescendo por 1.6s.
  riser: [
    '-f', 'lavfi', '-i', `anoisesrc=color=white:duration=1.6:sample_rate=${SR}:amplitude=0.8`,
    '-f', 'lavfi', '-i', `sine=frequency=5200:duration=1.6:sample_rate=${SR}`,
    '-filter_complex',
    '[0:a]highpass=f=4000,lowpass=f=9000[n];' +
    '[1:a]volume=0.15[s];' +
    '[n][s]amix=inputs=2:normalize=0,' +
    'afade=t=in:st=0:d=1.35:curve=qua,afade=t=out:st=1.45:d=0.15,volume=1.0',
  ],
};

/** Duracao de cada efeito em segundos — usada para dimensionar as Sequences. */
export const DURACAO = {hit: 0.34, whoosh: 0.45, pop: 0.08, riser: 1.6};
