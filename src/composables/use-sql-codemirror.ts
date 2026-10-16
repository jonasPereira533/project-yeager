import { onMounted, onUnmounted, shallowRef, watch, type Ref } from "vue";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import {
  sql,
  SQLite,
  SQLDialect,
  type SQLNamespace,
} from "@codemirror/lang-sql";
import type { SchemaTable } from "../types/case";
import {
  yeagerEditorTheme,
  yeagerHighlightStyle,
} from "../utils/sql-editor-theme";
import {
  buildAutocompleteExtension,
  setupExtensions,
} from "../utils/sql-editor-setup";
import { createColumnCompletionSource } from "../utils/sql-completion";

const SQLITE_DIALECT: SQLDialect = SQLDialect.define({
  ...SQLite.spec,
  caseInsensitiveIdentifiers: true,
});

function toSqlNamespace(schema: SchemaTable[]): Record<string, SQLNamespace> {
  const namespace: Record<string, SQLNamespace> = {};
  for (const table of schema) {
    namespace[table.name] = {
      self: { label: table.name, type: "class" },
      children: table.columns.map((c) => c.name),
    };
  }
  return namespace;
}

function buildSqlLanguage(schema: SchemaTable[]) {
  return [
    sql({
      dialect: SQLITE_DIALECT,
      schema: toSqlNamespace(schema),
      upperCaseKeywords: true,
    }),
    SQLITE_DIALECT.language.data.of({
      autocomplete: createColumnCompletionSource(schema),
    }),
  ];
}

export interface UseSqlCodeMirrorOptions {
  container: Ref<HTMLElement | null>;
  initialValue: string;
  schema: Ref<SchemaTable[]>;
  autocompleteOn: Ref<boolean>;
  labelId?: string;
  isRunning?: () => boolean;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function useSqlCodeMirror(options: UseSqlCodeMirrorOptions) {
  const view = shallowRef<EditorView | null>(null);
  const languageCompartment = new Compartment();
  const autocompleteCompartment = new Compartment();

  onMounted(() => {
    if (!options.container.value) return;
    const isRunning = options.isRunning ?? (() => false);

    const runKeymap = Prec.highest(
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            if (isRunning()) return true;
            options.onRun();
            return true;
          },
        },
      ]),
    );

    const state = EditorState.create({
      doc: options.initialValue,
      extensions: [
        setupExtensions,
        autocompleteCompartment.of(
          buildAutocompleteExtension(options.autocompleteOn.value),
        ),
        keymap.of([indentWithTab]),
        runKeymap,
        languageCompartment.of(buildSqlLanguage(options.schema.value)),
        syntaxHighlighting(yeagerHighlightStyle),
        yeagerEditorTheme,
        placeholderExtension("-- escreva sua consulta SQL aqui"),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          ...(options.labelId
            ? { "aria-labelledby": options.labelId }
            : { "aria-label": "Editor de consulta SQL" }),
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

  watch(options.autocompleteOn, (enabled) => {
    view.value?.dispatch({
      effects: autocompleteCompartment.reconfigure(
        buildAutocompleteExtension(enabled),
      ),
    });
  });

  return { setValue };
}
