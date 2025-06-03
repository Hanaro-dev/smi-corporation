<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Gestion des Pages</h1>
    <button
      class="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      @click="showCreateForm = true">
      Créer une nouvelle page
    </button>
    <ul>
      <li v-for="page in pages" :key="page.id" class="flex items-center mb-2">
        <span v-if="editId !== page.id" class="flex-1"
          >{{ page.title }}
          <span class="text-gray-600 text-sm">{{
            sanitizedContent(page.contentHtml)
          }}</span>
        </span>
        <input
          v-else
          v-model="editTitle"
          class="flex-1 px-2 py-1 border rounded mr-2"
          @keyup.enter="updatePage(page.id)"
          @blur="cancelEdit" >
        <textarea
          v-model="editContent"
          placeholder="Contenu de la page"
          class="px-2 py-1 border rounded min-h-[120px]" />
        <button
          v-if="editId !== page.id"
          class="ml-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          @click="startEdit(page)">
          Modifier
        </button>
        <button
          v-if="editId === page.id"
          class="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          @click="updatePage(page.id)">
          Enregistrer
        </button>
        <button
          v-if="editId === page.id"
          class="ml-2 px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
          @click="cancelEdit">
          Annuler
        </button>
        <button
          class="ml-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          @click="deletePage(page.id)">
          Supprimer
        </button>
      </li>
    </ul>
    <div v-if="showCreateForm" class="mt-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-2">Créer une page</h2>
      <form class="flex flex-col gap-2" @submit.prevent="createPage">
        <input
          v-model="newTitle"
          placeholder="Titre de la page"
          class="px-2 py-1 border rounded" >
        <TipTapEditor v-model="newContent" />
        <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>
        <div class="flex gap-2">
          <button
            type="submit"
            class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Créer
          </button>
          <button
            type="button"
            class="px-4 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
            @click="showCreateForm = false">
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DOMPurify from "dompurify";
import { useToast } from "~/composables/useAppToast";
import { html2bbcode } from "html-to-bbcode";
import bbcode2html from "bbcode-to-html";
import TipTapEditor from "~/components/TipTapEditor.vue";

const pages = ref([]);
const showCreateForm = ref(false);
const newTitle = ref("");
const newContent = ref("");
const editId = ref(null);
const editTitle = ref("");
const editContent = ref("");
const errorMessage = ref("");

const { addToast } = useToast();

onMounted(async () => {
  try {
    const res = await $fetch("/api/pages");
    pages.value = res.pages;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    addToast("Erreur lors du chargement des pages.", "error", 4000);
  }
});
const sanitizeHtml = (html) => DOMPurify.sanitize(html);

const sanitizedContent = (contentHtml) => {
  return sanitizeHtml(contentHtml);
};

const createPage = async () => {
  if (!newTitle.value.trim()) {
    addToast("Le titre est requis.", "error", 4000);
    return;
  }
  try {
    // Convertir le HTML de l’éditeur en BBCode avant envoi à l’API
    const bbcode = html2bbcode(newContent.value);
    const res = await $fetch("/api/pages", {
      method: "POST",
      body: {
        title: newTitle.value,
        content: bbcode,
      },
    });
    // Stocker aussi la version HTML pour affichage immédiat
    pages.value.push({ ...res, contentHtml: newContent.value });
    addToast("Page créée avec succès.", "success", 4000);
    newTitle.value = "";
    newContent.value = "";
    showCreateForm.value = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    addToast("Erreur lors de la création.", "error", 4000);
  }
};

const startEdit = (page) => {
  editId.value = page.id;
  editTitle.value = page.title;
  // Convertir le BBCode stocké en HTML pour l’éditeur
  editContent.value = bbcode2html(page.content || "");
};

const updatePage = async (id) => {
  if (!editTitle.value.trim()) {
    addToast("Le titre est requis.", "error", 4000);
    return;
  }
  try {
    // Convertir le HTML de l’éditeur en BBCode avant envoi à l’API
    const bbcode = html2bbcode(editContent.value);
    const res = await $fetch(`/api/pages/${id}`, {
      method: "PUT",
      body: {
        title: editTitle.value,
        content: bbcode,
      },
    });
    const idx = pages.value.findIndex((p) => p.id === id);
    if (idx !== -1)
      pages.value[idx] = { ...res, contentHtml: editContent.value };
    addToast("Page modifiée.", "success", 4000);
    editId.value = null;
    editTitle.value = "";
    editContent.value = "";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    addToast("Erreur lors de la modification.", "error", 4000);
  }
};

const cancelEdit = () => {
  editId.value = null;
  editTitle.value = "";
  editContent.value = "";
};

const deletePage = async (id) => {
  try {
    await $fetch(`/api/pages/${id}`, {
      method: "DELETE",
    });
    pages.value = pages.value.filter((page) => page.id !== id);
    addToast("Page supprimée.", "warning", 4000);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    addToast("Erreur lors de la suppression.", "error", 4000);
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
