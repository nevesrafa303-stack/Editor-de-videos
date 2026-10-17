#!/usr/bin/env python3
"""
Trilha + sound design do filme SulAmérica para CNPJ (100% sintetizado, determinístico).

  python tools/synth_audio.py            -> assets/audio/{bgm,sfx_*}.wav

Grade: 120 BPM, 1 compasso = 2.0 s, 14 compassos = 28 s (duração do filme).
Cortes de cena e a trava do preço caem em barra (ver STORYBOARD.md).

Seções (um acorde por compasso, Ré maior):
  1-2   dor (hospital)        Bm G — pads e piano, sem bateria (tensão)
  3-5   virada CNPJ           D A Bm — entra kick (1 e 3) e baixo (alívio)
  6-8   hospital + benefícios G D A — kick em todo tempo + hats
  9-11  preço                 Bm G A — + caixa 2 e 4; compasso 11 = rufo + prato reverso
  12-14 CTA                   D G D — tutti, filtro aberto, resolve
"""
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = 4 * BEAT           # 2.0 s
BARS = 14
DUR = BARS * BAR         # 28.0 s
# seções (índice do compasso onde cada uma começa)
VERSE, BUILD, PEAK, ROLL, CTA = 2, 5, 8, 10, 11
RNG = np.random.default_rng(20261016)

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio')


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x, axis=0)


def stereo(x, pan=0.0):
    """pan -1..1, equal-power"""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def add(buf, sig, at):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    n = min(len(sig), len(buf) - i)
    if i < 0:
        sig = sig[-i:]
        n = min(len(sig), len(buf))
        i = 0
    buf[i:i + n] += sig[:n]


def make_ir(seconds, rt60, lp_hz, predelay=0.012, seed=7):
    r = np.random.default_rng(seed)
    t = t_axis(seconds)
    env = np.exp(-6.91 * t / rt60)
    ir = np.stack([r.standard_normal(len(t)), r.standard_normal(len(t))], axis=1) * env[:, None]
    ir = lp(ir, lp_hz)
    ir = hp(ir, 120)
    pad = np.zeros((int(predelay * SR), 2))
    ir = np.concatenate([pad, ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir, wet):
    if x.ndim == 1:
        x = stereo(x)
    y = np.stack([fftconvolve(x[:, 0], ir[:, 0])[:len(x)], fftconvolve(x[:, 1], ir[:, 1])[:len(x)]], axis=1)
    return x * (1 - wet) + y * wet * 0.35


HALL = make_ir(3.2, 2.6, 6500, seed=11)
ROOM = make_ir(1.0, 0.7, 8000, seed=12)

# ───────────────────────── instrumentos ─────────────────────────


def piano(m, vel=0.8, length=3.0):
    f = mtof(m)
    t = t_axis(length)
    B = 0.00035
    tau0 = np.interp(m, [40, 90], [3.2, 0.9])
    out = np.zeros_like(t)
    for n in range(1, 20):
        fn = n * f * np.sqrt(1 + B * n * n)
        if fn > 12000:
            break
        a = (1 / n ** 1.05) * np.exp(-(n - 1) * (0.16 - 0.1 * vel))
        tau = tau0 / (1 + 0.35 * (n - 1))
        det = 1 + 0.0004 * ((-1) ** n)
        out += a * (np.sin(2 * np.pi * fn * t) + 0.6 * np.sin(2 * np.pi * fn * det * t + 0.7)) * np.exp(-t / tau)
    att = np.minimum(1, t / 0.004)
    hammer = lp(RNG.standard_normal(len(t)) * np.exp(-t / 0.006), 2500) * 0.25
    rel = np.clip((length - t) / 0.25, 0, 1)
    return (out * att + hammer) * rel * vel * 0.18


def saw_pad(m, length, cutoff, detune_cents=(-9, -3, 4, 10)):
    t = t_axis(length)
    out = np.zeros_like(t)
    for i, c in enumerate(detune_cents):
        f = mtof(m) * 2 ** (c / 1200)
        ph = (f * t + 0.23 * i) % 1.0
        out += 2 * ph - 1
    out /= len(detune_cents)
    out = lp(out, cutoff, order=4)
    return out


def env_asr(n, attack, release):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1) ** 1.5
    r = np.clip((n / SR - t) / release, 0, 1) ** 1.2
    return a * r


def bell(m, vel=0.5, length=1.6):
    t = t_axis(length)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55)
    x += 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.3)
    x += 0.2 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.18)
    return x * np.minimum(1, t / 0.002) * vel * 0.12


def kick(vel=1.0):
    t = t_axis(0.55)
    f = 46 + 70 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = lp(RNG.standard_normal(len(t)) * np.exp(-t / 0.002), 5000) * 0.35
    return (body + click) * vel * 0.9


def hat(vel=0.5):
    t = t_axis(0.09)
    x = hp(RNG.standard_normal(len(t)), 7500, 4) * np.exp(-t / 0.025)
    return x * vel * 0.25


def snare(vel=0.6):
    t = t_axis(0.25)
    noise = bp(RNG.standard_normal(len(t)), 1500, 7000) * np.exp(-t / 0.07)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    return (noise * 0.8 + tone * 0.5) * vel * 0.5


def sub_note(m, length):
    t = t_axis(length)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    e = np.minimum(1, t / 0.02) * np.exp(-t / 2.2) * np.clip((length - t) / 0.15, 0, 1)
    return np.tanh(x * 1.3) * e * 0.55


# ───────────────────────── harmonia ─────────────────────────

CHORDS = {
    'Bm': dict(bass=35, pad=[54, 59, 62, 66], arp=[66, 71, 74, 78]),
    'G': dict(bass=31, pad=[55, 59, 62, 69], arp=[67, 71, 74, 79]),
    'D': dict(bass=38, pad=[57, 62, 66, 69], arp=[66, 69, 74, 78]),
    'A': dict(bass=33, pad=[57, 61, 64, 69], arp=[64, 69, 73, 76]),
}
PROG = ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'A', 'D', 'G', 'D']


def bgm():
    n = int((DUR + 3.5) * SR)
    pads = np.zeros((n, 2))
    keys = np.zeros((n, 2))
    drums = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    fx = np.zeros((n, 2))

    for b, name in enumerate(PROG):
        c = CHORDS[name]
        t0 = b * BAR
        last = b == BARS - 1
        # pads: filtro abre ao longo do filme
        cutoff = 1400 if b < VERSE else 2000 if b < BUILD else 2800 if b < PEAK else 3400 if b < CTA else 4800
        L = BAR + 1.6 + (2.5 if last else 0)
        for i, m in enumerate(c['pad']):
            p = saw_pad(m, L, cutoff) * env_asr(int(L * SR), 0.7, 1.4 if not last else 3.0)
            add(pads, stereo(p, pan=(-0.5 + i * 0.33)), t0)
        # piano: quartas no intro, colcheias depois
        pattern = [0, 1, 2, 3, 2, 1, 2, 3]
        step = BEAT / 2
        steps = int(round(BAR / step))
        for s in range(steps):
            if last and s > 0:
                break
            m = c['arp'][pattern[s % 8]] if step < BEAT else c['arp'][[0, 2, 1, 3][s]]
            vel = 0.85 if s == 0 else 0.55 + 0.1 * (s % 2 == 0)
            if b >= PEAK:
                vel += 0.1
            note = piano(m, vel, length=2.6 if not last else 4.0)
            add(keys, stereo(note, pan=0.25 * np.sin(s)), t0 + s * step)
        # celesta: uma oitava acima, nos tempos, a partir do compasso 5
        if b >= VERSE and not last:
            for q in range(4):
                m = c['arp'][[3, 1, 2, 0][q]] + 12
                add(keys, stereo(bell(m, 0.55 if q == 0 else 0.4), pan=0.6 * (-1) ** q), t0 + q * BEAT + BEAT / 2)
        if last:
            for m in c['pad'] + [50]:
                add(keys, stereo(piano(m, 0.8, 4.0), pan=0.0), t0)
        # baixo a partir do compasso 5
        if b >= VERSE:
            add(bass, stereo(sub_note(c['bass'], BAR + 0.1 if not last else 3.0)), t0)
        # bateria
        if VERSE <= b < BARS - 1:
            beats = [0, 2] if b < BUILD else [0, 1, 2, 3]
            for q in beats:
                add(drums, stereo(kick(1.0 if q == 0 else 0.8)), t0 + q * BEAT)
        if BUILD <= b < BARS - 1:
            for e in range(8):
                add(drums, stereo(hat(0.55 if e % 2 else 0.35), pan=0.3), t0 + e * BEAT / 2)
        if b == ROLL:
            # rufo de caixa em crescendo na segunda metade do compasso antes do CTA
            for k in range(16):
                at = t0 + BAR / 2 + k * BAR / 32
                add(drums, stereo(snare(0.15 + 0.6 * k / 15), pan=-0.1), at)
        if PEAK <= b < BARS - 1 and b != ROLL:
            for q in (1, 3):
                add(drums, stereo(snare(0.55)), t0 + q * BEAT)
        if last:
            add(drums, stereo(kick(1.1)), t0)

    # prato reverso entrando no CTA (40.8 s) e crash na chegada
    swell_t = t_axis(BAR)
    swell = hp(RNG.standard_normal(len(swell_t)), 5000, 2) * (swell_t / BAR) ** 3 * 0.35
    add(fx, stereo(swell), CTA * BAR - BAR)
    crash_t = t_axis(3.0)
    crash = hp(RNG.standard_normal(len(crash_t)), 4000, 2) * np.exp(-crash_t / 0.9) * 0.3
    add(fx, stereo(crash), CTA * BAR)

    # sidechain leve: pads e baixo respiram com o kick a partir do compasso 5
    duck = np.ones(n)
    for b in range(VERSE, BARS - 1):
        for q in range(4):
            at = b * BAR + q * BEAT
            i = int(at * SR)
            k = np.arange(int(0.35 * SR))
            seg = 1 - 0.35 * np.exp(-k / (0.09 * SR))
            j = min(len(seg), n - i)
            duck[i:i + j] = np.minimum(duck[i:i + j], seg[:j])
    pads *= duck[:, None]
    bass *= duck[:, None]

    pads = hp(pads, 160)
    mix = (
        reverb(pads, HALL, 0.45) * 0.5
        + reverb(keys, HALL, 0.38) * 1.0
        + reverb(drums, ROOM, 0.18) * 0.45
        + lp(bass, 220) * 0.32
        + reverb(fx, HALL, 0.3) * 0.7
    )
    mix = hp(mix, 28)
    # EQ de master: tira embolo em 180-450 Hz, abre presença/ar acima de 2.5 kHz
    mix = mix - 0.3 * bp(mix, 180, 450) + 1.3 * hp(mix, 2500, 2) + 0.8 * hp(mix, 7000, 2)
    # termina no fim do filme com fade
    mix = mix[: int(DUR * SR)]
    fade = np.ones(len(mix))
    f0 = int((DUR - 1.4) * SR)
    fade[f0:] = np.linspace(1, 0, len(mix) - f0) ** 2
    fi = int(0.05 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    mix *= fade[:, None]
    return soft_limit(mix)


def soft_limit(x, ceiling=0.8, drive=1.1):
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * drive
    return np.tanh(x) / np.tanh(drive) * ceiling


# ───────────────────────── efeitos ─────────────────────────


def moving_band_noise(length, f_path, width_oct=0.6, seed=1):
    """ruído com uma banda que percorre f_path (Hz por quadro STFT)"""
    r = np.random.default_rng(seed)
    n = int(length * SR)
    x = r.standard_normal(n)
    hop, win = 256, 1024
    w = np.hanning(win)
    frames = 1 + (n - win) // hop
    out = np.zeros(n)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    lf = np.log2(np.maximum(freqs, 1))
    for k in range(frames):
        seg = x[k * hop:k * hop + win] * w
        spec = np.fft.rfft(seg)
        fc = f_path(k / max(1, frames - 1))
        g = np.exp(-0.5 * ((lf - np.log2(fc)) / width_oct) ** 2)
        out[k * hop:k * hop + win] += np.fft.irfft(spec * g) * w
    return out / (np.max(np.abs(out)) + 1e-9)


def sfx_whoosh():
    L = 1.0
    t = t_axis(L)
    x = moving_band_noise(L, lambda u: 250 * (14 ** np.sin(np.pi * u * 0.92)), 0.55, seed=3)
    e = np.exp(-0.5 * ((t - 0.58) / 0.17) ** 2)
    pan = np.linspace(-0.8, 0.8, len(t))
    a = (pan + 1) * np.pi / 4
    s = np.stack([x * e * np.cos(a), x * e * np.sin(a)], axis=1)
    return norm(reverb(s, HALL, 0.25), 0.8)


def sfx_riser():
    L = 1.6
    t = t_axis(L)
    u = t / L
    x = moving_band_noise(L, lambda v: 300 * (25 ** (v ** 1.6)), 0.5, seed=4)
    f = 180 * (6 ** (u ** 1.8))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.18
    e = u ** 2.2
    cut = np.clip((L - t) / 0.01, 0, 1)
    return norm(reverb(stereo((x * 0.8 + tone) * e * cut), HALL, 0.3), 0.7)


def sfx_impact():
    L = 3.0
    t = t_axis(L)
    f = 38 + 30 * np.exp(-t / 0.12)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    thump = lp(RNG.standard_normal(len(t)), 900) * np.exp(-t / 0.06) * 0.9
    air = hp(RNG.standard_normal(len(t)), 3000) * np.exp(-t / 0.35) * 0.12
    x = np.tanh((sub * 1.2 + thump + air) * 1.4)
    return norm(reverb(stereo(x), HALL, 0.35), 0.95)


def sfx_tick():
    L = 0.14
    t = t_axis(L)
    x = (np.sin(2 * np.pi * 2600 * t) * 0.6 + np.sin(2 * np.pi * 1300 * t) * 0.4) * np.exp(-t / 0.022)
    click = hp(RNG.standard_normal(len(t)), 4000) * np.exp(-t / 0.002) * 0.4
    return norm(reverb(stereo(x + click), ROOM, 0.12), 0.6)


def sfx_shimmer():
    L = 3.0
    out = np.zeros((int(L * SR), 2))
    notes = [86, 90, 93, 95, 98, 102, 105]  # D6 F#6 A6 B6 D7 F#7 A7
    for i, m in enumerate(notes):
        t = t_axis(1.8)
        f = mtof(m)
        bell = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25)) * np.exp(-t / 0.7)
        bell *= np.minimum(1, t / 0.003)
        add(out, stereo(bell * 0.4, pan=-0.6 + i * 0.2), i * 0.055)
    return norm(hp(reverb(out, HALL, 0.55), 900), 0.6)


def sfx_pop():
    """botão do CTA: toque macio e grave"""
    L = 0.5
    t = t_axis(L)
    f = 520 * np.exp(-t / 0.05) + 260
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    return norm(reverb(stereo(x), ROOM, 0.2), 0.6)


def norm(x, peak):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = {
        'bgm': bgm,
        'sfx_whoosh': sfx_whoosh,
        'sfx_riser': sfx_riser,
        'sfx_impact': sfx_impact,
        'sfx_tick': sfx_tick,
        'sfx_shimmer': sfx_shimmer,
        'sfx_pop': sfx_pop,
    }
    only = sys.argv[1:] or list(jobs)
    for name in only:
        y = jobs[name]()
        path = os.path.join(OUT, f'{name}.wav')
        sf.write(path, y.astype(np.float32), SR, subtype='PCM_24')
        print(f'{name}: {len(y) / SR:.2f}s -> {os.path.relpath(path)}')


if __name__ == '__main__':
    main()
