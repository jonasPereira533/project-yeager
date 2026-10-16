import { describe, expect, it } from "vitest";
import { isArchiveComplete, isCaseComplete } from "./case-completion";

const OBJECTIVES = [{ id: "o1" }, { id: "o2" }, { id: "o3" }];

function solved(...ids: string[]) {
  return (objectiveId: string) => ids.includes(objectiveId);
}

const ARCHIVE = [
  { id: "c1", objectives: OBJECTIVES },
  { id: "c2", objectives: [{ id: "o1" }, { id: "o2" }] },
];

const ALL_KEYS = ["c1:o1", "c1:o2", "c1:o3", "c2:o1", "c2:o2"];

function solvedKeys(...keys: string[]) {
  return (caseId: string, objectiveId: string) =>
    keys.includes(`${caseId}:${objectiveId}`);
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

describe("arquivo completo", () => {
  it("com todos os objetivos de todos os casos esta completo", () => {
    expect(isArchiveComplete(ARCHIVE, solvedKeys(...ALL_KEYS))).toBe(true);
  });

  it("falta um objetivo em qualquer caso e nao esta completo", () => {
    expect(isArchiveComplete(ARCHIVE, solvedKeys(...ALL_KEYS.slice(1)))).toBe(
      false,
    );
  });

  it("so um caso completo e o outro pela metade nao basta", () => {
    expect(
      isArchiveComplete(ARCHIVE, solvedKeys("c1:o1", "c1:o2", "c1:o3")),
    ).toBe(false);
  });

  it("ids iguais em casos diferentes contam separado", () => {
    expect(isArchiveComplete(ARCHIVE, solvedKeys("c2:o1", "c2:o2"))).toBe(
      false,
    );
  });

  it("caso sem objetivo barra a celebracao", () => {
    expect(
      isArchiveComplete(
        [
          { id: "c1", objectives: OBJECTIVES },
          { id: "c2", objectives: [] },
        ],
        solvedKeys("c1:o1", "c1:o2", "c1:o3"),
      ),
    ).toBe(false);
  });

  it("arquivo vazio nao se comemora", () => {
    expect(isArchiveComplete([], solvedKeys())).toBe(false);
  });
});
