<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Gestion des Pages</h1>
    
    <div class="flex mb-4 space-x-4">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="showCreateForm = true">
        Créer une nouvelle page
      </button>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        @click="viewMode = viewMode === 'list' ? 'tree' : 'list'">
        {{ viewMode === 'list' ? 'Vue arborescente' : 'Vue liste' }}
      </button>
    </div>
    
    <!-- Vue liste -->
    <div v-if="viewMode === 'list'">
      <ul class="space-y-4">
        <li v-for="page in pages" :key="page.id" class="border rounded p-3 bg-white dark:bg-gray-800">
          <div v-if="editId !== page.id" class="space-y-2">
            <div class="flex items-center">
              <span 
                class="text-lg font-semibold"
                :class="{'opacity-70': page.status === 'draft'}"
              >
                {{ page.title }}
              </span>
              
              <span 
                class="ml-2 px-2 py-0.5 text-xs rounded-full"
                :class="page.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
              >
                {{ page.status === 'published' ? 'Publié' : 'Brouillon' }}
              </span>
              
              <span v-if="page.parentId" class="ml-2 text-xs text-gray-500">
                Parent: {{ getParentTitle(page.parentId) }}
              </span>
            </div>
            
            <div class="text-sm text-gray-600 dark:text-gray-400">
              URL: /{{ page.slug }}
            </div>
            
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ truncateContent(sanitizedContent(page.content)) }}
            </div>
            
            <div class="flex space-x-2 mt-2">
              <button
                class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                @click="startEdit(page)">
                Modifier
              </button>
              <button
                v-if="page.status === 'draft'"
                class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                @click="updateStatus(page.id, 'published')">
                Publier
              </button>
              <button
                v-else
                class="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                @click="updateStatus(page.id, 'draft')">
                Dépublier
              </button>
              <button
                class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                @click="confirmDelete(page)">
                Supprimer
              </button>
            </div>
          </div>
          
          <!-- Formulaire d'édition -->
          <form v-else class="space-y-3" @submit.prevent="updatePage(page.id)">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
              <input
                v-model="editTitle"
                placeholder="Titre de la page"
                class="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug (URL)</label>
              <div class="flex items-center">
                <span class="text-gray-500 mr-1">/</span>
                <input
                  v-model="editSlug"
                  placeholder="url-de-la-page"
                  class="flex-1 px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Page parente</label>
              <select
                v-model="editParentId"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option :value="null">Aucune (page racine)</option>
                <option 
                  v-for="p in possibleParents(page.id)" 
                  :key="p.id" 
                  :value="p.id"
                >
                  {{ p.title }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
              <select
                v-model="editStatus"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenu</label>
              <TipTapEditor v-model="editContent" />
            </div>
            
            <div class="flex space-x-2">
              <button
                type="submit"
                class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Enregistrer
              </button>
              <button
                type="button"
                class="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                @click="cancelEdit">
                Annuler
              </button>
            </div>
          </form>
        </li>
      </ul>
    </div>
    
    <!-- Vue arborescente -->
    <div v-else-if="viewMode === 'tree'" class="border rounded p-4 bg-white dark:bg-gray-800">
      <div v-if="treePages.length === 0" class="text-gray-500">
        Aucune page trouvée. Créez votre première page.
      </div>
      <ul class="space-y-2">
        <PageTreeItem 
          v-for="page in treePages" 
          :key="page.id" 
          :page="page"
          @edit="startEdit"
          @delete="confirmDelete"
          @update-status="updateStatus"
        />
      </ul>
    </div>
    
    <!-- Formulaire de création de page -->
    <div v-if="showCreateForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-semibold mb-4">Créer une nouvelle page</h2>
        
        <form class="space-y-4" @submit.prevent="createPage">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
            <input
              v-model="newTitle"
              placeholder="Titre de la page"
              class="w-full px-3 py-2 border rounded-md"
              required
              @input="generateSlug"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug (URL)</label>
            <div class="flex items-center">
              <span class="text-gray-500 mr-1">/</span>
              <input
                v-model="newSlug"
                placeholder="url-de-la-page"
                class="flex-1 px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Page parente</label>
            <select
              v-model="newParentId"
              class="w-full px-3 py-2 border rounded-md"
            >
              <option :value="null">Aucune (page racine)</option>
              <option v-for="page in pages" :key="page.id" :value="page.id">
                {{ page.title }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
            <select
              v-model="newStatus"
              class="w-full px-3 py-2 border rounded-md"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenu</label>
            <TipTapEditor v-model="newContent" />
          </div>
          
          <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>
          
          <div class="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              class="px-4 py-2 border text-gray-700 rounded hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="showCreateForm = false">
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Boîte de dialogue de confirmation de suppression -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-medium mb-3">Confirmer la suppression</h3>
        <p class="mb-4">
          Êtes-vous sûr de vouloir supprimer la page "{{ pageToDelete?.title }}" ?
          <span v-if="hasChildren(pageToDelete?.id)" class="block text-red-600 mt-2">
            Attention : Cette page a des pages enfants. Vous devez d'abord supprimer ou déplacer ces pages.
          </span>
        </p>
        <div class="flex justify-end space-x-2">
          <button
            class="px-3 py-1 border rounded"
            @click="showDeleteConfirm = false">
            Annuler
          </button>
          <button
            class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            :disabled="hasChildren(pageToDelete?.id)"
            @click="deletePage(pageToDelete?.id)">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import DOMPurify from "dompurify";
import { useAppToast } from "~/composables/useAppToast";
import html2bbcode from "html2bbcode";
import bbcode2html from "bbcode-to-html";
import TipTapEditor from "~/components/TipTapEditor.vue";

// Composant pour l'affichage arborescent
const PageTreeItem = defineComponent({
  name: 'PageTreeItem',
  props: {
    page: { type: Object, required: true }
  },
  emits: ['edit', 'delete', 'update-status'],
  template: `
    <li class="pl-4 border-l">
      <div class="flex items-center py-1">
        <span 
          class="font-medium"
          :class="{'opacity-70': page.status === 'draft'}"
        >
          {{ page.title }}
        </span>
        
        <span 
          class="ml-2 px-2 py-0.5 text-xs rounded-full"
          :class="page.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'"
        >
          {{ page.status === 'published' ? 'Publié' : 'Brouillon' }}
        </span>
        
        <div class="ml-auto flex space-x-1">
          <button
            class="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            @click="$emit('edit', page)">
            Modifier
          </button>
          <button
            v-if="page.status === 'draft'"
            class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            @click="$emit('update-status', page.id, 'published')">
            Publier
          </button>
          <button
            v-else
            class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            @click="$emit('update-status', page.id, 'draft')">
            Dépublier
          </button>
          <button
            class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            @click="$emit('delete', page)">
            Supprimer
          </button>
        </div>
      </div>
      
      <!-- Afficher récursivement les enfants -->
      <ul v-if="page.children && page.children.length" class="mt-1 space-y-1">
        <PageTreeItem 
          v-for="child in page.children" 
          :key="child.id" 
          :page="child"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @update-status="(id, status) => $emit('update-status', id, status)"
        />
      </ul>
    </li>
  `
});

// État
const pages = ref([]);
const viewMode = ref('list');
const treePages = ref([]);
const showCreateForm = ref(false);
const showDeleteConfirm = ref(false);
const pageToDelete = ref(null);

// Formulaire de création
const newTitle = ref("");
const newContent = ref("");
const newSlug = ref("");
const newParentId = ref(null);
const newStatus = ref("draft");

// Formulaire d'édition
const editId = ref(null);
const editTitle = ref("");
const editContent = ref("");
const editSlug = ref("");
const editParentId = ref(null);
const editStatus = ref("draft");

const errorMessage = ref("");

const { addToast } = useAppToast();

// Récupération des pages
onMounted(async () => {
  await fetchPages();
  await fetchPagesTree();
});

const fetchPages = async () => {
  try {
    const res = await $fetch("/api/pages");
    pages.value = res.pages;
  } catch (error) {
    console.error(error);
    addToast("Erreur lors du chargement des pages.", "error", 4000);
  }
};

const fetchPagesTree = async () => {
  try {
    const res = await $fetch("/api/pages/tree");
    treePages.value = res.tree;
  } catch (error) {
    console.error(error);
    addToast("Erreur lors du chargement de l'arborescence.", "error", 4000);
  }
};

// Fonctions utilitaires
const sanitizeHtml = (html) => DOMPurify.sanitize(html);

const sanitizedContent = (bbcodeContent) => {
  if (!bbcodeContent) return "";
  return sanitizeHtml(bbcode2html(bbcodeContent));
};

const truncateContent = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
};

const generateSlug = () => {
  if (newTitle.value) {
    newSlug.value = newTitle.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
};

const getParentTitle = (parentId) => {
  const parent = pages.value.find(p => p.id === parentId);
  return parent ? parent.title : 'Inconnu';
};

const possibleParents = (currentId) => {
  // Ne pas autoriser une page à être son propre parent ou un de ses descendants
  return pages.value.filter(p => p.id !== currentId && !isDescendantOf(p.id, currentId));
};

const isDescendantOf = (pageId, possibleAncestorId) => {
  const page = pages.value.find(p => p.id === pageId);
  if (!page || !page.parentId) return false;
  if (page.parentId === possibleAncestorId) return true;
  return isDescendantOf(page.parentId, possibleAncestorId);
};

const hasChildren = (pageId) => {
  if (!pageId) return false;
  return pages.value.some(p => p.parentId === pageId);
};

// Actions CRUD
const createPage = async () => {
  if (!newTitle.value.trim()) {
    addToast("Le titre est requis.", "error", 4000);
    return;
  }
  
  try {
    // Convertir le HTML de l'éditeur en BBCode avant envoi à l'API
    const bbcode = html2bbcode(newContent.value);
    const res = await $fetch("/api/pages", {
      method: "POST",
      body: {
        title: newTitle.value,
        content: bbcode,
        slug: newSlug.value,
        parentId: newParentId.value,
        status: newStatus.value
      },
    });
    
    // Rafraîchir les données
    await fetchPages();
    await fetchPagesTree();
    
    addToast("Page créée avec succès.", "success", 4000);
    newTitle.value = "";
    newContent.value = "";
    newSlug.value = "";
    newParentId.value = null;
    newStatus.value = "draft";
    showCreateForm.value = false;
  } catch (error) {
    console.error(error);
    if (error.data && error.data.message) {
      errorMessage.value = JSON.stringify(error.data.message);
    } else {
      addToast("Erreur lors de la création.", "error", 4000);
    }
  }
};

const startEdit = (page) => {
  editId.value = page.id;
  editTitle.value = page.title;
  editContent.value = bbcode2html(page.content || "");
  editSlug.value = page.slug;
  editParentId.value = page.parentId;
  editStatus.value = page.status;
};

const updatePage = async (id) => {
  if (!editTitle.value.trim()) {
    addToast("Le titre est requis.", "error", 4000);
    return;
  }
  
  try {
    // Convertir le HTML de l'éditeur en BBCode avant envoi à l'API
    const bbcode = html2bbcode(editContent.value);
    const res = await $fetch(`/api/pages/${id}`, {
      method: "PUT",
      body: {
        title: editTitle.value,
        content: bbcode,
        slug: editSlug.value,
        parentId: editParentId.value,
        status: editStatus.value
      },
    });
    
    // Rafraîchir les données
    await fetchPages();
    await fetchPagesTree();
    
    addToast("Page modifiée avec succès.", "success", 4000);
    cancelEdit();
  } catch (error) {
    console.error(error);
    if (error.data && error.data.message) {
      errorMessage.value = JSON.stringify(error.data.message);
    } else {
      addToast("Erreur lors de la modification.", "error", 4000);
    }
  }
};

const updateStatus = async (id, status) => {
  try {
    await $fetch(`/api/pages/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    
    // Rafraîchir les données
    await fetchPages();
    await fetchPagesTree();
    
    addToast(
      status === 'published' ? "Page publiée." : "Page mise en brouillon.", 
      "success", 
      4000
    );
  } catch (error) {
    console.error(error);
    addToast("Erreur lors de la mise à jour du statut.", "error", 4000);
  }
};

const cancelEdit = () => {
  editId.value = null;
  editTitle.value = "";
  editContent.value = "";
  editSlug.value = "";
  editParentId.value = null;
  editStatus.value = "draft";
  errorMessage.value = "";
};

const confirmDelete = (page) => {
  pageToDelete.value = page;
  showDeleteConfirm.value = true;
};

const deletePage = async (id) => {
  if (!id) return;
  
  try {
    await $fetch(`/api/pages/${id}`, {
      method: "DELETE",
    });
    
    // Rafraîchir les données
    await fetchPages();
    await fetchPagesTree();
    
    addToast("Page supprimée.", "warning", 4000);
    showDeleteConfirm.value = false;
  } catch (error) {
    console.error(error);
    if (error.data && error.data.message) {
      addToast(error.data.message, "error", 4000);
    } else {
      addToast("Erreur lors de la suppression.", "error", 4000);
    }
  }
};
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
</style>
