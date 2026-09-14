import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // O repositorio tem outro package.json na raiz (pipeline de video); sem isto
  // o Turbopack elege a raiz errada como workspace.
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default config;
