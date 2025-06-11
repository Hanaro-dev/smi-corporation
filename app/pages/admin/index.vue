<template>
  <div class="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Tableau de bord</h1>
      
      <!-- Carte d'information utilisateur -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div class="flex items-center mb-4">
          <div class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium mr-4">
            {{ userInitials }}
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Bienvenue, {{ userName }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ user?.email }}</p>
            <div class="mt-1 flex flex-wrap gap-2">
              <span v-for="permission in userPermissions" :key="permission" 
                   class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {{ permission }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Notification du mode développement -->
        <div class="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 mt-4">
          <p class="text-sm">
            ⚠️ Cette application utilise actuellement une base de données simulée. Certaines fonctionnalités sont limitées en mode développement.
          </p>
        </div>
      </div>
      
      <!-- Grille de modules d'administration -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Module Utilisateurs -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div class="p-5 bg-blue-50 dark:bg-blue-900">
            <div class="flex items-center">
              <span class="text-2xl text-blue-600 dark:text-blue-400 mr-3">👥</span>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Utilisateurs</h3>
            </div>
          </div>
          <div class="p-5">
            <p class="text-gray-600 dark:text-gray-400 mb-4">Gérer les utilisateurs, leurs rôles et permissions.</p>
            <NuxtLink 
              to="/admin/users" 
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Gérer les utilisateurs
            </NuxtLink>
          </div>
        </div>
        
        <!-- Module Pages -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div class="p-5 bg-purple-50 dark:bg-purple-900">
            <div class="flex items-center">
              <span class="text-2xl text-purple-600 dark:text-purple-400 mr-3">📄</span>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Pages</h3>
            </div>
          </div>
          <div class="p-5">
            <p class="text-gray-600 dark:text-gray-400 mb-4">Créer et modifier les pages du site.</p>
            <NuxtLink 
              to="/admin/pages" 
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              Gérer les pages
            </NuxtLink>
          </div>
        </div>
        
        <!-- Module Images -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div class="p-5 bg-green-50 dark:bg-green-900">
            <div class="flex items-center">
              <span class="text-2xl text-green-600 dark:text-green-400 mr-3">🖼️</span>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Images</h3>
            </div>
          </div>
          <div class="p-5">
            <p class="text-gray-600 dark:text-gray-400 mb-4">Gérer les images et autres médias.</p>
            <NuxtLink 
              to="/admin/images" 
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Gérer les images
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';

// Store et données utilisateur
const auth = useAuthStore();
const { user } = storeToRefs(auth);

// Calculer les initiales de l'utilisateur pour l'avatar
const userInitials = computed(() => {
  if (!user.value || !user.value.name) return '?';
  
  return user.value.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
});

// Nom d'utilisateur pour l'affichage
const userName = computed(() => {
  return user.value?.name || user.value?.username || 'Utilisateur';
});

// Permissions utilisateur
const userPermissions = computed(() => {
  return user.value?.permissions || [];
});
</script>