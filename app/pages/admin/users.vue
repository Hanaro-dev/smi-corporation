<template>
  <div>
    <h1>Gestion des Utilisateurs</h1>
    <button @click="showCreateForm = true">Créer un nouvel utilisateur</button>
    <div v-if="isLoading">Chargement...</div>
    <ul>
      <li v-for="user in paginatedUsers" :key="user.id">
        {{ user.name }} ({{ user.role }})
        <button @click="editUser(user)">Modifier</button>
        <button @click="deleteUser(user.id)">Supprimer</button>
        <button
          class="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          Action
        </button>
      </li>
    </ul>
    <button :disabled="currentPage === 1" @click="currentPage--">
      Précédent
    </button>
    <button
      :disabled="currentPage * itemsPerPage >= users.length"
      @click="currentPage++">
      Suivant
    </button>

    <button :disabled="isLoading" @click="fetchUsers">
      <span v-if="isLoading">Chargement...</span>
      <span v-else>Charger les utilisateurs</span>
    </button>

    <div v-if="showCreateForm">
      <h2>Créer un utilisateur</h2>
      <UserForm
        :user="newUser"
        :errors="errors"
        submit-label="Créer"
        :handle-submit="validateAndCreateUser" />
    </div>

    <div v-if="selectedUser">
      <h2>Modifier l'utilisateur</h2>
      <form @submit.prevent="updateUser">
        <input v-model="selectedUser.name" placeholder="Nom" >
        <select v-model="selectedUser.role">
          <option value="admin">Admin</option>
          <option value="editor">Éditeur</option>
          <option value="viewer">Lecteur</option>
        </select>
        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { validateUser } from "~/utils/validators";

const users = ref([]);
const showCreateForm = ref(false);
const newUser = ref({ name: "", role: "" });
const errors = ref({ name: "", role: "" });
const isLoading = ref(false);
const selectedUser = ref(null);

const currentPage = ref(1);
const itemsPerPage = 10;
const totalUsers = ref(0);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return users.value.slice(start, end);
});

definePageMeta({
  middleware: "auth",
  permission: "manage_users", // Permission requise
});

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
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await fetchUsers();
});

// Fonction pour valider les champs du formulaire
const validateAndCreateUser = async () => {
  const errors = validateUser(newUser.value);
  if (Object.keys(errors).length > 0) {
    console.error(errors);
    return;
  }
  // Créer l'utilisateur
};

const editUser = (user) => {
  selectedUser.value = { ...user };
};

const updateUser = async () => {
  try {
    const updatedUser = await $fetch(`/api/users/${selectedUser.value.id}`, {
      method: "PUT",
      body: selectedUser.value,
    });
    const index = users.value.findIndex((u) => u.id === updatedUser.id);
    users.value[index] = updatedUser;
    selectedUser.value = null;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
  }
};

const deleteUser = async (id) => {
  try {
    await $fetch(`/api/users/${id}`, {
      method: "DELETE",
    });
    users.value = users.value.filter((user) => user.id !== id);
    addToast("Utilisateur supprimé avec succès.", "success", 5000);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    addToast("Erreur lors de la suppression de l'utilisateur.", "error", 7000);
  }
};
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
