import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "main-page",
    component: () => import("../views/main-page.vue"),
  },
  {
    path: "/cases",
    name: "case-page",
    component: () => import("../views/case-page.vue"),
  },
  {
    path: "/solution",
    name: "solution-page",
    component: () => import("../views/solution-page.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/not-found-page.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.onError((error, to) => {
  const isChunkError =
    /Loading( CSS)? chunk|Failed to fetch|dynamically imported module/i.test(
      String(error?.message ?? error),
    );

  if (isChunkError) {
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
