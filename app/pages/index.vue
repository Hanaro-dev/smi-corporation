<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Chargement -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
    
    <!-- Erreur -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
        <p class="text-gray-600 dark:text-gray-400">{{ error.message || 'Impossible de charger la page d\'accueil' }}</p>
      </div>
    </div>
    
    <!-- Contenu de la page -->
    <div v-else-if="page" class="container mx-auto px-4 py-8">
      <PageRenderer :page="page" />
    </div>
    
    <!-- Page par défaut si aucune page "accueil" trouvée -->
    <div v-else class="container mx-auto px-4 py-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Bienvenue sur SMI Corporation
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          La page d'accueil n'a pas encore été configurée.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink 
            to="/auth/login" 
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Se connecter
          </NuxtLink>
          <NuxtLink 
            to="/auth/register" 
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg font-medium transition"
          >
            Créer un compte
          </NuxtLink>
        </div>
      </div>
    </div>
    
    <!-- Pied de page -->
    <footer class="py-8 bg-gray-100 dark:bg-gray-800 text-center">
      <UContainer>
        <p class="text-gray-600 dark:text-gray-300">
          © {{ new Date().getFullYear() }} SMI Corporation. Tous droits réservés.
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          En mode développement avec base de données simulée.
        </p>
      </UContainer>
    </footer>
  </div>
</template>

<script setup>
// Charger la page d'accueil depuis la base de données
const { data: page, pending, error } = await useFetch('/api/pages/by-slug/accueil', {
  server: true,
  default: () => null
})
</script>
