<template>
  <div class="image-gallery">
    <div class="mb-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Galerie d'images ({{ totalImages }})</h3>
        <div class="flex items-center space-x-2">
          <div class="text-sm text-gray-600">
            Espace utilisé: {{ formatSize(totalSpaceUsed) }}
          </div>
          <select 
            v-model="itemsPerPage" 
            class="px-2 py-1 bg-white border rounded text-sm"
            @change="handleItemsPerPageChange"
          >
            <option :value="12">12 par page</option>
            <option :value="24">24 par page</option>
            <option :value="48">48 par page</option>
          </select>
        </div>
      </div>

      <!-- Filtres -->
      <div class="flex flex-wrap gap-2 mb-4">
        <div class="flex-1 min-w-[200px]">
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Rechercher par nom..." 
            class="w-full px-3 py-2 border rounded"
            @input="debouncedSearch"
          >
        </div>
        <div>
          <select 
            v-model="filters.format" 
            class="px-3 py-2 border rounded"
            @change="applyFilters"
          >
            <option value="">Tous les formats</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="gif">GIF</option>
            <option value="webp">WEBP</option>
            <option value="svg">SVG</option>
          </select>
        </div>
        <div>
          <select 
            v-model="filters.date" 
            class="px-3 py-2 border rounded"
            @change="applyFilters"
          >
            <option value="">Toutes dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
        <button 
          class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
          @click="resetFilters"
        >
          Réinitialiser
        </button>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="flex justify-center py-8">
      <PulseLoader :loading="loading" color="#4F46E5" size="15px" />
    </div>

    <!-- Message pas d'images -->
    <div v-else-if="images.length === 0" class="bg-gray-100 rounded-lg p-8 text-center">
      <p class="text-gray-700">Aucune image trouvée</p>
    </div>

    <!-- Grille d'images -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div 
        v-for="image in images" 
        :key="image.id" 
        class="image-card bg-white rounded-lg shadow overflow-hidden"
      >
        <div class="relative aspect-square bg-gray-100">
          <img 
            :src="getThumbnailUrl(image)" 
            :alt="image.altText || image.originalFilename" 
            class="w-full h-full object-cover"
            @click="openImageDetails(image)"
          >
          <div class="absolute inset-0 opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity flex items-center justify-center">
            <div class="flex space-x-2">
              <button 
                class="p-2 bg-white rounded-full hover:bg-gray-100" 
                title="Voir les détails"
                @click.stop="openImageDetails(image)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button 
                class="p-2 bg-white rounded-full hover:bg-gray-100" 
                title="Modifier"
                @click.stop="editImage(image)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                class="p-2 bg-white rounded-full hover:bg-gray-100" 
                title="Supprimer"
                @click.stop="confirmDeleteImage(image)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="p-3">
          <p class="font-medium text-sm truncate" :title="image.title || image.originalFilename">
            {{ image.title || image.originalFilename }}
          </p>
          <div class="text-xs text-gray-500 mt-1 space-y-1">
            <p>{{ formatDate(image.createdAt) }}</p>
            <p>{{ image.width }} × {{ image.height }} px</p>
            <p>{{ formatSize(image.size) }} · {{ image.format.toUpperCase() }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <nav class="flex items-center gap-1">
        <button 
          :disabled="currentPage === 1" 
          class="px-3 py-1 rounded border"
          :class="currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'" 
          @click="changePage(currentPage - 1)"
        >
          Précédent
        </button>
        
        <button 
          v-for="page in displayedPages" 
          :key="page" 
          class="px-3 py-1 rounded border"
          :class="page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'" 
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          :disabled="currentPage === totalPages" 
          class="px-3 py-1 rounded border"
          :class="currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'" 
          @click="changePage(currentPage + 1)"
        >
          Suivant
        </button>
      </nav>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
        <h3 class="text-lg font-medium mb-2">Confirmer la suppression</h3>
        <p class="mb-4">Voulez-vous vraiment supprimer cette image ? Cette action est irréversible.</p>
        <div class="flex justify-end gap-2">
          <button 
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
            @click="showDeleteConfirm = false"
          >
            Annuler
          </button>
          <button 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" 
            @click="deleteImage"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '~/composables/useAppToast';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

const props = defineProps({
  autoLoad: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['image-selected', 'image-deleted', 'image-edited']);
const router = useRouter();
const { addToast } = useToast();

// État
const images = ref([]);
const loading = ref(false);
const totalImages = ref(0);
const totalSpaceUsed = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(24);
const showDeleteConfirm = ref(false);
const imageToDelete = ref(null);

// Filtres
const filters = ref({
  search: '',
  format: '',
  date: ''
});

// Pagination calculée
const totalPages = computed(() => Math.ceil(totalImages.value / itemsPerPage.value));
const displayedPages = computed(() => {
  const pages = [];
  const maxDisplayedPages = 5;

  if (totalPages.value <= maxDisplayedPages) {
    // Afficher toutes les pages si leur nombre est inférieur ou égal à maxDisplayedPages
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Toujours afficher la première page
    pages.push(1);

    // Calculer les pages du milieu à afficher
    let startPage = Math.max(2, currentPage.value - 1);
    const endPage = Math.min(totalPages.value - 1, startPage + 2);

    // Ajuster startPage si endPage est trop proche de la fin
    if (endPage === totalPages.value - 1) {
      startPage = Math.max(2, endPage - 2);
    }

    // Ajouter un ellipsis si nécessaire
    if (startPage > 2) {
      pages.push('...');
    }

    // Ajouter les pages du milieu
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Ajouter un ellipsis si nécessaire
    if (endPage < totalPages.value - 1) {
      pages.push('...');
    }

    // Toujours afficher la dernière page
    pages.push(totalPages.value);
  }

  return pages;
});

// Debounce pour la recherche
let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
};

// Charger les images
const loadImages = async () => {
  if (loading.value) return;
  
  loading.value = true;
  
  try {
    // Calculer l'offset basé sur la page courante
    const offset = (currentPage.value - 1) * itemsPerPage.value;
    
    // Préparer les paramètres de requête
    const params = new URLSearchParams();
    params.append('limit', itemsPerPage.value);
    params.append('offset', offset);
    
    // Ajouter les filtres s'ils sont définis
    if (filters.value.search) {
      params.append('search', filters.value.search);
    }
    
    if (filters.value.format) {
      params.append('format', filters.value.format);
    }
    
    if (filters.value.date) {
      params.append('date', filters.value.date);
    }
    
    // Effectuer la requête
    const response = await $fetch(`/api/images?${params.toString()}`);
    
    // Mettre à jour les données
    images.value = response.images;
    totalImages.value = response.total;
    totalSpaceUsed.value = response.totalSize || 0;
  } catch (error) {
    console.error('Erreur lors du chargement des images:', error);
    addToast('Erreur lors du chargement des images', 'error', 4000);
  } finally {
    loading.value = false;
  }
};

// Formater la taille en octets, Ko, Mo, etc.
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

// Formater la date
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Obtenir l'URL de la miniature
const getThumbnailUrl = (image) => {
  // Rechercher la variante "thumbnail" si elle existe
  if (image.variants && image.variants.length > 0) {
    const thumbnail = image.variants.find(v => v.type === 'thumbnail');
    if (thumbnail) {
      return thumbnail.url;
    }
  }
  
  // Sinon, retourner l'URL de l'image originale
  return image.url;
};

// Gérer le changement de page
const changePage = (page) => {
  if (page < 1 || page > totalPages.value || page === '...') return;
  
  currentPage.value = page;
  loadImages();
  
  // Défiler vers le haut de la page
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// Gérer le changement de nombre d'éléments par page
const handleItemsPerPageChange = () => {
  currentPage.value = 1; // Revenir à la première page
  loadImages();
};

// Appliquer les filtres
const applyFilters = () => {
  currentPage.value = 1; // Revenir à la première page
  loadImages();
};

// Réinitialiser les filtres
const resetFilters = () => {
  filters.value = {
    search: '',
    format: '',
    date: ''
  };
  currentPage.value = 1;
  loadImages();
};

// Ouvrir les détails d'une image
const openImageDetails = (image) => {
  emit('image-selected', image);
  router.push(`/admin/images/${image.id}`);
};

// Éditer une image
const editImage = (image) => {
  emit('image-edited', image);
  router.push(`/admin/images/${image.id}`);
};

// Confirmer la suppression d'une image
const confirmDeleteImage = (image) => {
  imageToDelete.value = image;
  showDeleteConfirm.value = true;
};

// Supprimer une image
const deleteImage = async () => {
  if (!imageToDelete.value) return;
  
  loading.value = true;
  
  try {
    await $fetch('/api/images', {
      method: 'DELETE',
      body: { id: imageToDelete.value.id }
    });
    
    // Fermer la confirmation
    showDeleteConfirm.value = false;
    
    // Recharger les images
    loadImages();
    
    // Émettre l'événement
    emit('image-deleted', imageToDelete.value);
    
    // Afficher une notification
    addToast('Image supprimée avec succès', 'success', 4000);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    addToast('Erreur lors de la suppression de l\'image', 'error', 4000);
  } finally {
    loading.value = false;
    imageToDelete.value = null;
  }
};

// Hooks de cycle de vie
onMounted(() => {
  if (props.autoLoad) {
    loadImages();
  }
});

// Observer les changements de propriétés
watch(() => props.autoLoad, (newVal) => {
  if (newVal) {
    loadImages();
  }
});

// Exposer des méthodes pour le composant parent
defineExpose({
  loadImages,
  resetFilters,
  images
});
</script>

<style scoped>
.image-gallery {
  width: 100%;
}

.image-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>