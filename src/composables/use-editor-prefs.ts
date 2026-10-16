import { computed, effectScope, ref, watch } from "vue";
import { parsePrefs, type EditorPrefs } from "../utils/editor-prefs";

const STORAGE_KEY = "yeager:editor-prefs";

function readLocal(): EditorPrefs {
  try {
    return parsePrefs(localStorage.getItem(STORAGE_KEY));
  } catch {
    return parsePrefs(null);
  }
}

function createEditorPrefs() {
  const prefs = ref<EditorPrefs>(readLocal());

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs.value));
    } catch {
      // cota cheia ou storage bloqueado
    }
  }

  function setAutocomplete(autocomplete: boolean) {
    prefs.value = { ...prefs.value, autocomplete };
  }

  const autocomplete = computed(() => prefs.value.autocomplete);

  watch(prefs, persist);

  return { prefs, autocomplete, setAutocomplete };
}

export type EditorPrefsApi = ReturnType<typeof createEditorPrefs>;

let shared: EditorPrefsApi | null = null;

export function useEditorPrefs(): EditorPrefsApi {
  if (!shared) {
    shared = effectScope(true).run(createEditorPrefs)!;
  }
  return shared;
}