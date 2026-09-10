import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export const yeagerEditorTheme = EditorView.theme(
  {
    "&": {
      color: "var(--ink)",
      backgroundColor: "#0f1319",
      border: "1px solid var(--rule)",
      borderRadius: "4px",
      fontSize: "0.92rem",
      minHeight: "130px",
      resize: "vertical",
      overflow: "auto",
    },
    "&.cm-focused": {
      outline: "none",
      borderColor: "var(--amber)",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono)",
      caretColor: "var(--amber)",
      padding: "1rem 1.1rem",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.55",
    },
    ".cm-gutters": {
      backgroundColor: "#0f1319",
      color: "var(--ink-muted)",
      border: "none",
      borderRight: "1px solid var(--rule)",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(232, 163, 61, 0.06)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(232, 163, 61, 0.06)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(232, 163, 61, 0.25) !important",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--amber)",
    },
    ".cm-placeholder": {
      color: "var(--ink-muted)",
      fontStyle: "normal",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--surface-2)",
      border: "1px solid var(--rule)",
      color: "var(--ink)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.82rem",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "var(--amber)",
      color: "#1a1305",
    },
  },
  { dark: true },
);

export const yeagerHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "var(--amber)", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "var(--teal)" },
  { tag: t.number, color: "#c9a876" },
  { tag: t.bool, color: "#c9a876" },
  { tag: t.null, color: "#c9a876" },
  { tag: t.comment, color: "#5b6472", fontStyle: "italic" },
  { tag: t.operator, color: "var(--ink-muted)" },
  { tag: t.punctuation, color: "var(--ink-muted)" },
  { tag: t.typeName, color: "var(--teal)" },
  { tag: t.propertyName, color: "var(--ink)" },
]);
