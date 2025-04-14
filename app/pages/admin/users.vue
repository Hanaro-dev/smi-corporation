<template>
  <div>
    <h1>Gestion des Utilisateurs</h1>
    <button @click="createUser">Créer un nouvel utilisateur</button>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} ({{ user.role }})
        <button @click="editUser(user.id)">Modifier</button>
        <button @click="deleteUser(user.id)">Supprimer</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, name: 'Admin', role: 'admin' },
  { id: 2, name: 'Editor', role: 'editor' },
]);

const createUser = () => {
  alert('Créer un nouvel utilisateur');
};

const editUser = (id) => {
  alert(`Modifier l'utilisateur ${id}`);
};

const deleteUser = (id) => {
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
</style>