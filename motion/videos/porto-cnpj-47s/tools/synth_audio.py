#!/usr/bin/env python3
"""
Trilha + sound design do filme Porto 47 s ("A conta que ninguém revisa").

  python -I tools/synth_audio.py            -> assets/audio/{bgm,sfx_*}.wav

Grade presa à locução: G0 = 7,63 s ("Plano de saúde não é gasto"), compasso de BAR s,
de modo que a trava do preço (26,29 s, fim de "oitenta") cai na barra 8, o CTA
(37,95 s) na barra 13 e o acorde final (44,95 s) na barra 16.
  antes de G0   tensão: pulso grave em colcheias, tique-taque, cluster agudo, riser
  barras 0-1    virada: piano e pad claros, sem bateria ("decisão inteligente")
  barras 2-4    groove leve (kick 1 e 3, chimbal), baixo
  barras 5-7    groove cheio; rufo na 7 até a trava do preço
  barras 8-12   pico (palmas 2 e 4) — benefícios e comparativo
  barras 13-15  refrão do CTA
  barra 16      acorde final, soa até o fim
"""
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
G0 = 7.63
LOCK = 26.29
BAR = (LOCK - G0) / 8        # 2.3325 s -> ~102,9 BPM
BEAT = BAR / 4
BARS = 17
TOTAL = 47.0
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
PROG = ['D', 'A'] + ['Bm', 'G', 'D', 'A'] * 3 + ['Bm', 'G', 'D']
LIGHT_G, FULL, PEAK, CHORUS, LAST = 2, 5, 8, 13, 16


def tension():
    """antes de G0: pulso grave em colcheias na mesma grade, tique-taque e cluster subindo"""
    L = G0 + 0.6
    n = int(L * SR)
    out = np.zeros((n, 2))
    t = t_axis(L)
    # cluster agudo (D5 Eb5 A5) crescendo
    for i, m in enumerate([74, 75, 81]):
        p = saw_pad(m, L, 2400, detune_cents=(-14, -5, 6, 15)) * (0.16 + 0.32 * (t / L) ** 1.5)
        add(out, stereo(p, pan=-0.5 + 0.5 * i), 0)
    # pulso grave abafado em colcheias (Ré), recuando a grade a partir de G0
    k = 1
    while G0 - k * BEAT / 2 > 0.02:
        at = G0 - k * BEAT / 2
        tt = t_axis(0.22)
        f = mtof(38)
        x = np.tanh(1.5 * np.sin(2 * np.pi * f * tt)) * np.exp(-tt / 0.07) * (0.85 + 0.15 * (at / G0))
        add(out, stereo(lp(x, 400) * 0.75), at)
        k += 1
    # drone grave contínuo (D1 + A1) desde o primeiro quadro
    drone = np.sin(2 * np.pi * mtof(26) * t) + 0.5 * np.sin(2 * np.pi * mtof(33) * t + 0.4)
    add(out, stereo(np.tanh(drone * 0.8) * 0.32 * np.clip(t / 0.05, 0, 1)), 0)
    # tique-taque nos tempos
    tt = t_axis(0.05)
    k = 1
    while G0 - k * BEAT > 0.05:
        at = G0 - k * BEAT
        x = np.sin(2 * np.pi * (2400 if k % 2 else 1800) * tt) * np.exp(-tt / 0.008) + hp(RNG.standard_normal(len(tt)), 3000) * np.exp(-tt / 0.003) * 0.4
        add(out, stereo(x * 0.2, pan=0.35 * (-1) ** k), at)
        k += 1
    # golpe grave no "doze" (4,51 s)
    add(out, stereo(kick(1.0) * 0.9), 4.51)
    # riser nos últimos 1,6 s
    rl = 1.6
    rt = t_axis(rl)
    add(out, stereo(moving_band_noise(rl, lambda u: 400 * (18 ** (u ** 1.5)), 0.5, seed=21) * (rt / rl) ** 2.5 * 0.45), G0 - 0.08 - rl)
    out = reverb(out, HALL, 0.3)
    c0 = int((G0 - 0.08) * SR)
    out[c0 - 240:c0] *= np.linspace(1, 0, 240)[:, None]
    out[c0:] = 0
    return out


def bgm():
    n = int((TOTAL + 4.0) * SR)
    pads, keys, drums, bass, fx = (np.zeros((n, 2)) for _ in range(5))
    for b, name in enumerate(PROG):
        c = CHORDS[name]
        t0 = G0 + b * BAR
        last = b == LAST
        cutoff = 2600 if b < LIGHT_G else 3000 if b < FULL else 3800 if b < CHORUS else 5200
        L = BAR + 1.6 + (2.6 if last else 0)
        for i, m in enumerate(c['pad']):
            p = saw_pad(m, L, cutoff) * env_asr(int(L * SR), 0.2 if b in (0, CHORUS) else 0.6, 1.4 if not last else 2.4)
            add(pads, stereo(p, pan=(-0.5 + i * 0.33)), t0)
        if b < LIGHT_G:
            # virada: acorde de piano cheio + sinos, sem bateria
            for m in c['pad'] + [c['bass'] + 24]:
                add(keys, stereo(piano(m, 0.75, 3.2), pan=0.15 * np.sin(m)), t0)
            for q in range(4):
                add(keys, stereo(bell(c['arp'][[3, 1, 2, 0][q]] + 12, 0.42), pan=0.6 * (-1) ** q), t0 + q * BEAT + BEAT / 2)
        elif not last:
            pattern = [0, 1, 2, 3, 2, 1, 2, 3]
            for s_ in range(8):
                vel = 0.9 if s_ == 0 else 0.55 + 0.1 * (s_ % 2 == 0) + (0.1 if b >= PEAK else 0)
                add(keys, stereo(piano(c['arp'][pattern[s_]], vel, 2.6), pan=0.25 * np.sin(s_)), t0 + s_ * BEAT / 2)
                if b >= CHORUS:
                    add(keys, stereo(piano(c['arp'][pattern[s_]] + 12, vel * 0.5, 1.8), pan=-0.3 * np.sin(s_)), t0 + s_ * BEAT / 2)
            for q in range(4):
                add(keys, stereo(bell(c['arp'][[3, 1, 2, 0][q]] + 12, 0.45 if q == 0 else 0.32), pan=0.6 * (-1) ** q), t0 + q * BEAT + BEAT / 2)
        else:
            for m in c['pad'] + [50, 74]:
                add(keys, stereo(piano(m, 0.85, 4.0)), t0)
        if b >= LIGHT_G or b == 0:
            add(bass, stereo(sub_note(c['bass'], BAR + 0.1 if not last else 2.4)), t0)
        if LIGHT_G <= b < LAST:
            beats = [0, 2] if b < FULL else [0, 1, 2, 3]
            for q in beats:
                add(drums, stereo(kick(1.0 if q == 0 else 0.8)), t0 + q * BEAT)
            for e in range(8):
                add(drums, stereo(hat(0.5 if e % 2 else 0.3), pan=0.3), t0 + e * BEAT / 2)
            if b >= PEAK:
                for q in (1, 3):
                    add(drums, stereo(snare(0.55)), t0 + q * BEAT)
            if b in (PEAK - 1, CHORUS - 1):
                for k in range(16):
                    add(drums, stereo(snare(0.12 + 0.55 * k / 15), pan=-0.1), t0 + BAR / 2 + k * BAR / 32)
        if last:
            add(drums, stereo(kick(1.1)), t0)
    crash_t = t_axis(3.0)
    crash = hp(RNG.standard_normal(len(crash_t)), 4000, 2) * np.exp(-crash_t / 0.9) * 0.3
    for b in (0, FULL, PEAK, CHORUS, LAST):
        add(fx, stereo(crash * (0.6 if b == 0 else 1.0)), G0 + b * BAR)
    sw_t = t_axis(BAR)
    for b in (PEAK, CHORUS):
        add(fx, stereo(hp(RNG.standard_normal(len(sw_t)), 5000, 2) * (sw_t / BAR) ** 3 * 0.3), G0 + b * BAR - BAR)
    duck = np.ones(n)
    for b in range(FULL, LAST):
        for q in range(4):
            i = int((G0 + b * BAR + q * BEAT) * SR)
            k = np.arange(int(0.3 * SR))
            seg = 1 - 0.32 * np.exp(-k / (0.08 * SR))
            j = min(len(seg), n - i)
            duck[i:i + j] = np.minimum(duck[i:i + j], seg[:j])
    pads *= duck[:, None]
    bass *= duck[:, None]
    pads = hp(pads, 160)
    mix = (reverb(pads, HALL, 0.45) * 0.5 + reverb(keys, HALL, 0.38) * 1.0 + reverb(drums, ROOM, 0.18) * 0.45
           + lp(bass, 220) * 0.32 + reverb(fx, HALL, 0.3) * 0.7)
    t1 = tension()
    mix[:len(t1)] += t1 * 0.9
    mix = hp(mix, 28)
    mix = mix - 0.3 * bp(mix, 180, 450) + 1.3 * hp(mix, 2500, 2) + 0.8 * hp(mix, 7000, 2)
    mix = mix[: int(TOTAL * SR)]
    fade = np.ones(len(mix))
    f0 = int((TOTAL - 1.4) * SR)
    fade[f0:] = np.linspace(1, 0, len(mix) - f0) ** 2
    fi = int(0.02 * SR)
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
        'sfx_counter': lambda: sfx_counter(length=LOCK - 24.01, n=22),
        'sfx_stamp': sfx_stamp,
        'sfx_scramble': sfx_scramble,
        'sfx_scramble_short': lambda: sfx_scramble(length=1.0),
        'sfx_notify': sfx_notify,
        'sfx_glitch': sfx_glitch,
        'sfx_switch': sfx_switch,
        'sfx_drop': sfx_drop,
        'sfx_chime': sfx_chime,
    }
    only = sys.argv[1:] or list(jobs)
    for name in only:
        y = jobs[name]()
        path = os.path.join(OUT, f'{name}.wav')
        sf.write(path, y.astype(np.float32), SR, subtype='PCM_24')
        print(f'{name}: {len(y) / SR:.2f}s -> {os.path.relpath(path)}')


if __name__ == '__main__':
    main()
