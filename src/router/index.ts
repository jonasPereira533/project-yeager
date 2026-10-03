import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", name: "main-page", component: () => import("../views/main-page.vue") },
  { path: "/cases", name: "case-page", component: () => import("../views/case-page.vue") },
  {
    path: "/solution",
    name: "solution-page",
    component: () => import("../views/solution-page.vue"),
  },
  {
    // Sem esta rota, um URL digitado errado renderiza só o header e o footer,
    // porque o router-view não casa com nada e fica vazio.
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/not-found-page.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // Âncora dentro da página, ex.: /#como-jogar.
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    if (savedPosition) return savedPosition;

    // Sem isto, `scroll-behavior: smooth` no base.css preserva o offset de
    // rolagem anterior e /cases abre no meio da página.
    return { top: 0 };
  },
});

// Um deploy no meio da sessão deixa um chunk em cache指向 a versão antiga e o
// import dinâmico falha. Sem isto o router fica morto sem nenhuma mensagem.
router.onError((error, to) => {
  const isChunkError =
    /Loading( CSS)? chunk|Failed to fetch|dynamically imported module/i.test(
      String(error?.message ?? error),
    );

  if (isChunkError) {
    // Recarrega uma vez; se for um erro real de chunk, não entra em loop.
    const key = "yeager:chunk-reload";
    if (sessionStorage.getItem(key) !== to.fullPath) {
      sessionStorage.setItem(key, to.fullPath);
      window.location.assign(to.fullPath);
      return;
    }
  }

  console.error("Falha ao navegar para", to.fullPath, error);
});

export default router;