import { effectScope, ref, watch } from "vue";
import { shouldWarnOnReload, type ReloadGuardState } from "../utils/reload-guard";

function createReloadGuard() {
  const armed = ref(false);
  let listening = false;
  let bypassed = false;

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (bypassed) {
      bypassed = false;
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  }

  function syncListener() {
    if (armed.value && !listening) {
      window.addEventListener("beforeunload", onBeforeUnload);
      listening = true;
    } else if (!armed.value && listening) {
      window.removeEventListener("beforeunload", onBeforeUnload);
      listening = false;
    }
  }

  function setState(state: ReloadGuardState) {
    armed.value = shouldWarnOnReload(state);
  }

  function disarm() {
    armed.value = false;
  }

  function bypassNext() {
    if (!armed.value) return;
    bypassed = true;
  }

  watch(armed, syncListener, { flush: "sync" });

  return { armed, setState, disarm, bypassNext };
}

export type ReloadGuardApi = ReturnType<typeof createReloadGuard>;

let shared: ReloadGuardApi | null = null;

export function useReloadGuard(): ReloadGuardApi {
  if (!shared) {
    shared = effectScope(true).run(createReloadGuard)!;
  }
  return shared;
}