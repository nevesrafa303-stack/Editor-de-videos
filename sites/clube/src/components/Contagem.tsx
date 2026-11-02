"use client";

import { useEffect } from "react";
import { iniciarContagem } from "@/lib/contagem";

export function Contagem() {
  useEffect(() => iniciarContagem(), []);
  return null;
}
