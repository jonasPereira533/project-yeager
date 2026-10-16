import { onMounted, onUnmounted, type Ref } from "vue";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useDialogFocusTrap(
  dialog: Ref<HTMLElement | null>,
  onClose: () => void,
) {
  function focusables(): HTMLElement[] {
    return dialog.value
      ? Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];
  }

  let previousOverflow = "";
  let returnFocusTo: HTMLElement | null = null;

  onMounted(() => {
    returnFocusTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusables()[0]?.focus();
  });

  onUnmounted(() => {
    document.body.style.overflow = previousOverflow;
    if (returnFocusTo?.isConnected) returnFocusTo.focus();
  });

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const items = focusables();
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    if (!first || !last) return;

    if (
      event.shiftKey &&
      (current === first || !dialog.value?.contains(current))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (current === last || !dialog.value?.contains(current))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  return { onKeydown };
}
