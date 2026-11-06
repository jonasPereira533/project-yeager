<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useCurrentUser, useFirestore, useIsCurrentUserLoaded } from "vuefire";
import { CASES } from "../../data/cases";
import { CERTIFICATE_CONFIG } from "../../data/certificate-config";
import { useAuth } from "../../composables/use-auth";
import { issueCertificate } from "../../composables/use-certificate-record";
import { useProgress } from "../../composables/use-progress";
import { downloadCertificate } from "../../utils/certificate";
import { certificateValidationUrl } from "../../utils/certificate-code";
import {
  certificateNameKey,
  readSavedName,
  resolveName,
  writeSavedName,
} from "../../utils/certificate-name";

const user = useCurrentUser();
const userLoaded = useIsCurrentUserLoaded();
const db = useFirestore();
const { loginWithGoogle } = useAuth();
const { totalXP } = useProgress();

const storageKey = computed(() => certificateNameKey(user.value?.uid));
const savedName = ref(readSavedName(storageKey.value));
watch(storageKey, (key) => {
  savedName.value = readSavedName(key);
});

const knownName = computed(() =>
  resolveName(savedName.value, user.value?.displayName),
);

const editing = ref(false);
const draft = ref("");
// o campo so aparece quando ainda nao ha nome, ou se a pessoa pedir pra trocar
const showField = computed(
  () => userLoaded.value && !!user.value && (!knownName.value || editing.value),
);

const pending = ref(false);
const errorMessage = ref("");
const nameInput = ref<HTMLInputElement | null>(null);
const downloadButton = ref<HTMLButtonElement | null>(null);

const casesCount = CASES.length;
const objectivesCount = CASES.reduce(
  (sum, caseItem) => sum + caseItem.objectives.length,
  0,
);

async function startEditing() {
  draft.value = knownName.value;
  errorMessage.value = "";
  editing.value = true;
  await nextTick();
  nameInput.value?.focus();
}

function validationBase(): string {
  const { hostname, origin } = window.location;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  return local ? origin : CERTIFICATE_CONFIG.validationBaseUrl;
}

async function download() {
  if (pending.value || !userLoaded.value) return;

  // a validacao depende de um registro no Firestore, entao so quem esta logado emite
  const currentUser = user.value;
  if (!currentUser) {
    await loginWithGoogle();
    return;
  }

  const name = (showField.value ? draft.value : knownName.value).trim();
  if (!name) {
    errorMessage.value = "Informe seu nome para constar no certificado.";
    nameInput.value?.focus();
    return;
  }

  pending.value = true;
  errorMessage.value = "";
  try {
    const record = await issueCertificate(db, {
      uid: currentUser.uid,
      name,
      hours: CERTIFICATE_CONFIG.hours,
      cases: casesCount,
      objectives: objectivesCount,
      xp: totalXP.value,
    });

    if (showField.value) {
      writeSavedName(storageKey.value, name);
      savedName.value = name;
      editing.value = false;
    }

    await downloadCertificate(
      {
        name: record.name,
        casesCount: record.cases,
        objectivesCount: record.objectives,
        totalXP: record.xp,
        issuedAt: record.issuedAt,
        validationUrl: certificateValidationUrl(validationBase(), record.code),
      },
      CERTIFICATE_CONFIG,
    );
  } catch (error) {
    console.error("Erro ao gerar o certificado:", error);
    const denied =
      (error as { code?: string } | null)?.code === "permission-denied";
    errorMessage.value = denied
      ? "Não consegui registrar o certificado. Confira se todos os chamados estão concluídos e se você está logado."
      : "Não foi possível gerar o certificado. Tente novamente em instantes.";
  } finally {
    pending.value = false;
  }
}

function focus() {
  const target = nameInput.value ?? downloadButton.value;
  target?.scrollIntoView({ block: "center" });
  target?.focus();
}

defineExpose({ focus });
</script>

<template>
  <section class="certificate" aria-labelledby="certificate-title">
    <p id="certificate-title" class="text">
      <span class="eyebrow">Certificado</span>
      <span class="detail">
        {{ CERTIFICATE_CONFIG.hours }} horas complementares
        <template v-if="!user && userLoaded">
          · entre com Google para emitir com código de validação
        </template>
        <template v-else-if="knownName && !showField">
          · em nome de {{ knownName }}
        </template>
      </span>
    </p>

    <div class="actions">
      <template v-if="showField">
        <label class="sr-only" for="certificate-name"
          >Nome no certificado</label
        >
        <input
          id="certificate-name"
          ref="nameInput"
          v-model="draft"
          class="input"
          type="text"
          maxlength="80"
          autocomplete="name"
          placeholder="Seu nome completo"
          :aria-invalid="errorMessage ? 'true' : undefined"
          aria-describedby="certificate-error"
          @keydown.enter.prevent="download"
        />
      </template>
      <button
        v-else-if="user && knownName"
        type="button"
        class="link"
        @click="startEditing"
      >
        Alterar nome
      </button>

      <button
        ref="downloadButton"
        type="button"
        class="btn"
        :disabled="pending || !userLoaded"
        :aria-busy="pending"
        @click="download"
      >
        {{
          pending
            ? "Gerando…"
            : user
              ? "Baixar certificado"
              : "Entrar para baixar"
        }}
      </button>
    </div>

    <p id="certificate-error" class="error" role="alert">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.certificate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-left: 4px solid var(--amber);
  border-radius: 4px;
  padding: 0.9rem 1.3rem;
  margin-bottom: 2.5rem;
}

.text {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.3rem 1rem;
  margin: 0;
}
.eyebrow {
  font-family: "Special Elite", monospace;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--amber);
}
.detail {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.8rem;
  color: var(--ink-muted);
}

.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.input {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.5rem 0.8rem;
  min-width: 16rem;
}
.input:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}
.input[aria-invalid="true"] {
  border-color: var(--stamp-red);
}

/* mesmo padrao dos botoes do header (Placar, Sair), na cor ambar */
.btn {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
  color: var(--amber);
  background: none;
  border: 1px solid var(--amber);
  padding: 0.5rem 1rem;
  border-radius: 2px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}
.btn:hover:not(:disabled) {
  background: var(--amber);
  color: var(--bg);
}
.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.btn:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

.link {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  color: var(--ink-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.link:hover {
  color: var(--ink);
}
.link:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
}

.error {
  flex-basis: 100%;
  margin: 0;
  font-size: 0.8rem;
  color: var(--stamp-red);
}
.error:empty {
  display: none;
}

@media (max-width: 40rem) {
  .input {
    min-width: 0;
    flex: 1 1 100%;
  }
}
</style>
