<template>
  <img
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :class="computedClass"
    :loading="loading"
    @load="onLoad"
    @error="onError"
  />
</template>

<script setup>
/**
 * Composant image local pour remplacer NuxtImg
 * Gestion locale des images sans dépendance externe
 */

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  height: {
    type: [String, Number],
    default: undefined
  },
  class: {
    type: String,
    default: ''
  },
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => ['lazy', 'eager'].includes(value)
  }
})

const emit = defineEmits(['load', 'error'])

const computedClass = computed(() => {
  const baseClasses = 'block'
  return `${baseClasses} ${props.class}`.trim()
})

const onLoad = (event) => {
  emit('load', event)
}

const onError = (event) => {
  emit('error', event)
  // Optionnel: définir une image de fallback
  event.target.src = '/images/placeholder.jpg'
}
</script>

<style scoped>
/* Styles optionnels pour les images */
img {
  max-width: 100%;
  height: auto;
}
</style>