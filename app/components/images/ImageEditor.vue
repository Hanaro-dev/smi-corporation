<template>
  <div class="image-editor">
    <div v-if="loading" class="flex justify-center py-8">
      <PulseLoader :loading="loading" color="#4F46E5" size="15px" />
    </div>
    
    <div v-else-if="!image" class="bg-gray-100 rounded-lg p-8 text-center">
      <p class="text-gray-700">Aucune image sélectionnée</p>
    </div>
    
    <div v-else class="bg-white rounded-lg shadow p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Prévisualisation de l'image -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Prévisualisation</h3>
          <div class="relative bg-gray-100 rounded overflow-hidden" :style="{ maxHeight: '400px' }">
            <img 
              v-if="!showCropper" 
              :src="image.url" 
              :alt="image.altText || image.originalFilename"
              class="w-full h-auto object-contain"
            >
            
            <!-- Composant de recadrage -->
            <div v-else class="w-full" style="height: 400px;">
              <Cropper
                ref="cropperRef"
                :src="image.url"
                :stencil-props="{
                  aspectRatio: cropperAspectRatio
                }"
                :default-size="defaultSize"
                image-restriction="stencil"
                @change="onCropperChange"
              />
            </div>
          </div>
          
          <!-- Informations sur l'image -->
          <div class="mt-4 bg-gray-50 p-4 rounded text-sm">
            <p><strong>Nom du fichier:</strong> {{ image.originalFilename }}</p>
            <p><strong>Dimensions:</strong> {{ image.width }} × {{ image.height }} px</p>
            <p><strong>Taille:</strong> {{ formatSize(image.size) }}</p>
            <p><strong>Format:</strong> {{ image.format.toUpperCase() }}</p>
            <p><strong>Date d'ajout:</strong> {{ formatDate(image.createdAt) }}</p>
          </div>
          
          <!-- Actions de recadrage -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button 
              v-if="!showCropper" 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
              @click="enableCropper"
            >
              Recadrer l'image
            </button>
            
            <template v-else>
              <div class="flex items-center gap-2 w-full mb-2">
                <label class="whitespace-nowrap">Ratio d'aspect:</label>
                <select 
                  v-model="aspectRatio" 
                  class="px-2 py-1 border rounded flex-grow"
                >
                  <option value="free">Libre</option>
                  <option value="1:1">Carré (1:1)</option>
                  <option value="4:3">Standard (4:3)</option>
                  <option value="16:9">Large (16:9)</option>
                  <option value="2:3">Portrait (2:3)</option>
                </select>
              </div>
              
              <div class="flex gap-2 w-full">
                <button 
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
                  @click="cancelCropper"
                >
                  Annuler
                </button>
                <button 
                  class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" 
                  @click="applyCrop"
                >
                  Appliquer
                </button>
              </div>
            </template>
          </div>
        </div>
        
        <!-- Formulaire d'édition des métadonnées -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Métadonnées</h3>
          <form @submit.prevent="saveMetadata">
            <div class="mb-4">
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input 
                id="title"
                v-model="form.title" 
                type="text" 
                class="w-full px-3 py-2 border rounded"
                placeholder="Titre de l'image"
              >
            </div>
            
            <div class="mb-4">
              <label for="altText" class="block text-sm font-medium text-gray-700 mb-1">Texte alternatif</label>
              <input 
                id="altText"
                v-model="form.altText" 
                type="text" 
                class="w-full px-3 py-2 border rounded"
                placeholder="Description pour les lecteurs d'écran"
              >
              <p class="text-xs text-gray-500 mt-1">
                Le texte alternatif est important pour l'accessibilité et le SEO.
              </p>
            </div>
            
            <div class="mb-4">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                id="description"
                v-model="form.description" 
                rows="4" 
                class="w-full px-3 py-2 border rounded"
                placeholder="Description détaillée de l'image"
              />
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
              <button 
                type="button"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
                @click="resetForm"
              >
                Réinitialiser
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                :disabled="saving"
              >
                <span v-if="saving">Enregistrement...</span>
                <span v-else>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from '~/composables/useAppToast';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const props = defineProps({
  imageId: {
    type: [Number, String],
    default: null
  },
  imageData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update', 'crop-complete', 'save-complete']);
const { addToast } = useToast();

// État
const image = ref(null);
const loading = ref(false);
const saving = ref(false);
const form = ref({
  title: '',
  altText: '',
  description: ''
});
const originalForm = ref({});

// État du recadrage
const showCropper = ref(false);
const cropperRef = ref(null);
const aspectRatio = ref('free');
const coordinates = ref(null);

// Calculer le ratio d'aspect pour le cropper
const cropperAspectRatio = computed(() => {
  if (aspectRatio.value === 'free') return undefined;
  
  const [width, height] = aspectRatio.value.split(':').map(Number);
  return width / height;
});

// Calculer la taille par défaut pour le cropper
const defaultSize = computed(() => {
  if (!image.value) return { width: '80%', height: '80%' };
  
  return {
    width: Math.min(image.value.width, 400),
    height: Math.min(image.value.height, 300)
  };
});

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Charger les données de l'image
const loadImageData = async () => {
  if (!props.imageId && !props.imageData) return;
  
  loading.value = true;
  
  try {
    if (props.imageData) {
      // Utiliser les données fournies directement
      image.value = props.imageData;
    } else {
      // Charger les données depuis l'API
      const response = await $fetch(`/api/images/${props.imageId}`);
      image.value = response;
    }
    
    // Initialiser le formulaire avec les données de l'image
    form.value = {
      title: image.value.title || '',
      altText: image.value.altText || '',
      description: image.value.description || ''
    };
    
    // Sauvegarder les valeurs originales pour pouvoir réinitialiser
    originalForm.value = { ...form.value };
  } catch (error) {
    console.error('Erreur lors du chargement des données de l\'image:', error);
    addToast('Erreur lors du chargement des données de l\'image', 'error', 4000);
  } finally {
    loading.value = false;
  }
};

// Réinitialiser le formulaire
const resetForm = () => {
  form.value = { ...originalForm.value };
};

// Sauvegarder les métadonnées
const saveMetadata = async () => {
  if (!image.value) return;
  
  saving.value = true;
  
  try {
    // Envoyer les données à l'API
    const response = await $fetch(`/api/images/${image.value.id}`, {
      method: 'PATCH',
      body: {
        title: form.value.title,
        altText: form.value.altText,
        description: form.value.description
      }
    });
    
    // Mettre à jour l'image locale
    image.value = {
      ...image.value,
      title: form.value.title,
      altText: form.value.altText,
      description: form.value.description
    };
    
    // Mettre à jour les valeurs originales
    originalForm.value = { ...form.value };
    
    // Émettre l'événement de mise à jour
    emit('update', image.value);
    emit('save-complete', image.value);
    
    // Afficher une notification
    addToast('Métadonnées enregistrées avec succès', 'success', 4000);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des métadonnées:', error);
    addToast('Erreur lors de l\'enregistrement des métadonnées', 'error', 4000);
  } finally {
    saving.value = false;
  }
};

// Activer le recadrage
const enableCropper = () => {
  showCropper.value = true;
};

// Annuler le recadrage
const cancelCropper = () => {
  showCropper.value = false;
  coordinates.value = null;
};

// Surveiller les changements du cropper
const onCropperChange = ({ coordinates: coords }) => {
  coordinates.value = coords;
};

// Appliquer le recadrage
const applyCrop = async () => {
  if (!coordinates.value || !image.value) return;
  
  saving.value = true;
  
  try {
    // Envoyer les coordonnées à l'API
    const response = await $fetch(`/api/images/${image.value.id}/crop`, {
      method: 'POST',
      body: {
        coordinates: coordinates.value,
        aspectRatio: aspectRatio.value
      }
    });
    
    // Mettre à jour l'image locale avec la nouvelle URL (après recadrage)
    image.value = response;
    
    // Désactiver le cropper
    showCropper.value = false;
    coordinates.value = null;
    
    // Émettre l'événement de mise à jour
    emit('update', image.value);
    emit('crop-complete', image.value);
    
    // Afficher une notification
    addToast('Image recadrée avec succès', 'success', 4000);
  } catch (error) {
    console.error('Erreur lors du recadrage de l\'image:', error);
    addToast('Erreur lors du recadrage de l\'image', 'error', 4000);
  } finally {
    saving.value = false;
  }
};

// Observer les changements de propriétés
watch(() => props.imageId, (newId) => {
  if (newId) {
    loadImageData();
  }
});

watch(() => props.imageData, (newData) => {
  if (newData) {
    image.value = newData;
    
    form.value = {
      title: newData.title || '',
      altText: newData.altText || '',
      description: newData.description || ''
    };
    
    originalForm.value = { ...form.value };
  }
});

// Hooks de cycle de vie
onMounted(() => {
  loadImageData();
});

// Exposer des méthodes pour le composant parent
defineExpose({
  loadImageData,
  resetForm,
  saveMetadata,
  enableCropper,
  cancelCropper,
  applyCrop
});
</script>

<style scoped>
.image-editor {
  width: 100%;
}

:deep(.vue-advanced-cropper) {
  background-color: #f3f4f6;
}

:deep(.vue-advanced-cropper__foreground) {
  border-radius: 0;
}

:deep(.vue-advanced-cropper__stretcher) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
}
</style>