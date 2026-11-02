"use client";

import { useEffect } from "react";
import { iniciarVideoEvento } from "@/lib/video-evento";

// Liga o vídeo da abertura (a lógica fica em src/lib/video-evento.ts, usada também pela prévia).
export function VideoEvento() {
  useEffect(() => iniciarVideoEvento(), []);
  return null;
}
