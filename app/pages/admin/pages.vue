<template>
  <div>
    <h1>Gestion des Pages</h1>
    <button @click="createPage">Créer une nouvelle page</button>
    <ul>
      <li v-for="page in pages" :key="page.id">
        {{ page.title }}
        <button @click="editPage(page.id)">Modifier</button>
        <button @click="deletePage(page.id)">Supprimer</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const pages = ref([
  { id: 1, title: 'Page 1' },
  { id: 2, title: 'Page 2' },
]);

const createPage = () => {
  alert('Créer une nouvelle page');
};

const editPage = (id) => {
  alert(`Modifier la page ${id}`);
};

const deletePage = (id) => {
  pages.value = pages.value.filter((page) => page.id !== id);
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