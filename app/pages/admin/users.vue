<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <h1 class="text-2xl font-bold mb-4 text-gray-800">
      Gestion des Utilisateurs
    </h1>
    <button
      class="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      @click="showCreateForm = true">
      Créer un nouvel utilisateur
    </button>
    
    <!-- Bannière d'avertissement pour la base de données simulée -->
    <div class="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
      <div class="flex items-center">
        <div class="py-1">
          <svg class="h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p class="font-bold">Mode développement</p>
          <p class="text-sm">Cette application utilise actuellement une base de données simulée. Certaines fonctionnalités comme la suppression et la modification d'utilisateurs sont limitées.</p>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center text-gray-500">Chargement...</div>
    <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>
    <ul class="space-y-4">
      <li
        v-for="user in users"
        :key="user.id"
        class="flex items-center justify-between bg-white p-4 rounded shadow">
        <span>{{ user.name }} ({{ user.role }})</span>
        <div class="flex space-x-2">
          <button
            class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            @click="editUser(user)">
            Modifier
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            @click="deleteUser(user.id)">
            Supprimer
          </button>
        </div>
      </li>
    </ul>
    <div class="mt-4 flex justify-between">
      <button
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
        @click="currentPage--"
      >
        Précédent
      </button>
      <button
        :disabled="currentPage * itemsPerPage >= totalUsers"
        class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
        @click="currentPage++"
      >
        Suivant
      </button>
    </div>

    <UserForm
      v-if="showCreateForm || selectedUser"
      :user="selectedUser || newUser"
      :errors="errors"
      :submit-label="selectedUser ? 'Mettre à jour' : 'Créer'"
      :handle-submit="selectedUser ? updateUser : validateAndCreateUser" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import UserForm from "~/components/UserForm.vue";

const users = ref([]);
const totalUsers = ref(0);
const currentPage = ref(1);
const itemsPerPage = 10;
const isLoading = ref(false);
const showCreateForm = ref(false);
const selectedUser = ref(null);
const newUser = ref({ name: "", role_id: null });
const errors = ref({});
const errorMessage = ref("");

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const res = await $fetch(
      `/api/users?page=${currentPage.value}&limit=${itemsPerPage}`
    );
    users.value = res.users;
    totalUsers.value = res.total;
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs :", error);
    errorMessage.value = "Erreur lors du chargement des utilisateurs.";
  } finally {
    isLoading.value = false;
  }
};

const validateAndCreateUser = async () => {
  // Validation et création d'utilisateur
};

const updateUser = async () => {
  // Mise à jour d'utilisateur
};

const deleteUser = async (id) => {
  try {
    await $fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    errorMessage.value = "Erreur lors de la suppression de l'utilisateur.";
  }
};

fetchUsers();
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
button {
  margin-left: 1rem;
}
.error {
  color: red;
  font-size: 0.875rem;
  margin-left: 0.5rem;
}
</style>
