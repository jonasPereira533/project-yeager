#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rulesPath = join(root, "firestore.rules");
const backupDir = join(homedir(), ".yeager-rules");

const command = process.argv[2];
const argument = process.argv[3];

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function ensureBackupDir() {
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
}

function currentCommit() {
  const head = git("rev-parse", "--short", "HEAD");
  const dirty = git("status", "--porcelain", "firestore.rules");
  return {
    commit: head || "(sem commit)",
    dirty: dirty.length > 0,
  };
}

function backup() {
  if (!existsSync(rulesPath)) {
    console.error("firestore.rules nao encontrado em", root);
    process.exit(1);
  }
  ensureBackupDir();
  const name = `${stamp()}.rules`;
  copyFileSync(rulesPath, join(backupDir, name));
  const { commit, dirty } = currentCommit();
  writeFileSync(
    join(backupDir, `${name}.json`),
    JSON.stringify({ commit, dirty, savedAt: new Date().toISOString() }, null, 2),
  );
  console.log(`copia salva: ${join(backupDir, name)}`);
  console.log(`             commit ${commit}${dirty ? " (com mudancas locais)" : ""}`);
  return join(backupDir, name);
}

function backups() {
  if (!existsSync(backupDir)) return [];
  return readdirSync(backupDir)
    .filter((name) => name.endsWith(".rules"))
    .sort()
    .reverse();
}

function list() {
  const all = backups();
  if (all.length === 0) {
    console.log("nenhuma copia em", backupDir);
    return;
  }
  console.log("copias em", backupDir);
  for (const name of all) {
    const meta = join(backupDir, `${name}.json`);
    const info = existsSync(meta)
      ? JSON.parse(readFileSync(meta, "utf8"))
      : { commit: "?" };
    console.log(`  ${name}  commit ${info.commit}${info.dirty ? "+local" : ""}`);
  }
}

function deploy() {
  console.log("publicando as regras...");
  try {
    execFileSync("npx", ["firebase", "deploy", "--only", "firestore:rules"], {
      cwd: root,
      stdio: "inherit",
    });
  } catch {
    console.error(
      "\nO deploy falhou. O firestore.rules local ja esta no estado desejado;\n" +
        "confirme com `git diff firestore.rules` e tente de novo quando estiver autenticado.",
    );
    process.exit(1);
  }
}

function restoreFromRef(ref) {
  const source = git("show", `${ref}:firestore.rules`);
  if (!source) {
    console.error(`nao consegui ler firestore.rules no commit ${ref}`);
    process.exit(1);
  }
  return source;
}

function rollback() {
  const saved = backup();
  let content;
  let origin;

  if (argument) {
    content = restoreFromRef(argument);
    origin = `commit ${argument}`;
  } else {
    const all = backups().filter((name) => name !== saved.split("/").pop());
    if (all.length === 0) {
      console.error("nenhuma copia anterior para restaurar");
      process.exit(1);
    }
    const latest = all[0];
    content = readFileSync(join(backupDir, latest), "utf8");
    origin = `copia ${latest}`;
  }

  writeFileSync(rulesPath, content);
  console.log(`restaurou ${origin} (a versao que estava no working tree foi salva em ${saved})`);
  deploy();
}

switch (command) {
  case "backup":
    backup();
    break;
  case "list":
    list();
    break;
  case "deploy":
    backup();
    deploy();
    break;
  case "rollback":
    rollback();
    break;
  default:
    console.log(`uso:
  npm run rules:backup          guarda uma copia das regras fora do repo
  npm run rules:deploy          guarda a copia e publica (use este, sempre)
  npm run rules:rollback        restaura a ultima copia e republica
  npm run rules:rollback <ref>  restaura as regras de um commit e republica
  npm run rules:list            lista as copias guardadas`);
}
