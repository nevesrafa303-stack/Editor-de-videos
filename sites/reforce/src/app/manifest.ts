import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reforce Consultoria",
    short_name: "Reforce",
    description: "Planejamento que chega até a execução: projetos de capital, paradas e infraestrutura.",
    start_url: "/",
    display: "browser",
    background_color: "#011417",
    theme_color: "#011417",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
