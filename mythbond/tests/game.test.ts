import { describe, expect, it } from "vitest";
import { act, adopt, finishActivity, formOf, HOUR, MIN, newSave, nextForm, stageOf, tick, warm } from "../src/game";

function started(line: "kitsune" | "elf" = "kitsune") {
  const save = newSave(0);
  adopt(save, line);
  return save;
}

describe("evolution", () => {
  it("charm awakens into a familiar, then an adult form", () => {
    const save = started();
    expect(act(save, "meal").ok).toBe(false); // charm can't eat
    const ev = tick(save, 2 * MIN);
    expect(ev[0]).toMatchObject({ type: "evolved" });
    expect(formOf(save.pet!).id).toBe("kitsune_familiar");
    save.pet!.fullness = save.pet!.mood = save.pet!.clean = 100;
    tick(save, 20 * MIN);
    expect(formOf(save.pet!).id).toBe("kitsune_awakened");
    expect(save.album).toEqual(["kitsune_seed", "kitsune_familiar", "kitsune_awakened"]);
  });

  it("warming the charm speeds it up", () => {
    const save = started();
    for (let i = 0; i < 24; i++) warm(save.pet!);
    expect(tick(save, 1000)[0]?.type).toBe("evolved");
  });

  it("ascension waits for bond + power and branches on the higher one", () => {
    for (const [bond, power, want] of [[50, 20, "elf_grace"], [20, 50, "elf_valor"]] as const) {
      const save = started("elf");
      const pet = save.pet!;
      pet.formId = "elf_awakened";
      pet.stageMs = HOUR;
      expect(nextForm(pet)).toBeNull();
      pet.bond = bond;
      pet.power = power;
      tick(save, 1000);
      expect(pet.formId).toBe(want);
      expect(stageOf(pet)).toBe(3);
      expect(nextForm(pet)).toBeNull();
    }
  });
});

describe("care", () => {
  it("needs decay, and feeding / cleaning restore them", () => {
    const save = started();
    const pet = save.pet!;
    pet.formId = "kitsune_awakened";
    tick(save, 3 * HOUR);
    expect(pet.fullness).toBeLessThan(40);
    expect(pet.mess).toBe(2);
    const before = pet.fullness;
    expect(act(save, "meal").ok).toBe(true);
    expect(pet.fullness).toBeCloseTo(before + 30);
    act(save, "clean");
    expect(pet.clean).toBe(100);
    expect(pet.mess).toBe(0);
  });

  it("sleep restores energy and blocks other care", () => {
    const save = started();
    const pet = save.pet!;
    pet.formId = "kitsune_awakened";
    pet.energy = 20;
    expect(act(save, "sleep").ok).toBe(true);
    expect(act(save, "meal").ok).toBe(false);
    tick(save, 2 * HOUR);
    expect(pet.energy).toBeGreaterThan(70);
  });

  it("a neglected need counts one care mistake per incident", () => {
    const save = started();
    const pet = save.pet!;
    pet.formId = "kitsune_awakened";
    pet.fullness = 0;
    tick(save, 2 * HOUR);
    expect(pet.mistakes).toBe(1);
  });

  it("offline time is capped and never ends the run", () => {
    const save = started();
    const pet = save.pet!;
    pet.formId = "kitsune_awakened";
    tick(save, 30 * 24 * HOUR, true);
    expect(save.pet).not.toBeNull();
    expect(pet.fullness).toBeGreaterThanOrEqual(10);
    expect(pet.ageMs).toBe(8 * HOUR);
  });

  it("long active neglect makes her leave", () => {
    const save = started();
    const pet = save.pet!;
    pet.formId = "kitsune_awakened";
    pet.fullness = pet.mood = 0;
    const ev = tick(save, 13 * HOUR);
    expect(save.pet).toBeNull();
    expect(ev.some((e) => e.type === "departed")).toBe(true);
  });

  it("training raises power, play raises bond", () => {
    const save = started();
    const pet = save.pet!;
    pet.formId = "kitsune_awakened";
    finishActivity(pet, "train", 1);
    expect(pet.power).toBe(6);
    finishActivity(pet, "play", 1);
    expect(pet.bond).toBe(5);
  });
});
