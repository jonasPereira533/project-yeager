<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useFirestore } from "vuefire";
import { CERTIFICATE_CONFIG } from "../data/certificate-config";
import { fetchCertificate } from "../composables/use-certificate-record";
import {
  isCertificateCode,
  normalizeCertificateCode,
} from "../utils/certificate-code";
import { formatIssueDate } from "../utils/certificate";
import type { CertificateRecord } from "../utils/certificate-record";

const route = useRoute();
const db = useFirestore();

type Status = "loading" | "valid" | "not-found" | "error";
const status = ref<Status>("loading");
const record = ref<CertificateRecord | null>(null);

const code = computed(() =>
  normalizeCertificateCode(String(route.params.code ?? "")),
);

onMounted(async () => {
  if (!isCertificateCode(code.value)) {
    status.value = "not-found";
    return;
  }
  try {
    record.value = await fetchCertificate(db, code.value);
    status.value = record.value ? "valid" : "not-found";
  } catch (error) {
    console.error("Erro ao validar o certificado:", error);
    status.value = "error";
  }
});
</script>

<template>
  <div class="verify-page">
    <p class="eyebrow">Validação de certificado</p>

    <p v-if="status === 'loading'" class="message" role="status">
      Consultando o arquivo…
    </p>

    <template v-else-if="status === 'valid' && record">
      <h1 class="title valid">Certificado válido</h1>
      <p class="message">
        Este certificado foi emitido pelo Yeager. Confira se os dados abaixo são
        os mesmos do documento em mãos.
      </p>
      <dl class="facts">
        <div>
          <dt>Nome</dt>
          <dd class="name">{{ record.name }}</dd>
        </div>
        <div>
          <dt>Carga horária complementar</dt>
          <dd>{{ record.hours }} horas</dd>
        </div>
        <div>
          <dt>Treinamento</dt>
          <dd>{{ CERTIFICATE_CONFIG.courseName }}</dd>
        </div>
        <div>
          <dt>Concluído</dt>
          <dd>
            {{ record.cases }} chamados · {{ record.objectives }} objetivos ·
            {{ record.xp }} XP
          </dd>
        </div>
        <div>
          <dt>Emitido em</dt>
          <dd>{{ formatIssueDate(record.issuedAt) }}</dd>
        </div>
        <div>
          <dt>Emissor</dt>
          <dd>{{ CERTIFICATE_CONFIG.issuer }}</dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd class="code">{{ record.code }}</dd>
        </div>
      </dl>
    </template>

    <template v-else-if="status === 'not-found'">
      <h1 class="title invalid">Certificado não encontrado</h1>
      <p class="message">
        Não existe certificado com o código
        <span class="code">{{ code || "informado" }}</span
        >. Confira o endereço impresso no documento. Se ele estiver correto, o
        certificado não é autêntico.
      </p>
    </template>

    <template v-else>
      <h1 class="title invalid">Não foi possível consultar</h1>
      <p class="message" role="alert">
        Houve uma falha na consulta. Tente de novo em instantes.
      </p>
    </template>
  </div>
</template>

<style scoped>
.verify-page {
  padding: 4rem 5vw 6rem;
  max-width: 44rem;
}
.eyebrow {
  font-family: "Special Elite", monospace;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--amber);
  margin: 0 0 0.6rem;
}
.title {
  font-family: "Special Elite", monospace;
  font-size: 2rem;
  margin: 0 0 1rem;
}
.title.valid {
  color: var(--ink);
}
.title.invalid {
  color: var(--stamp-red);
}
.message {
  font-size: 0.95rem;
  color: var(--ink-muted);
  margin: 0 0 2rem;
  max-width: 60ch;
}
.facts {
  margin: 0;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-left: 4px solid var(--amber);
  border-radius: 4px;
  padding: 0.4rem 1.4rem;
}
.facts > div {
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--rule);
}
.facts > div:last-child {
  border-bottom: none;
}
dt {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
dd {
  margin: 0;
  font-size: 0.95rem;
}
.name {
  font-weight: 600;
}
.code {
  font-family: "IBM Plex Mono", monospace;
  letter-spacing: 0.06em;
}
@media (max-width: 40rem) {
  .facts > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.2rem;
  }
}
</style>
