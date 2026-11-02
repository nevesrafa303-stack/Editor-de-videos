"use client";

import { useEffect } from "react";
import { iniciarAnimacoes, iniciarRolagemSuave } from "@/lib/motion";

export function Motion() {
  useEffect(() => iniciarRolagemSuave(), []);
  useEffect(() => iniciarAnimacoes(), []);
  return null;
}
