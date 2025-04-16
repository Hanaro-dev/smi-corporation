<template>
  <div>
    <h1>Gestion des Pages</h1>
    <button @click="showCreateForm = true">Créer une nouvelle page</button>
    <ul>
      <li v-for="page in pages" :key="page.id">
        <span v-if="editId !== page.id">{{ page.title }}</span>
        <input
          v-else
          v-model="editTitle"
          @keyup.enter="updatePage(page.id)"
          @blur="cancelEdit"
        >
        <button v-if="editId !== page.id" @click="startEdit(page)">Modifier</button>
        <button v-if="editId === page.id" @click="updatePage(page.id)">Enregistrer</button>
        <button v-if="editId === page.id" @click="cancelEdit">Annuler</button>
        <button @click="deletePage(page.id)">Supprimer</button>
      </li>
    </ul>
    <div v-if="showCreateForm">
      <h2>Créer une page</h2>
      <form @submit.prevent="createPage">
        <input v-model="newTitle" placeholder="Titre de la page" >
        <button type="submit">Créer</button>
        <button type="button" @click="showCreateForm = false">Annuler</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from '~/composables/useToast';

const pages = ref([]);
const showCreateForm = ref(false);
const newTitle = ref('');
const editId = ref(null);
const editTitle = ref('');

const { addToast } = useToast();

// Charger les pages au montage
onMounted(async () => {
  try {
    const res = await axios.get('/api/pages');
    pages.value = res.data;
  } catch (e) {
    addToast('Erreur lors du chargement des pages.', 'error', 4000);
  }
});

const createPage = async () => {
  if (!newTitle.value.trim()) {
    addToast('Le titre est requis.', 'error', 4000);
    return;
  }
  try {
    const res = await axios.post('/api/pages', { title: newTitle.value });
    pages.value.push(res.data);
    addToast('Page créée avec succès.', 'success', 4000);
    newTitle.value = '';
    showCreateForm.value = false;
  } catch (e) {
    addToast('Erreur lors de la création.', 'error', 4000);
  }
};

const startEdit = (page) => {
  editId.value = page.id;
  editTitle.value = page.title;
};

const updatePage = async (id) => {
  if (!editTitle.value.trim()) {
    addToast('Le titre est requis.', 'error', 4000);
    return;
  }
  try {
    const res = await axios.put(`/api/pages/${id}`, { title: editTitle.value });
    const idx = pages.value.findIndex((p) => p.id === id);
    if (idx !== -1) pages.value[idx] = res.data;
    addToast('Page modifiée.', 'success', 4000);
    editId.value = null;
    editTitle.value = '';
  } catch (e) {
    addToast('Erreur lors de la modification.', 'error', 4000);
  }
};

const cancelEdit = () => {
  editId.value = null;
  editTitle.value = '';
};

const deletePage = async (id) => {
  try {
    await axios.delete(`/api/pages/${id}`);
    pages.value = pages.value.filter((page) => page.id !== id);
    addToast('Page supprimée.', 'warning', 4000);
  } catch (e) {
    addToast('Erreur lors de la suppression.', 'error', 4000);
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
input {
  margin-right: 0.5rem;
}
</style>