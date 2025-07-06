<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Images</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Téléchargez, organisez et gérez les images utilisées sur le site
        </p>
      </div>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          @click="activeTab = 'upload'"
        >
          <Icon name="heroicons:arrow-up-tray" class="w-4 h-4 mr-2" />
          Télécharger
        </button>
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="showBulkActions = !showBulkActions"
        >
          <Icon name="heroicons:cog-6-tooth" class="w-4 h-4 mr-2" />
          Actions
        </button>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:photo" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total images</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.totalImages }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:server" class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Espace utilisé</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSize(stats.totalSize) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:squares-plus" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Formats</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.formats?.length || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:clock" class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière upload</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatLastUpload() }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Formats badge -->
    <div v-if="stats.formats?.length" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Formats d'images détectés</h3>
      <div class="flex flex-wrap gap-2">
        <span 
          v-for="format in stats.formats" 
          :key="format.name"
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
          :class="getFormatClass(format.name)"
        >
          {{ format.name.toUpperCase() }}
          <span class="ml-1.5 opacity-75">({{ format.count }})</span>
        </span>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div class="flex flex-col lg:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une image..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <select
            v-model="sortBy"
            class="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="created_desc">Plus récent</option>
            <option value="created_asc">Plus ancien</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="name_desc">Nom Z-A</option>
            <option value="size_desc">Taille décroissante</option>
            <option value="size_asc">Taille croissante</option>
          </select>
          <select
            v-model="formatFilter"
            class="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tous les formats</option>
            <option v-for="format in stats.formats" :key="format.name" :value="format.name">
              {{ format.name.toUpperCase() }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="border-b border-gray-200 dark:border-gray-700 px-4">
        <div class="flex space-x-8">
          <button 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'gallery' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
            @click="activeTab = 'gallery'"
          >
            <Icon name="heroicons:photo" class="w-4 h-4 mr-2 inline" />
            Galerie ({{ stats.totalImages }})
          </button>
          <button 
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'upload' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
            @click="activeTab = 'upload'"
          >
            <Icon name="heroicons:arrow-up-tray" class="w-4 h-4 mr-2 inline" />
            Télécharger
          </button>
        </div>
      </div>

      <!-- Contenu des onglets -->
      <div class="p-4">
        <div v-if="activeTab === 'gallery'">
          <ImageGallery 
            ref="galleryRef"
            :search-query="searchQuery"
            :sort-by="sortBy"
            :format-filter="formatFilter"
            @image-deleted="handleImageDeleted"
            @image-updated="handleImageUpdated"
          />
        </div>

        <div v-else-if="activeTab === 'upload'">
          <ImageUploader 
            ref="uploaderRef"
            @upload-success="handleUploadSuccess"
            @upload-progress="handleUploadProgress"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { toast } from '~/composables/useToast';

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  permission: 'edit' // Permission pour gérer les images
});

const { error: showError } = toast;

// État
const activeTab = ref('gallery');
const galleryRef = ref(null);
const uploaderRef = ref(null);
const showBulkActions = ref(false);
const searchQuery = ref('');
const sortBy = ref('created_desc');
const formatFilter = ref('all');
const stats = ref({
  totalImages: 0,
  totalSize: 0,
  formats: [],
  lastUpload: null
});

// Formater la taille en octets, Ko, Mo, etc.
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

// Obtenir la classe CSS en fonction du format d'image
const getFormatClass = (format) => {
  const classes = {
    jpeg: 'bg-blue-100 text-blue-800',
    jpg: 'bg-blue-100 text-blue-800',
    png: 'bg-green-100 text-green-800',
    gif: 'bg-purple-100 text-purple-800',
    webp: 'bg-yellow-100 text-yellow-800',
    svg: 'bg-pink-100 text-pink-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  return classes[format.toLowerCase()] || classes.default;
};

// Charger les statistiques
const loadStats = async () => {
  try {
    const response = await $fetch('/api/images/stats');
    stats.value = response;
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    showError('Erreur lors du chargement des statistiques');
  }
};

// Gérer le téléchargement réussi d'une image
const handleUploadSuccess = (uploadedImage) => {
  // Actualiser les statistiques
  loadStats();
  
  // Si l'utilisateur souhaite voir l'image dans la galerie
  if (uploadedImage) {
    // Basculer vers l'onglet galerie
    activeTab.value = 'gallery';
    
    // Actualiser la galerie
    if (galleryRef.value) {
      galleryRef.value.loadImages();
    }
  }
};

// Gérer la suppression d'une image
const handleImageDeleted = () => {
  loadStats();
};

// Gérer la mise à jour d'une image
const handleImageUpdated = () => {
  loadStats();
};

// Gérer le progrès de téléchargement
const handleUploadProgress = (_progress) => {
  // Optionnel : afficher le progrès
};

// Formater la dernière date d'upload
const formatLastUpload = () => {
  if (!stats.value.lastUpload) return 'Aucune';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(stats.value.lastUpload));
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
</style>
