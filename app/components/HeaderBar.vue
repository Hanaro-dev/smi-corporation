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
      <ul class="flex gap-6 items-center">
        <li v-if="!isAuthenticated">
          <NuxtLink to="/auth/login" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Connexion</NuxtLink>
        </li>
        <template v-else>
          <li>
            <NuxtLink to="/admin/users" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Utilisateurs</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/pages" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Pages</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/admin/images" class="text-lg text-gray-400 hover:text-blue-600 font-medium">Images</NuxtLink>
          </li>
        </template>
        <li>
          <ColorModePicker />
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import ColorModePicker from '~/components/ColorModePicker.vue'

const auth = useAuthStore()
const { isAuthenticated } = storeToRefs(auth)
</script>

<style></style>
