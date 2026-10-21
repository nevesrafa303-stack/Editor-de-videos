import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LAKS Company",
    short_name: "LAKS",
    description: "Aceleradora de marketing e vendas para corretoras de planos de saúde e seguros.",
    start_url: "/",
    display: "browser",
    background_color: "#020202",
    theme_color: "#020202",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
