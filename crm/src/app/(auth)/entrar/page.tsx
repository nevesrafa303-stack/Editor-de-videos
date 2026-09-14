import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getSession()) redirect("/painel");
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Entrar na clínica
      </h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        Use o e-mail cadastrado pela sua clínica.
      </p>

      <LoginForm next={next} />

      <p className="mt-8 text-sm text-slate-500">
        Ainda nao tem conta?{" "}
        <Link href="/cadastrar" className="font-medium text-brand-700 hover:underline">
          Cadastre sua clínica
        </Link>
      </p>
    </div>
  );
}
