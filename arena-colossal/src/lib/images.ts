import 'server-only';

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Inventario das imagens realmente presentes em `/public/images`.
 *
 * POR QUE ISSO EXISTE: o site nasce sem as fotos da Arena. Se cada moldura
 * tentasse carregar um arquivo inexistente, o navegador dispararia dezenas de
 * requisicoes com erro 400/404 — console poluido, banda desperdicada e um
 * flash entre a tentativa e o placeholder.
 *
 * Com este inventario, a moldura ja sabe, no primeiro render do servidor, se a
 * foto existe. Nenhuma requisicao inutil sai do navegador, e basta soltar o
 * arquivo na pasta certa para a foto real assumir.
 */

const PUBLIC_IMAGES = join(process.cwd(), 'public', 'images');

let cache: Set<string> | null = null;

function scan(directory: string, prefix: string, found: Set<string>): void {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    // A pasta pode nem existir em um checkout novo.
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const publicPath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      scan(join(directory, entry.name), publicPath, found);
    } else if (/\.(avif|webp|jpe?g|png|gif|svg)$/i.test(entry.name)) {
      found.add(publicPath);
    }
  }
}

export function getAvailableImages(): string[] {
  // Em desenvolvimento nao cacheamos: a foto nova aparece no proximo refresh.
  if (cache !== null && process.env.NODE_ENV === 'production') {
    return [...cache];
  }

  const found = new Set<string>();
  scan(PUBLIC_IMAGES, '/images', found);
  cache = found;

  return [...found];
}
