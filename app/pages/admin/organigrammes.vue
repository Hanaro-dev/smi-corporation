<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Organigrammes</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Créez et gérez les organigrammes de l'entreprise</p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="viewMode = viewMode === 'list' ? 'grid' : 'list'"
        >
          <Icon :name="viewMode === 'list' ? 'heroicons:squares-2x2' : 'heroicons:list-bullet'" class="w-4 h-4 mr-2" />
          {{ viewMode === 'list' ? 'Vue grille' : 'Vue liste' }}
        </button>
        <button
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          @click="showCreateForm = true"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouvel organigramme
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:building-office" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total organigrammes</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ organigrammes.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:eye" class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Publiés</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ publishedOrganigrammes }}</p>
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
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ draftOrganigrammes }}</p>
          </div>
        </div>
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
              placeholder="Rechercher un organigramme..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
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
            class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            @click="clearFilters"
          >
            Effacer
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Chargement des organigrammes...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="errorMessage" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <span class="text-red-800 dark:text-red-200">{{ errorMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Organigrammes list/grid -->
    <div v-else-if="filteredOrganigrammes.length === 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
      <div class="text-center">
        <Icon name="heroicons:building-office" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">Aucun organigramme ne correspond à vos critères</p>
      </div>
    </div>

    <!-- Vue liste -->
    <div v-else-if="viewMode === 'list'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des organigrammes</h3>
      </div>
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="organigramme in filteredOrganigrammes" :key="organigramme.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white" :class="{'opacity-70': organigramme.status === 'draft'}">
                  {{ organigramme.title }}
                </h4>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="organigramme.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'"
                >
                  <Icon :name="organigramme.status === 'published' ? 'heroicons:eye' : 'heroicons:pencil-square'" class="w-3 h-3 mr-1" />
                  {{ organigramme.status === 'published' ? 'Publié' : 'Brouillon' }}
                </span>
              </div>
              
              <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span class="flex items-center">
                  <Icon name="heroicons:link" class="w-4 h-4 mr-1" />
                  {{ organigramme.slug }}
                </span>
                <span class="flex items-center">
                  <Icon name="heroicons:calendar" class="w-4 h-4 mr-1" />
                  {{ formatDate(organigramme.updatedAt || organigramme.createdAt) }}
                </span>
              </div>
              
              <p v-if="organigramme.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ organigramme.description }}
              </p>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              <button
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                @click="editOrganigramme(organigramme)"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button
                v-if="organigramme.status === 'draft'"
                class="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                @click="updateStatus(organigramme.id, 'published')"
              >
                <Icon name="heroicons:eye" class="w-4 h-4 mr-1" />
                Publier
              </button>
              <button
                v-else
                class="inline-flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
                @click="updateStatus(organigramme.id, 'draft')"
              >
                <Icon name="heroicons:eye-slash" class="w-4 h-4 mr-1" />
                Dépublier
              </button>
              <button
                class="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                @click="confirmDelete(organigramme)"
              >
                <Icon name="heroicons:trash" class="w-4 h-4 mr-1" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue grille -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="organigramme in filteredOrganigrammes" 
        :key="organigramme.id" 
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2" :class="{'opacity-70': organigramme.status === 'draft'}">
              {{ organigramme.title }}
            </h3>
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2"
              :class="organigramme.status === 'published' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'"
            >
              {{ organigramme.status === 'published' ? 'Publié' : 'Brouillon' }}
            </span>
          </div>
          
          <p v-if="organigramme.description" class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {{ organigramme.description }}
          </p>
          
          <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
            <Icon name="heroicons:calendar" class="w-4 h-4 mr-1" />
            {{ formatDate(organigramme.updatedAt || organigramme.createdAt) }}
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {{ organigramme.slug }}
            </span>
            <div class="flex space-x-1">
              <button
                class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                @click="editOrganigramme(organigramme)"
                title="Modifier"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4" />
              </button>
              <button
                v-if="organigramme.status === 'draft'"
                class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                @click="updateStatus(organigramme.id, 'published')"
                title="Publier"
              >
                <Icon name="heroicons:eye" class="w-4 h-4" />
              </button>
              <button
                v-else
                class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                @click="updateStatus(organigramme.id, 'draft')"
                title="Dépublier"
              >
                <Icon name="heroicons:eye-slash" class="w-4 h-4" />
              </button>
              <button
                class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                @click="confirmDelete(organigramme)"
                title="Supprimer"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition -->
    <div v-if="showCreateForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {{ selectedOrganigramme ? 'Modifier l\'organigramme' : 'Créer un organigramme' }}
        </h3>
        
        <form class="space-y-4" @submit.prevent="selectedOrganigramme ? updateOrganigramme() : createOrganigramme()">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
            <input
              v-model="formData.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              :class="{ 'border-red-500': errors.title }"
            >
            <span v-if="errors.title" class="text-red-500 text-sm">{{ errors.title }}</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optionnelle)</label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              :class="{ 'border-red-500': errors.description }"
            ></textarea>
            <span v-if="errors.description" class="text-red-500 text-sm">{{ errors.description }}</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select
              v-model="formData.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
          
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <span class="text-red-800 dark:text-red-200 text-sm">{{ errorMessage }}</span>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="resetForm"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {{ selectedOrganigramme ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirmer la suppression</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Êtes-vous sûr de vouloir supprimer l'organigramme <strong>{{ organigrammeToDelete?.title }}</strong> ? Cette action est irréversible.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="showDeleteConfirm = false; organigrammeToDelete = null"
          >
            Annuler
          </button>
          <button
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            @click="deleteOrganigramme(organigrammeToDelete?.id)"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { toast } from "~/composables/useToast";

// Configuration de la page
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  permission: 'manage_organigrammes'
});

const { success, error: showError, warning } = toast;

// État
const organigrammes = ref([]);
const isLoading = ref(false);
const viewMode = ref('list');
const showCreateForm = ref(false);
const showDeleteConfirm = ref(false);
const selectedOrganigramme = ref(null);
const organigrammeToDelete = ref(null);
const errorMessage = ref("");
const errors = ref({});

// Filtres et recherche
const searchQuery = ref('');
const statusFilter = ref('all');

// Form data
const formData = ref({
  title: '',
  description: '',
  status: 'draft'
});

// Computed properties
const filteredOrganigrammes = computed(() => {
  let filtered = organigrammes.value;
  
  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(org => 
      org.title.toLowerCase().includes(query) ||
      (org.description && org.description.toLowerCase().includes(query)) ||
      org.slug.toLowerCase().includes(query)
    );
  }
  
  // Filtrer par statut
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(org => org.status === statusFilter.value);
  }
  
  return filtered;
});

const publishedOrganigrammes = computed(() => organigrammes.value.filter(o => o.status === 'published').length);
const draftOrganigrammes = computed(() => organigrammes.value.filter(o => o.status === 'draft').length);

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

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    status: 'draft'
  };
  selectedOrganigramme.value = null;
  showCreateForm.value = false;
  errors.value = {};
  errorMessage.value = '';
};

// API functions
const fetchOrganigrammes = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await $fetch('/api/organigrammes');
    organigrammes.value = response.organigrammes || [];
  } catch (error) {
    console.error('Erreur lors du chargement des organigrammes:', error);
    errorMessage.value = 'Erreur lors du chargement des organigrammes.';
    organigrammes.value = [];
  } finally {
    isLoading.value = false;
  }
};

const createOrganigramme = async () => {
  errors.value = {};
  errorMessage.value = '';
  
  try {
    const response = await $fetch('/api/organigrammes', {
      method: 'POST',
      body: formData.value
    });
    
    await fetchOrganigrammes();
    success('Organigramme créé avec succès.');
    resetForm();
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    if (error.data?.message && typeof error.data.message === 'object') {
      errors.value = error.data.message;
    } else {
      errorMessage.value = error.data?.message || 'Erreur lors de la création de l\'organigramme.';
    }
  }
};

const editOrganigramme = (organigramme) => {
  selectedOrganigramme.value = organigramme;
  formData.value = {
    title: organigramme.title,
    description: organigramme.description || '',
    status: organigramme.status
  };
  showCreateForm.value = true;
};

const updateOrganigramme = async () => {
  if (!selectedOrganigramme.value) return;
  
  errors.value = {};
  errorMessage.value = '';
  
  try {
    const response = await $fetch(`/api/organigrammes/${selectedOrganigramme.value.id}`, {
      method: 'PUT',
      body: formData.value
    });
    
    await fetchOrganigrammes();
    success('Organigramme modifié avec succès.');
    resetForm();
  } catch (error) {
    console.error('Erreur lors de la modification:', error);
    if (error.data?.message && typeof error.data.message === 'object') {
      errors.value = error.data.message;
    } else {
      errorMessage.value = error.data?.message || 'Erreur lors de la modification de l\'organigramme.';
    }
  }
};

const updateStatus = async (id, status) => {
  try {
    await $fetch(`/api/organigrammes/${id}`, {
      method: 'PATCH',
      body: { status }
    });
    
    await fetchOrganigrammes();
    success(status === 'published' ? 'Organigramme publié.' : 'Organigramme mis en brouillon.');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    showError('Erreur lors de la mise à jour du statut.');
  }
};

const confirmDelete = (organigramme) => {
  organigrammeToDelete.value = organigramme;
  showDeleteConfirm.value = true;
};

const deleteOrganigramme = async (id) => {
  if (!id) return;
  
  try {
    await $fetch(`/api/organigrammes/${id}`, {
      method: 'DELETE'
    });
    
    await fetchOrganigrammes();
    warning('Organigramme supprimé.');
    showDeleteConfirm.value = false;
    organigrammeToDelete.value = null;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showError('Erreur lors de la suppression de l\'organigramme.');
  }
};

onMounted(() => {
  fetchOrganigrammes();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>