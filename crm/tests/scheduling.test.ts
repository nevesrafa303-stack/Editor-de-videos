import { describe, expect, it } from "vitest";
import {
  addMinutes,
  findConflicts,
  freeSlots,
  overlaps,
  startOfWeek,
  type BusyBlock,
} from "@/domain/scheduling";

const at = (hour: number, minute = 0) => new Date(2026, 8, 14, hour, minute);

describe("overlaps", () => {
  it("detecta sobreposicao parcial", () => {
    expect(
      overlaps(
        { startsAt: at(9), endsAt: at(10) },
        { startsAt: at(9, 30), endsAt: at(10, 30) },
      ),
    ).toBe(true);
  });

  it("horarios encostados não se sobrepoem", () => {
    expect(
      overlaps(
        { startsAt: at(9), endsAt: at(10) },
        { startsAt: at(10), endsAt: at(11) },
      ),
    ).toBe(false);
  });
});

describe("findConflicts", () => {
  const busy: BusyBlock[] = [
    { id: "a", professionalId: "dr-ana", roomId: "sala-1", startsAt: at(9), endsAt: at(10) },
    { id: "b", professionalId: "dr-bruno", roomId: "sala-2", startsAt: at(9), endsAt: at(10) },
  ];

  it("bloqueia o mesmo profissional em dois atendimentos", () => {
    const conflicts = findConflicts(
      { professionalId: "dr-ana", roomId: "sala-3", startsAt: at(9, 30), endsAt: at(10, 30) },
      busy,
    );
    expect(conflicts.map((c) => c.id)).toEqual(["a"]);
  });

  it("bloqueia duas pessoas na mesma sala", () => {
    const conflicts = findConflicts(
      { professionalId: "dr-carla", roomId: "sala-2", startsAt: at(9, 15), endsAt: at(9, 45) },
      busy,
    );
    expect(conflicts.map((c) => c.id)).toEqual(["b"]);
  });

  it("libera profissional e sala diferentes no mesmo horario", () => {
    expect(
      findConflicts(
        { professionalId: "dr-carla", roomId: "sala-3", startsAt: at(9), endsAt: at(10) },
        busy,
      ),
    ).toEqual([]);
  });

  it("ignora o proprio agendamento ao remarcar", () => {
    expect(
      findConflicts(
        { id: "a", professionalId: "dr-ana", roomId: "sala-1", startsAt: at(9, 30), endsAt: at(10, 30) },
        busy,
      ),
    ).toEqual([]);
  });

  it("não trata sala vazia como conflito", () => {
    expect(
      findConflicts(
        { professionalId: "dr-carla", roomId: null, startsAt: at(9), endsAt: at(10) },
        [{ id: "c", professionalId: "dr-dora", roomId: null, startsAt: at(9), endsAt: at(10) }],
      ),
    ).toEqual([]);
  });
});

describe("freeSlots", () => {
  it("remove horarios ocupados e respeita o fechamento", () => {
    const day = new Date(2026, 8, 14); // segunda-feira
    const slots = freeSlots(day, 60, [{ startsAt: at(9), endsAt: at(10) }]);
    const labels = slots.map((slot) => `${slot.getHours()}:${String(slot.getMinutes()).padStart(2, "0")}`);

    expect(labels).toContain("8:00");
    expect(labels).not.toContain("8:30"); // colidiria com 9h
    expect(labels).not.toContain("9:00");
    expect(labels).not.toContain("9:30");
    expect(labels).toContain("10:00");
    expect(labels.at(-1)).toBe("19:00"); // último que cabe antes das 20h
  });

  it("domingo não tem horario livre", () => {
    expect(freeSlots(new Date(2026, 8, 13), 30, [])).toEqual([]);
  });
});

describe("startOfWeek", () => {
  it("comeca na segunda-feira", () => {
    expect(startOfWeek(new Date(2026, 8, 17))).toEqual(new Date(2026, 8, 14));
  });

  it("domingo pertence a semana que comecou na segunda anterior", () => {
    expect(startOfWeek(new Date(2026, 8, 20))).toEqual(new Date(2026, 8, 14));
  });
});

describe("addMinutes", () => {
  it("soma minutos atravessando a hora", () => {
    expect(addMinutes(at(9, 45), 30)).toEqual(at(10, 15));
  });
});
