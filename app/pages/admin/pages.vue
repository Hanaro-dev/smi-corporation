<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Pages</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Créez et gérez le contenu de votre site</p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          @click="viewMode = viewMode === 'list' ? 'tree' : 'list'"
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Icon :name="viewMode === 'list' ? 'heroicons:squares-2x2' : 'heroicons:list-bullet'" class="w-4 h-4 mr-2" />
          {{ viewMode === 'list' ? 'Vue arborescente' : 'Vue liste' }}
        </button>
        <button
          @click="showCreateForm = true"
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouvelle page
        </button>
      </div>
    </div>

    <!-- Search and filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une page..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
          </select>
          <button
            @click="clearFilters"
            class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Effacer
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:document-text" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total pages</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ pages.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:eye" class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Publiées</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ publishedPages }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:pencil-square" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Brouillons</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ draftPages }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Vue liste -->
    <div v-if="viewMode === 'list'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des pages</h3>
      </div>
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-if="filteredPages.length === 0" class="p-8 text-center">
          <Icon name="heroicons:document-text" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">Aucune page ne correspond à vos critères</p>
        </div>
        <div v-for="page in filteredPages" :key="page.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div v-if="editId !== page.id" class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white" :class="{'opacity-70': page.status === 'draft'}">
                  {{ page.title }}
                </h4>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="page.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'"
                >
                  <Icon :name="page.status === 'published' ? 'heroicons:eye' : 'heroicons:pencil-square'" class="w-3 h-3 mr-1" />
                  {{ page.status === 'published' ? 'Publié' : 'Brouillon' }}
                </span>
                <span v-if="page.parentId" class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  <Icon name="heroicons:arrow-up-right" class="w-3 h-3 mr-1" />
                  {{ getParentTitle(page.parentId) }}
                </span>
              </div>
              
              <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span class="flex items-center">
                  <Icon name="heroicons:link" class="w-4 h-4 mr-1" />
                  /{{ page.slug }}
                </span>
                <span class="flex items-center">
                  <Icon name="heroicons:calendar" class="w-4 h-4 mr-1" />
                  {{ formatDate(page.updatedAt || page.createdAt) }}
                </span>
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ truncateContent(sanitizedContent(page.content)) }}
              </p>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              <button
                @click="startEdit(page)"
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button
                v-if="page.status === 'draft'"
                @click="updateStatus(page.id, 'published')"
                class="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Icon name="heroicons:eye" class="w-4 h-4 mr-1" />
                Publier
              </button>
              <button
                v-else
                @click="updateStatus(page.id, 'draft')"
                class="inline-flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Icon name="heroicons:eye-slash" class="w-4 h-4 mr-1" />
                Dépublier
              </button>
              <button
                @click="confirmDelete(page)"
                class="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Icon name="heroicons:trash" class="w-4 h-4 mr-1" />
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
              <!-- Sélecteur de mode d'édition -->
              <div class="mb-3 flex items-center space-x-4">
                <label class="flex items-center">
                  <input 
                    v-model="useBBCodeMode" 
                    type="checkbox" 
                    class="mr-2"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400">Utiliser l'éditeur BBCode avancé</span>
                </label>
                <span v-if="useBBCodeMode" class="text-xs text-blue-600 dark:text-blue-400">
                  Mode BBCode activé - Tags personnalisés disponibles
                </span>
              </div>
              
              <!-- Éditeur BBCode ou TipTap selon le mode sélectionné -->
              <BBCodeEditor 
                v-if="useBBCodeMode"
                v-model="editContent"
                :page-type="'admin'"
                :show-preview-by-default="true"
                @validation="handleBBCodeValidation"
                class="min-h-64"
              />
              <TipTapEditor 
                v-else
                v-model="editContent" 
              />
              
              <!-- Affichage des erreurs de validation BBCode -->
              <div v-if="useBBCodeMode && !bbcodeValidation.isValid" class="mt-2">
                <div 
                  v-for="error in bbcodeValidation.errors" 
                  :key="error"
                  class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 mb-1"
                >
                  {{ error }}
                </div>
              </div>
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
        </div>
      </div>
    </div>
    
    <!-- Vue arborescente -->
    <div v-else-if="viewMode === 'tree'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Arborescence des pages</h3>
      </div>
      <div class="p-4">
        <div v-if="treePages.length === 0" class="text-center py-8">
          <Icon name="heroicons:folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">Aucune page trouvée. Créez votre première page.</p>
        </div>
        <ul v-else class="space-y-2">
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
            <!-- Sélecteur de mode d'édition pour la création -->
            <div class="mb-3 flex items-center space-x-4">
              <label class="flex items-center">
                <input 
                  v-model="useBBCodeMode" 
                  type="checkbox" 
                  class="mr-2"
                />
                <span class="text-sm text-gray-600 dark:text-gray-400">Utiliser l'éditeur BBCode avancé</span>
              </label>
              <span v-if="useBBCodeMode" class="text-xs text-blue-600 dark:text-blue-400">
                Mode BBCode activé - Tags personnalisés disponibles
              </span>
            </div>
            
            <!-- Éditeur BBCode ou TipTap selon le mode sélectionné -->
            <BBCodeEditor 
              v-if="useBBCodeMode"
              v-model="newContent"
              :page-type="'admin'"
              :show-preview-by-default="true"
              @validation="handleBBCodeValidation"
              class="min-h-64"
            />
            <TipTapEditor 
              v-else
              v-model="newContent" 
            />
            
            <!-- Affichage des erreurs de validation BBCode -->
            <div v-if="useBBCodeMode && !bbcodeValidation.isValid" class="mt-2">
              <div 
                v-for="error in bbcodeValidation.errors" 
                :key="error"
                class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 mb-1"
              >
                {{ error }}
              </div>
            </div>
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
import { toast } from "~/composables/useToast";
import html2bbcode from "html2bbcode";
import bbcode2html from "bbcode-to-html";
import TipTapEditor from "~/components/TipTapEditor.vue";
// Importation du système BBCode personnalisé pour l'édition avancée
import BBCodeEditor from "~/components/BBCodeEditor.vue";
import { useBBCode } from "~/composables/useBBCode";

// Configuration de la page
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

// Hook BBCode pour la validation et la gestion des tags personnalisés
const { getAvailableBBCodes, validateBBCode } = useBBCode();

// État pour la gestion du BBCode dans les formulaires
const useBBCodeMode = ref(false);
const bbcodeValidation = ref({ isValid: true, errors: [] });

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

// Filtres et recherche
const searchQuery = ref('');
const statusFilter = ref('all');

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

const { success, error: showError, warning, info } = toast;

// Récupération des pages
onMounted(async () => {
  await fetchPages();
  await fetchPagesTree();
});

const fetchPages = async () => {
  try {
    console.log("Fetching pages from API...");
    const res = await $fetch("/api/pages");
    console.log("Pages fetched successfully:", res);
    pages.value = res.pages;
  } catch (error) {
    console.error("Error fetching pages:", error);
    showError(`Erreur lors du chargement des pages: ${error.message || error}`);
  }
};

const fetchPagesTree = async () => {
  try {
    const res = await $fetch("/api/pages/tree");
    treePages.value = res.tree;
  } catch (error) {
    console.error(error);
    showError("Erreur lors du chargement de l'arborescence.");
  }
};

// Fonctions utilitaires
const sanitizeHtml = (html) => DOMPurify.sanitize(html);

/**
 * Convertit et nettoie le contenu BBCode pour l'affichage
 * Gère à la fois les BBCodes standards et personnalisés
 */
const sanitizedContent = (bbcodeContent) => {
  if (!bbcodeContent) return "";
  
  try {
    // Utiliser le système BBCode personnalisé si des tags custom sont détectés
    const customBBCodePattern = /\[(orgchart|columns|callout|gallery|userinfo|breadcrumb)([^\]]*)?\]/i;
    
    if (customBBCodePattern.test(bbcodeContent)) {
      // Utiliser le parseur BBCode personnalisé pour préserver les éléments custom
      const { parseCustomBBCode } = useBBCode();
      return sanitizeHtml(parseCustomBBCode(bbcodeContent, getAvailableBBCodes('admin')));
    } else {
      // Utiliser le parseur BBCode standard pour les contenus simples
      return sanitizeHtml(bbcode2html(bbcodeContent));
    }
  } catch (error) {
    console.warn('Erreur lors du parsing BBCode:', error);
    return sanitizeHtml(bbcodeContent); // Fallback vers le contenu brut
  }
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

// Computed properties
const filteredPages = computed(() => {
  let filtered = pages.value;
  
  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(page => 
      page.title.toLowerCase().includes(query) ||
      page.slug.toLowerCase().includes(query) ||
      (page.content && page.content.toLowerCase().includes(query))
    );
  }
  
  // Filtrer par statut
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(page => page.status === statusFilter.value);
  }
  
  return filtered;
});

const publishedPages = computed(() => pages.value.filter(p => p.status === 'published').length);
const draftPages = computed(() => pages.value.filter(p => p.status === 'draft').length);

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'Non défini';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
};

// Actions CRUD
// Gestion de la validation BBCode
const handleBBCodeValidation = (validation) => {
  bbcodeValidation.value = validation;
};

/**
 * Crée une nouvelle page avec gestion intelligente du contenu
 * Supporte à la fois le mode BBCode avancé et l'éditeur TipTap classique
 */
const createPage = async () => {
  if (!newTitle.value.trim()) {
    showError("Le titre est requis.");
    return;
  }
  
  // Vérifier la validation BBCode si le mode est activé
  if (useBBCodeMode.value && !bbcodeValidation.value.isValid) {
    showError("Veuillez corriger les erreurs BBCode avant de sauvegarder.");
    return;
  }
  
  try {
    // Gestion intelligente du contenu selon le mode d'édition
    let contentToSave;
    if (useBBCodeMode.value) {
      // En mode BBCode, le contenu est déjà au format BBCode
      contentToSave = newContent.value;
    } else {
      // En mode TipTap, convertir le HTML en BBCode
      contentToSave = html2bbcode(newContent.value);
    }
    // Envoi de la requête avec le contenu préparé
    const res = await $fetch("/api/pages", {
      method: "POST",
      body: {
        title: newTitle.value,
        content: contentToSave,
        slug: newSlug.value,
        parentId: newParentId.value,
        status: newStatus.value,
        // Métadonnées pour identifier le type de contenu
        contentType: useBBCodeMode.value ? 'bbcode' : 'html'
      },
    });
    
    // Rafraîchir les données
    await fetchPages();
    await fetchPagesTree();
    
    success("Page créée avec succès.");
    // Réinitialisation complète du formulaire
    newTitle.value = "";
    newContent.value = "";
    newSlug.value = "";
    newParentId.value = null;
    newStatus.value = "draft";
    useBBCodeMode.value = false; // Réinitialiser le mode d'édition
    bbcodeValidation.value = { isValid: true, errors: [] }; // Réinitialiser la validation
    showCreateForm.value = false;
  } catch (error) {
    console.error(error);
    if (error.data && error.data.message) {
      errorMessage.value = JSON.stringify(error.data.message);
    } else {
      showError("Erreur lors de la création.");
    }
  }
};

/**
 * Initialise le formulaire d'édition d'une page
 * Détecte automatiquement le format du contenu et configure l'éditeur approprié
 */
const startEdit = (page) => {
  editId.value = page.id;
  editTitle.value = page.title;
  editSlug.value = page.slug;
  editParentId.value = page.parentId;
  editStatus.value = page.status;
  
  // Détection intelligente du format de contenu
  const pageContent = page.content || "";
  
  // Vérifier si le contenu contient des BBCodes personnalisés
  const customBBCodePattern = /\[(orgchart|columns|callout|gallery|userinfo|breadcrumb)([^\]]*)?\]/i;
  const hasCustomBBCodes = customBBCodePattern.test(pageContent);
  
  if (hasCustomBBCodes) {
    // Mode BBCode : garder le contenu en BBCode
    useBBCodeMode.value = true;
    editContent.value = pageContent;
    info("Mode BBCode activé - Cette page contient des éléments BBCode personnalisés.");
  } else {
    // Mode classique : convertir BBCode vers HTML pour TipTap
    useBBCodeMode.value = false;
    editContent.value = bbcode2html(pageContent);
  }
  
  // Réinitialiser la validation
  bbcodeValidation.value = { isValid: true, errors: [] };
};

/**
 * Met à jour une page existante avec gestion intelligente du contenu
 * Détecte automatiquement le format et applique les bonnes conversions
 */
const updatePage = async (id) => {
  if (!editTitle.value.trim()) {
    showError("Le titre est requis.");
    return;
  }
  
  // Vérifier la validation BBCode si le mode est activé
  if (useBBCodeMode.value && !bbcodeValidation.value.isValid) {
    showError("Veuillez corriger les erreurs BBCode avant de sauvegarder.");
    return;
  }
  
  try {
    // Gestion intelligente du contenu selon le mode d'édition
    let contentToSave;
    if (useBBCodeMode.value) {
      // En mode BBCode, le contenu est déjà au format BBCode
      contentToSave = editContent.value;
    } else {
      // En mode TipTap, convertir le HTML en BBCode
      contentToSave = html2bbcode(editContent.value);
    }
    // Envoi de la requête avec le contenu préparé
    const res = await $fetch(`/api/pages/${id}`, {
      method: "PUT",
      body: {
        title: editTitle.value,
        content: contentToSave,
        slug: editSlug.value,
        parentId: editParentId.value,
        status: editStatus.value,
        // Métadonnées pour identifier le type de contenu
        contentType: useBBCodeMode.value ? 'bbcode' : 'html'
      },
    });
    
    // Rafraîchir les données
    await fetchPages();
    await fetchPagesTree();
    
    success("Page modifiée avec succès.");
    cancelEdit();
  } catch (error) {
    console.error(error);
    if (error.data && error.data.message) {
      errorMessage.value = JSON.stringify(error.data.message);
    } else {
      showError("Erreur lors de la modification.");
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
    
    success(status === 'published' ? "Page publiée." : "Page mise en brouillon.");
  } catch (error) {
    console.error(error);
    showError("Erreur lors de la mise à jour du statut.");
  }
};

/**
 * Annule l'édition et réinitialise tous les champs du formulaire
 */
const cancelEdit = () => {
  editId.value = null;
  editTitle.value = "";
  editContent.value = "";
  editSlug.value = "";
  editParentId.value = null;
  editStatus.value = "draft";
  useBBCodeMode.value = false; // Réinitialiser le mode d'édition
  bbcodeValidation.value = { isValid: true, errors: [] }; // Réinitialiser la validation
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
    
    warning("Page supprimée.");
    showDeleteConfirm.value = false;
  } catch (error) {
    console.error(error);
    if (error.data && error.data.message) {
      showError(error.data.message);
    } else {
      showError("Erreur lors de la suppression.");
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
