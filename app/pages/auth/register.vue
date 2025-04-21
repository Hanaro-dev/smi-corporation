<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
        Inscription
      </h1>
      <form @submit.prevent="handleRegister">
        <div class="mb-4">
          <label
            for="username"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nom d'utilisateur
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Entrez votre nom d'utilisateur"
            required
          >
        </div>
        <div class="mb-4">
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Adresse e-mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Entrez votre e-mail"
            required
          >
        </div>
        <div class="mb-6">
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Mot de passe
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Entrez votre mot de passe"
            required
          >
        </div>
        <button
          type="submit"
          class="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          :disabled="loading"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Inscription...
          </span>
          <span v-else>S'inscrire</span>
        </button>
      </form>
      <p v-if="error" class="mt-4 text-sm text-center text-red-600 dark:text-red-400">
        {{ error }}
      </p>
      <p class="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
        Vous avez déjà un compte ?
        <NuxtLink
          to="/auth/login"
          class="text-blue-600 hover:underline dark:text-blue-400"
        >
          Connectez-vous
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const router = useRouter();

const handleRegister = async () => {
  error.value = "";
  loading.value = true;
  try {
    // Remplacement de axios par $fetch
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        username: username.value,
        email: email.value,
        password: password.value,
      },
    });
    // Redirection après inscription réussie
    router.push("/auth/login");
  } catch (e) {
    error.value = e.data?.message || "Erreur lors de l'inscription.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Aucun style personnalisé nécessaire, TailwindCSS gère tout */
</style>
