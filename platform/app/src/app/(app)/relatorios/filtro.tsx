import { Button, Field, Input, Select } from "@/ui";
import type { UnitOption } from "@/modules/auth/units";

/**
 * Filtro do painel.
 *
 * `method="get"` de propósito: o período vira endereço, e o endereço vira link.
 * Um relatório que não dá para mandar pronto para a contadora é um relatório
 * que vira captura de tela — e captura de tela ninguém confere.
 *
 * Sem JavaScript e sem estado: o formulário recarrega a página, que é o que
 * uma mudança de período é.
 */
export function Filtro({
  de,
  ate,
  unitId,
  unidades,
}: {
  de: string;
  ate: string;
  unitId: string | null;
  unidades: UnitOption[];
}) {
  return (
    <form
      method="get"
      aria-label="Período do relatório"
      className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface px-5 py-4 shadow-xs"
    >
      <Field label="De" className="w-40">
        <Input name="de" type="date" defaultValue={de} required />
      </Field>

      <Field label="Até" className="w-40">
        <Input name="ate" type="date" defaultValue={ate} required />
      </Field>

      {unidades.length > 1 ? (
        <Field label="Unidade" className="w-56">
          <Select name="unidade" defaultValue={unitId ?? ""}>
            <option value="">Todas as unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Button type="submit" variant="secondary" className="mb-0.5">
        Aplicar
      </Button>
    </form>
  );
}
