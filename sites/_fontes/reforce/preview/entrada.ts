// Script da prévia em arquivo único (sem servidor, sem React). Usa as mesmas funções do site:
// cabeçalho e menu (lib/cabecalho.ts), interações (lib/interacoes.ts) e animações (lib/motion.ts).
import { iniciarCabecalho, iniciarMenu } from "../../../reforce/src/lib/cabecalho";
import { iniciarInteracoes } from "../../../reforce/src/lib/interacoes";
import { iniciarAnimacoes, iniciarRolagemSuave } from "../../../reforce/src/lib/motion";

// A política de privacidade não está na prévia.
document.querySelectorAll<HTMLAnchorElement>("a[data-previa-link]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    window.alert("Na prévia, esta página não está incluída. No site publicado ela abre normalmente.");
  }),
);

iniciarCabecalho();
iniciarMenu();
iniciarInteracoes();
iniciarRolagemSuave();
iniciarAnimacoes();
