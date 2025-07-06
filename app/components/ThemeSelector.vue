<template>
  <div class="relative">
    <!-- Bouton principal -->
    <button
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Changer de thème"
      @click="toggleMenu"
    >
      <Icon :name="currentIcon" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
    </button>
    
    <!-- Menu dropdown -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50"
    >
      <div class="py-2">
        <div class="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
          Thème
        </div>
        
        <button
          v-for="theme in themes"
          :key="theme.value"
          class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="[
            isActive(theme.value)
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-700 dark:text-gray-300'
          ]"
          @click="selectTheme(theme.value)"
        >
          <Icon 
            :name="theme.icon" 
            class="w-5 h-5"
            :class="isActive(theme.value) ? 'text-blue-600 dark:text-blue-400' : ''"
          />
          <span>{{ theme.label }}</span>
          <Icon 
            v-if="isActive(theme.value)"
            name="heroicons:check" 
            class="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto"
          />
        </button>
      </div>
    </div>
    
    <!-- Overlay pour fermer le menu -->
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-40"
      @click="closeMenu"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const colorMode = useColorMode()
const isOpen = ref(false)

const themes = [
  {
    value: 'system',
    label: 'Automatique',
    icon: 'heroicons:computer-desktop'
  },
  {
    value: 'light',
    label: 'Clair',
    icon: 'heroicons:sun'
  },
  {
    value: 'dark',
    label: 'Sombre',
    icon: 'heroicons:moon'
  }
]

const currentIcon = computed(() => {
  if (colorMode.preference === 'system') {
    return colorMode.value === 'dark' ? 'heroicons:moon' : 'heroicons:sun'
  }
  return themes.find(t => t.value === colorMode.preference)?.icon || 'heroicons:computer-desktop'
})

const isActive = (mode) => {
  return colorMode.preference === mode
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const selectTheme = (mode) => {
  colorMode.preference = mode
  closeMenu()
}

// Fermer le menu avec Escape
const handleEscape = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>