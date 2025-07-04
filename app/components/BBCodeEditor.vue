<template>
  <div class="bbcode-editor">
    <!-- Toolbar avec BBCodes disponibles -->
    <div class="toolbar bg-gray-50 dark:bg-gray-800 rounded-t-lg p-3" style="border: 1px solid #d1d5db; border-bottom: none;">
      <!-- Boutons BBCode organisés par catégorie -->
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="bbcode in availableHelp"
          :key="bbcode.tag"
          class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors transform hover:scale-105"
          :title="`${bbcode.description} - Cliquez pour insérer`"
          @click="insertBBCode(bbcode)"
        >
          {{ bbcode.tag }}
        </button>
      </div>
      
      <!-- Indicateur du nombre de tags disponibles -->
      <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {{ availableHelp.length }} BBCode{{ availableHelp.length > 1 ? 's' : '' }} disponible{{ availableHelp.length > 1 ? 's' : '' }}
        <span v-if="props.pageType !== 'default'" class="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
          Mode: {{ props.pageType }}
        </span>
      </div>
      
      <!-- Toggle preview -->
      <div class="flex items-center space-x-3">
        <label class="flex items-center">
          <input 
            v-model="showPreview" 
            type="checkbox" 
            class="mr-2"
          >
          <span class="text-sm text-gray-600 dark:text-gray-400">Aperçu en temps réel</span>
        </label>
        
        <button
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          @click="showHelp = !showHelp"
        >
          {{ showHelp ? 'Masquer' : 'Afficher' }} l'aide
        </button>
      </div>
    </div>

    <!-- Zone d'édition -->
    <div class="editor-container" :class="showPreview ? 'grid grid-cols-2 gap-0' : ''">
      <!-- Éditeur de texte -->
      <div class="editor-panel">
        <textarea
          ref="textarea"
          v-model="localContent"
          class="w-full h-64 p-4 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          :class="showPreview ? 'border-r-0' : 'rounded-b-lg border-b'"
          placeholder="Saisissez votre contenu avec des BBCodes..."
          @input="handleInput"
          @keydown="handleKeydown"
        />
      </div>

      <!-- Aperçu -->
      <div 
        v-if="showPreview" 
        class="preview-panel rounded-br-lg"
        style="border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;"
      >
        <div class="h-64 p-4 overflow-y-auto bg-white dark:bg-gray-800">
          <BBCodeRenderer 
            :content="localContent" 
            :page-type="pageType"
            :enabled-tags="enabledTags"
          />
        </div>
      </div>
    </div>

    <!-- Aide contextuelle -->
    <div 
      v-if="showHelp" 
      class="help-panel bg-gray-50 dark:bg-gray-800 rounded-b-lg p-4"
      style="border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;"
    >
      <h4 class="font-medium text-gray-900 dark:text-white mb-3">BBCodes disponibles :</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="bbcode in availableHelp"
          :key="bbcode.tag"
          class="help-item p-3 bg-white dark:bg-gray-700 rounded border"
        >
          <div class="flex items-center justify-between mb-2">
            <code class="text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">{{ bbcode.tag }}</code>
            <button
              class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              @click="insertBBCode(bbcode)"
            >
              Insérer
            </button>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">{{ bbcode.description }}</p>
          <code class="text-xs text-gray-500 dark:text-gray-400 block">{{ bbcode.syntax }}</code>
        </div>
      </div>
    </div>

    <!-- Messages de validation -->
    <div v-if="validationErrors.length > 0" class="validation-errors mt-2">
      <div
        v-for="error in validationErrors"
        :key="error"
        class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 mb-1"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useBBCode } from '~/composables/useBBCode'
import BBCodeRenderer from './BBCodeRenderer.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  pageType: {
    type: String,
    default: 'default'
  },
  enabledTags: {
    type: Array,
    default: () => []
  },
  showPreviewByDefault: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'validation'])

const { getBBCodeHelp, validateBBCode, getAvailableBBCodes } = useBBCode()

// État local
const localContent = ref(props.modelValue)
const showPreview = ref(props.showPreviewByDefault)
const showHelp = ref(false)
const textarea = ref(null)
const validationErrors = ref([])

// BBCodes disponibles pour cette page
const availableTags = computed(() => {
  return props.enabledTags.length > 0 
    ? props.enabledTags 
    : getAvailableBBCodes(props.pageType)
})

const availableHelp = computed(() => {
  return getBBCodeHelp(availableTags.value)
})

// Synchronisation avec le v-model
watch(() => props.modelValue, (newValue) => {
  localContent.value = newValue
})

watch(localContent, (newValue) => {
  emit('update:modelValue', newValue)
  validateContent()
})

// Validation du contenu
const validateContent = () => {
  const validation = validateBBCode(localContent.value, availableTags.value)
  validationErrors.value = validation.errors
  emit('validation', validation)
}

// Gestion des événements
const handleInput = (event) => {
  localContent.value = event.target.value
}

const handleKeydown = (event) => {
  // Tab pour indentation
  if (event.key === 'Tab') {
    event.preventDefault()
    insertText('  ')
  }
}

// Insérer du texte à la position du curseur
const insertText = (text) => {
  const element = textarea.value
  const start = element.selectionStart
  const end = element.selectionEnd
  const before = localContent.value.substring(0, start)
  const after = localContent.value.substring(end)
  
  localContent.value = before + text + after
  
  nextTick(() => {
    element.focus()
    element.setSelectionRange(start + text.length, start + text.length)
  })
}

// Insérer un BBCode
const insertBBCode = (bbcode) => {
  const isClosingTag = bbcode.syntax.includes('[/')
  
  if (isClosingTag) {
    // Tag avec ouverture et fermeture
    const openTag = bbcode.syntax.split('[/')[0] + ']'
    const closeTag = '[/' + bbcode.tag + ']'
    
    const element = textarea.value
    const start = element.selectionStart
    const end = element.selectionEnd
    const selectedText = localContent.value.substring(start, end)
    
    const replacement = openTag + (selectedText || 'contenu') + closeTag
    insertText(replacement)
  } else {
    // Tag simple
    insertText(bbcode.syntax)
  }
}

// Initialisation
validateContent()
</script>

<style scoped>
.bbcode-editor {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;
}

.dark .bbcode-editor {
  border-color: #4b5563;
}

.editor-container {
  min-height: 16rem;
}

.help-item {
  transition: all 0.2s ease-in-out;
}

.help-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>