<template>
  <div class="image-uploader">
    <h3 class="text-lg font-semibold mb-2">Télécharger des images</h3>
    
    <!-- FilePond component -->
    <FilePond
      ref="pond"
      class="filepond-container"
      :files="files"
      :server="serverOptions"
      :allow-multiple="true"
      :max-files="10"
      :accepted-file-types="acceptedFileTypes"
      :max-file-size="maxFileSize"
      :label-idle="labelIdle"
      :image-preview-height="170"
      :image-resize-target-width="300"
      :image-resize-target-height="300"
      :image-resize-mode="'contain'"
      :image-preview-markup="true"
      @init="handleFilePondInit"
      @processfile="handleProcessFile"
      @addfile="handleFileAdded"
      @removefile="handleFileRemoved"
      @error="handleError"
    />

    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="mt-2">
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class="bg-blue-600 h-2.5 rounded-full" 
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>
      <p class="text-sm text-gray-600 mt-1">Téléchargement: {{ uploadProgress }}%</p>
    </div>

    <div v-if="uploadError" class="mt-2 p-2 bg-red-100 text-red-700 rounded">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';
import { toast } from '~/composables/useToast';

// Import FilePond and plugins
import vueFilePond from 'vue-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';

// Create FilePond component with plugins
const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview
);

const emit = defineEmits(['upload-success', 'upload-error']);
const { addToast } = useToast();

// Refs
const pond = ref(null);
const files = ref([]);
const uploadProgress = ref(0);
const uploadError = ref(null);
const uploadedImages = ref([]);

// Constants
const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const maxFileSize = '10MB';
const labelIdle = 'Glissez-déposez vos images ici ou <span class="filepond--label-action">parcourez</span>';

// Server configuration for FilePond
const serverOptions = {
  process: {
    url: '/api/images',
    method: 'POST',
    withCredentials: false,
    headers: {},
    timeout: 7000,
    onload: (response) => {
      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(response);
        uploadedImages.value.push(parsedResponse);
        emit('upload-success', parsedResponse);
        return parsedResponse.id;
      } catch (error) {
        console.error('Error parsing upload response:', error);
        return response;
      }
    },
    onerror: (response) => {
      try {
        const parsedError = JSON.parse(response);
        uploadError.value = parsedError.statusMessage || 'Erreur lors du téléchargement';
        emit('upload-error', parsedError);
      } catch (error) {
        uploadError.value = 'Erreur lors du téléchargement';
        emit('upload-error', { message: 'Erreur lors du téléchargement' });
      }
      return response;
    },
    ondata: (formData) => {
      // You can append additional data to the formData here
      return formData;
    },
    onprogress: (progress) => {
      uploadProgress.value = Math.floor(progress);
    }
  },
  revert: null,
  load: null,
  fetch: null,
  restore: null
};

// Event handlers
const handleFilePondInit = () => {
  console.log('FilePond instance initialized');
};

const handleProcessFile = (error, file) => {
  if (error) {
    console.error('Error uploading file:', error);
    addToast('Erreur lors du téléchargement de l\'image', 'error', 4000);
    return;
  }
  
  addToast('Image téléchargée avec succès', 'success', 4000);
  uploadProgress.value = 0;
};

const handleFileAdded = (error, file) => {
  if (error) {
    console.error('Error adding file:', error.message);
    return;
  }
  uploadError.value = null;
};

const handleFileRemoved = (error, file) => {
  if (error) {
    console.error('Error removing file:', error.message);
    return;
  }
};

const handleError = (error, file, status) => {
  console.error('FilePond error:', error);
  uploadError.value = error.message || 'Une erreur est survenue lors du téléchargement';
  addToast(uploadError.value, 'error', 4000);
};

// Functions to expose to parent component
const clearFiles = () => {
  if (pond.value) {
    pond.value.removeFiles();
  }
  uploadedImages.value = [];
  uploadError.value = null;
  uploadProgress.value = 0;
};

// Expose methods to parent components
defineExpose({
  clearFiles,
  uploadedImages
});
</script>

<style scoped>
.image-uploader {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.filepond-container {
  width: 100%;
  min-height: 200px;
  margin-bottom: 1rem;
}

:deep(.filepond--drop-label) {
  color: #555;
  font-size: 0.875rem;
}

:deep(.filepond--panel-root) {
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
}

:deep(.filepond--item-panel) {
  background-color: #f0f9ff;
}

:deep(.filepond--file-action-button) {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>