import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

const rulesSource = readFileSync(
  resolve(import.meta.dirname, "../firestore.rules"),
  "utf8",
);

const PROJECT_ID = "demo-yeager";
const HOST = "127.0.0.1";
const PORT = 8080;

const ALICE = "alice-uid";
const BOB = "bob-uid";

const KEY_A = "clientes-bloqueados:o1";
const KEY_B = "estoque-abaixo-minimo:o2";
const KEY_C = "motivos-cancelamento:o3";
const FAKE_KEY = "clientes-bloqueados:o9";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: rulesSource, host: HOST, port: PORT },
  });
});

afterAll(async () => {
  await env.cleanup();
});

afterEach(async () => {
  await env.clearFirestore();
});

function asUser(uid: string): Firestore {
  return env.authenticatedContext(uid).firestore() as unknown as Firestore;
}

function asAnon(): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

function line(overrides: Record<string, unknown> = {}) {
  return {
    displayName: "Ana",
    solved: [KEY_A],
    hints: [],
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function lineRef(db: Firestore, uid = ALICE) {
  return doc(db, "leaderboard", uid);
}

function touch(extra: Record<string, unknown> = {}) {
  return { updatedAt: serverTimestamp(), ...extra };
}

describe("placar: quem pode escrever", () => {
  it("o dono cria a propria linha", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
  });

  it("ninguem cria linha alheia", async () => {
    const bob = asUser(BOB);
    await assertFails(setDoc(lineRef(bob, ALICE), line()));
  });

  it("anonimo nao cria linha", async () => {
    await assertFails(setDoc(lineRef(asAnon(), ALICE), line()));
  });

  it("a leitura do placar e publica", async () => {
    await assertSucceeds(setDoc(lineRef(asUser(ALICE)), line()));
    await assertSucceeds(getDocs(collection(asAnon(), "leaderboard")));
  });

  it("ninguem apaga a propria linha", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertFails(deleteDoc(lineRef(alice)));
  });
});

describe("placar: formato do documento", () => {
  it("exige pelo menos um objetivo resolvido", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(lineRef(alice), line({ solved: [] })));
  });

  it("recusa campo que o cliente nao deveria escrever", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(lineRef(alice), line({ xp: 9999 })));
  });

  it("recusa nome acima do teto", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(lineRef(alice), line({ displayName: "A".repeat(41) })));
  });

  it("recusa chave de objetivo que nao existe", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(lineRef(alice), line({ solved: [FAKE_KEY] })));
  });

  it("recusa chave de caso que nao existe", async () => {
    const alice = asUser(ALICE);
    await assertFails(
      setDoc(lineRef(alice), line({ solved: ["caso-que-nao-existe:o1"] })),
    );
  });

  it("updatedAt tem de ser o carimbo do servidor", async () => {
    const alice = asUser(ALICE);
    await assertFails(
      setDoc(lineRef(alice), line({ updatedAt: Timestamp.fromMillis(1) })),
    );
  });

  it("completedAt no create tem de ser o carimbo do servidor", async () => {
    const alice = asUser(ALICE);
    await assertFails(
      setDoc(lineRef(alice), line({ completedAt: Timestamp.fromMillis(1) })),
    );
  });
});

describe("placar: as listas so crescem", () => {
  it("aceita acrescentar objetivo resolvido", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ solved: [KEY_A, KEY_B] })),
    );
  });

  it("recusa remover objetivo resolvido", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line({ solved: [KEY_A, KEY_B] })));
    await assertFails(updateDoc(lineRef(alice), touch({ solved: [KEY_A] })));
  });

  it("recusa remover dica usada", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line({ hints: [KEY_C] })));
    await assertFails(updateDoc(lineRef(alice), touch({ hints: [] })));
  });
});

describe("placar: o carimbo de conclusao", () => {
  it("pode ser lancado quando ainda nao existe", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
  });

  it("nao pode ser alterado depois de lancado", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
    await assertFails(
      updateDoc(lineRef(alice), touch({ completedAt: Timestamp.fromMillis(1) })),
    );
  });

  it("nao pode ser apagado", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
    await assertFails(updateDoc(lineRef(alice), touch({ completedAt: deleteField() })));
  });

  it("nao some quando a linha e reescrita sem carimbo", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
    await assertFails(setDoc(lineRef(alice), line()));
  });

  it("segundo dispositivo nao pode relancar o carimbo", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
    await assertFails(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
  });

  it("segundo dispositivo sincroniza sem mexer no carimbo", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ solved: [KEY_A, KEY_B] })),
    );
    const snap = await getDoc(lineRef(alice));
    if (snap.data()?.completedAt == null) {
      throw new Error("o carimbo sumiu na sincronizacao");
    }
  });

  it("o caminho que o cliente usa preserva o carimbo", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(
      updateDoc(lineRef(alice), touch({ completedAt: serverTimestamp() })),
    );
    await assertSucceeds(setDoc(lineRef(alice), line(), { merge: true }));
    const snap = await getDoc(lineRef(alice));
    if (snap.data()?.completedAt == null) {
      throw new Error("o carimbo sumiu no merge do cliente");
    }
  });
});

describe("placar: o setor e escolhido uma vez", () => {
  it("pode ser escolhido quando ainda nao existe", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(updateDoc(lineRef(alice), touch({ sector: "Final" })));
  });

  it("nao pode ser trocado depois de escolhido", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(updateDoc(lineRef(alice), touch({ sector: "Final" })));
    await assertFails(updateDoc(lineRef(alice), touch({ sector: "Prime" })));
  });

  it("nao pode ser apagado depois de escolhido", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertSucceeds(updateDoc(lineRef(alice), touch({ sector: "Final" })));
    await assertFails(updateDoc(lineRef(alice), touch({ sector: deleteField() })));
  });

  it("recusa setor fora da lista", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line()));
    await assertFails(updateDoc(lineRef(alice), touch({ sector: "Corporativo" })));
  });

  it("linha com setor nulo aceita o primeiro setor de verdade", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line({ sector: null })));
    await assertSucceeds(updateDoc(lineRef(alice), touch({ sector: "Final" })));
  });

  it("linha com setor nulo nao trava o cliente em merge", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line({ sector: null })));
    await assertSucceeds(
      setDoc(lineRef(alice), line({ sector: "Final" }), { merge: true }),
    );
  });

  it("a linha pode carregar o que o servidor ja tinha alem do dispositivo", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(setDoc(lineRef(alice), line({ solved: [KEY_A, KEY_B] })));
    await assertSucceeds(
      setDoc(lineRef(alice), line({ solved: [KEY_A, KEY_B, KEY_C] }), {
        merge: true,
      }),
    );
  });

  it("aceita todos os setores da lista", async () => {
    const sectors = ["Partner", "Final", "Prime", "Implantação", "Outro"];
    for (const [index, sector] of sectors.entries()) {
      const uid = `setor-${index}`;
      const db = asUser(uid);
      await assertSucceeds(setDoc(doc(db, "leaderboard", uid), line()));
      await assertSucceeds(updateDoc(doc(db, "leaderboard", uid), touch({ sector })));
    }
  });
});

describe("devs: fora do placar", () => {
  it("a leitura e publica", async () => {
    await assertSucceeds(getDocs(collection(asAnon(), "devs")));
  });

  it("nem o proprio dono escreve", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(doc(alice, "devs", ALICE), { displayName: "Juarez" }));
  });

  it("ninguem escreve", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(doc(alice, "devs", BOB), { displayName: "Jonas" }));
    await assertFails(deleteDoc(doc(alice, "devs", ALICE)));
  });
});

describe("progresso: o bloco antigo continua valendo", () => {
  it("o dono grava o proprio progresso", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(
      setDoc(doc(alice, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o1"] },
        hintsUsedByCase: {},
        draftsByCase: {},
      }),
    );
  });

  it("ninguem grava progresso alheio", async () => {
    const bob = asUser(BOB);
    await assertFails(
      setDoc(doc(bob, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o1"] },
        hintsUsedByCase: {},
        draftsByCase: {},
      }),
    );
  });

  it("o progresso nao pode encolher", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(
      setDoc(doc(alice, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o1", "o2"] },
        hintsUsedByCase: {},
        draftsByCase: {},
      }),
    );
    await assertFails(
      updateDoc(doc(alice, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o1"] },
      }),
    );
  });

  it("ninguem apaga o progresso", async () => {
    const alice = asUser(ALICE);
    await assertFails(deleteDoc(doc(alice, "users", ALICE)));
  });

  it("o rascunho pode encolher, o progresso nao", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(
      setDoc(doc(alice, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o1", "o2"] },
        hintsUsedByCase: {},
        draftsByCase: {
          "clientes-bloqueados": {
            activeObjectiveId: "o1",
            queries: { o1: "select 1" },
          },
        },
      }),
    );
    await assertSucceeds(
      updateDoc(doc(alice, "users", ALICE), {
        draftsByCase: {
          "clientes-bloqueados": {
            activeObjectiveId: "o1",
            queries: { o1: "select 2" },
          },
        },
      }),
    );
    await assertFails(
      updateDoc(doc(alice, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o1"] },
      }),
    );
  });

  it("recusa objetivo que nao existe", async () => {
    const alice = asUser(ALICE);
    await assertFails(
      setDoc(doc(alice, "users", ALICE), {
        solvedByCase: { "clientes-bloqueados": ["o9"] },
        hintsUsedByCase: {},
        draftsByCase: {},
      }),
    );
  });
});

describe("fora do alcance das regras", () => {
  it("nenhuma colecao desconhecida aceita escrita", async () => {
    const alice = asUser(ALICE);
    await assertFails(setDoc(doc(alice, "casa", ALICE), { qualquer: 1 }));
    await assertFails(getDocs(collection(asAnon(), "casa")));
  });
});

describe("o documento sobrevive ao caminho feliz", () => {
  it("guarda o que o cliente gravou", async () => {
    const alice = asUser(ALICE);
    await assertSucceeds(
      setDoc(lineRef(alice), line({ sector: "Implantação" })),
    );
    const snap = await getDoc(lineRef(alice));
    const data = snap.data();
    if (!data) throw new Error("documento nao encontrado");
    if (data.sector !== "Implantação") {
      throw new Error(`setor esperado, veio ${String(data.sector)}`);
    }
    if (!Array.isArray(data.solved) || data.solved.length !== 1) {
      throw new Error("solved inesperado");
    }
  });
});
