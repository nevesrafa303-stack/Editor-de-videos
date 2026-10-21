#!/usr/bin/env python3
"""
Locução HeyGen do filme Amil 50% ("Metade.") em UMA tomada contínua.

  python3 -I tools/voice.py   -> assets/voice/vo.wav + assets/voice/vo.words.json

Uma fala só soa mais humana; depois os silêncios entre palavras são encurtados (no máximo
GAP_COMMA dentro da frase e GAP_SENTENCE entre frases; GAP_AFTER marca as pausas de
impacto). Os tempos de cada palavra (word_timestamps da HeyGen) guiam as animações.

A chave da HeyGen nunca passa por aqui: o segredo de rede do ambiente injeta o
cabeçalho X-Api-Key nas chamadas a api.heygen.com (o valor abaixo é um marcador).
Cache em assets/voice/vo.json: só gera de novo se texto, voz ou velocidade mudarem.
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'voice')
API = 'https://api.heygen.com/v3/voices/speech'
VOICE = '0edbc867be6f48c5be8ff8b0fbca0802'  # Sofia Brazil - Friendly (pt-BR nativa, feminina, calorosa)
SPEED = 1.1
LEAD_IN = 0.12
GAP_COMMA = 0.09
GAP_SENTENCE = 0.2

# pausas (s) depois das frases que marcam virada de cena; o resto fica curto
GAP_AFTER = {
    'Metade.': 0.42,
    'CNPJ.': 0.3,
    'mensalidade.': 0.35,
    'vidas.': 0.3,
    'Black.': 0.32,
    'Fleury.': 0.4,
    'outubro.': 0.45,
    'online.': 0.32,
}

# só falas aprovadas: peças da campanha Amil 50% (outubro/2026), regras da Amil para SP e RJ
# e a copy das peças Amil Black (acesso ao Albert Einstein, Sírio-Libanês e Fleury)
TEXT = (
    'Metade. '
    'É isso que você paga nas duas primeiras faturas do plano de saúde Amil para CNPJ. '
    'Cinquenta por cento de desconto na primeira e na segunda mensalidade. '
    'Para empresas de São Paulo e do Rio, de duas a noventa e nove vidas. '
    'Nas linhas Bronze, Prata, Ouro, Platinum e Amil Black. '
    'E no Amil Black, você tem acesso ao Albert Einstein, ao Sírio-Libanês e ao Fleury. '
    'Mas atenção: a oferta vale só para contratos fechados em outubro. '
    'Faça agora sua simulação gratuita, cem por cento online. '
    'Toque no botão e fale com um especialista.'
)


def curl(args):
    r = subprocess.run(['curl', '-sS', '--fail-with-body', '-m', '180', *args], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'curl falhou ({r.returncode}): {r.stderr.strip() or r.stdout[:300]}')
    return r.stdout


def speech():
    cache = os.path.join(OUT, 'vo.json')
    req = {'text': TEXT, 'voice_id': VOICE, 'speed': SPEED, 'language': 'pt'}
    if os.path.exists(cache):
        c = json.load(open(cache))
        if c.get('request') == req:
            return c
    body = json.loads(curl(['-X', 'POST', API, '-H', 'X-Api-Key: proxy-injected',
                            '-H', 'Content-Type: application/json', '-d', json.dumps(req)]))
    data = body.get('data', body)
    if not data.get('audio_url'):
        sys.exit(f'HeyGen não devolveu audio_url: {json.dumps(body)[:300]}')
    c = {'request': req, 'response': data}
    json.dump(c, open(cache, 'w'), ensure_ascii=False, indent=1)
    return c


def tighten(y, sr, words):
    """encurta os silêncios entre palavras; devolve áudio e palavras remapeadas"""
    out, new_words, cursor, t_out = [], [], 0, 0.0
    fade = int(0.006 * sr)
    for i, w in enumerate(words):
        s, e = int(w['start'] * sr), int(w['end'] * sr)
        if i == 0:
            s0 = max(0, s - int(0.03 * sr))
            out.append(y[s0:s])
            t_out += (s - s0) / sr
        else:
            prev = words[i - 1]
            gap = w['start'] - prev['end']
            target = GAP_AFTER.get(prev['word'])
            limit = target if target else (GAP_SENTENCE if prev['word'][-1:] in '.?!:' else GAP_COMMA)
            pe = int(prev['end'] * sr)
            if gap > limit:
                keep = int(limit * sr / 2)
                a = y[pe:pe + keep].copy()
                b = y[s - keep:s].copy()
                if fade and len(a) > fade and len(b) > fade:
                    a[-fade:] *= np.linspace(1, 0, fade)
                    b[:fade] *= np.linspace(0, 1, fade)
                seg = np.concatenate([a, b])
            elif target and gap < target:
                # pausa marcada mais longa que a original: completa com silêncio
                seg = np.concatenate([y[pe:s], np.zeros(int((target - gap) * sr))])
            else:
                seg = y[pe:s]
            out.append(seg)
            t_out += len(seg) / sr
        out.append(y[s:e])
        new_words.append({'word': w['word'], 'start': round(t_out, 3), 'end': round(t_out + (e - s) / sr, 3)})
        t_out += (e - s) / sr
    tail = y[int(words[-1]['end'] * sr):int(words[-1]['end'] * sr) + int(0.25 * sr)]
    out.append(tail)
    return np.concatenate(out), new_words


def main():
    os.makedirs(OUT, exist_ok=True)
    c = speech()
    raw = os.path.join(OUT, 'vo.raw.wav')
    curl(['-o', raw + '.src', c['response']['audio_url']])
    subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-y', '-i', raw + '.src', '-ac', '1', '-ar', '48000', raw],
                   check=True)
    os.remove(raw + '.src')
    y, sr = sf.read(raw)
    words = [w for w in c['response']['word_timestamps'] if not w['word'].startswith('<')]
    y2, words2 = tighten(y, sr, words)
    lead = np.zeros(int(LEAD_IN * sr))
    y2 = np.concatenate([lead, y2])
    for w in words2:
        w['start'] = round(w['start'] + LEAD_IN, 3)
        w['end'] = round(w['end'] + LEAD_IN, 3)
    tmp = os.path.join(OUT, 'vo.tight.wav')
    sf.write(tmp, y2.astype(np.float32), sr, subtype='PCM_24')
    pre = 'highpass=f=70'
    probe = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', tmp, '-af',
                            f'{pre},loudnorm=I=-16:TP=-2:LRA=7:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
    af = (f"{pre},loudnorm=I=-16:TP=-2:LRA=7:linear=true:measured_I={m['input_i']}:"
          f"measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    dst = os.path.join(OUT, 'vo.wav')
    subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-y', '-i', tmp, '-af', af, '-ar', '48000', '-ac', '1', dst],
                   check=True)
    os.remove(tmp)
    json.dump(words2, open(os.path.join(OUT, 'vo.words.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'engine={c["response"].get("engine")}  original {len(y) / sr:.2f}s -> {len(y2) / sr:.2f}s, {len(words2)} palavras')
    for w in words2:
        print(f'{w["start"]:6.2f} {w["end"]:6.2f} {w["word"]}')


if __name__ == '__main__':
    main()
