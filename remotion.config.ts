import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(18);
Config.setOverwriteOutput(true);
// Chromium fica no container em /opt/pw-browsers; se ausente, o Remotion baixa o seu.
Config.setChromiumOpenGlRenderer('angle-egl');
