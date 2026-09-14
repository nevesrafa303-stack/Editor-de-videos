import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // O repositorio tem outros package.json (pipeline de video, prototipo v1);
  // sem isto o Turbopack elege a raiz errada como workspace.
  turbopack: { root: path.resolve(import.meta.dirname) },
  // pg e bcryptjs sao nativos do servidor: nao devem entrar no bundle do cliente.
  serverExternalPackages: ["pg", "bcryptjs"],
};

export default config;
