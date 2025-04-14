<template>
  <div class="p-6 shadow rounded-lg">
    <h1 class="text-2xl font-bold mb-4">Bienvenue dans le panneau d'administration</h1>
    <p>Utilisez le menu pour gérer les différentes sections.</p>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
});
</script>

<style scoped>
/* Aucun style personnalisé nécessaire, TailwindCSS gère tout */
</style>