#!/usr/bin/env python3
"""
Locução HeyGen do filme Aport Seguros — uma fala por cena.

  python3 tools/voice.py        -> assets/voice/0N.wav (+ 0N.json com word_timestamps)

Voz: "Sofia Brazil - Friendly" (feminina, pt-BR). A chave da HeyGen nunca passa
por aqui: o segredo de rede do ambiente injeta o cabeçalho X-Api-Key em toda
chamada a api.heygen.com (o valor abaixo é só um marcador que o proxy troca).

Cada fala é cacheada em assets/voice/0N.json; só gera de novo (e gasta crédito)
se o texto, a voz ou a velocidade mudarem. Depois de baixar: 0.3 s de entrada
(o tempo que as animações usam), passa-altas em 70 Hz e loudness em -16 LUFS.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'voice')
API = 'https://api.heygen.com/v3/voices/speech'
VOICE = '0edbc867be6f48c5be8ff8b0fbca0802'  # Sofia Brazil - Friendly
LEAD_IN = 0.3

LINES = [
    (1, 1.0, 'Sua empresa merece um plano de saúde à altura.'),
    (2, 1.0, 'Na Aport Seguros, o seu CNPJ tem plano de saúde a partir de três vidas.'),
    (3, 1.05, 'Bradesco Saúde: ampla rede, telemedicina e suporte para TEA. A partir de mil seiscentos e noventa e sete reais e noventa.'),
    (4, 1.05, "SulAmérica: atendimento na Rede D'Or e plano odontológico. A partir de mil e catorze reais e noventa e sete."),
    (5, 1.05, 'Porto: odontológico, seguro de vida e serviços ocupacionais. A partir de novecentos e quarenta e dois reais e oitenta.'),
    (6, 1.0, 'Faça agora a sua simulação gratuita, cem por cento online. Aport Seguros.'),
]


def curl(args):
    r = subprocess.run(['curl', '-sS', '--fail-with-body', '-m', '180', *args], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'curl falhou ({r.returncode}): {r.stderr.strip() or r.stdout[:300]}')
    return r.stdout


def speech(n, speed, text):
    cache = os.path.join(OUT, f'{n:02d}.json')
    req = {'text': text, 'voice_id': VOICE, 'speed': speed, 'language': 'pt'}
    if os.path.exists(cache):
        c = json.load(open(cache))
        if c.get('request') == req:
            return c
    body = json.loads(curl(['-X', 'POST', API, '-H', 'X-Api-Key: proxy-injected',
                            '-H', 'Content-Type: application/json', '-d', json.dumps(req)]))
    data = body.get('data', body)
    if not data.get('audio_url'):
        sys.exit(f'HeyGen não devolveu audio_url para a cena {n}: {json.dumps(body)[:300]}')
    c = {'request': req, 'response': data}
    json.dump(c, open(cache, 'w'), ensure_ascii=False, indent=1)
    return c


def loudnorm(src, dst):
    pre = f'adelay={int(LEAD_IN * 1000)}:all=1,highpass=f=70'
    probe = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af',
                            f'{pre},loudnorm=I=-16:TP=-2:LRA=7:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
    af = (f"{pre},loudnorm=I=-16:TP=-2:LRA=7:linear=true:measured_I={m['input_i']}:"
          f"measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-y', '-i', src, '-af', af,
                    '-ar', '48000', '-ac', '1', dst], check=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    for n, speed, text in LINES:
        c = speech(n, speed, text)
        raw = os.path.join(OUT, f'{n:02d}.raw.wav')
        if not os.path.exists(raw):
            curl(['-o', raw, c['response']['audio_url']])
        dst = os.path.join(OUT, f'{n:02d}.wav')
        loudnorm(raw, dst)
        print(f'cena {n}: {c["response"]["duration"]:.2f}s de fala -> assets/voice/{n:02d}.wav')


if __name__ == '__main__':
    main()
