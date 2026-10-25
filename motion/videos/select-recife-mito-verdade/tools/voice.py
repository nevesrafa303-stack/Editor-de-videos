#!/usr/bin/env python3
"""
Locução HeyGen da variação "Mito ou verdade" (Select Recife) em UMA tomada contínua.

  python3 -I tools/voice.py   -> assets/voice/vo.wav + assets/voice/vo.words.json

Uma fala só soa mais humana; depois os silêncios entre palavras são encurtados (no máximo
GAP_COMMA dentro da frase e GAP_SENTENCE entre frases; GAP_AFTER marca as pausas de
impacto, contadas por ocorrência da palavra). Os tempos de cada palavra (word_timestamps da
HeyGen) guiam as animações e a trilha.

As observações obrigatórias de segurança comercial NÃO entram na fala (só por escrito, ver
CLAUDE.md da raiz). ElevenLabs sem créditos nesta data; por isso a HeyGen.

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
VOICE = '6d282a9f296746568da9d65586935dba'  # Sofia Brazil - Excited (pt-BR nativa, feminina, animada)
SPEED = 1.12
LEAD_IN = 0.12
GAP_COMMA = 0.12
GAP_SENTENCE = 0.24

# pausas (s) depois de cada frase que marca virada de cena: (palavra, n-ésima ocorrência) -> pausa
GAP_AFTER = {
    ('Recife.', 0): 0.22,
    ('verdade?', 0): 0.55,
    ('hospital.', 0): 0.3,
    ('Mito!', 0): 0.32,
    ('Recife.', 1): 0.5,
    ('hospitais.', 0): 0.3,
    ('Mito!', 1): 0.32,
    ('confiança.', 0): 0.5,
    ('hospital?', 0): 0.3,
    ('Verdade!', 0): 0.45,
    ('saiu.', 0): 0.38,
    ('fica.', 0): 0.42,
}

# só o conteúdo do brief "A saída da Select de Recife" em formato de quiz (a 2ª "mito" vem da
# observação obrigatória "A rede credenciada pode variar conforme plano contratado."), mais o CTA
# do formulário dos anúncios; sem preço
TEXT = (
    'A Select saiu de Recife. Mito ou verdade? '
    'Se a Select saiu, eu perdi o meu hospital. Mito! '
    'Existem planos com atendimento no Real Hospital Português, no Santa Joana '
    'e em outros hospitais de referência do Recife. '
    'Todo plano tem os mesmos hospitais. Mito! '
    'A rede muda de um plano pro outro. Por isso o consultor compara as operadoras e encontra o plano '
    'que mantém os seus hospitais de confiança. '
    'Dá pra trocar de plano sem trocar de hospital? Verdade! '
    'A Select saiu. O Português fica. '
    'Toca no botão aqui embaixo e preenche o formulário.'
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
    seen = {}
    nth = []
    for w in words:
        nth.append(seen.get(w['word'], 0))
        seen[w['word']] = nth[-1] + 1
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
            target = GAP_AFTER.get((prev['word'], nth[i - 1]))
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
