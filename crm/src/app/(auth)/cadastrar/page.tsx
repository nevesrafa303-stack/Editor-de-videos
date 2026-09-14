import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { SignupForm } from "./form";

export const metadata: Metadata = { title: "Cadastrar clínica" };

export default async function SignupPage() {
  if (await getSession()) redirect("/painel");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Cadastre sua clínica
      </h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        Sua conta já vem com salas e um catalogo inicial de procedimentos.
      </p>

      <SignupForm />

      <p className="mt-8 text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
