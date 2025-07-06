<template>
  <div
    class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <div
      class="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h1
        class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
        Connexion
      </h1>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adresse e-mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Entrez votre e-mail"
            required
            autocomplete="username" >
        </div>
        <div class="mb-6">
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mot de passe
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Entrez votre mot de passe"
            required
            autocomplete="current-password" >
        </div>
        <button
          type="submit"
          class="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          :disabled="loading">
          <span v-if="loading" class="flex items-center justify-center">
            <svg
              class="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4" />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Connexion...
          </span>
          <span v-else>Se connecter</span>
        </button>
      </form>
      <p
        v-if="error"
        class="mt-4 text-sm text-center text-red-600 dark:text-red-400">
        {{ error }}
      </p>
      <p class="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
        Pas encore de compte ?
        <NuxtLink
          to="/auth/register"
          class="text-blue-600 hover:underline dark:text-blue-400">
          Inscrivez-vous
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { toast } from "~/composables/useToast";
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const router = useRouter();
const { success, error: showError } = toast;
const { login: authLogin } = useAuth();

// Récupérer l'URL de redirection depuis la query string ou utiliser la page d'accueil par défaut
const route = useRoute();
const redirectTo = ref(route.query.redirect || "/");

const handleLogin = async () => {
  error.value = "";
  loading.value = true;
  
  try {
    const result = await authLogin({
      email: email.value,
      password: password.value
    });

    if (result.success) {
      // Afficher un toast de succès
      success(`Connexion réussie!`);
      
      // Vider les champs
      email.value = "";
      password.value = "";
      
      // Rediriger l'utilisateur
      router.push(redirectTo.value);
    } else {
      error.value = result.error || "Erreur lors de la connexion.";
      showError(error.value);
    }
  } catch (e) {
    console.error("Erreur login:", e);
    error.value = e.message || "Erreur lors de la connexion.";
    showError(error.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Aucun style personnalisé nécessaire, TailwindCSS gère tout */
</style>
