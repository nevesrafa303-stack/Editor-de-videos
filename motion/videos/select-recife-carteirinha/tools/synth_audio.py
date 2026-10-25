#!/usr/bin/env python3
"""
Trilha + tratamento dos efeitos da variação "Você tinha Select?" (Select Recife, com locução).

  python -I tools/synth_audio.py   -> assets/audio/bgm.wav e assets/audio/sfx_*.wav

Efeitos: os do ElevenLabs (Sound Effects v2) já usados nos anúncios SulAmérica, guardados em
assets/audio/src/*.mp3; aqui são cortados no ataque, nivelados e convertidos para 48 kHz.
assets/audio/sfx_hits.json guarda, para cada efeito, quanto tempo depois do início do arquivo fica
o golpe.

Trilha sintetizada (a conexão do ElevenLabs deste ambiente não gera música), presa à locução
(assets/voice/vo.words.json): tensão em Lá menor no "Você tinha Select em Recife? Presta
atenção.", subida em Sol, drop em Dó maior no "mas trocar de plano…", groove leve nos hospitais e
no consultor, respiro (piano e batida de coração) no "cada dia sem plano é um dia de risco",
subida de novo, refrão no "Troque de plano" e acorde final em Dó depois do "fala com um
consultor". A grade (DROP, CTA, compasso, fim) vai para tools/grid.json, que tools/build.mjs lê.
"""
import json
import math
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
RNG = np.random.default_rng(20261025)
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


HALL = make_ir(3.6, 3.0, 6000, seed=11)
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
    return lp(out, cutoff, order=4)


def env_asr(n, attack, release):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1) ** 1.5
    r = np.clip((n / SR - t) / release, 0, 1) ** 1.2
    return a * r


def kick(vel=1.0):
    t = t_axis(0.55)
    f = 46 + 70 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = lp(RNG.standard_normal(len(t)) * np.exp(-t / 0.002), 5000) * 0.35
    return (body + click) * vel * 0.9


def heart(vel=0.6):
    """batida de coração: kick grave e abafado, sem clique"""
    t = t_axis(0.45)
    f = 38 + 40 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return lp(np.sin(ph) * np.exp(-t / 0.16), 400) * vel


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


# ───────────────────────── grade da trilha (presa à locução) ─────────────────────────

_WORDS = json.load(open(os.path.join(ROOT, "assets", "voice", "vo.words.json")))


def _norm(w):
    import unicodedata
    w = unicodedata.normalize('NFD', w.lower())
    return ''.join(ch for ch in w if ch.isalnum() and not unicodedata.combining(ch))


def wat(text, after=0.0):
    return next(w['start'] for w in _WORDS if _norm(w['word']) == text and w['start'] >= after - 1e-3)


VO_END = _WORDS[-1]['end']
# DROP = "mas trocar de plano…" (a virada); CTA = "Troque de plano"; respiro (sem groove) no
# "Só não deixa pra depois: cada dia sem plano é um dia de risco pra família."
DROP = wat('mas')
CTA = wat('troque')
N = 11                                                   # compassos entre DROP e CTA (~96 BPM)
BREAK_FROM = wat('so', wat('empresa'))
BAR = (CTA - DROP) / N
BEAT = BAR / 4


def at_bar(b):
    return DROP + b * BAR


PRE = -math.ceil(DROP / BAR - 1e-6)                     # o primeiro compasso já cobre o t = 0
LAST = math.ceil((VO_END - 0.4 - DROP) / BAR)           # acorde final logo depois da última palavra
TOTAL = round(max(VO_END + 2.6, at_bar(LAST) + 2.0), 1)
BREAK_BARS = range(round((BREAK_FROM - DROP) / BAR), N - 1) if BREAK_FROM else range(0)

# tipo de cada compasso: dor/tensão, subida, groove, refrão e acorde final
KIND = {}
for b in range(PRE, LAST + 1):
    KIND[b] = 'pain' if b < -1 else 'build' if b == -1 else 'groove' if b < N else 'chorus' if b < LAST else 'last'
for b in BREAK_BARS:
    KIND[b] = 'pain'
if BREAK_FROM:
    KIND[N - 1] = 'build'

CHORDS = {
    'Am': dict(bass=33, pad=[57, 60, 64, 69], arp=[64, 69, 72, 76]),
    'F': dict(bass=29, pad=[57, 60, 65, 69], arp=[65, 69, 72, 77]),
    'Dm': dict(bass=38, pad=[57, 62, 65, 69], arp=[62, 65, 69, 74]),
    'E': dict(bass=28, pad=[56, 59, 64, 68], arp=[64, 68, 71, 76]),
    'G': dict(bass=31, pad=[55, 59, 62, 67], arp=[62, 67, 71, 74]),
    'C': dict(bass=36, pad=[55, 60, 64, 67], arp=[64, 67, 72, 76]),
}
PROG = {}
for b, k in KIND.items():
    if k == 'pain':
        PROG[b] = ['Am', 'F'][b % 2] if b >= 0 else ['Am', 'F', 'Dm', 'E'][(b - PRE) % 4]
    elif k == 'build':
        PROG[b] = 'G'
    elif k == 'groove':
        PROG[b] = ['C', 'G', 'Am', 'F'][b % 4]
    elif k == 'chorus':
        PROG[b] = ['G', 'F', 'C'][(LAST - 1 - b) % 3]
    else:
        PROG[b] = 'C'
# motivo do piano na dor, por acorde (tempo em batidas dentro do compasso, nota)
MOTIF = {'Am': [(1.0, 76), (2.5, 72)], 'F': [(1.0, 77), (2.5, 72)], 'Dm': [(1.0, 74), (2.5, 69)],
         'E': [(1.0, 71), (2.0, 68), (3.0, 64)]}


def bgm():
    n = int((TOTAL + 4.0) * SR)
    pads, keys, drums, bass, fx = (np.zeros((n, 2)) for _ in range(5))
    for b in range(PRE, LAST + 1):
        c = CHORDS[PROG[b]]
        t0 = at_bar(b)
        k = KIND[b]
        pain, build, last, chorus = k == 'pain', k == 'build', k == 'last', k == 'chorus'
        cutoff = (700 + 120 * (b - PRE) if b < 0 else 1100) if pain else 1000 if build else 4800 if chorus else 3400
        L = BAR + 1.3 + (2.6 if last else 0)
        for i, m in enumerate(c['pad']):
            env = env_asr(int(L * SR), 0.9 if pain else 0.12 if b in (0, N) else 0.4, 1.2 if not last else 2.6)
            p = saw_pad(m, L, cutoff) * env
            if build:  # filtro abrindo até o drop
                p = saw_pad(m, L, 1000) * env * 0.5 + saw_pad(m, L, 3200) * env * np.linspace(0, 0.7, len(env))
            add(pads, stereo(p * (0.75 if pain else 1), pan=(-0.5 + i * 0.33)), t0)
        # teclas
        if pain:
            for m in (c['pad'][0] - 12, c['pad'][1] - 12, c['pad'][2] - 12):
                add(keys, stereo(piano(m, 0.38, 3.2), pan=-0.15), t0)
            for q, m in MOTIF.get(PROG[b], []):
                add(keys, stereo(piano(m, 0.5, 2.8), pan=0.2), t0 + q * BEAT)
        elif build:
            for s_ in range(8):
                add(keys, stereo(pluck(c['arp'][[0, 2, 1, 3, 2, 1, 3, 2][s_]], 0.45 + 0.04 * s_, 1.0, 0.35 + 0.04 * s_),
                                 pan=0.3 * np.sin(1.7 * s_)), t0 + s_ * BAR / 8)
        elif last:
            for m in c['pad'] + [48, 72, 76]:
                add(keys, stereo(piano(m, 0.85, 3.8)), t0)
        else:
            for m in c['pad']:
                add(keys, stereo(piano(m, 0.42 if not chorus else 0.5, 2.6), pan=-0.2), t0)
            steps = 16 if chorus else 8
            for s_ in range(steps):
                q = [0, 1, 2, 3, 2, 3, 1, 2, 0, 2, 3, 1, 2, 3, 1, 3][s_ % 16] if steps == 16 else [0, 2, 1, 3, 2, 1, 3, 2][s_]
                vel = 0.62 if s_ % 4 == 0 else 0.44
                add(keys, stereo(pluck(c['arp'][q] + (12 if chorus and s_ % 2 else 0), vel, 1.2, 0.6 if chorus else 0.5),
                                 pan=0.35 * np.sin(1.7 * s_)), t0 + s_ * BAR / steps)
        # baixo
        if pain:
            add(bass, stereo(sub_note(c['bass'] + 12, BAR + 0.1) * 0.55), t0)
        elif build:
            for e in range(8):
                tt = t_axis(BEAT / 2 * 0.9)
                x = np.tanh(1.6 * np.sin(2 * np.pi * mtof(c['bass'] + 12) * tt)) * np.exp(-tt / 0.09)
                add(bass, stereo(lp(x, 380 + 600 * e / 7) * 0.6), t0 + e * BEAT / 2)
        elif last:
            add(bass, stereo(sub_note(c['bass'], 2.6)), t0)
        else:
            add(bass, stereo(sub_note(c['bass'] + 12, BEAT * 1.8) * 0.9), t0)
            add(bass, stereo(sub_note(c['bass'] + 12, BEAT * 1.8) * 0.75), t0 + 2 * BEAT)
            if chorus:
                for q in range(4):
                    tt = t_axis(BEAT * 0.45)
                    x = np.tanh(1.4 * np.sin(2 * np.pi * mtof(c['bass'] + 24) * tt)) * np.exp(-tt / 0.12)
                    add(bass, stereo(lp(x, 700) * 0.45), t0 + q * BEAT + BEAT / 2)
        # bateria
        if pain:
            for q in (0, 2):  # coração: tum-tum
                add(drums, stereo(heart(0.75)), t0 + q * BEAT)
                add(drums, stereo(heart(0.45)), t0 + q * BEAT + 0.2)
        elif build:
            add(drums, stereo(kick(0.8)), t0)
            for kk in range(28):  # rufo acelerando
                tk = t0 + BAR * (1 - (1 - kk / 28) ** 1.7)
                add(drums, stereo(snare(0.1 + 0.5 * kk / 27), pan=-0.1), tk)
        elif last:
            add(drums, stereo(kick(1.1)), t0)
        else:
            kicks = (0, 1, 2, 3) if chorus else (0, 2, 2.5)
            for q in kicks:
                add(drums, stereo(kick(1.0 if q == 0 else 0.85)), t0 + q * BEAT)
            for e in range(16 if chorus else 8):
                add(drums, stereo(hat(0.4 if e % 2 else 0.24), pan=0.3), t0 + e * BAR / (16 if chorus else 8))
            if b > 0:
                for q in (1, 3):
                    add(drums, stereo(clap(0.55), pan=-0.05), t0 + q * BEAT)
    # pratos e varreduras
    crash_t = t_axis(3.0)
    crash = hp(RNG.standard_normal(len(crash_t)), 4000, 2) * np.exp(-crash_t / 0.9) * 0.3
    for b in (0, N, LAST):
        add(fx, stereo(crash), at_bar(b))
    for b in (0, N):
        sw_t = t_axis(BAR)
        sw = moving_band_noise(BAR, lambda v: 500 * (16 ** (v ** 1.7)), 0.5, seed=40 + b)
        add(fx, stereo(sw * (sw_t / BAR) ** 3 * (0.36 if b == 0 else 0.26)), at_bar(b) - BAR)
    # ar grave no gancho
    air_t = t_axis(BAR * 2)
    air = moving_band_noise(BAR * 2, lambda u: 180 * (3 ** u), 0.6, seed=31) * 0.1 * np.minimum(1, air_t / 0.6)
    add(fx, stereo(air), 0.0)
    # bombeamento do kick nos pads no groove e no refrão
    duck = np.ones(n)
    for b in range(0, LAST):
        if KIND[b] not in ('groove', 'chorus'):
            continue
        for q in range(4):
            i = int((at_bar(b) + q * BEAT) * SR)
            kk = np.arange(int(0.3 * SR))
            seg = 1 - (0.32 if KIND[b] == 'chorus' else 0.22) * np.exp(-kk / (0.08 * SR))
            j = min(len(seg), n - i)
            duck[i:i + j] = np.minimum(duck[i:i + j], seg[:j])
    pads *= duck[:, None]
    pads = hp(pads, 140)
    mix = (reverb(pads, HALL, 0.45) * 0.5 + reverb(keys, HALL, 0.36) * 1.0 + reverb(drums, ROOM, 0.16) * 0.55
           + lp(bass, 240) * 0.4 + reverb(fx, HALL, 0.3) * 0.7)
    mix = hp(mix, 28)
    mix = mix - 0.3 * bp(mix, 180, 450) + 1.0 * hp(mix, 2500, 2) + 0.5 * hp(mix, 7000, 2)
    mix = mix[: int(TOTAL * SR)]
    # dinâmica: gancho um pouco abaixo, subida até o drop, groove e refrão contidos sob a voz, e o
    # acorde final aberto depois que ela termina
    tt = np.arange(len(mix)) / SR
    g = np.interp(tt, [0, max(0.01, at_bar(-1)), at_bar(0) - 0.05, at_bar(0) + 0.6, at_bar(N) - 0.05, at_bar(N) + 0.05,
                       VO_END, VO_END + 0.5, TOTAL],
                  [0.86, 0.86, 1.0, 0.82, 0.82, 0.86, 0.86, 1.12, 1.12])
    mix *= g[:, None]
    fade = np.ones(len(mix))
    f0 = int((TOTAL - 1.4) * SR)
    fade[f0:] = np.linspace(1, 0, len(mix) - f0) ** 2
    mix *= fade[:, None]
    return soft_limit(mix)


# ───────────────────────── efeitos do ElevenLabs ─────────────────────────

# início do trecho útil em cada arquivo (s); None = detectar o ataque
SFX_START = {'check': 0.55, 'tap': None, 'card': None, 'riser': 0.80, 'whoosh': 0.0,
             'impact': 0.0, 'shimmer': 0.0, 'counter': 0.0, 'stamp': None,
             'clock': None, 'pop': None, 'chime': None}
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
    grid = dict(drop=round(DROP, 3), cta=round(CTA, 3), bar=round(BAR, 4), n=N, pre=PRE, last=LAST,
                fin=round(at_bar(LAST), 3), total=TOTAL, kinds={str(b): KIND[b] for b in sorted(KIND)})
    json.dump(grid, open(os.path.join(ROOT, 'tools', 'grid.json'), 'w'), indent=1)
    print(f'bgm.wav {TOTAL} s, compasso {BAR:.3f} s ({60 / BEAT:.1f} BPM)')


if __name__ == '__main__':
    main()
