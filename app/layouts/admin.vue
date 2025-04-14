<template>
  <div class="flex h-screen">
    <!-- Navigation -->
    <nav class="w-64 bg-gray-100 p-4">
      <ul class="space-y-4">
        <li>
          <NuxtLink
            to="/ADMIN"
            class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            active-class="bg-gray-200 text-gray-900"
          >
            Tableau de bord
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/ADMIN/pages"
            class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            active-class="bg-gray-200 text-gray-900"
          >
            Pages
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/ADMIN/users"
            class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            active-class="bg-gray-200 text-gray-900"
          >
            Utilisateurs
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/ADMIN/permissions"
            class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            active-class="bg-gray-200 text-gray-900"
          >
            Permissions
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/ADMIN/organigrammes"
            class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            active-class="bg-gray-200 text-gray-900"
          >
            Organigrammes
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/ADMIN/images"
            class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            active-class="bg-gray-200 text-gray-900"
          >
            Images
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 p-6 bg-gray-50">
      <slot />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* Aucun style personnalisé nécessaire, TailwindCSS gère tout */
</style>