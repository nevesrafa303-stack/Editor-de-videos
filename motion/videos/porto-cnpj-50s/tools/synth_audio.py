#!/usr/bin/env python3
"""
Trilha + sound design do filme Porto 50 s ("Para de rolar").

  python -I tools/synth_audio.py            -> assets/audio/{bgm,sfx_*}.wav

Grade presa à locução: G0 = 12,47 s ("E muita gente já descobriu", a virada), compasso
de BAR s, de modo que a trava do preço (26,43 s, fim de "oitenta") cai na barra 6, o
"Agora pode rolar" chega no refrão (barra 13) e o acorde final soa na barra 15.
  0–0,62 s     só o feed voando (efeito); no toque do dedo, golpe grave e a tensão começa
  até G0       tensão em Dó# menor: pulso grave em colcheias, tique-taque, pluck menor, riser
  barras 0-1   virada para Mi maior: plucks e pad claros, sem bateria
  barras 2-5   groove leve (kick 1 e 3, chimbal), baixo
  barras 6-10  pico (palmas 2 e 4) — preço, benefícios e comparativo
  barras 11-12 respiro (filtro fechado) — "Simulação gratuita"
  barras 13-14 refrão — "Agora pode rolar" e o toque no botão
  barra 15     acorde final, soa até o fim
"""
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
STOP = 0.616
G0 = 12.47
LOCK = 26.426
BAR = (LOCK - G0) / 6        # 2.326 s -> ~103 BPM
BEAT = BAR / 4
TOTAL = 50.0
RNG = np.random.default_rng(20261018)

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
    'E': dict(bass=40, pad=[56, 59, 64, 68], arp=[64, 68, 71, 76]),
    'C#m': dict(bass=37, pad=[56, 61, 64, 68], arp=[61, 64, 68, 73]),
    'A': dict(bass=33, pad=[57, 61, 64, 69], arp=[61, 64, 69, 73]),
    'B': dict(bass=35, pad=[54, 59, 63, 66], arp=[63, 66, 71, 75]),
}
PROG = ['A', 'B'] + ['E', 'C#m', 'A', 'B'] * 3 + ['A', 'E']
LIGHT_G, FULL, PEAK, BREAK, CHORUS, LAST = 2, 6, 6, 11, 13, 15


def pluck(m, vel=0.7, length=1.6, bright=0.5):
    """Karplus-Strong: corda dedilhada curta"""
    f = mtof(m)
    n = int(length * SR)
    p = max(2, int(round(SR / f)))
    r = np.random.default_rng(int(m * 31 + vel * 100))
    buf = r.uniform(-1, 1, p)
    buf = lp(buf, 1500 + 7000 * bright) if p > 32 else buf
    out = np.zeros(n)
    idx = 0
    damp = 0.996 - 0.004 * (m - 50) / 40
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % p
        buf[idx] = damp * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    t = np.arange(n) / SR
    return out * np.minimum(1, t / 0.002) * vel * 0.32


def clap(vel=0.6):
    t = t_axis(0.3)
    out = np.zeros(len(t))
    for d in (0.0, 0.011, 0.022):
        i = int(d * SR)
        out[i:] += bp(RNG.standard_normal(len(t) - i), 900, 5000) * np.exp(-t[:len(t) - i] / (0.012 if d < 0.02 else 0.09))
    return out * vel * 0.5


def tension():
    """do toque do dedo até G0: pulso grave em colcheias, tique-taque, pluck menor e riser"""
    L = G0 + 0.6
    n = int(L * SR)
    out = np.zeros((n, 2))
    t = t_axis(L)
    on = np.clip((t - STOP) / 0.04, 0, 1)
    # drone grave C#1 + G#1
    drone = np.sin(2 * np.pi * mtof(25) * t) + 0.5 * np.sin(2 * np.pi * mtof(32) * t + 0.4)
    add(out, stereo(np.tanh(drone * 0.8) * 0.3 * on), 0)
    # cluster agudo crescendo (C#5 D5 G#5)
    for i, m in enumerate([73, 74, 80]):
        u = np.clip((t - STOP) / (G0 - STOP), 0, 1)
        p = saw_pad(m, L, 2200, detune_cents=(-14, -5, 6, 15)) * (0.06 + 0.3 * u ** 1.8) * on
        add(out, stereo(p, pan=-0.5 + 0.5 * i), 0)
    # pulso grave em colcheias, recuando a grade a partir de G0
    k = 1
    while G0 - k * BEAT / 2 > STOP + 0.05:
        at = G0 - k * BEAT / 2
        tt = t_axis(0.22)
        x = np.tanh(1.5 * np.sin(2 * np.pi * mtof(37) * tt)) * np.exp(-tt / 0.07) * (0.8 + 0.2 * (at / G0))
        add(out, stereo(lp(x, 420) * 0.75), at)
        k += 1
    # tique-taque nos tempos
    tt = t_axis(0.05)
    k = 1
    while G0 - k * BEAT > STOP + 0.2:
        at = G0 - k * BEAT
        x = np.sin(2 * np.pi * (2400 if k % 2 else 1800) * tt) * np.exp(-tt / 0.008) + hp(RNG.standard_normal(len(tt)), 3000) * np.exp(-tt / 0.003) * 0.4
        add(out, stereo(x * 0.18, pan=0.35 * (-1) ** k), at)
        k += 1
    # motivo de pluck em Dó# menor a cada compasso (C#5 E5 G#5 E5 B4)
    motif = [73, 76, 80, 76, 71, 76, 73, 68]
    b = 1
    while G0 - b * BAR > STOP + 0.3:
        t0 = G0 - b * BAR
        for q, m in enumerate(motif):
            add(out, stereo(pluck(m, 0.45 if q else 0.6, 1.2, 0.35), pan=0.4 * np.sin(q)), t0 + q * BEAT / 2)
        b += 1
    # riser nos últimos 1,6 s
    rl = 1.6
    rt = t_axis(rl)
    add(out, stereo(moving_band_noise(rl, lambda u: 400 * (18 ** (u ** 1.5)), 0.5, seed=21) * (rt / rl) ** 2.5 * 0.45), G0 - 0.08 - rl)
    out = reverb(out, HALL, 0.3)
    c0 = int((G0 - 0.08) * SR)
    out[c0 - 240:c0] *= np.linspace(1, 0, 240)[:, None]
    out[c0:] = 0
    s0 = int(STOP * SR)
    out[:s0] = 0
    return out


def bgm():
    n = int((TOTAL + 4.0) * SR)
    pads, keys, drums, bass, fx = (np.zeros((n, 2)) for _ in range(5))
    for b, name in enumerate(PROG):
        c = CHORDS[name]
        t0 = G0 + b * BAR
        last = b == LAST
        brk = BREAK <= b < CHORUS
        cutoff = 2400 if b < LIGHT_G else 1500 if brk else 3200 if b < PEAK else 4200 if b < CHORUS else 5200
        L = BAR + 1.6 + (3.0 if last else 0)
        for i, m in enumerate(c['pad']):
            p = saw_pad(m, L, cutoff) * env_asr(int(L * SR), 0.25 if b in (0, CHORUS) else 0.6, 1.4 if not last else 2.6)
            add(pads, stereo(p, pan=(-0.5 + i * 0.33)), t0)
        if last:
            for m in c['pad'] + [52, 76]:
                add(keys, stereo(piano(m, 0.8, 4.2)), t0)
        else:
            # plucks em semicolcheias (padrão sobe e desce), mais densos no pico e no refrão
            pattern = [0, 2, 1, 3, 2, 1, 3, 2]
            steps = 8 if (b < LIGHT_G or brk) else 16
            for s_ in range(steps):
                q = pattern[s_ % 8] if steps == 8 else [0, 1, 2, 3, 2, 3, 1, 2, 0, 2, 3, 1, 2, 3, 1, 3][s_]
                vel = 0.75 if s_ % 4 == 0 else 0.5
                add(keys, stereo(pluck(c['arp'][q] + (12 if b >= CHORUS and s_ % 2 else 0), vel, 1.3, 0.55 if b >= PEAK else 0.4),
                                 pan=0.35 * np.sin(1.7 * s_)), t0 + s_ * BAR / steps)
            if b < LIGHT_G:
                for m in c['pad']:
                    add(keys, stereo(piano(m, 0.6, 3.0), pan=0.15 * np.sin(m)), t0)
        if not brk or b == BREAK + 1:
            add(bass, stereo(sub_note(c['bass'], BAR + 0.1 if not last else 2.6)), t0)
        if LIGHT_G <= b < LAST and not brk:
            beats = [0, 2] if b < PEAK else [0, 1, 2, 3]
            for q in beats:
                add(drums, stereo(kick(1.0 if q == 0 else 0.8)), t0 + q * BEAT)
            for e in range(8):
                add(drums, stereo(hat(0.5 if e % 2 else 0.3), pan=0.3), t0 + e * BEAT / 2)
            if b >= PEAK:
                for q in (1, 3):
                    add(drums, stereo(clap(0.6), pan=-0.05), t0 + q * BEAT)
        if b == CHORUS - 1:
            # respiro: rufo de palmas subindo até o refrão
            for k in range(16):
                add(drums, stereo(clap(0.08 + 0.5 * k / 15), pan=-0.1), t0 + BAR / 2 + k * BAR / 32)
        if last:
            add(drums, stereo(kick(1.1)), t0)
    crash_t = t_axis(3.0)
    crash = hp(RNG.standard_normal(len(crash_t)), 4000, 2) * np.exp(-crash_t / 0.9) * 0.3
    for b in (0, PEAK, CHORUS, LAST):
        add(fx, stereo(crash * (0.6 if b == 0 else 1.0)), G0 + b * BAR)
    sw_t = t_axis(BAR)
    for b in (PEAK, CHORUS):
        add(fx, stereo(hp(RNG.standard_normal(len(sw_t)), 5000, 2) * (sw_t / BAR) ** 3 * 0.3), G0 + b * BAR - BAR)
    duck = np.ones(n)
    for b in range(PEAK, LAST):
        if BREAK <= b < CHORUS:
            continue
        for q in range(4):
            i = int((G0 + b * BAR + q * BEAT) * SR)
            k = np.arange(int(0.3 * SR))
            seg = 1 - 0.32 * np.exp(-k / (0.08 * SR))
            j = min(len(seg), n - i)
            duck[i:i + j] = np.minimum(duck[i:i + j], seg[:j])
    pads *= duck[:, None]
    bass *= duck[:, None]
    pads = hp(pads, 160)
    mix = (reverb(pads, HALL, 0.45) * 0.5 + reverb(keys, HALL, 0.32) * 1.0 + reverb(drums, ROOM, 0.18) * 0.45
           + lp(bass, 220) * 0.34 + reverb(fx, HALL, 0.3) * 0.7)
    t1 = tension()
    mix[:len(t1)] += t1 * 0.95
    mix = hp(mix, 28)
    mix = mix - 0.3 * bp(mix, 180, 450) + 1.2 * hp(mix, 2500, 2) + 0.7 * hp(mix, 7000, 2)
    mix = mix[: int(TOTAL * SR)]
    fade = np.ones(len(mix))
    f0 = int((TOTAL - 1.4) * SR)
    fade[f0:] = np.linspace(1, 0, len(mix) - f0) ** 2
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


def sfx_counter(length=2.3, n=26):
    out = np.zeros((int((length + 0.2) * SR), 2))
    t = t_axis(0.03)
    for k in range(1, n + 1):
        u = 1 - (1 - k / n) ** (1 / 3)        # inverso de power3.out
        f = 3200 if k % 2 else 2600
        x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + hp(RNG.standard_normal(len(t)), 5000) * np.exp(-t / 0.002) * 0.3
        add(out, stereo(x * (0.55 + 0.45 * k / n), pan=0.1 * (-1) ** k), u * length)
    return norm(reverb(out, ROOM, 0.1), 0.6)


def sfx_chime():
    """revelação do logo: duas notas de sino suaves (A5 e D6, no tom da trilha)"""
    L = 2.2
    out = np.zeros((int(L * SR), 2))
    for i, (m, at, g) in enumerate([(81, 0.0, 0.55), (86, 0.09, 0.45)]):
        t = t_axis(L - at)
        f = mtof(m)
        bell = (np.sin(2 * np.pi * f * t) + 0.28 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.4)
                + 0.12 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.18)) * np.exp(-t / 0.75)
        bell *= np.minimum(1, t / 0.004)
        add(out, stereo(bell * g, pan=-0.2 + 0.4 * i), at)
    return norm(hp(reverb(out, HALL, 0.4), 400), 0.55)


def sfx_notify():
    """notificação de celular: dois toques de sino curtos"""
    L = 1.2
    out = np.zeros((int(L * SR), 2))
    for at, m in ((0.0, 88), (0.12, 93)):
        t = t_axis(L - at)
        f = mtof(m)
        x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.1)) * np.exp(-t / 0.28)
        add(out, stereo(x * np.minimum(1, t / 0.002) * 0.6), at)
    return norm(reverb(out, ROOM, 0.15), 0.6)


def sfx_glitch():
    """falha digital: rajadas de ruído quantizado e bipes quadrados"""
    L = 0.6
    out = np.zeros((int(L * SR), 2))
    r = np.random.default_rng(31)
    at = 0.0
    for k in range(9):
        d = r.uniform(0.02, 0.06)
        t = t_axis(d)
        if k % 3 == 1:
            f = r.choice([220, 330, 880, 1320])
            x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5
        else:
            x = r.standard_normal(len(t))
            x = np.round(x * 3) / 3
            x = bp(x, 600, 6000)
        x *= np.hanning(len(t)) ** 0.3 * (1 - k / 12)
        add(out, stereo(x, pan=r.uniform(-0.7, 0.7)), at)
        at += d + r.uniform(0.0, 0.025)
    return norm(out, 0.55)


def sfx_switch():
    """interruptor: clique mecânico duplo"""
    L = 0.25
    out = np.zeros((int(L * SR), 2))
    for at, f, v in ((0.0, 3200, 1.0), (0.045, 2100, 0.7)):
        t = t_axis(0.06)
        x = (np.sin(2 * np.pi * f * t) * 0.5 + hp(RNG.standard_normal(len(t)), 2500) * 0.6) * np.exp(-t / 0.006)
        x += np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.02) * 0.6
        add(out, stereo(x * v), at)
    return norm(reverb(out, ROOM, 0.1), 0.7)


def sfx_drop():
    """mensalidade caindo: assobio descendente com corpo"""
    L = 0.9
    t = t_axis(L)
    f = 1400 * (0.18 ** (t / L) ** 0.8)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5) * np.minimum(1, t / 0.01)
    x += 0.4 * np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR) * np.exp(-t / 0.5)
    return norm(reverb(stereo(x), HALL, 0.25), 0.55)


def sfx_stamp():
    """carimbo "PAGO": baque grave + papel"""
    L = 0.5
    t = t_axis(L)
    thump = np.sin(2 * np.pi * np.cumsum(90 + 120 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.09)
    paper = bp(RNG.standard_normal(len(t)), 1200, 6000) * np.exp(-t / 0.03) * 0.5
    return norm(reverb(stereo(np.tanh((thump + paper) * 1.6)), ROOM, 0.15), 0.7)


def sfx_scramble(length=2.8, step=1 / 15):
    """letreiro de números girando: tiques regulares e secos"""
    out = np.zeros((int((length + 0.1) * SR), 2))
    tt = t_axis(0.025)
    k = 0
    while k * step < length:
        f = (2900, 3300, 2500)[k % 3]
        x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004) + hp(RNG.standard_normal(len(tt)), 5000) * np.exp(-tt / 0.002) * 0.25
        add(out, stereo(x * (0.5 + 0.2 * (k % 2)), pan=0.15 * (-1) ** k), k * step)
        k += 1
    return norm(reverb(out, ROOM, 0.08), 0.5)


def sfx_pop():
    """botão do CTA: toque macio e grave"""
    L = 0.5
    t = t_axis(L)
    f = 520 * np.exp(-t / 0.05) + 260
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    return norm(reverb(stereo(x), ROOM, 0.2), 0.6)


def sfx_feedfly(length=0.9):
    """feed voando: catraca rápida de rolagem + vento, cortado seco no toque"""
    L = length
    t = t_axis(L)
    out = np.zeros((len(t), 2))
    tt = t_axis(0.012)
    at = 0.0
    k = 0
    while at < STOP:
        x = np.sin(2 * np.pi * (2200 + 300 * (k % 3)) * tt) * np.exp(-tt / 0.002) + hp(RNG.standard_normal(len(tt)), 4000) * np.exp(-tt / 0.0015) * 0.5
        add(out, stereo(x * 0.35, pan=0.2 * (-1) ** k), at)
        at += 1 / 38
        k += 1
    air = moving_band_noise(L, lambda u: 900 + 2200 * u, 0.7, seed=41) * 0.5
    out += stereo(air * np.clip((STOP - t) / 0.01, 0, 1) * np.minimum(1, t / 0.05))
    return norm(reverb(out, ROOM, 0.1), 0.6)


def sfx_listfly(length=1.9, td=0.14, tm=1.5):
    """lista correndo: tiques cuja frequência acompanha a velocidade (power4.out)"""
    out = np.zeros((int((length + 0.1) * SR), 2))
    tt = t_axis(0.014)
    pos, step, k = 0.0, 0.0, 0
    ts = np.arange(0, td + tm, 1 / 2000)

    def y(t):
        if t < td:
            return 0.28 * (t / td) ** 2
        u = (t - td) / tm
        return 0.28 + 0.72 * (1 - (1 - u) ** 5)
    last = 0.0
    for t in ts:
        v = y(t) * 48
        if v - last >= 1:
            last = np.floor(v)
            x = np.sin(2 * np.pi * (2600 + 400 * (k % 2)) * tt) * np.exp(-tt / 0.0025) + hp(RNG.standard_normal(len(tt)), 4500) * np.exp(-tt / 0.0015) * 0.4
            add(out, stereo(x * 0.35, pan=0.15 * (-1) ** k), t)
            k += 1
    return norm(reverb(out, ROOM, 0.1), 0.5)


def sfx_swipe():
    """arremesso de rolagem: sopro curto que sobe"""
    L = 0.5
    t = t_axis(L)
    x = moving_band_noise(L, lambda u: 700 * (5 ** u), 0.6, seed=17)
    e = np.exp(-0.5 * ((t - 0.12) / 0.07) ** 2) * 0.6 + np.exp(-t / 0.18) * (t > 0.12) * 0.4
    return norm(reverb(stereo(x * e * np.minimum(1, t / 0.01)), ROOM, 0.15), 0.55)


def sfx_rubber():
    """retorno elástico: "tum" grave e curto com leve queda de tom"""
    L = 0.5
    t = t_axis(L)
    f = 140 * np.exp(-t / 0.12) + 70
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.1)
    x += lp(RNG.standard_normal(len(t)), 600) * np.exp(-t / 0.015) * 0.3
    return norm(reverb(stereo(np.tanh(x * 1.4)), ROOM, 0.12), 0.6)


def sfx_tap():
    """toque no vidro: clique seco + corpo"""
    L = 0.3
    t = t_axis(L)
    click = hp(RNG.standard_normal(len(t)), 3000) * np.exp(-t / 0.0018)
    body = np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.012) * 0.6 + np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.03) * 0.5
    return norm(reverb(stereo(click + body), ROOM, 0.1), 0.7)


def sfx_sheet():
    """folha subindo: sopro macio ascendente"""
    L = 0.8
    t = t_axis(L)
    x = moving_band_noise(L, lambda u: 300 * (8 ** u), 0.7, seed=19)
    e = np.sin(np.pi * np.clip(t / 0.6, 0, 1)) ** 2
    return norm(reverb(stereo(x * e), HALL, 0.25), 0.5)


def norm(x, peak):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = {
        'bgm': bgm,
        'sfx_whoosh': sfx_whoosh,
        'sfx_impact': sfx_impact,
        'sfx_tick': sfx_tick,
        'sfx_shimmer': sfx_shimmer,
        'sfx_pop': sfx_pop,
        'sfx_counter': lambda: sfx_counter(length=LOCK - 24.40, n=20),
        'sfx_stamp': sfx_stamp,
        'sfx_scramble_short': lambda: sfx_scramble(length=1.0),
        'sfx_notify': sfx_notify,
        'sfx_drop': sfx_drop,
        'sfx_chime': sfx_chime,
        'sfx_feedfly': sfx_feedfly,
        'sfx_listfly': sfx_listfly,
        'sfx_swipe': sfx_swipe,
        'sfx_rubber': sfx_rubber,
        'sfx_tap': sfx_tap,
        'sfx_sheet': sfx_sheet,
    }
    only = sys.argv[1:] or list(jobs)
    for name in only:
        y = jobs[name]()
        path = os.path.join(OUT, f'{name}.wav')
        sf.write(path, y.astype(np.float32), SR, subtype='PCM_24')
        print(f'{name}: {len(y) / SR:.2f}s -> {os.path.relpath(path)}')


if __name__ == '__main__':
    main()
