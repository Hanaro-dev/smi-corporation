<template>
  <div class="relative user-menu">
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
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Rôle: {{ userRole }}
        </div>
      </div>
      
      <!-- Tableau de bord (visible pour tous les utilisateurs connectés) -->
      <NuxtLink
        to="/admin"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Tableau de bord
      </NuxtLink>
      
      <!-- Gestion des utilisateurs (visible pour admin ou avec permission) -->
      <NuxtLink
        v-if="canManageUsers"
        to="/admin/users"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Gestion des utilisateurs
      </NuxtLink>
      
      <!-- Gestion des rôles (visible pour admin ou avec permission) -->
      <NuxtLink
        v-if="canManageRoles"
        to="/admin/permissions"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Rôles et permissions
      </NuxtLink>
      
      <!-- Gestion des pages (visible pour admin ou éditeurs) -->
      <NuxtLink
        v-if="canEditContent"
        to="/admin/pages"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Gestion des pages
      </NuxtLink>
      
      <!-- Profil utilisateur -->
      <NuxtLink
        to="/admin/profile"
        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="isOpen = false"
      >
        Mon profil
      </NuxtLink>
      
      <!-- Déconnexion -->
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
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const { $auth } = useNuxtApp();

const isOpen = ref(false);

// Calculer les initiales de l'utilisateur pour l'avatar
const userInitials = computed(() => {
  if (!authStore.user || !authStore.user.name) return '?';
  
  // Extraire les initiales (première lettre de chaque mot du nom)
  return authStore.user.name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2); // Limiter à 2 caractères
});

// Nom d'utilisateur pour l'affichage
const userName = computed(() => {
  return authStore.username;
});

// Rôle de l'utilisateur pour l'affichage
const userRole = computed(() => {
  return authStore.role ? authStore.role.charAt(0).toUpperCase() + authStore.role.slice(1) : 'Utilisateur';
});

// Vérifier les permissions pour l'affichage conditionnel des liens
const canManageUsers = computed(() => {
  return authStore.hasAnyPermission(['admin', 'manage_users']);
});

const canManageRoles = computed(() => {
  return authStore.hasAnyPermission(['admin', 'manage_roles', 'manage_permissions']);
});

const canEditContent = computed(() => {
  return authStore.hasAnyPermission(['admin', 'edit']);
});

// Basculer l'état du menu
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

// Gérer la déconnexion
const handleLogout = async () => {
  try {
    // Utiliser la méthode de déconnexion du plugin auth
    await $auth.logout();
    // La redirection est gérée par le plugin
  } catch (error) {
    console.error('Erreur lors de la déconnexion', error);
  }
};

// Fermer le menu si on clique en dehors
const handleClickOutside = (event) => {
  // Si le menu est ouvert et que le clic n'est pas dans le composant user-menu
  if (isOpen.value && !event.target.closest('.user-menu')) {
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