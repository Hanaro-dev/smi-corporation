<template>
  <div class="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
    <div class="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Mon Profil</h1>
      
      <!-- Section d'informations utilisateur -->
      <div class="mb-8">
        <div class="flex items-center mb-6">
          <!-- Avatar -->
          <div class="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium mr-6">
            {{ userInitials }}
          </div>
          
          <!-- Informations de base -->
          <div>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ userName }}</h2>
            <p class="text-gray-600 dark:text-gray-300">{{ user?.email }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
v-for="permission in userPermissions" :key="permission" 
                    class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {{ permission }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Formulaire de modification -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Modifier mes informations</h3>
        
        <form class="space-y-4" @submit.prevent="updateProfile">
          <!-- Champ Nom -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
            <input 
              id="name" 
              v-model="formData.name" 
              type="text" 
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
          
          <!-- Champ Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              id="email" 
              v-model="formData.email" 
              type="email" 
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
          
          <!-- Champ Mot de passe -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau mot de passe (laisser vide pour ne pas changer)
            </label>
            <input 
              id="password" 
              v-model="formData.password" 
              type="password" 
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
          
          <!-- Message d'information sur la base de données simulée -->
          <div class="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
            <p class="text-sm">
              En mode développement, les modifications de profil sont simulées et ne seront pas persistantes.
            </p>
          </div>
          
          <!-- Boutons -->
          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button 
              type="button" 
              class="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" 
              @click="resetForm"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Mise à jour...</span>
              <span v-else>Mettre à jour</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import { toast } from '~/composables/useToast';

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

// Store et composables
const auth = useAuthStore();
const { user } = storeToRefs(auth);
const { success, error: showError } = toast;

// États
const isSubmitting = ref(false);
const formData = ref({
  name: '',
  email: '',
  password: '',
});

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

// Charger les données initiales du formulaire
onMounted(() => {
  resetForm();
});

// Réinitialiser le formulaire avec les données utilisateur actuelles
const resetForm = () => {
  if (user.value) {
    formData.value = {
      name: user.value.name || user.value.username || '',
      email: user.value.email || '',
      password: '',
    };
  }
};

// Soumettre le formulaire de mise à jour
const updateProfile = async () => {
  isSubmitting.value = true;
  
  try {
    // Simulation de mise à jour en mode développement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mettre à jour l'utilisateur dans le store (simulation)
    auth.login({
      ...user.value,
      name: formData.value.name,
      email: formData.value.email,
    });
    
    addToast('Profil mis à jour avec succès', 'success');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil', error);
    addToast('Erreur lors de la mise à jour du profil', 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>