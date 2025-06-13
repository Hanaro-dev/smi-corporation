<template>
  <div>
    <h1 class="text-2xl font-bold mb-2">Gestion des Images</h1>
    <p class="text-gray-600 mb-6">
      Téléchargez, organisez et gérez les images utilisées sur le site.
    </p>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-1">Nombre total d'images</h3>
        <p class="text-2xl font-semibold">{{ stats.totalImages }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-1">Espace utilisé</h3>
        <p class="text-2xl font-semibold">{{ formatSize(stats.totalSize) }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-1">Formats d'images</h3>
        <div class="flex flex-wrap gap-2 mt-1">
          <span 
            v-for="format in stats.formats" 
            :key="format.name"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            :class="getFormatClass(format.name)"
          >
            {{ format.name.toUpperCase() }}
            <span class="ml-1 text-xs opacity-75">({{ format.count }})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="mb-6 border-b">
      <div class="flex gap-4">
        <button 
          class="px-4 py-2 font-medium" 
          :class="activeTab === 'gallery' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'"
          @click="activeTab = 'gallery'"
        >
          Galerie
        </button>
        <button 
          class="px-4 py-2 font-medium" 
          :class="activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'"
          @click="activeTab = 'upload'"
        >
          Télécharger
        </button>
      </div>
    </div>

    <!-- Contenu des onglets -->
    <div v-if="activeTab === 'gallery'">
      <ImageGallery 
        ref="galleryRef"
        @image-deleted="handleImageDeleted"
      />
    </div>

    <div v-else-if="activeTab === 'upload'">
      <ImageUploader 
        ref="uploaderRef"
        @upload-success="handleUploadSuccess"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '~/composables/useAppToast';

definePageMeta({
  layout: 'admin',
  middleware: ['auth']
});

const { addToast } = useToast();

// État
const activeTab = ref('gallery');
const galleryRef = ref(null);
const uploaderRef = ref(null);
const stats = ref({
  totalImages: 0,
  totalSize: 0,
  formats: []
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
    addToast('Erreur lors du chargement des statistiques', 'error', 4000);
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
  // Actualiser les statistiques
  loadStats();
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
