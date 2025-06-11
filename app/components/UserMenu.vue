<template>
  <div class="relative">
    <!-- Bouton du menu utilisateur -->
    <button
      @click="toggleMenu"
      class="flex items-center text-gray-400 hover:text-blue-600 focus:outline-none"
    >
      <!-- Avatar utilisateur (cercle avec initiales si pas de photo) -->
      <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium mr-2">
        {{ userInitials }}
      </div>
      <!-- Nom d'utilisateur et icône -->
      <span class="mr-1">{{ userName }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        :class="{ 'transform rotate-180': isOpen }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Menu déroulant -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
    >
      <div class="px-4 py-2 text-sm text-gray-700 border-b border-gray-200 dark:text-gray-200 dark:border-gray-700">
        Connecté en tant que <span class="font-bold">{{ userName }}</span>
      </div>
      
      <NuxtLink
        to="/admin"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Tableau de bord
      </NuxtLink>
      
      <NuxtLink
        to="/admin/profile"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Mon profil
      </NuxtLink>
      
      <button
        @click="handleLogout"
        class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Déconnexion
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const auth = useAuthStore();
const { user } = storeToRefs(auth);

const isOpen = ref(false);

// Calculer les initiales de l'utilisateur pour l'avatar
const userInitials = computed(() => {
  if (!user.value || !user.value.name) return '?';
  
  // Extraire les initiales (première lettre de chaque mot du nom)
  return user.value.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2); // Limiter à 2 caractères
});

// Nom d'utilisateur pour l'affichage
const userName = computed(() => {
  return user.value?.name || user.value?.username || 'Utilisateur';
});

// Basculer l'état du menu
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

// Gérer la déconnexion
const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
    auth.logout();
    router.push('/auth/login');
  } catch (error) {
    console.error('Erreur lors de la déconnexion', error);
  }
};

// Fermer le menu si on clique en dehors
const handleClickOutside = (event) => {
  // Obtenir l'élément parent qui contient ce composant
  const menu = event.target.closest('.user-menu');
  const button = event.target.closest('button');
  
  // Si le clic n'est pas dans le menu ou sur le bouton qui l'ouvre, fermer le menu
  if (isOpen.value && !menu && !button) {
    isOpen.value = false;
  }
};

// Ajouter et supprimer l'écouteur d'événement de clic
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>