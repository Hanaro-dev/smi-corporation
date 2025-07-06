<template>
  <header>
    <nav class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="flex items-center">
          <img
            src="../assets/logos/smi-logo.png"
            alt="Logo SMI"
            class="w-14 h-14 mr-4"
          >
          <span class="text-4xl font-bold text-gray-300">Corporation</span>
        </NuxtLink>
      </div>
      
      <!-- Menu de navigation -->
      <div class="flex items-center gap-6">
        <!-- Liens de navigation pour utilisateurs connectés -->
        <ul v-if="isAuthenticated" class="hidden md:flex gap-6 items-center">
          <li>
            <NuxtLink to="/admin/users" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Utilisateurs</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/pages" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Pages</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/images" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Images</NuxtLink>
          </li>
        </ul>
        
        <!-- Actions utilisateur -->
        <div class="flex gap-4 items-center">
          <ThemeSelector />
          
          <!-- Lien de connexion pour utilisateurs non connectés -->
          <div v-if="!isAuthenticated">
            <NuxtLink to="/auth/login" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Connexion</NuxtLink>
          </div>
          
          <!-- Menu utilisateur pour utilisateurs connectés -->
          <div v-else class="user-menu">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import ThemeSelector from '~/components/ThemeSelector.vue'
import UserMenu from '~/components/UserMenu.vue'

const auth = useAuthStore()
const { isAuthenticated } = storeToRefs(auth)
</script>

<style>
.user-menu {
  position: relative;
  z-index: 50;
}
</style>
