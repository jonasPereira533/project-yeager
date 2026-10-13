import { describe, expect, it } from "vitest";
import { isCaseComplete } from "./case-completion";

const OBJECTIVES = [{ id: "o1" }, { id: "o2" }, { id: "o3" }];

function solved(...ids: string[]) {
  return (objectiveId: string) => ids.includes(objectiveId);
}

describe("caso completo", () => {
  it("falta um objetivo e nao esta completo", () => {
    expect(isCaseComplete(OBJECTIVES, solved("o1", "o2"))).toBe(false);
  });

  it("com todos os objetivos fechados esta completo", () => {
    expect(isCaseComplete(OBJECTIVES, solved("o1", "o2", "o3"))).toBe(true);
  });

  it("caso sem objetivo nao se comemora", () => {
    expect(isCaseComplete([], solved())).toBe(false);
  });

  it("nao liga com ids que nao sao do caso", () => {
    expect(isCaseComplete(OBJECTIVES, solved("o1", "o2", "o3", "o4"))).toBe(
      true,
    );
  });
});