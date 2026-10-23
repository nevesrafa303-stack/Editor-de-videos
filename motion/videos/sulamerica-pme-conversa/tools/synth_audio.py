#!/usr/bin/env python3
"""
Trilha + tratamento dos efeitos da variação "conversa em áudios" do anúncio SulAmérica PME (3 vidas,
R$ 1.770,30 com IOF): a cliente pergunta por áudio e o consultor responde.

  python -I tools/synth_audio.py   -> assets/audio/bgm.wav e assets/audio/sfx_*.wav

Efeitos: gerados no ElevenLabs (Sound Effects v2) e guardados em assets/audio/src/*.mp3; aqui são
cortados no ataque, nivelados e convertidos para 48 kHz. assets/audio/sfx_hits.json guarda, para
cada efeito, quanto tempo depois do início do arquivo fica o golpe.

Trilha sintetizada (a conexão do ElevenLabs deste ambiente não gera música), lo-fi leve, por baixo
da conversa e presa a ela (assets/voice/vo.lines.json e vo.words.json):
DROP = primeiro áudio do consultor, CTA = a última resposta dele ("Preenche o formulário…"),
11 compassos entre os dois (~97 BPM).
  -4..-1   piano sozinho, acordes abertos em Ré (a pergunta da cliente)
  0–6      groove leve: bumbo do lo-fi, estalo no 2 e no 4, chimbal com swing, baixo, piano (oferta)
  7–9      + palmas e dedilhado (idades e benefícios)
  10       respiro em Lá, só piano e subida ("Amei! E como é que eu faço?")
  11–13    refrão do CTA, com sinos (contido sob a última fala, cresce quando ela termina)
  14       acorde final em Ré, soa até o fim
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

VOICE = os.path.join(ROOT, "assets", "voice")
_LINES = json.load(open(os.path.join(VOICE, "vo.lines.json")))
_WORDS = json.load(open(os.path.join(VOICE, "vo.words.json")))
DROP = next(l["start"] for l in _LINES if l["spk"] == "consultor")
CTA = next(w["start"] for w in _WORDS if w["line"] == "k3")
BAR = (CTA - DROP) / 11
BEAT = BAR / 4
TOTAL = round(_LINES[-1]["end"] + 2.6, 1)
PRE, BREAK, CHORUS, LAST = -4, 10, 11, 14
SW = 0.16                    # swing das colcheias


def at_bar(b):
    return DROP + b * BAR


CHORDS = {
    'D': dict(bass=38, pad=[57, 61, 62, 66], arp=[62, 66, 69, 73]),
    'Bm': dict(bass=35, pad=[57, 59, 62, 66], arp=[59, 62, 66, 69]),
    'G': dict(bass=31, pad=[55, 59, 62, 66], arp=[59, 62, 66, 71]),
    'A': dict(bass=33, pad=[57, 61, 64, 69], arp=[61, 64, 69, 73]),
}
PROG = {-4: 'D', -3: 'Bm', -2: 'G', -1: 'A', 0: 'D', 1: 'Bm', 2: 'G', 3: 'A', 4: 'D', 5: 'Bm', 6: 'G', 7: 'A',
        8: 'D', 9: 'Bm', 10: 'A', 11: 'D', 12: 'G', 13: 'A', 14: 'D'}


def swing(e):
    """instante da colcheia e (0..7) no compasso, com swing"""
    return e * BEAT / 2 + (SW * BEAT / 2 if e % 2 else 0)


def bgm():
    n = int((TOTAL + 4.0) * SR)
    pads, keys, drums, bass, fx = (np.zeros((n, 2)) for _ in range(5))
    for b in range(PRE, LAST + 1):
        c = CHORDS[PROG[b]]
        t0 = at_bar(b)
        intro, brk, last = b < 0, b == BREAK, b == LAST
        chorus = CHORUS <= b < LAST
        L = BAR + 1.2 + (2.6 if last else 0)
        # pad bem baixo, só cola
        if not intro:
            for i, m in enumerate(c['pad']):
                p = saw_pad(m, L, 1400 if brk else 2200 if chorus else 1700) * env_asr(int(L * SR), 0.6, 1.2)
                add(pads, stereo(p, pan=(-0.5 + i * 0.33)), t0)
        # piano: acorde aberto no 1, notas soltas no resto (como quem toca devagar)
        vel = 0.62 if intro or brk else 0.5
        for i, m in enumerate([c['bass'] + 12] + c['pad']):
            add(keys, stereo(piano(m, vel * (0.85 if i else 1), 3.4 if last else 2.6), pan=-0.2 + 0.1 * i), t0 + 0.012 * i)
        if not last:
            for e, q in ((3, 1), (5, 2), (6, 3)) if intro or brk else ((3, 1), (6, 2)):
                add(keys, stereo(piano(c['arp'][q], vel * 0.6, 1.8), pan=0.25), t0 + swing(e))
        if b >= 7 and not brk and not last:   # dedilhado nas idades/benefícios e no refrão
            for s_ in range(8):
                q = [0, 2, 1, 3, 2, 1, 3, 2][s_]
                add(keys, stereo(pluck(c['arp'][q] + 12, 0.32 if s_ % 2 else 0.42, 1.0, 0.55 if chorus else 0.4),
                                 pan=0.35 * np.sin(1.7 * s_)), t0 + swing(s_))
        if chorus:                            # sinos no refrão
            for s_, q in ((0, 3), (3, 2), (6, 1)):
                add(keys, stereo(bell(c['arp'][q] + 12, 0.5), pan=-0.3), t0 + swing(s_))
        # baixo
        if last:
            add(bass, stereo(sub_note(c['bass'], 2.6)), t0)
        elif not intro and not brk:
            add(bass, stereo(sub_note(c['bass'], BEAT * 1.6) * 0.9), t0)
            add(bass, stereo(sub_note(c['bass'] + (7 if b % 2 else 12), BEAT * 0.8) * 0.6), t0 + swing(3))
            add(bass, stereo(sub_note(c['bass'], BEAT * 1.2) * 0.75), t0 + 2 * BEAT)
        elif brk:
            add(bass, stereo(sub_note(c['bass'], BAR) * 0.6), t0)
        # bateria lo-fi
        if last:
            add(drums, stereo(kick(0.9)), t0)
        elif not intro and not brk:
            for tk, v in ((0, 0.85), (swing(3), 0.55), (2 * BEAT, 0.75)):
                add(drums, stereo(kick(v)), t0 + tk)
            for q in (1, 3):
                add(drums, stereo(snare(0.42), pan=-0.05), t0 + q * BEAT)
                if b >= 7:
                    add(drums, stereo(clap(0.4), pan=0.05), t0 + q * BEAT + 0.008)
            for e in range(8):
                add(drums, stereo(hat(0.36 if e % 2 else 0.22), pan=0.3), t0 + swing(e))
        elif brk:   # subida até o CTA
            for k in range(16):
                tk = t0 + BAR * (1 - (1 - k / 16) ** 1.5)
                add(drums, stereo(snare(0.08 + 0.32 * k / 15), pan=-0.1), tk)
    # varredura e prato no CTA, prato suave no drop
    crash_t = t_axis(3.0)
    crash = hp(RNG.standard_normal(len(crash_t)), 4000, 2) * np.exp(-crash_t / 0.9) * 0.1
    add(fx, stereo(crash * 0.6), at_bar(0))
    add(fx, stereo(crash), at_bar(CHORUS))
    sw_t = t_axis(BAR)
    sw = moving_band_noise(BAR, lambda v: 500 * (16 ** (v ** 1.7)), 0.5, seed=44)
    add(fx, stereo(sw * (sw_t / BAR) ** 3 * 0.28), at_bar(BREAK))
    pads = hp(pads, 160)
    mix = (reverb(pads, HALL, 0.42) * 0.32 + reverb(keys, HALL, 0.26) * 1.0 + reverb(drums, ROOM, 0.12) * 0.55
           + lp(bass, 220) * 0.36 + reverb(fx, HALL, 0.3) * 0.6)
    mix = hp(mix, 28)
    mix = lp(mix, 9000)          # cor lo-fi: topo mais macio
    mix = mix[: int(TOTAL * SR)]
    tt = np.arange(len(mix)) / SR
    # refrão contido enquanto o consultor ainda fala; cresce depois da última palavra
    vo_end = _LINES[-1]["end"]
    g = np.interp(tt, [0, at_bar(BREAK) - 0.05, at_bar(BREAK) + 0.3, CTA - 0.02, CTA + 0.05, vo_end, vo_end + 0.5, TOTAL],
                  [1.0, 1.0, 0.8, 0.85, 0.72, 0.72, 1.12, 1.12])
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
             'pop': None, 'boing': None, 'chime': None}
SFX_MAXLEN = {'chime': 0.5}   # notificação só com as duas primeiras notas (a terceira cairia sobre a fala)
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
        x = x[: min(len(x), tail + int(0.05 * SR), int(SFX_MAXLEN.get(name, 99) * SR))]
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
