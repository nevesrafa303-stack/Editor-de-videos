import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mentoria RISE",
    short_name: "RISE",
    description: "Mentoria anual de aceleração para donos de agência, com o Hermano.",
    start_url: "/",
    display: "browser",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
