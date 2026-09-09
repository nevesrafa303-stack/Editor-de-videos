/**
 * A composicao le SEMPRE src/generated/data.json.
 * Esse arquivo e reescrito por scripts/04_build_edl.mjs a partir da EDL +
 * transcricao. O que esta committado e um placeholder vazio, para o studio e o
 * typecheck rodarem antes de existir um bruto.
 */
import raw from './generated/data.json';
import type {ReelData} from './types';

export const reelData = raw as unknown as ReelData;
