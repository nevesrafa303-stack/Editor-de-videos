# Monta o corte do "Ads 01 · reajuste": lê tools/cuts.json e gera o filtro do ffmpeg (vídeo SDR + áudio bruto),
# mantendo vídeo e áudio em sincronia.
#   - cada trecho {a, b} vem do vídeo original (s), alinhado aos quadros de 30 fps;
#   - gain: ganho em dB do trecho (as tomadas foram gravadas com volumes diferentes); gain2: [t, dB] troca o ganho
#     no meio do trecho, na troca de tomada;
#   - mute: trechos [t0, t1] em que só o áudio fica mudo (respiração, começo de outra palavra);
#   - fade_out_at: o áudio some em 25 ms até esse ponto (corte no meio da frase);
#   - freeze_until: o vídeo segura o 1º quadro da tomada seguinte até esse ponto (o áudio entra antes do corte);
#   - tail_freeze: o último quadro fica parado no fim (coberto pelo cartão final).
#   python3 -I tools/assemble.py tools/cuts.json <sdr_full.mp4> <raw48.wav> assets/video/src.mp4 <voice_cut_raw.wav>
import json, sys, subprocess
cfg = json.load(open(sys.argv[1])); vsrc, asrc, vout, aout = sys.argv[2:6]
fps = cfg['fps']; snap = lambda t: round(round(t*fps)/fps, 6)
vf, af, labels = [], [], []
tl = 0.0; table = []
for i, s in enumerate(cfg['segments']):
    a, b = snap(s['a']), snap(s['b']); d = b - a
    fz = s.get('freeze_until')
    if fz:
        fz = snap(fz)
        vf.append(f"[0:v]trim=start={fz}:end={b},setpts=PTS-STARTPTS,tpad=start_duration={fz-a:.6f}:start_mode=clone[v{i}]")
    else:
        vf.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]")
    ch = [f"atrim=start={a}:end={b}", "asetpts=PTS-STARTPTS"]
    g = s.get('gain', 0)
    if 'gain2' in s:
        t2, g2 = s['gain2']; ch.append(f"volume=volume='if(lt(t,{t2-a:.4f}),{10**(g/20):.4f},{10**(g2/20):.4f})':eval=frame")
    else:
        ch.append(f"volume={10**(g/20):.4f}")
    for m0, m1 in s.get('mute', []):
        ch.append(f"volume=0:enable='between(t,{m0-a:.4f},{m1-a:.4f})'")
    ch.append("afade=t=in:d=0.006")
    fo = s.get('fade_out_at')
    if fo: ch.append(f"afade=t=out:st={fo-a-0.025:.4f}:d=0.025")
    else: ch.append(f"afade=t=out:st={d-0.008:.4f}:d=0.008")
    af.append(f"[1:a]{','.join(ch)}[a{i}]")
    labels.append(f"[v{i}][a{i}]")
    table.append({'id': s['id'], 'src_in': a, 'src_out': b, 'out_in': round(tl, 4), 'out_out': round(tl + d, 4)})
    tl += d
n = len(cfg['segments']); tf = cfg.get('tail_freeze', 0)
fc = ';'.join(vf + af) + ';' + ''.join(labels) + f"concat=n={n}:v=1:a=1[vc][ac]"
fc += f";[vc]tpad=stop_duration={tf}:stop_mode=clone[vo];[ac]apad=pad_dur={tf}[ao]"
cmd = ['ffmpeg','-v','error','-y','-i',vsrc,'-i',asrc,'-filter_complex',fc,'-map','[vo]','-c:v','libx264','-preset','slow','-crf','22','-tune','film','-g','15','-keyint_min','15','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-an',vout,'-map','[ao]','-c:a','pcm_s24le','-ar','48000',aout]
subprocess.run(cmd, check=True)
json.dump({"segments": table, "total": round(tl + tf, 4)}, open(sys.argv[1].replace("cuts.json", "timeline.json"), "w"), indent=1)
print(json.dumps(table, indent=0)); print('total', tl + tf)
