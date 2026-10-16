import { describe, expect, it } from "vitest";
import { shouldWarnOnReload } from "./reload-guard";

describe("aviso de recarga", () => {
  it("nao avisa com o editor vazio", () => {
    expect(shouldWarnOnReload({ settled: "", current: "" })).toBe(false);
  });

  it("nao avisa por causa so de espaco", () => {
    expect(shouldWarnOnReload({ settled: "", current: "   \n " })).toBe(false);
  });

  it("avisa assim que a pessoa digita", () => {
    expect(shouldWarnOnReload({ settled: "", current: "SELECT" })).toBe(true);
  });

  it("nao avisa depois de rodar, quando nada mudou", () => {
    expect(
      shouldWarnOnReload({ settled: "SELECT 1", current: "SELECT 1" }),
    ).toBe(false);
  });

  it("avisa quando a consulta foi editada depois de rodar", () => {
    expect(
      shouldWarnOnReload({ settled: "SELECT 1", current: "SELECT 2" }),
    ).toBe(true);
  });

  it("espaco nas pontas nao conta como edicao", () => {
    expect(
      shouldWarnOnReload({ settled: "SELECT 1", current: "  SELECT 1  " }),
    ).toBe(false);
  });

  it("avisa quando o rascunho restaurado difere do que rodou", () => {
    expect(
      shouldWarnOnReload({ settled: "SELECT 2", current: "SELECT 1" }),
    ).toBe(true);
  });

  it("nao avisa quando o rascunho restaurado e o proprio texto rodado", () => {
    expect(
      shouldWarnOnReload({ settled: "SELECT 1", current: "SELECT 1" }),
    ).toBe(false);
  });
});