<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/use-auth";
import { useProgress } from "../../composables/use-progress";

const router = useRouter();
const { user, loginWithGoogle, logout } = useAuth();
const { totalXP, level } = useProgress();

const goToMainPage = () => {
  router.push({ name: 'main-page' });
}

const handleAuthClick = () => {
  if (user.value) {
    logout();
  } else {
    loginWithGoogle();
  }
}
</script>

<template>
  <header>
    <button type="button" class="logo" @click="goToMainPage">
      YEAGAR<span>.</span>
    </button>
    <div class="nav-links">
      <div class="xp-badge">
        <span class="xp-value">{{ totalXP }} XP</span>
      </div>
      <button type="button" class="login-link" @click="handleAuthClick">
        {{ user ? 'Sair' : 'Entrar' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:1.5rem 5vw;
  border-bottom:1px solid var(--rule);
}
.logo{
  font-family:'Special Elite', monospace;
  font-size:1.3rem;
  letter-spacing:0.06em;
  background:none;
  border:none;
  color:var(--ink);
  padding:0;
  cursor:pointer;
}
.logo span{ color:var(--amber); }
.nav-links{
  display:flex;
  align-items:center;
  gap: 2rem;
}
.xp-badge{
  display:flex;
  align-items:baseline;
  gap:0.5rem;
  font-family:'IBM Plex Mono', monospace;
  font-size:0.85rem;
}
.xp-value{
  color:var(--ink-muted);
  font-weight:600;
}
.xp-level{
  color:var(--ink-muted);
}
.login-link{
  font-family:'IBM Plex Mono', monospace;
  font-size:0.85rem;
  color:var(--ink-muted);
  background:none;
  text-decoration:none;
  border:1px solid var(--rule);
  padding:0.5rem 1rem;
  border-radius:2px;
  cursor:pointer;
  transition:border-color 0.2s, color 0.2s;
}
.login-link:hover{ border-color:var(--ink-muted); color:var(--ink); }
</style>