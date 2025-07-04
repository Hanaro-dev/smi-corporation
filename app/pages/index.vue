<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Section Hero -->
    <section class="py-12 md:py-20">
      <UContainer>
        <div class="flex flex-col md:flex-row items-center justify-between gap-12">
          <div class="flex-1">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Bienvenue sur la <span class="text-blue-600 dark:text-blue-400">Plateforme SMI</span>
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Une solution complète pour gérer vos contenus, utilisateurs et médias en toute simplicité.
            </p>
            <div class="flex flex-wrap gap-4">
              <NuxtLink 
                to="/auth/register" 
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Créer un compte
              </NuxtLink>
              <NuxtLink 
                to="/auth/login" 
                class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-lg font-medium transition"
              >
                Se connecter
              </NuxtLink>
            </div>
          </div>
          <div class="flex-1 flex justify-center">
            <img
              src="~/assets/images/smi-headerfull.png"
              alt="SMI Corporation"
              class="max-w-full h-auto"
            >
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Section Fonctionnalités -->
    <section class="py-16 bg-white dark:bg-gray-800">
      <UContainer>
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Fonctionnalités principales</h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Notre plateforme offre tout ce dont vous avez besoin pour gérer votre contenu numérique.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Fonctionnalité 1 -->
          <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <span class="text-2xl text-blue-600 dark:text-blue-400">👥</span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Gestion des utilisateurs</h3>
            <p class="text-gray-600 dark:text-gray-300">
              Créez et gérez facilement les comptes utilisateurs avec différents niveaux de permissions.
            </p>
          </div>
          
          <!-- Fonctionnalité 2 -->
          <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <span class="text-2xl text-purple-600 dark:text-purple-400">📄</span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Édition de pages</h3>
            <p class="text-gray-600 dark:text-gray-300">
              Un éditeur intuitif pour créer et modifier vos pages avec une mise en forme riche.
            </p>
          </div>
          
          <!-- Fonctionnalité 3 -->
          <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <span class="text-2xl text-green-600 dark:text-green-400">🖼️</span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Gestion des médias</h3>
            <p class="text-gray-600 dark:text-gray-300">
              Téléchargez et organisez vos images et autres médias pour une utilisation simple dans vos contenus.
            </p>
          </div>
        </div>
      </UContainer>
    </section>
    
    <!-- Section Appel à l'action -->
    <section class="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <UContainer>
        <div class="text-center">
          <h2 class="text-3xl font-bold mb-6">Prêt à commencer ?</h2>
          <p class="text-xl mb-8 max-w-2xl mx-auto">
            Rejoignez notre plateforme dès aujourd'hui et bénéficiez de tous les outils nécessaires pour gérer votre contenu digital.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink 
              to="/auth/register" 
              class="px-6 py-3 bg-white text-blue-700 hover:bg-gray-100 rounded-lg font-medium transition"
            >
              S'inscrire maintenant
            </NuxtLink>
            <NuxtLink 
              to="/auth/login" 
              class="px-6 py-3 border-2 border-white hover:bg-white hover:text-blue-700 rounded-lg font-medium transition"
            >
              Se connecter
            </NuxtLink>
          </div>
        </div>
      </UContainer>
    </section>
    
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
// Suppression du console.log inutile
const colorMode = useColorMode();
</script>
