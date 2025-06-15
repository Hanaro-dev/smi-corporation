<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-lg w-full p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg text-center">
      <div class="text-6xl font-bold mb-4 text-yellow-500">
        <span class="fa fa-exclamation-triangle"/>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Une erreur est survenue</h1>
      <p class="text-gray-600 dark:text-gray-300 mb-8">
        Nous rencontrons actuellement des difficultés techniques. Veuillez réessayer ultérieurement.
      </p>
      <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
        <NuxtLink 
          to="/"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Retour à l'accueil
        </NuxtLink>
        <button
          class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg font-medium transition"
          @click="refresh"
        >
          Rafraîchir la page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Mise à jour du titre de la page
useHead({
  title: 'Erreur | SMI Corporation',
});

// Fonction pour rafraîchir la page
const refresh = () => {
  window.location.reload();
};
</script>