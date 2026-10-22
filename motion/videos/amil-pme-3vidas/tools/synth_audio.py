#!/usr/bin/env python3
"""
Trilha + tratamento dos efeitos do anúncio Amil "3 vidas" (Plano de Saúde Empresarial).

  python -I tools/synth_audio.py   -> assets/audio/bgm.wav e assets/audio/sfx_*.wav

Efeitos: gerados no ElevenLabs (Sound Effects v2, prompts em README) e guardados em
assets/audio/src/*.mp3; aqui são cortados no ataque, nivelados e convertidos para 48 kHz.
assets/audio/sfx_hits.json guarda, para cada efeito, quanto tempo depois do início do arquivo
fica o golpe (o build alinha o golpe, não o começo do arquivo).

Trilha sintetizada (a conexão do ElevenLabs deste ambiente não gera música), presa à locução:
DROP = 7,46 s ("mil", o preço) e CTA = 29,30 s ("Toque"), 11 compassos entre os dois (~121 BPM).
  0–3,49      sussurro: drone grave em Lá, ar filtrado (o "Psiu… você que tem CNPJ")
  -2..-1      pré: pulso de baixo em colcheias, motivo de pluck com filtro abrindo, riser
  0–6         drop no preço: kick 4/4, baixo, plucks; palmas a partir do 2, chimbal 16 nos benefícios
  7–9         respiro sério ("Só um detalhe"): pad, piano, kick só no 1
  10          subida ("Então não fica no achismo"): rufo, filtro abrindo
  11–13       refrão do CTA
  14          acorde final em Lá, soa até o fim
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
RNG = np.random.default_rng(20261022)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets", "audio")

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



def norm(x, peak):
    return x / (np.max(np.abs(x)) + 1e-9) * peak




# ───────────────────────── grade da trilha ─────────────────────────

DROP = 7.46                  # "mil" (o preço)
CTA = 29.30                  # "Toque"
BAR = (CTA - DROP) / 11      # 1,985 s -> ~121 BPM
BEAT = BAR / 4
TOTAL = 36.5
PRE, BREAK, BUILD, CHORUS, LAST = -2, 7, 10, 11, 14


def at_bar(b):
    return DROP + b * BAR


CHORDS = {
    'A': dict(bass=33, pad=[57, 61, 64, 69], arp=[64, 69, 73, 76]),
    'E': dict(bass=40, pad=[56, 59, 64, 68], arp=[64, 68, 71, 76]),
    'F#m': dict(bass=30, pad=[54, 57, 61, 66], arp=[61, 66, 69, 73]),
    'D': dict(bass=38, pad=[57, 62, 66, 69], arp=[62, 66, 69, 74]),
}
PROG = {-2: 'F#m', -1: 'D', 0: 'A', 1: 'E', 2: 'F#m', 3: 'D', 4: 'A', 5: 'E', 6: 'D',
        7: 'F#m', 8: 'D', 9: 'E', 10: 'E', 11: 'A', 12: 'E', 13: 'D', 14: 'A'}


def intro():
    """sussurro: drone em Lá com quinta, ar filtrado que abre devagar até o pré"""
    L = at_bar(PRE) + 0.4
    t = t_axis(L)
    x = np.sin(2 * np.pi * mtof(33) * t) + 0.45 * np.sin(2 * np.pi * mtof(40) * t + 0.3) + 0.2 * np.sin(2 * np.pi * mtof(45) * t)
    x = np.tanh(x * 0.9) * np.minimum(1, t / 1.2) * 0.32
    air = moving_band_noise(L, lambda u: 500 * (5 ** u), 0.7, seed=31) * 0.1 * (t / L) ** 1.5
    out = stereo(x) + np.stack([air, np.roll(air, 900)], axis=1)
    out[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
    return reverb(out, HALL, 0.35)


def bgm():
    n = int((TOTAL + 4.0) * SR)
    pads, keys, drums, bass, fx = (np.zeros((n, 2)) for _ in range(5))
    for b in range(PRE, LAST + 1):
        c = CHORDS[PROG[b]]
        t0 = at_bar(b)
        pre, brk, build, last = b < 0, BREAK <= b < BUILD, b == BUILD, b == LAST
        chorus = b >= CHORUS and not last
        u = (b - PRE) / 2 if pre else 1
        cutoff = 900 + 1800 * u if pre else 2300 if brk else 2600 if build else 5200 if chorus else 3800 if b >= 4 else 3200
        L = BAR + 1.3 + (2.6 if last else 0)
        for i, m in enumerate(c['pad']):
            p = saw_pad(m, L, cutoff) * env_asr(int(L * SR), 0.15 if b in (0, CHORUS) else 0.5, 1.2 if not last else 2.6)
            add(pads, stereo(p, pan=(-0.5 + i * 0.33)), t0)
        # teclas
        if last:
            for m in c['pad'] + [45, 76]:
                add(keys, stereo(piano(m, 0.85, 3.8)), t0)
        elif brk:
            for s_ in range(8):
                add(keys, stereo(piano(c['arp'][[0, 2, 1, 3, 2, 1, 3, 2][s_]], 0.6 if s_ % 4 == 0 else 0.42, 2.4), pan=0.25 * np.sin(s_)), t0 + s_ * BAR / 8)
        else:
            steps = 8 if pre or build else 16
            for s_ in range(steps):
                q = [0, 1, 2, 3, 2, 3, 1, 2, 0, 2, 3, 1, 2, 3, 1, 3][s_ % 16] if steps == 16 else [0, 2, 1, 3, 2, 1, 3, 2][s_]
                vel = (0.7 if s_ % 4 == 0 else 0.48) * (0.55 + 0.45 * u if pre else 1)
                bright = 0.25 + 0.25 * u if pre else 0.62 if chorus else 0.48
                add(keys, stereo(pluck(c['arp'][q] + (12 if chorus and s_ % 2 else 0), vel, 1.2, bright),
                                 pan=0.35 * np.sin(1.7 * s_)), t0 + s_ * BAR / steps)
        # baixo
        if last:
            add(bass, stereo(sub_note(c['bass'], 2.6)), t0)
        elif pre or build:
            for e in range(8):
                tt = t_axis(BEAT / 2 * 0.9)
                x = np.tanh(1.6 * np.sin(2 * np.pi * mtof(c['bass'] + 12) * tt)) * np.exp(-tt / 0.09)
                add(bass, stereo(lp(x, 380 + (400 * u if pre else 600 * e / 7)) * (0.55 + 0.1 * (e % 2 == 0))), t0 + e * BEAT / 2)
        elif brk:
            add(bass, stereo(sub_note(c['bass'], BAR + 0.1) * 0.8), t0)
        else:
            add(bass, stereo(sub_note(c['bass'], BEAT * 0.9) * 0.9), t0)
            for q in range(4):  # baixo no contratempo (house)
                tt = t_axis(BEAT * 0.45)
                x = np.tanh(1.4 * np.sin(2 * np.pi * mtof(c['bass'] + 12) * tt)) * np.exp(-tt / 0.12)
                add(bass, stereo(lp(x, 700) * 0.6), t0 + q * BEAT + BEAT / 2)
        # bateria
        if last:
            add(drums, stereo(kick(1.1)), t0)
        elif pre:
            if b == -1:
                add(drums, stereo(kick(0.5)), t0)
                add(drums, stereo(kick(0.55)), t0 + 2 * BEAT)
        elif brk:
            add(drums, stereo(kick(0.65)), t0)
            for e in range(4):
                add(drums, stereo(hat(0.22), pan=0.3), t0 + e * BEAT + BEAT / 2)
        elif build:
            for k in range(24):  # rufo acelerando
                tk = t0 + BAR * (1 - (1 - k / 24) ** 1.6)
                add(drums, stereo(snare(0.12 + 0.5 * k / 23), pan=-0.1), tk)
            add(drums, stereo(kick(0.7)), t0)
        else:
            for q in range(4):
                add(drums, stereo(kick(1.0 if q == 0 else 0.85)), t0 + q * BEAT)
            hsteps = 16 if b >= 4 else 8
            for e in range(hsteps):
                add(drums, stereo(hat(0.42 if e % 2 else 0.26), pan=0.3), t0 + e * BAR / hsteps)
            if b >= 2:
                for q in (1, 3):
                    add(drums, stereo(clap(0.6), pan=-0.05), t0 + q * BEAT)
    # pratos e varreduras
    crash_t = t_axis(3.0)
    crash = hp(RNG.standard_normal(len(crash_t)), 4000, 2) * np.exp(-crash_t / 0.9) * 0.3
    for b in (0, CHORUS, LAST):
        add(fx, stereo(crash), at_bar(b))
    add(fx, stereo(crash * 0.5), at_bar(BREAK))
    for b, L in ((0, BAR), (CHORUS, BAR)):
        sw_t = t_axis(L)
        sw = moving_band_noise(L, lambda v: 500 * (16 ** (v ** 1.7)), 0.5, seed=40 + b)
        add(fx, stereo(sw * (sw_t / L) ** 3 * 0.32), at_bar(b) - L)
    # bombeamento do kick nos pads e no baixo
    duck = np.ones(n)
    for b in list(range(0, BREAK)) + list(range(CHORUS, LAST)):
        for q in range(4):
            i = int(at_bar(b) * SR + q * BEAT * SR)
            k = np.arange(int(0.3 * SR))
            seg = 1 - 0.36 * np.exp(-k / (0.08 * SR))
            j = min(len(seg), n - i)
            duck[i:i + j] = np.minimum(duck[i:i + j], seg[:j])
    pads *= duck[:, None]
    bass *= duck[:, None]
    pads = hp(pads, 160)
    mix = (reverb(pads, HALL, 0.42) * 0.5 + reverb(keys, HALL, 0.3) * 1.0 + reverb(drums, ROOM, 0.16) * 0.5
           + lp(bass, 240) * 0.38 + reverb(fx, HALL, 0.3) * 0.7)
    t1 = intro()
    mix[:len(t1)] += t1
    mix = hp(mix, 28)
    mix = mix - 0.3 * bp(mix, 180, 450) + 1.1 * hp(mix, 2500, 2) + 0.6 * hp(mix, 7000, 2)
    mix = mix[: int(TOTAL * SR)]
    # dinâmica por seção: respiro sério mais baixo, subida volta ao nível, refrão um pouco acima
    tt = np.arange(len(mix)) / SR
    g = np.interp(tt, [0, at_bar(BREAK) - 0.05, at_bar(BREAK) + 0.4, at_bar(BUILD), CTA - 0.02, CTA + 0.05, TOTAL],
                  [1.0, 1.0, 0.62, 0.66, 0.95, 1.12, 1.12])
    mix *= g[:, None]
    fade = np.ones(len(mix))
    f0 = int((TOTAL - 1.4) * SR)
    fade[f0:] = np.linspace(1, 0, len(mix) - f0) ** 2
    mix *= fade[:, None]
    return soft_limit(mix)


# ───────────────────────── efeitos do ElevenLabs ─────────────────────────

# início do trecho útil em cada arquivo (s); None = detectar o ataque
SFX_START = {'check': 0.55, 'pin': None, 'tap': None, 'card': None, 'riser': 0.80, 'whoosh': 0.0,
             'impact': 0.0, 'shimmer': 0.0, 'counter': 0.0, 'drone': 0.0, 'stamp': None}
SFX_HIT_AT_PEAK = {'riser'}   # o golpe do riser é o fim da subida (o pico)


def load_mp3(path):
    import subprocess
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def prep_sfx():
    src = os.path.join(OUT, 'src')
    hits = {}
    for name, start in SFX_START.items():
        x = load_mp3(os.path.join(src, f'{name}.mp3'))
        env = np.convolve(np.abs(x).max(axis=1), np.ones(240) / 240, 'same')
        if start is None:
            start = max(0.0, np.argmax(env > env.max() * 0.1) / SR - 0.01)
        i0 = int(start * SR)
        x, env = x[i0:], env[i0:]
        tail = len(env) - np.argmax(env[::-1] > env.max() * 0.01)
        x = x[: min(len(x), tail + int(0.05 * SR))]
        x[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]
        peak_t = np.argmax(env[: len(x)]) / SR
        hit = peak_t if name in SFX_HIT_AT_PEAK else max(0.0, np.argmax(env > env.max() * 0.3) / SR)
        sf.write(os.path.join(OUT, f'sfx_{name}.wav'), norm(x, 0.89), SR, subtype='PCM_16')
        hits[name] = dict(hit=round(hit, 3), dur=round(len(x) / SR, 3))
    with open(os.path.join(OUT, 'sfx_hits.json'), 'w') as f:
        json.dump(hits, f, indent=1)
    return hits


def main():
    os.makedirs(OUT, exist_ok=True)
    for k, v in prep_sfx().items():
        print(f'sfx_{k}: golpe {v["hit"]} s, {v["dur"]} s')
    sf.write(os.path.join(OUT, 'bgm.wav'), bgm(), SR, subtype='PCM_16')
    print(f'bgm.wav {TOTAL} s, compasso {BAR:.3f} s ({60 / BEAT:.1f} BPM)')


if __name__ == '__main__':
    main()
