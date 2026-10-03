import { ref, readonly } from "vue";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useCurrentUser } from "vuefire";

export type AuthErrorKind = "popup-closed" | "network" | "unknown";

/**
 * Estado da autenticação.
 *
 * Fica no módulo porque o botão de login é exibido em componentes diferentes
 * (header e hero) e ambos precisam desabilitar durante o popup e mostrar o mesmo
 * erro. Com estado por componente, um duplo clique abriria dois popups.
 */
const pending = ref(false);
const errorKind = ref<AuthErrorKind | null>(null);
const errorMessage = ref("");

/**
 * popup-closed  o usuário fechou a janela do Google sem querer — não é erro.
 * network       falha de rede / popup bloqueado pelo navegador.
 * unknown       qualquer outra coisa (config, conta desativada, etc).
 */
function classify(error: unknown): AuthErrorKind {
  const code = (error as { code?: string } | null)?.code ?? "";

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return "popup-closed";
  }
  if (
    code === "auth/network-request-failed" ||
    code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment"
  ) {
    return "network";
  }
  return "unknown";
}

export function useAuth() {
  const user = useCurrentUser();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  async function loginWithGoogle() {
    // Guarda contra duplo clique: sem isto, dois signInWithPopup paralelos.
    if (pending.value) return;

    pending.value = true;
    errorKind.value = null;
    errorMessage.value = "";

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const kind = classify(error);
      errorKind.value = kind;

      // Fechar o popup é uma escolha do usuário, não uma falha: mostrar erro
      // aqui seria ruído. Ainda registramos no console para diagnóstico.
      if (kind === "popup-closed") {
        console.info("Login cancelado: popup do Google fechado.");
      } else {
        console.error("Erro ao fazer login com Google:", error);
        errorMessage.value =
          kind === "network"
            ? "Não foi possível falar com o Google. Verifique sua conexão e tente de novo."
            : "O login com Google falhou. Tente novamente em instantes.";
      }
    } finally {
      pending.value = false;
    }
  }

  async function logout() {
    if (pending.value) return;

    pending.value = true;
    errorKind.value = null;
    errorMessage.value = "";

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      errorKind.value = "unknown";
      errorMessage.value = "Não foi possível encerrar a sessão. Tente novamente.";
    } finally {
      pending.value = false;
    }
  }

  function clearAuthError() {
    errorKind.value = null;
    errorMessage.value = "";
  }

  return {
    user,
    pending: readonly(pending),
    errorKind: readonly(errorKind),
    errorMessage: readonly(errorMessage),
    clearAuthError,
    loginWithGoogle,
    logout,
  };
}