import { onMounted, onUnmounted, shallowRef, watch, type Ref } from "vue";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { sql, SQLite, type SQLNamespace } from "@codemirror/lang-sql";
import type { SchemaTable } from "../types/case";
import {
  yeagarEditorTheme,
  yeagarHighlightStyle,
} from "../utils/sql-editor-theme";

function toSqlNamespace(schema: SchemaTable[]): SQLNamespace {
  const namespace: Record<string, string[]> = {};
  for (const table of schema) {
    namespace[table.name] = table.columns.map((c) => c.name);
  }
  return namespace;
}

function buildSqlLanguage(schema: SchemaTable[]) {
  return sql({
    dialect: SQLite,
    schema: toSqlNamespace(schema),
    upperCaseKeywords: true,
  });
}

export interface UseSqlCodeMirrorOptions {
  container: Ref<HTMLElement | null>;
  initialValue: string;
  schema: Ref<SchemaTable[]>;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function useSqlCodeMirror(options: UseSqlCodeMirrorOptions) {
  const view = shallowRef<EditorView | null>(null);
  const languageCompartment = new Compartment();

  onMounted(() => {
    if (!options.container.value) return;

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          options.onRun();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: options.initialValue,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        runKeymap,
        languageCompartment.of(buildSqlLanguage(options.schema.value)),
        syntaxHighlighting(yeagarHighlightStyle),
        yeagarEditorTheme,
        placeholderExtension("-- escreva sua consulta SQL aqui"),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": "Editor de consulta SQL",
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            options.onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    view.value = new EditorView({ state, parent: options.container.value });
  });

  onUnmounted(() => {
    view.value?.destroy();
    view.value = null;
  });

  function setValue(value: string) {
    const editor = view.value;
    if (!editor) return;
    if (editor.state.doc.toString() === value) return;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
    });
  }

  watch(options.schema, (schema) => {
    view.value?.dispatch({
      effects: languageCompartment.reconfigure(buildSqlLanguage(schema)),
    });
  });

  return { setValue };
}
