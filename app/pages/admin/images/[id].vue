<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/admin/images"
        class="flex items-center text-gray-600 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Retour à la galerie
      </NuxtLink>
      
      <h1 class="text-2xl font-bold">
        {{ image ? (image.title || 'Détails de l\'image') : 'Chargement...' }}
      </h1>
    </div>

    <div v-if="notFound" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
      <p>L'image demandée n'a pas été trouvée.</p>
      <NuxtLink to="/admin/images" class="underline hover:text-red-800">
        Retourner à la galerie d'images
      </NuxtLink>
    </div>

    <div v-if="!notFound">
      <ImageEditor 
        :image-id="imageId" 
        @update="handleImageUpdate"
        @save-complete="handleSaveComplete"
        @crop-complete="handleCropComplete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '~/composables/useToast';

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
});

const route = useRoute();
const router = useRouter();
const { addToast } = useToast();

const imageId = ref(null);
const image = ref(null);
const notFound = ref(false);
const loading = ref(true);

// Charger les données de l'image
const fetchImageData = async () => {
  if (!imageId.value) return;
  
  loading.value = true;
  
  try {
    const response = await $fetch(`/api/images/${imageId.value}`);
    image.value = response;
    notFound.value = false;
  } catch (error) {
    console.error('Erreur lors du chargement de l\'image:', error);
    
    if (error.response && error.response.status === 404) {
      notFound.value = true;
      addToast('Image non trouvée', 'error', 4000);
    } else {
      addToast('Erreur lors du chargement de l\'image', 'error', 4000);
    }
  } finally {
    loading.value = false;
  }
};

// Gérer la mise à jour de l'image
const handleImageUpdate = (updatedImage) => {
  image.value = updatedImage;
};

// Gérer la fin de l'enregistrement
const handleSaveComplete = () => {
  // Si besoin d'actions supplémentaires après la sauvegarde
};

// Gérer la fin du recadrage
const handleCropComplete = () => {
  // Rafraîchir les données de l'image après le recadrage
  fetchImageData();
};

onMounted(() => {
  // Récupérer l'ID de l'image depuis l'URL
  imageId.value = route.params.id;
  
  if (!imageId.value) {
    notFound.value = true;
    return;
  }
  
  fetchImageData();
});
</script>