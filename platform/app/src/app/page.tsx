import { redirect } from "next/navigation";
import { currentSession } from "@/server/next/session";

export default async function Home() {
  redirect((await currentSession()) ? "/pacientes" : "/entrar");
}
