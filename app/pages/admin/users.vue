<template>
  <div>
    <h1>Gestion des Utilisateurs</h1>
    <button @click="showCreateForm = true">Créer un nouvel utilisateur</button>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} ({{ user.role }})
        <button @click="editUser(user)">Modifier</button>
        <button @click="deleteUser(user.id)">Supprimer</button>
        <button
          class="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          Action
        </button>
      </li>
    </ul>

    <div v-if="showCreateForm">
      <h2>Créer un utilisateur</h2>
      <form @submit.prevent="validateAndCreateUser">
        <div>
          <input v-model="newUser.name" placeholder="Nom" />
          <span v-if="errors.name" class="text-red-600 text-sm ml-2">{{
            errors.name
          }}</span>
        </div>
        <div>
          <input v-model="newUser.role" placeholder="Rôle" />
          <span v-if="errors.role" class="error">{{ errors.role }}</span>
        </div>
        <button type="submit">Créer</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const users = ref([]);
const showCreateForm = ref(false);
const newUser = ref({ name: "", role: "" });
const errors = ref({ name: "", role: "" });

definePageMeta({
  middleware: "auth",
  permission: "manage_users", // Permission requise
});

onMounted(async () => {
  users.value = await $fetch("/api/users");

  // Notification d'information
  addToast("Chargement des données en cours...", "info", 3000);
});

// Fonction pour valider les champs du formulaire
const validateAndCreateUser = async () => {
  // Réinitialiser les erreurs
  errors.value = { name: "", role: "" };

  // Valider le champ "name"
  if (!newUser.value.name) {
    errors.value.name = "Le nom est requis.";
  } else if (newUser.value.name.length < 3) {
    errors.value.name = "Le nom doit contenir au moins 3 caractères.";
  }

  // Valider le champ "role"
  if (!newUser.value.role) {
    errors.value.role = "Le rôle est requis.";
  }

  // Si aucune erreur, soumettre le formulaire
  if (!errors.value.name && !errors.value.role) {
    try {
      const response = await axios.post("/api/users", newUser.value);
      users.value.push(response.data);
      newUser.value = { name: "", role: "" }; // Réinitialiser le formulaire
      showCreateForm.value = false;

      // Afficher une notification de succès
      addToast("Utilisateur créé avec succès !", "success", 5000);
    } catch (error) {
      // Afficher une notification d'erreur
      addToast("Erreur lors de la création de l'utilisateur.", "error", 7000);
    }
  }
};

const editUser = (user) => {
  alert(`Modifier l'utilisateur ${user.id}`);

  // Notification d'avertissement
  addToast("Attention : action irréversible.", "warning", 4000);
};

const deleteUser = async (id) => {
  await axios.delete(`/api/users/${id}`);
  users.value = users.value.filter((user) => user.id !== id);
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
