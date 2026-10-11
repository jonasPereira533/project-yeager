import { onMounted, onUnmounted, shallowRef, watch, type Ref } from "vue";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { basicSetup } from "codemirror";
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

/**
 * SQLite identifiers sao case-insensitive, mas o dialect do lang-sql assume
 * que nao sao. Sem isso, um nome como `Cli_For` nao casa com o padrao usado
 * para decidir entre completar puro ou envolver em crase, e toda sugestao de
 * tabela volta cercada de crase.
 */
const SQLITE_DIALECT: SQLDialect = SQLDialect.define({
  ...SQLite.spec,
  caseInsensitiveIdentifiers: true,
});

/**
 * O formato de `SQLNamespace` e recursivo: cada tabela vira um nivel com um
 * `self` (o proprio nome da tabela, tipado como `class`) e `children` no
 * formato de array, que e a unica forma que o lang-sql tipa como `property`.
 * Passar um objeto aqui faria cada coluna virar `type` de novo.
 */
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
  return sql({
    dialect: SQLITE_DIALECT,
    schema: toSqlNamespace(schema),
    upperCaseKeywords: true,
  });
}

export interface UseSqlCodeMirrorOptions {
  container: Ref<HTMLElement | null>;
  initialValue: string;
  schema: Ref<SchemaTable[]>;
  labelId?: string;
  isRunning?: () => boolean;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function useSqlCodeMirror(options: UseSqlCodeMirrorOptions) {
  const view = shallowRef<EditorView | null>(null);
  const languageCompartment = new Compartment();

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
        basicSetup,
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

  return { setValue };
}
